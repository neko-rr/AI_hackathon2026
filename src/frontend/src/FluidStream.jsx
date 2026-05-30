import { useRef, useEffect } from "react";
import { fluidStateToCssVars } from "./fluidState";
import {
  createPathSampler,
  easeOutCubic,
  sampleTrail,
  applyTrailToElement,
} from "./fluidPathMotion";

const SEGMENT_MS_BASE = 1050;

function chipIsOn(t, passIndex, passSteps) {
  if (passIndex <= 0) return false;
  const idx = Math.min(passIndex, Math.max(passSteps.length - 1, 0));
  const currentOrder = passSteps[idx]?.turbineIndex ?? -1;
  return currentOrder >= 0 && t.passageOrder <= currentOrder;
}

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
  const stageRef = useRef(null);
  const progressRef = useRef(0);
  const animFrameRef = useRef(null);

  const cssVars = fluidStateToCssVars(fluidState);
  const idx = Math.min(Math.max(passIndex, 0), Math.max(passSteps.length - 1, 0));
  const step = passSteps[idx] || { headX: 50, headY: 8, progress: 0 };
  const label = fluidState?.label || "？";
  const isSteam = fluidType === "steam";
  const flowClass = isSteam ? "fluid--steam" : "fluid--liquid";
  const targetProgress = step.progress ?? 0;
  const flowSpeed = fluidState?.speed ?? 1;

  useEffect(() => {
    if (!active || !routePath || !stageRef.current) return undefined;

    const sampler = createPathSampler(routePath);
    const fromProgress = progressRef.current;
    const toProgress = targetProgress;
    const duration = SEGMENT_MS_BASE / flowSpeed;

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (Math.abs(fromProgress - toProgress) < 0.01) {
      const trail = sampleTrail(sampler, toProgress / 100);
      applyTrailToElement(stageRef.current, trail, toProgress);
      progressRef.current = toProgress;
      return undefined;
    }

    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const u = easeOutCubic(Math.min(1, elapsed / duration));
      const current = fromProgress + (toProgress - fromProgress) * u;
      progressRef.current = current;
      const trail = sampleTrail(sampler, current / 100);
      applyTrailToElement(stageRef.current, trail, current);

      if (u < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        progressRef.current = toProgress;
        animFrameRef.current = null;
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [active, routePath, passIndex, targetProgress, flowSpeed]);

  useEffect(() => {
    if (!active) {
      progressRef.current = 0;
      if (stageRef.current) {
        applyTrailToElement(
          stageRef.current,
          sampleTrail(null, 0),
          0
        );
      }
    }
  }, [active]);

  return (
    <div
      ref={stageRef}
      className={`fluid-stage ${flowClass} ${active ? "on flowing" : ""}`}
      style={cssVars}
      aria-hidden={!active}
    >
      <div className="fluid-type-badge">
        {isSteam ? "蒸気 ↑ 上へ昇る" : "液体 ↓ 下へ流れる"}
      </div>

      {turbines.length > 0 && (
        <div className="condition-chips" aria-label="通過する条件">
          {turbines.map((t) => (
            <span
              key={t.id}
              className={`condition-chip ${chipIsOn(t, passIndex, passSteps) ? "on" : ""} ${highlightOrder === t.passageOrder ? "pulse" : ""}`}
            >
              <span className="chip-axis">{t.label}</span>
              <span className="chip-value">{t.value}</span>
            </span>
          ))}
        </div>
      )}

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
          <svg
            className="river-waves-svg"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              className="river-wave river-wave--1"
              d={
                isSteam
                  ? "M0,6 Q25,14 50,6 T100,6 L100,0 L0,0 Z"
                  : "M0,94 Q25,86 50,94 T100,94 L100,100 L0,100 Z"
              }
            />
            <path
              className="river-wave river-wave--2"
              d={
                isSteam
                  ? "M0,12 Q30,4 60,12 T100,12 L100,0 L0,0 Z"
                  : "M0,88 Q30,96 60,88 T100,88 L100,100 L0,100 Z"
              }
            />
          </svg>

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
                className="fluid-route-stream"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d={routePath}
                className="fluid-route-active"
                pathLength="100"
                vectorEffect="non-scaling-stroke"
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
                <div className="turbine-splash" aria-hidden />
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
