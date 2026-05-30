// 意外発送タービン — 質問を流体→タービン→条件付き回答

import { formatTurbineRecap, turbinesToMap, TURBINE_COUNT } from "./turbinePools";

const API_URL = import.meta.env.VITE_API_URL || "";
const DELIVERY_TITLE = "届いたアイデア";

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
    body = `${body}（エネルギー変換の観点では、入力の運動エネルギーを回転運動として取り出し、発電機へ伝達します。）`;
  }

  const audiencePrefix = {
    自分: "自分が理解するには：",
    相手: "相手に説明するときは：",
    みんな: "みんなに伝えるなら：",
  };
  body = `${audiencePrefix[aud] || ""}${body}`;

  const sceneSuffix = {
    会議: " 要点を3つに絞って話すと伝わりやすいです。",
    学校: " 身近な例え（扇風機や水車）を添えると理解が深まります。",
    日常: " 身の回りの「回って何かを作る」ものに例えるとイメージしやすいです。",
    審査: " デモでは「入力→回転→出力」を短く見せるのが効果的です。",
  };
  body = `${body}${sceneSuffix[scene] || ""}`;

  return body.slice(0, 280);
}

function baseAnswersForQuestion(q) {
  const t = q.toLowerCase();

  if (t.includes("タービン") && (t.includes("何") || t.includes("?") || t.includes("？"))) {
    return [
      {
        headline: "タービンとは",
        body: "水や風、蒸気などの力で羽根が回り、その回転で電気を作る装置です。発電所でよく使われます。",
      },
      {
        headline: "どう動く？",
        body: "流れの力が羽根を回し、回転が発電機につながって電気になります。",
      },
      {
        headline: "身近な例",
        body: "風力発電の大きな扇風機のような形を想像すると分かりやすいです。",
      },
    ];
  }

  if (t.includes("風力") || (t.includes("風") && t.includes("発電"))) {
    return [
      {
        headline: "風力タービンの答え",
        body: "風で羽根が回り、発電機とつながって電気を作ります。風の強い場所に建てられます。",
      },
    ];
  }

  if (t.includes("蒸気")) {
    return [
      {
        headline: "蒸気タービンの答え",
        body: "ボイラーで作った蒸気が羽根を回し、発電機を動かして電気を作ります。火力発電などで使われます。",
      },
    ];
  }

  if (t.includes("水力") || (t.includes("水") && t.includes("発電"))) {
    return [
      {
        headline: "水力タービンの答え",
        body: "ダムなどの水の流れで羽根が回り、発電機で電気を作ります。",
      },
    ];
  }

  return [
    {
      headline: "ご質問への答え",
      body: `「${q}」について、タービン（回転してエネルギーを変える仕組み）の視点では、力や流れを別の形に変換することが大切、と考えられます。`,
    },
    {
      headline: "もう少し詳しく",
      body: "タービンは「入力（水・風・蒸気）→ 回転 → 出力（電気）」という変換の連鎖で動く装置です。",
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
          body: "例：「タービンって何？」と書いて「仕掛けを動かす」を押すと、流体が3つのタービンを通り、ここに答えが届きます。",
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
      const body = String(x.body || "").slice(0, 280);
      return {
        headline: String(x.headline || "").slice(0, 40),
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

export const SAMPLES = {
  question: "タービンって何？",
  questionWind: "風力発電の仕組みは？",
};

export { TURBINE_COUNT };

/** API 接続済みか（UI 表示用） */
export function isApiConfigured() {
  return Boolean(API_URL);
}
