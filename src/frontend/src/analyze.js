// テキスト → 「水の強さ / 風の強さ」を 0..1 で返す解析ロジック。
// 1) キーワード辞書（日本語＋英語）: 即時・確実
// 2) Transformers.js の埋め込み: 任意でDLし、用意でき次第ブレンド
//
// バックエンド不要。すべてブラウザ内で完結する。

/* ===================== 1) キーワード辞書 ===================== */
// weight 2 = 中心語, 1 = 関連語。部分一致で採点する。
const WATER_WORDS = [
  ["水", 2], ["みず", 2], ["雨", 2], ["あめ", 1], ["川", 2], ["かわ", 1],
  ["海", 2], ["うみ", 1], ["湖", 1], ["滝", 2], ["たき", 1], ["流れ", 2],
  ["流れる", 2], ["しずく", 1], ["雫", 1], ["潤", 1], ["うるお", 1],
  ["濡", 1], ["ぬれ", 1], ["湿", 1], ["しめ", 1], ["波", 1], ["なみ", 1],
  ["泉", 1], ["水滴", 2], ["梅雨", 1], ["つゆ", 1], ["液体", 1], ["飲", 1],
  ["渇", 1], ["潮", 1], ["噴水", 2], ["洪水", 2], ["water", 2], ["rain", 2],
  ["river", 2], ["ocean", 2], ["sea", 1], ["wet", 1], ["flow", 2],
  ["drip", 1], ["wave", 1], ["lake", 1], ["waterfall", 2], ["splash", 1],
];

const WIND_WORDS = [
  ["風", 2], ["かぜ", 2], ["そよ", 1], ["嵐", 2], ["あらし", 1], ["台風", 2],
  ["たいふう", 1], ["吹", 2], ["ふく", 1], ["そよ風", 2], ["微風", 2],
  ["突風", 2], ["つむじ", 1], ["旋風", 2], ["空気", 1], ["くうき", 1],
  ["涼", 1], ["すず", 1], ["扇", 2], ["扇風機", 2], ["舞", 1], ["竜巻", 2],
  ["疾風", 2], ["wind", 2], ["breeze", 2], ["storm", 2], ["gust", 2],
  ["air", 1], ["blow", 1], ["gale", 2], ["typhoon", 2], ["fan", 1],
  ["tornado", 2],
];

const SAT = 4; // この重み合計で強さ1.0に飽和

function scoreWords(text, words) {
  const lower = text.toLowerCase();
  let sum = 0;
  for (const [w, weight] of words) {
    if (lower.includes(w.toLowerCase())) sum += weight;
  }
  return sum;
}

export function keywordScores(text) {
  if (!text || !text.trim()) return { water: 0, wind: 0 };
  const w = scoreWords(text, WATER_WORDS);
  const f = scoreWords(text, WIND_WORDS);
  return {
    water: Math.min(1, w / SAT),
    wind: Math.min(1, f / SAT),
  };
}

/* ===================== 2) 埋め込み（Transformers.js） ===================== */
// multilingual-e5-small は日本語にも対応。動的importで必要時のみ読み込む。
const MODEL_ID = "Xenova/multilingual-e5-small";

// e5系は "query:" / "passage:" の接頭辞を付けると精度が上がる
const WATER_ANCHORS = [
  "passage: 水が勢いよく流れ落ちている",
  "passage: 川や雨、滝のような水の流れ",
  "passage: しっとりと濡れて潤う水分",
];
const WIND_ANCHORS = [
  "passage: 強い風が吹き抜けている",
  "passage: 台風やそよ風など空気の流れ",
  "passage: 風が舞い、空を吹き渡る",
];

// 埋め込みコサイン類似度をこの範囲で 0..1 に写像（経験的に調整）
const SIM_LO = 0.74;
const SIM_HI = 0.86;

let extractorPromise = null;
let anchorVecs = null; // { water: number[][], wind: number[][] }

function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function maxSim(vec, anchors) {
  let best = -Infinity;
  for (const a of anchors) best = Math.max(best, dot(vec, a)); // 正規化済 → 内積=コサイン
  return best;
}

// モデルを読み込み、アンカーの埋め込みを事前計算する。
// onProgress(0..1) で進捗を通知（任意）。
export async function loadEmbedder(onProgress) {
  if (extractorPromise) return extractorPromise;
  extractorPromise = (async () => {
    const { pipeline, env } = await import("@huggingface/transformers");
    env.allowLocalModels = false; // ローカル404を避けリモートのみ
    const extractor = await pipeline("feature-extraction", MODEL_ID, {
      progress_callback: (p) => {
        if (onProgress && p?.status === "progress" && p.total) {
          onProgress(Math.min(1, p.loaded / p.total));
        }
      },
    });

    const embed = async (texts) => {
      const out = await extractor(texts, { pooling: "mean", normalize: true });
      return out.tolist(); // number[][]
    };
    anchorVecs = {
      water: await embed(WATER_ANCHORS),
      wind: await embed(WIND_ANCHORS),
    };
    return embed;
  })();
  return extractorPromise;
}

// 埋め込みベースのスコア（モデル未ロードなら null）
export async function embeddingScores(text) {
  if (!extractorPromise || !text.trim()) return null;
  const embed = await extractorPromise;
  const [vec] = await embed(["query: " + text]);
  const map = (sim) =>
    Math.max(0, Math.min(1, (sim - SIM_LO) / (SIM_HI - SIM_LO)));
  return {
    water: map(maxSim(vec, anchorVecs.water)),
    wind: map(maxSim(vec, anchorVecs.wind)),
  };
}

// 辞書と埋め込みをブレンド（埋め込みが無ければ辞書のみ）
export function blend(kw, emb) {
  if (!emb) return kw;
  return {
    water: 0.45 * kw.water + 0.55 * emb.water,
    wind: 0.45 * kw.wind + 0.55 * emb.wind,
  };
}
