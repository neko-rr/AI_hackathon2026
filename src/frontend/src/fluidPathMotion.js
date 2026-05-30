/** SVG パス上の流体位置サンプリング（viewBox 0–100 想定） */

const SVG_NS = "http://www.w3.org/2000/svg";

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

/**
 * path d から弧長ベースのサンプラを生成
 * getPointAtLength は弧長 parameter を使うため、s(t)移動に使える
 */
export function createPathSampler(pathD) {
  if (!pathD || typeof pathD !== "string") return null;

  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", pathD);

  const total = path.getTotalLength();
  if (!total || !Number.isFinite(total)) return null;

  const atLength = (length) => {
    const s = clamp(length, 0, total);
    const point = path.getPointAtLength(s);
    const delta = Math.max(0.8, total * 0.004);
    const prev = path.getPointAtLength(clamp(s - delta, 0, total));
    const next = path.getPointAtLength(clamp(s + delta, 0, total));
    const tx = next.x - prev.x;
    const ty = next.y - prev.y;
    const norm = Math.hypot(tx, ty) || 1;
    return {
      x: point.x,
      y: point.y,
      tangentX: tx / norm,
      tangentY: ty / norm,
      angleDeg: (Math.atan2(ty, tx) * 180) / Math.PI,
    };
  };

  return {
    total,
    at(progress01) {
      const t = clamp(progress01, 0, 1);
      return atLength(t * total);
    },
    atLength,
  };
}

/** 頭・中間・尾を弧長距離で取得（接線込み） */
export function sampleTrail(sampler, progress01, options = {}) {
  if (!sampler) {
    return {
      head: { x: 50, y: 8, tangentX: 0, tangentY: 1, angleDeg: 90 },
      mid: { x: 50, y: 8, tangentX: 0, tangentY: 1, angleDeg: 90 },
      tail: { x: 50, y: 8, tangentX: 0, tangentY: 1, angleDeg: 90 },
    };
  }

  const t = clamp(progress01, 0, 1);
  const headLength = t * sampler.total;
  const spacingMid = options.spacingMid ?? 5.4;
  const spacingTail = options.spacingTail ?? 10.2;

  return {
    head: sampler.atLength(headLength),
    mid: sampler.atLength(headLength - spacingMid),
    tail: sampler.atLength(headLength - spacingTail),
  };
}

export function applyTrailToElement(el, trail, routeProgress100) {
  if (!el || !trail) return;
  el.style.setProperty("--fluid-x", `${trail.head.x}%`);
  el.style.setProperty("--fluid-y", `${trail.head.y}%`);
  el.style.setProperty("--fluid-mid-x", `${trail.mid.x}%`);
  el.style.setProperty("--fluid-mid-y", `${trail.mid.y}%`);
  el.style.setProperty("--fluid-tail-x", `${trail.tail.x}%`);
  el.style.setProperty("--fluid-tail-y", `${trail.tail.y}%`);
  el.style.setProperty("--fluid-angle", `${trail.head.angleDeg.toFixed(2)}deg`);
  if (routeProgress100 != null) {
    el.style.setProperty("--route-progress", String(routeProgress100));
  }
}
