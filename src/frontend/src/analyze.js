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
  // 連想語（田んぼ＝水田 など、間接的に水を含む語）は低めの重み
  ["田んぼ", 2], ["水田", 2], ["田", 1], ["稲", 1], ["米", 1], ["沼", 1],
  ["池", 1], ["水たまり", 2], ["露", 1], ["霧", 1], ["雪", 1], ["氷", 1],
  ["こおり", 1], ["涙", 1], ["汗", 1], ["風呂", 1], ["シャワー", 2],
  ["プール", 2], ["ダム", 2], ["蛇口", 2], ["井戸", 2], ["みずうみ", 2],
];

const WIND_WORDS = [
  ["風", 2], ["かぜ", 2], ["そよ", 1], ["嵐", 2], ["あらし", 1], ["台風", 2],
  ["たいふう", 1], ["吹", 2], ["ふく", 1], ["そよ風", 2], ["微風", 2],
  ["突風", 2], ["つむじ", 1], ["旋風", 2], ["空気", 1], ["くうき", 1],
  ["涼", 1], ["すず", 1], ["扇", 2], ["扇風機", 2], ["舞", 1], ["竜巻", 2],
  ["疾風", 2], ["wind", 2], ["breeze", 2], ["storm", 2], ["gust", 2],
  ["air", 1], ["blow", 1], ["gale", 2], ["typhoon", 2], ["fan", 1],
  ["tornado", 2],
  // 連想語（凧・風車・換気など空気の動きを連想させる語）は低めの重み
  ["凧", 1], ["風車", 2], ["かざぐるま", 2], ["換気", 1], ["さわやか", 1],
  ["そよぐ", 2], ["はためく", 2], ["扇ぐ", 2],
];

const FIRE_WORDS = [
  ["火", 2], ["炎", 2], ["ほのお", 2], ["燃", 2], ["もえ", 1], ["焼", 2],
  ["やけ", 1], ["熱", 2], ["あつ", 1], ["灼", 1], ["火事", 2], ["焚", 2],
  ["たき火", 2], ["火力", 2], ["マグマ", 2], ["溶岩", 2], ["噴火", 2],
  ["火炎", 2], ["バーナー", 2], ["コンロ", 2], ["かまど", 2], ["竈", 2],
  ["灯", 1], ["ろうそく", 1], ["爆", 1], ["沸", 2], ["わか", 1], ["煮", 1],
  ["暖", 1], ["太陽", 1], ["fire", 2], ["flame", 2], ["burn", 2],
  ["blaze", 2], ["heat", 2], ["hot", 1], ["ember", 1], ["lava", 2],
  ["inferno", 2], ["torch", 1], ["candle", 1], ["boil", 2], ["flare", 1],
  // 連想語（赤・夏・暑さなど熱を連想させる語）は低めの重み
  ["赤", 1], ["夏", 1], ["暑", 1], ["灼熱", 2], ["花火", 1], ["暖炉", 2],
  ["ストーブ", 2], ["焼肉", 1], ["バーベキュー", 2], ["溶鉱炉", 2],
];

const SAT = 2.5; // この重み合計で強さ1.0に飽和（小さいほどゆるく反応）

function scoreWords(text, words) {
  const lower = text.toLowerCase();
  let sum = 0;
  for (const [w, weight] of words) {
    if (lower.includes(w.toLowerCase())) sum += weight;
  }
  return sum;
}

export function keywordScores(text) {
  if (!text || !text.trim()) return { water: 0, wind: 0, fire: 0 };
  return {
    water: Math.min(1, scoreWords(text, WATER_WORDS) / SAT),
    wind: Math.min(1, scoreWords(text, WIND_WORDS) / SAT),
    fire: Math.min(1, scoreWords(text, FIRE_WORDS) / SAT),
  };
}

/* ===================== 2) 埋め込み（Transformers.js） ===================== */
// multilingual-e5-base は small より日本語の意味理解が高い。動的importで必要時のみ読み込む。
const MODEL_ID = "Xenova/multilingual-e5-base";

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
const FIRE_ANCHORS = [
  "passage: 炎が燃え上がり、ものが焼けている",
  "passage: 火やたき火、熱い炎の様子",
  "passage: 火力で熱せられ、お湯が沸騰している",
];

// スコア化パラメータ（ゆるめ設定）
const SPREAD = 0.03; // 偏差をこの幅で 0..1 に写像（小さいほど敏感＝ゆるい）
const ASSOC_K = 6; // 連想する単語数（上位K件）
const ASSOC_GAIN = 0.75; // 連想語のスコアをどれだけ加味するか
const ASSOC_TEMP = 0.02; // 連想語の重み付け温度（小さいほど上位を重視）

// 連想ゲーム用の語彙。多様なほど“意外な連想”が生まれる。
const VOCAB = [
  // 水寄り
  "海", "川", "雨", "雪", "氷", "滝", "湖", "池", "泉", "温泉",
  "波", "津波", "洪水", "田んぼ", "稲", "涙", "汗", "お茶", "スープ", "鍋",
  "傘", "梅雨", "水たまり", "井戸", "ダム", "プール", "シャワー", "風呂", "魚", "潜水艦",
  // 風寄り
  "風", "嵐", "台風", "竜巻", "そよ風", "突風", "扇風機", "凧", "風車", "風船",
  "飛行機", "鳥", "羽", "空", "雲", "ヘリコプター", "旗", "帆船", "換気扇", "秋",
  // 炎寄り
  "火", "炎", "太陽", "夏", "花火", "焚き火", "暖炉", "ストーブ", "溶岩", "火山",
  "マグマ", "ろうそく", "バーベキュー", "焼肉", "灼熱", "赤", "情熱", "火事", "鍛冶", "ドラゴン",
  // 連想の橋渡し（中立〜複合）
  "山", "森", "砂漠", "雷", "虹", "星", "月", "宝", "船", "海賊",
  "龍", "魔法", "剣", "城", "電気", "タービン", "蒸気", "やかん", "機関車", "発電所",
  "自然", "嵐の夜", "戦士", "冒険", "祭り",
];

