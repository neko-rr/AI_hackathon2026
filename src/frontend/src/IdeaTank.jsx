import { fluidStateToCssVars } from "./fluidState";

/** 届いたアイデア見出し用ミニタンク */
export function TankIcon({ fluidState, fillPercent = 40, active = false, steam = false }) {
  const cssVars = fluidStateToCssVars(fluidState);
  return (
    <div
      className={`tank-icon ${active ? "active" : ""} ${steam ? "tank-icon--steam" : ""}`}
      style={{ ...cssVars, "--tank-fill": `${fillPercent}%` }}
      aria-hidden
    >
      <div className="tank-icon-shell">
        <div className="tank-icon-fill">
          <span className="tank-icon-bubble tank-icon-bubble--1" />
          <span className="tank-icon-bubble tank-icon-bubble--2" />
        </div>
        <div className="tank-icon-glass" />
      </div>
    </div>
  );
}

/** タービンからタンクへ流体を流し込む */
export default function IdeaTank({
  fluidState,
  fluidType = "liquid",
  fillPercent = 0,
  flowing = false,
  received = false,
  label = "",
}) {
  const cssVars = fluidStateToCssVars(fluidState);
  const isSteam = fluidType === "steam";
  const clampedFill = Math.min(100, Math.max(0, fillPercent));

  return (
    <div
      className={`idea-tank-wrap ${flowing ? "flowing" : ""} ${received ? "received" : ""} ${isSteam ? "idea-tank-wrap--steam" : ""}`}
      style={cssVars}
      aria-hidden
    >
      <div className="idea-tank-inlet">
        <div className="idea-tank-pipe">
          <div className="idea-tank-stream idea-tank-stream--1" />
          <div className="idea-tank-stream idea-tank-stream--2" />
          <div className="idea-tank-stream idea-tank-stream--3" />
        </div>
        {label && flowing && <span className="idea-tank-stream-label">{label.slice(0, 6)}</span>}
      </div>

      <div className="idea-tank-unit">
        <span className="idea-tank-label">アイデアタンク</span>
        <div className={`idea-tank-body ${received ? "full" : ""}`}>
          <div
            className="idea-tank-fill"
            style={{ "--tank-fill": `${clampedFill}%` }}
          >
            <div className="idea-tank-surface" />
            <span className="idea-tank-bubble idea-tank-bubble--1" />
            <span className="idea-tank-bubble idea-tank-bubble--2" />
            <span className="idea-tank-bubble idea-tank-bubble--3" />
          </div>
          <div className="idea-tank-glass" />
          <div className="idea-tank-scale">
            <span>満</span>
            <span>半</span>
            <span>空</span>
          </div>
        </div>
        {received && <span className="idea-tank-ready">届きました</span>}
        {flowing && !received && clampedFill >= 85 && (
          <span className="idea-tank-ready idea-tank-ready--wait">溜まり中…</span>
        )}
      </div>
    </div>
  );
}
