import { useState, useEffect, useRef } from "react";
import { keywordScores, embeddingScores, blend, loadEmbedder } from "./analyze";

// タービンの羽根（8枚）
const BLADES = Array.from({ length: 8 }, (_, i) => i);

export default function App() {
  const [text, setText] = useState("");
  // 解析結果の強さ（0..1）
  const [scores, setScores] = useState({ water: 0, wind: 0 });

  // 埋め込みモデルの状態: off → loading → ready
  const [embedState, setEmbedState] = useState("off");
  const [embedProgress, setEmbedProgress] = useState(0);
  const [busy, setBusy] = useState(false);

  const wI = scores.water; // 水の強さ
  const fI = scores.wind; // 風の強さ
  const total = wI + fI;
  const spinning = total > 0.02;

  // ===== 解析実行 =====
  const analyze = async (value) => {
    const t = value ?? text;
    const kw = keywordScores(t);
    setScores(kw); // まず辞書で即反映
    if (embedState === "ready") {
      setBusy(true);
      try {
        const emb = await embeddingScores(t);
        setScores(blend(kw, emb));
      } finally {
        setBusy(false);
      }
    }
  };

  // ===== 埋め込みモデルを起動時に自動ロード（常にベクトル解析） =====
  useEffect(() => {
    let cancelled = false;
    setEmbedState("loading");
    loadEmbedder((p) => !cancelled && setEmbedProgress(p))
      .then(() => {
        if (cancelled) return;
        setEmbedState("ready");
        setText((cur) => {
          if (cur.trim()) analyze(cur); // 読み込み完了後に再解析
          return cur;
        });
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) setEmbedState("off"); // 失敗時は辞書のみで継続
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== タービン回転（慣性つき） =====
  const [angle, setAngle] = useState(0);
  const speedRef = useRef(0);
  const rafRef = useRef();
  const lastRef = useRef(null);

  useEffect(() => {
    const targetSpeed = total * 260; // 強さ合計に比例（最大 ~520 deg/s）
    const tick = (t) => {
      if (lastRef.current == null) lastRef.current = t;
      const dt = (t - lastRef.current) / 1000;
      lastRef.current = t;
      const cur = speedRef.current;
      speedRef.current = cur + (targetSpeed - cur) * Math.min(1, dt * 1.5);
      setAngle((a) => (a + speedRef.current * dt) % 360);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      lastRef.current = null;
    };
  }, [total]);

  // 明るさ: 強さ合計に比例（単独要素が強くても十分明るくなる）
  const brightness = Math.min(1, total / 1.4);

  // 描画パラメータ
  const streamCount = wI > 0.02 ? Math.max(1, Math.round(wI * 5)) : 0;
  const windCount = fI > 0.02 ? Math.max(1, Math.round(fI * 18)) : 0;

  return (
    <div
      className="stage"
      style={{
        background: `radial-gradient(circle at 50% 45%, rgba(120,180,255,${
          0.35 * brightness
        }) 0%, rgba(20,30,50,${0.25 * brightness}) 30%, #000 70%)`,
      }}
    >
      <div className="glow-layer" style={{ opacity: brightness }} aria-hidden />

      <h1 className="title">タービン発電</h1>

      {/* ====== 入力パネル ====== */}
      <div className="control">
        <input
          className="text-input"
          type="text"
          value={text}
          placeholder="文章を入力（例: 滝のように水が勢いよく流れ落ちる）"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && analyze()}
        />
        <button className="analyze-btn" onClick={() => analyze()} disabled={busy}>
          {busy ? "解析中…" : "解析する"}
        </button>

        <span className={`embed-status embed-${embedState}`}>
          {embedState === "loading" &&
            `ベクトル解析モデル読込中… ${Math.round(embedProgress * 100)}%`}
          {embedState === "ready" && "● ベクトル解析 ON"}
          {embedState === "off" && "辞書解析（モデル読込失敗）"}
        </span>
      </div>

      {/* ====== 蛇口（右上・左向き）＋水流 ====== */}
      <div className="faucet-area">
        <Faucet flowing={wI > 0.02} />
        <div className="water" aria-hidden>
          {Array.from({ length: streamCount }, (_, i) => (
            <span
              key={i}
              className="water-stream"
              style={{
                left: `${22 + i * 7}px`,
                width: `${4 + wI * 6}px`,
                animationDuration: `${0.6 / (0.4 + wI)}s`,
                animationDelay: `${i * -0.13}s`,
                opacity: 0.5 + wI * 0.5,
              }}
            />
          ))}
        </div>
      </div>

      {/* ====== タービン（中央） ====== */}
      <div className="turbine-wrap">
        <Turbine angle={angle} glow={brightness} />
        <div className="turbine-status">
          {spinning ? "回転中 ⚡" : "停止中"}
        </div>
      </div>

      {/* ====== 風（下から上へ） ====== */}
      {windCount > 0 && (
        <div className="wind" aria-hidden>
          {Array.from({ length: windCount }, (_, i) => (
            <span
              key={i}
              className="wind-line"
              style={{
                left: `${(i / windCount) * 220}px`,
                animationDuration: `${1.1 / (0.4 + fI)}s`,
                animationDelay: `${i * -0.09}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* ====== 扇風機（下） ====== */}
      <div className="fan-area">
        <Fan intensity={fI} />
      </div>
    </div>
  );
}

/* ---------- タービン本体 ---------- */
function Turbine({ angle, glow }) {
  return (
    <svg
      className="turbine-svg"
      viewBox="-110 -110 220 220"
      width="320"
      height="320"
    >
      <defs>
        <radialGradient id="hub" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#cfe6ff" />
          <stop offset="100%" stopColor="#3a4a66" />
        </radialGradient>
        <linearGradient id="blade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9fc3ff" />
          <stop offset="100%" stopColor="#41567a" />
        </linearGradient>
      </defs>

      <circle
        r="100"
        fill="none"
        stroke="#2a3550"
        strokeWidth="6"
        style={{ filter: `drop-shadow(0 0 ${12 * glow}px #6ab0ff)` }}
      />

      <g transform={`rotate(${angle})`}>
        {BLADES.map((i) => (
          <g key={i} transform={`rotate(${(360 / BLADES.length) * i})`}>
            <path
              d="M 0 -14 Q 26 -40 18 -90 Q 6 -70 0 -14 Z"
              fill="url(#blade)"
              stroke="#2a3550"
              strokeWidth="1"
            />
          </g>
        ))}
        <circle r="22" fill="url(#hub)" stroke="#dceeff" strokeWidth="2" />
        <circle r="6" fill="#1a2336" />
      </g>
    </svg>
  );
}

/* ---------- 蛇口（左向き） ---------- */
function Faucet({ flowing }) {
  return (
    <svg width="90" height="80" viewBox="0 0 90 80" className="faucet-svg">
      <rect x="74" y="8" width="16" height="26" rx="3" fill="#8895aa" />
      <rect x="25" y="14" width="55" height="12" rx="6" fill="#aab6c9" />
      <rect x="22" y="20" width="12" height="30" rx="5" fill="#aab6c9" />
      <rect x="58" y="2" width="10" height="12" rx="3" fill="#6c7a90" />
      <circle cx="63" cy="3" r="6" fill={flowing ? "#5fd0ff" : "#9aa7bc"} />
    </svg>
  );
}

/* ---------- 扇風機 ---------- */
function Fan({ intensity }) {
  const spinning = intensity > 0.02;
  // 強いほど速く回す（duration 短く）
  const dur = spinning ? 0.5 / (0.3 + intensity) : 0;
  return (
    <svg width="110" height="120" viewBox="0 0 110 120" className="fan-svg">
      <rect x="50" y="60" width="10" height="45" fill="#6c7a90" />
      <rect x="32" y="103" width="46" height="10" rx="5" fill="#6c7a90" />
      <circle cx="55" cy="45" r="42" fill="none" stroke="#5a6678" strokeWidth="3" />
      <g
        transform="translate(55 45)"
        className={spinning ? "fan-blades spin" : "fan-blades"}
        style={spinning ? { animationDuration: `${dur}s` } : undefined}
      >
        {[0, 90, 180, 270].map((deg) => (
          <ellipse
            key={deg}
            cx="0"
            cy="-20"
            rx="11"
            ry="22"
            fill="#9fc3ff"
            opacity="0.85"
            transform={`rotate(${deg})`}
          />
        ))}
        <circle r="7" fill="#dceeff" />
      </g>
    </svg>
  );
}
