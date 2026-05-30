// 意外発送タービン — 質問を流体→タービン→条件付き回答

import { formatTurbineRecap, turbinesToMap, TURBINE_COUNT } from "./turbinePools";

const API_URL = import.meta.env.VITE_API_URL || "";
const DELIVERY_TITLE = "届いたアイデア";
const MAX_BODY_LEN = 300;
const MAX_HEADLINE_LEN = 40;

function normalizeTurbines(turbines) {
  if (Array.isArray(turbines) && turbines.length) {
    return turbines;
  }
  return [];
}

/** 3軸に応じて本文を修飾 */
function adaptBody(baseBody, turbinesMap) {
  const diff = turbinesMap.difficulty || "ふつう";
  const aud = turbinesMap.audience || "みんな";
  const scene = turbinesMap.scene || "日常";

  let body = baseBody;

  if (diff === "やさしい") {
    body = body.replace(/装置/g, "仕組み").replace(/エネルギー/g, "力");
  } else if (diff === "むずかしい") {
    body = `${body}（もう一歩踏み込むと、背景や理由を押さえると理解が深まります。）`;
  }

  const audiencePrefix = {
    自分: "自分が理解するには：",
    相手: "相手に説明するときは：",
    みんな: "みんなに伝えるなら：",
  };
  body = `${audiencePrefix[aud] || ""}${body}`;

  const sceneSuffix = {
    会議: " 要点を3つに絞って話すと伝わりやすいです。",
    学校: " 身近な例えを添えると理解が深まります。",
    日常: " 身の回りの例に置き換えるとイメージしやすいです。",
    審査: " 短くまとめて伝えると伝わりやすいです。",
  };
  body = `${body}${sceneSuffix[scene] || ""}`;

  return body.slice(0, MAX_BODY_LEN);
}

function baseAnswersForQuestion(q) {
  const t = q.toLowerCase();

  if (t.includes("猫") && (t.includes("好") || t.includes("かれる"))) {
    return [
      {
        headline: "まずは安全に",
        body: "無理に触らず、猫のペースに合わせるのが基本です。急接近や大声は避けましょう。",
      },
      {
        headline: "距離の取り方",
        body: "低い姿勢で、視線を合わせすぎず、おやつやおもちゃで関心を向けてみてください。",
      },
    ];
  }

  if (t.includes("ハッカソン") || t.includes("攻略")) {
    return [
      {
        headline: "時間の使い方",
        body: "最初に動く最小版（MVP）を決め、見せる体験を最優先にすると成果が出やすいです。",
      },
      {
        headline: "チーム運用",
        body: "役割を分け、5分迷ったら削る。デモで見せる操作は3分以内に収まるように設計しましょう。",
      },
    ];
  }

  if (t.includes("ご飯") || t.includes("食事") || t.includes("昼") || t.includes("夕")) {
    return [
      {
        headline: "今日のごはん案",
        body: "バランスを意識するなら、主食・たんぱく質・野菜の3つをそろえると選びやすいです。",
      },
      {
        headline: "手軽な選択",
        body: "時間がない日は丼ものやスープ付き定食など、一皿でそろうメニューもおすすめです。",
      },
    ];
  }

  if (t.includes("タービン") && (t.includes("何") || t.includes("?") || t.includes("？"))) {
    return [
      {
        headline: "タービンとは",
        body: "水や風、蒸気などの力で羽根が回り、その回転で電気を作る装置です。",
      },
      {
        headline: "どう動く？",
        body: "流れの力が羽根を回し、回転が発電機につながって電気になります。",
      },
    ];
  }

  return [
    {
      headline: "ご質問への答え",
      body: `「${q}」について、まずは目的をはっきりさせ、小さく試してから広げていくのが近道です。`,
    },
    {
      headline: "次の一歩",
      body: "気になる点を1つに絞り、今日できることから始めてみてください。",
    },
  ];
}

/** デモ用：よくある質問 + タービン条件 */
function buildAnswerFallback(input, turbines = []) {
  const q = (input || "").trim();
  const turbinesMap = turbinesToMap(turbines);
  const turbineRecap = formatTurbineRecap(turbines);

  if (!q) {
    return {
      question: "",
      turbines,
      turbineRecap,
      deliveryTitle: DELIVERY_TITLE,
      deliveryItems: [
        {
          headline: "質問を入力してください",
          body: "例：「猫に好かれる方法」と書いて「仕掛けを動かす」を押すと、流体が3つのタービンを通り、ここに答えが届きます。",
        },
      ],
      fallback: true,
    };
  }

  const items = baseAnswersForQuestion(q).map((item) => ({
    headline: item.headline,
    body: adaptBody(item.body, turbinesMap),
  }));

  return {
    question: q,
    turbines,
    turbineRecap,
    deliveryTitle: DELIVERY_TITLE,
    deliveryItems: items,
    fallback: true,
  };
}

function normalizePayload(data, input, turbines, skipAdapt = false) {
  const base = buildAnswerFallback(input, turbines);
  if (!data || typeof data !== "object") return base;

  const turbinesMap = turbinesToMap(turbines);
  const items = Array.isArray(data.deliveryItems) ? data.deliveryItems : base.deliveryItems;
  const cleaned = items
    .filter((x) => x && (x.headline || x.body))
    .slice(0, 3)
    .map((x) => {
      const body = String(x.body || "").slice(0, MAX_BODY_LEN);
      return {
        headline: String(x.headline || "").slice(0, MAX_HEADLINE_LEN),
        body: skipAdapt ? body : adaptBody(body, turbinesMap),
      };
    });

  return {
    question: data.question || input || base.question,
    turbines: Array.isArray(data.turbines) ? data.turbines : base.turbines,
    turbineRecap: data.turbineRecap || base.turbineRecap,
    deliveryTitle: DELIVERY_TITLE,
    deliveryItems: cleaned.length ? cleaned : base.deliveryItems,
    fallback: Boolean(data.fallback),
  };
}

/** 質問とタービン条件を送り、回答を届ける */
export async function fetchDelivery(text, context = {}) {
  const input = (text || "").trim();
  const normalizedTurbines = normalizeTurbines(context.turbines);
  const fluidType = context.fluidType === "steam" ? "steam" : "liquid";
  const fallback = buildAnswerFallback(input, normalizedTurbines);
  const turbinesPayload = turbinesToMap(normalizedTurbines);

  if (!API_URL) {
    await delay(350);
    return fallback;
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: input,
        fluidType,
        turbines: turbinesPayload,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const skipAdapt = data.fallback === false;
    return normalizePayload(data, input, normalizedTurbines, skipAdapt);
  } catch (e) {
    console.warn("fetchDelivery fallback:", e.message);
    return { ...fallback, fallback: true };
  }
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export const SAMPLE_QUESTIONS = [
  { label: "猫に好かれる方法", text: "猫に好かれる方法" },
  { label: "ハッカソンの攻略方法", text: "ハッカソンの攻略方法" },
  { label: "今日のご飯", text: "今日のご飯" },
];

export { TURBINE_COUNT };

/** API 接続済みか（UI 表示用） */
export function isApiConfigured() {
  return Boolean(API_URL);
}