let extractorPromise = null;
let anchorVecs = null; // { water:[][], wind:[][], fire:[][] }
let vocab = null; // [{ word, vec, combined:{water,wind,fire} }]

function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function meanSim(vec, anchors) {
  let s = 0;
  for (const a of anchors) s += dot(vec, a); // 正規化済 → 内積=コサイン
  return s / anchors.length;
}

// 「どちらかが光れば点く」OR合成（ゆるく複数要素が点きやすい）
function orVal(a, b) {
  return a + b - a * b;
}
function orElem(a, b) {
  return {
    water: orVal(a.water, b.water),
    wind: orVal(a.wind, b.wind),
    fire: orVal(a.fire, b.fire),
  };
}

// ベクトル → 各要素スコア（平均からの偏差ベース・ゲートなしでゆるめ）
function embElem(vec) {
  const sims = {
    water: meanSim(vec, anchorVecs.water),
    wind: meanSim(vec, anchorVecs.wind),
    fire: meanSim(vec, anchorVecs.fire),
  };
  const avg = (sims.water + sims.wind + sims.fire) / 3;
  const rel = (s) => Math.max(0, Math.min(1, (s - avg) / SPREAD));
  return { water: rel(sims.water), wind: rel(sims.wind), fire: rel(sims.fire) };
}

// 単語ベクトル＋辞書から、その語の総合要素スコアを作る
function combinedElem(vec, word) {
  return orElem(keywordScores(word), embElem(vec));
}

function dominantElement(elem) {
  const m = Math.max(elem.water, elem.wind, elem.fire);
  if (m < 0.12) return null; // ほぼ無色
  if (elem.water === m) return "water";
  if (elem.wind === m) return "wind";
  return "fire";
}

// モデルを読み込み、アンカー＋語彙の埋め込みを事前計算する。
export async function loadEmbedder(onProgress) {
  if (extractorPromise) return extractorPromise;
  extractorPromise = (async () => {
    const { pipeline, env } = await import("@huggingface/transformers");
    env.allowLocalModels = false; // ローカル404を避けリモートのみ
    const extractor = await pipeline("feature-extraction", MODEL_ID, {
      dtype: "q8", // int8量子化（約110MB）でDLを軽くする
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
      fire: await embed(FIRE_ANCHORS),
    };

    // 語彙をチャンクで埋め込み（メモリ節約）→ 各語の総合スコアを事前計算
    const vecs = [];
    const CHUNK = 16;
    for (let i = 0; i < VOCAB.length; i += CHUNK) {
      const part = await embed(
        VOCAB.slice(i, i + CHUNK).map((w) => "passage: " + w)
      );
      for (const v of part) vecs.push(v);
    }
    vocab = VOCAB.map((word, i) => ({
      word,
      vec: vecs[i],
      combined: combinedElem(vecs[i], word),
    }));

    return embed;
  })();
  return extractorPromise;
}

// 入力テキストを解析：スコア＋連想語を返す（モデル未ロードなら null）
export async function analyzeFull(text) {
  if (!extractorPromise || !vocab || !text.trim()) return null;
  const embed = await extractorPromise;
  const [vec] = await embed(["query: " + text]);

  // 入力自身の総合スコア
  const inputCombined = combinedElem(vec, text);

  // 連想：語彙の中から意味的に近い語を上位K件（自明な一致は除外）
  const ranked = vocab
    .filter((d) => !text.includes(d.word) && !d.word.includes(text))
    .map((d) => ({ ...d, sim: dot(vec, d.vec) }))
    .sort((a, b) => b.sim - a.sim)
    .slice(0, ASSOC_K);

  // 類似度をソフトマックスで重み付け（上位ほど効く）
  const maxSim = ranked.length ? ranked[0].sim : 0;
  const exps = ranked.map((d) => Math.exp((d.sim - maxSim) / ASSOC_TEMP));
  const expSum = exps.reduce((a, b) => a + b, 0) || 1;

  // 連想語の要素スコアを加重平均
  const assoc = { water: 0, wind: 0, fire: 0 };
  ranked.forEach((d, i) => {
    const w = exps[i] / expSum;
    assoc.water += w * d.combined.water;
    assoc.wind += w * d.combined.wind;
    assoc.fire += w * d.combined.fire;
  });

  // 入力スコア に 連想スコア を OR合成（ゆるく上乗せ）
  const scores = {
    water: Math.min(1, orVal(inputCombined.water, ASSOC_GAIN * assoc.water)),
    wind: Math.min(1, orVal(inputCombined.wind, ASSOC_GAIN * assoc.wind)),
    fire: Math.min(1, orVal(inputCombined.fire, ASSOC_GAIN * assoc.fire)),
  };

  const associations = ranked.map((d) => ({
    word: d.word,
    element: dominantElement(d.combined),
  }));

  return { scores, associations };
}
