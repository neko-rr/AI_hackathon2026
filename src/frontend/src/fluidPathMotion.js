/** SVG パス上の流体位置サンプリング（viewBox 0–100 想定） */

const SVG_NS = "http://www.w3.org/2000/svg";

export function easeOutCubic(t) {
  const u = Math.min(1, Math.max(0, t));
  return 1 - (1 - u) ** 3;
}

/** path d から getPointAtLength 用サンプラを生成 */
export function createPathSampler(pathD) {
  if (!pathD || typeof pathD !== "string") return null;

  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", pathD);

  const total = path.getTotalLength();
  if (!total || !Number.isFinite(total)) return null;

  return {
    total,
    at(progress01) {
      const t = Math.min(1, Math.max(0, progress01));
      const p = path.getPointAtLength(t * total);
      return { x: p.x, y: p.y };
    },
  };
}

/** 頭・中間・尾の位置（ルート進捗 0–1） */
export function sampleTrail(sampler, progress01) {
  if (!sampler) {
    return {
      head: { x: 50, y: 8 },
      mid: { x: 50, y: 8 },
      tail: { x: 50, y: 8 },
    };
  }
  const t = Math.min(1, Math.max(0, progress01));
  const lagMid = 0.038;
  const lagTail = 0.078;
  return {
    head: sampler.at(t),
    mid: sampler.at(Math.max(0, t - lagMid)),
    tail: sampler.at(Math.max(0, t - lagTail)),
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
  if (routeProgress100 != null) {
    el.style.setProperty("--route-progress", String(routeProgress100));
  }
}
