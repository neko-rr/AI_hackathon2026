/** 3タービンの軸定義・ランダム2D配置・通過ルート */

export const TURBINE_AXES = [
  { id: "difficulty", label: "難易度", pool: ["やさしい", "ふつう", "むずかしい"] },
  { id: "audience", label: "対象", pool: ["自分", "相手", "みんな"] },
  { id: "scene", label: "場面", pool: ["会議", "学校", "日常", "審査"] },
];

export const TURBINE_COUNT = TURBINE_AXES.length;

export const FLUID_TYPES = {
  liquid: { id: "liquid", label: "液体", flowLabel: "↓ 下へ流れる" },
  steam: { id: "steam", label: "蒸気", flowLabel: "↑ 上へ昇る" },
};

const MIN_DIST = 22;
const X_MIN = 12;
const X_MAX = 88;
const Y_MIN = 18;
const Y_MAX = 82;

function pickValue(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}

/** ステージ上に重ならないランダム座標（%） */
function generateScatterPositions(count) {
  const positions = [];
  let guard = 0;
  while (positions.length < count && guard < 400) {
    const x = Math.round(X_MIN + Math.random() * (X_MAX - X_MIN));
    const y = Math.round(Y_MIN + Math.random() * (Y_MAX - Y_MIN));
    const ok = positions.every(
      (p) => Math.hypot(p.x - x, p.y - y) >= MIN_DIST
    );
    if (ok) positions.push({ x, y });
    guard += 1;
  }
  if (positions.length < count) {
    return [
      { x: 22, y: 28 },
      { x: 72, y: 52 },
      { x: 38, y: 74 },
    ];
  }
  return positions;
}

/** 通過順（液体=上→下、蒸気=下→上） */
function sortByFlowOrder(turbines, fluidType) {
  const copy = [...turbines];
  if (fluidType === "steam") {
    copy.sort((a, b) => b.yPercent - a.yPercent || a.xPercent - b.xPercent);
  } else {
    copy.sort((a, b) => a.yPercent - b.yPercent || a.xPercent - b.xPercent);
  }
  return copy.map((t, i) => ({ ...t, passageOrder: i }));
}

export function getStartPoint(fluidType) {
  return fluidType === "steam"
    ? { x: 50, y: 92 }
    : { x: 50, y: 8 };
}

export function getEndPoint(fluidType) {
  return fluidType === "steam"
    ? { x: 50, y: 8 }
    : { x: 50, y: 92 };
}

/** 曲線ルート（viewBox 0-100） */
export function buildRoutePath(points) {
  if (!points || points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const curr = points[i];
    const cx = (prev.x + curr.x) / 2;
    const cy = (prev.y + curr.y) / 2;
    d += ` Q ${cx} ${cy}, ${curr.x} ${curr.y}`;
  }
  return d;
}

/** ルート上の進捗率（0-100） */
function stepProgress(index, totalSteps) {
  if (totalSteps <= 1) return 100;
  return Math.round((index / (totalSteps - 1)) * 100);
}

export function rollTurbineRun() {
  const fluidType = Math.random() < 0.5 ? "liquid" : "steam";
  const fluidMeta = FLUID_TYPES[fluidType];
  const scatter = generateScatterPositions(TURBINE_COUNT);

  const placed = TURBINE_AXES.map((axis, i) => ({
    ...axis,
    value: pickValue(axis.pool),
    xPercent: scatter[i].x,
    yPercent: scatter[i].y,
  }));

  const turbines = sortByFlowOrder(placed, fluidType);
  const passSteps = buildPassSteps(fluidType, turbines);
  const routePoints = [
    getStartPoint(fluidType),
    ...turbines.map((t) => ({ x: t.xPercent, y: t.yPercent })),
    getEndPoint(fluidType),
  ];
  const routePath = buildRoutePath(routePoints);

  return { fluidType, fluidMeta, turbines, passSteps, routePath, routePoints };
}

export function headToProgress(_fluidType, stepIndex, totalSteps) {
  return stepProgress(stepIndex, totalSteps);
}

export function buildPassSteps(fluidType, turbinesSorted) {
  const start = getStartPoint(fluidType);
  const end = getEndPoint(fluidType);
  const totalSteps = turbinesSorted.length + 2;

  const steps = [
    {
      headX: start.x,
      headY: start.y,
      progress: 0,
      turbineIndex: -1,
    },
  ];

  turbinesSorted.forEach((t, i) => {
    steps.push({
      headX: t.xPercent,
      headY: t.yPercent,
      progress: stepProgress(i + 1, totalSteps - 1),
      turbineIndex: i,
    });
  });

  steps.push({
    headX: end.x,
    headY: end.y,
    progress: 100,
    turbineIndex: turbinesSorted.length,
  });

  return steps;
}

export function turbinesToMap(turbines) {
  if (!Array.isArray(turbines)) return {};
  return Object.fromEntries(turbines.map((t) => [t.id, t.value]));
}

export function formatTurbineRecap(turbines) {
  if (!Array.isArray(turbines) || !turbines.length) return "";
  return turbines.map((t) => `${t.label}：${t.value}`).join(" / ");
}

export function formatFluidRecap(fluidMeta) {
  if (!fluidMeta) return "";
  return `${fluidMeta.label}（${fluidMeta.flowLabel}）`;
}
