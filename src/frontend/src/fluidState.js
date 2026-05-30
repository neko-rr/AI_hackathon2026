/** 質問 → 流体状態、タービン通過時の視覚変換 */

const DEFAULT_STATE = {
  hue: 200,
  speed: 1,
  opacity: 0.75,
  blur: 8,
  particleScale: 1,
  wave: 1,
  label: "？",
};

function hashQuestion(text) {
  let h = 0;
  const s = (text || "").trim();
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) % 360;
  }
  return h;
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

/** 質問から初期流体を生成 */
export function createFluidFromQuestion(question, fluidType = "liquid") {
  const raw = (question || "").trim();
  const isSteam = fluidType === "steam";
  return {
    ...DEFAULT_STATE,
    hue: isSteam ? 38 : hashQuestion(raw) || DEFAULT_STATE.hue,
    opacity: isSteam ? 0.62 : DEFAULT_STATE.opacity,
    blur: isSteam ? 10 : DEFAULT_STATE.blur,
    speed: isSteam ? 1.15 : DEFAULT_STATE.speed,
    label: raw.slice(0, 8) || "？",
    fluidType,
  };
}

function applyDifficulty(state, value) {
  if (value === "やさしい") {
    return {
      ...state,
      hue: clamp(state.hue + 20, 0, 360),
      speed: state.speed * 0.7,
      particleScale: state.particleScale * 1.25,
      blur: clamp(state.blur - 2, 2, 20),
      opacity: clamp(state.opacity + 0.1, 0.4, 1),
    };
  }
  if (value === "むずかしい") {
    return {
      ...state,
      hue: clamp(state.hue - 30, 0, 360),
      speed: state.speed * 1.3,
      particleScale: state.particleScale * 0.75,
      blur: clamp(state.blur + 4, 2, 20),
      opacity: clamp(state.opacity - 0.05, 0.4, 1),
    };
  }
  return state;
}

function applyAudience(state, value) {
  if (value === "自分") {
    return {
      ...state,
      hue: clamp(state.hue + 15, 0, 360),
      opacity: clamp(state.opacity + 0.08, 0.4, 1),
    };
  }
  if (value === "相手") {
    return {
      ...state,
      hue: clamp(state.hue - 15, 0, 360),
    };
  }
  if (value === "みんな") {
    return {
      ...state,
      hue: clamp(state.hue + 8, 0, 360),
      wave: state.wave * 1.35,
    };
  }
  return state;
}

function applyScene(state, value) {
  if (value === "会議") {
    return {
      ...state,
      wave: state.wave * 0.65,
      speed: state.speed * 0.95,
    };
  }
  if (value === "学校") {
    return {
      ...state,
      wave: state.wave * 1.5,
    };
  }
  if (value === "日常") {
    return {
      ...state,
      opacity: clamp(state.opacity + 0.1, 0.4, 1),
      speed: state.speed * 0.9,
    };
  }
  if (value === "審査") {
    return {
      ...state,
      speed: state.speed * 1.2,
      blur: clamp(state.blur - 3, 2, 20),
    };
  }
  return state;
}

/** タービン通過時に流体状態を累積変換 */
export function applyTurbineTransform(state, axisId, value) {
  if (!state || !axisId) return state;

  switch (axisId) {
    case "difficulty":
      return applyDifficulty(state, value);
    case "audience":
      return applyAudience(state, value);
    case "scene":
      return applyScene(state, value);
    default:
      return state;
  }
}

/** CSS 変数オブジェクト */
export function fluidStateToCssVars(state) {
  if (!state) return {};
  return {
    "--fluid-hue": String(Math.round(state.hue)),
    "--fluid-speed": String(state.speed.toFixed(2)),
    "--fluid-opacity": String(state.opacity.toFixed(2)),
    "--fluid-blur": `${Math.round(state.blur)}px`,
    "--fluid-scale": String(state.particleScale.toFixed(2)),
    "--fluid-wave": String(state.wave.toFixed(2)),
    "--fluid-flow-duration": `${(2.8 / state.speed).toFixed(2)}s`,
  };
}
