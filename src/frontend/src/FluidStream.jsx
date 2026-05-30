import { fluidStateToCssVars } from "./fluidState";

export default function FluidStream({
  fluidState,
  fluidType = "liquid",
  passIndex = 0,
  passSteps = [],
  routePath = "",
  turbines = [],
  highlightOrder = -1,
  active,
  lightOn = false,
  onTurbineRender,
}) {
  const cssVars = fluidStateToCssVars(fluidState);
  const idx = Math.min(Math.max(passIndex, 0), Math.max(passSteps.length - 1, 0));
  const step = passSteps[idx] || { headX: 50, headY: 8, progress: 0 };
  const label = fluidState?.label || "？";
  const isSteam = fluidType === "steam";
  const flowClass = isSteam ? "fluid--steam" : "fluid--liquid";
  const routeProgress = step.progress ?? 0;

  return (
    <div
      className={`fluid-stage ${flowClass} ${active ? "on flowing" : ""}`}
      style={{
        ...cssVars,
        "--fluid-x": `${step.headX ?? 50}%`,
        "--fluid-y": `${step.headY ?? 8}%`,
        "--route-progress": routeProgress,
      }}
      aria-hidden={!active}
    >
      <div className="fluid-type-badge">
        {isSteam ? "蒸気 ↑ 上へ昇る" : "液体 ↓ 下へ流れる"}
      </div>

      <svg className="fluid-filter-def" aria-hidden="true">
        <defs>
          <filter id="fluid-goo" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      <div className="scatter-field-wrap">
        <div className="scatter-field">
          {routePath && (
            <svg
              className="fluid-route-svg"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden
            >
              <path d={routePath} className="fluid-route" vectorEffect="non-scaling-stroke" />
              <path
                d={routePath}
                className="fluid-route-active"
                pathLength="100"
                vectorEffect="non-scaling-stroke"
                style={{
                  strokeDasharray: 100,
                  strokeDashoffset: 100 - routeProgress,
                }}
              />
            </svg>
          )}

          <div className="fluid-goo">
            <div className="fluid-blob fluid-blob--tail" />
            <div className="fluid-blob fluid-blob--mid" />
            <div className="fluid-blob fluid-blob--head">
              <span className="fluid-label">{label}</span>
            </div>
          </div>

          {turbines.map((t) => {
            const currentOrder = step.turbineIndex ?? -1;
            const isHighlight =
              highlightOrder >= 0 && t.passageOrder === highlightOrder;
            const touched =
              passIndex > 0 &&
              currentOrder >= 0 &&
              t.passageOrder <= currentOrder;

            return (
              <div
                key={t.id}
                className={`turbine-mount ${touched ? "touched" : ""} ${isHighlight ? "highlight" : ""}`}
                style={{
                  left: `${t.xPercent}%`,
                  top: `${t.yPercent}%`,
                }}
              >
                <div className="turbine-touch-ring" aria-hidden />
                {onTurbineRender
                  ? onTurbineRender(
                      t,
                      isHighlight,
                      lightOn && t.passageOrder === turbines.length - 1
                    )
                  : null}
                <span className="turbine-axis-label">{t.label}</span>
                <span className="turbine-badge">{t.value}</span>
              </div>
            );
          })}
        </div>

        <div className={`flow-direction-hint ${isSteam ? "up" : "down"}`} aria-hidden>
          {isSteam ? "▲ 上へ" : "▼ 下へ"}
        </div>
      </div>
    </div>
  );
}

export function TurbineSvg({ id, angle, size, glowing }) {
  const BLADES = 6;
  return (
    <svg
      className={`turbine-svg${glowing ? " turbine-svg--glow" : ""}`}
      viewBox="-110 -110 220 220"
      width={size}
      height={size}
    >
      <defs>
        <radialGradient id={`hub-${id}`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="var(--accent-warm)" />
          <stop offset="100%" stopColor="#5a4a2a" />
        </radialGradient>
        <linearGradient id={`blade-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="#8a6a30" />
        </linearGradient>
      </defs>
      <circle r="100" fill="none" stroke="#6a5530" strokeWidth="6" />
      <g transform={`rotate(${angle})`}>
        {Array.from({ length: BLADES }, (_, i) => (
          <g key={i} transform={`rotate(${(360 / BLADES) * i})`}>
            <path
              d="M 0 -14 Q 26 -40 18 -90 Q 6 -70 0 -14 Z"
              fill={`url(#blade-${id})`}
              stroke="#6a5530"
              strokeWidth="1"
            />
          </g>
        ))}
        <circle r="22" fill={`url(#hub-${id})`} stroke="#fff2c2" strokeWidth="2" />
      </g>
    </svg>
  );
}
