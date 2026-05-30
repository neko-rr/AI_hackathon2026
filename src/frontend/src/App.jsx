import { useState, useEffect, useRef } from "react";
import { keywordScores, analyzeFull, loadEmbedder } from "./analyze";

// タービンの羽根（8枚）
const BLADES = Array.from({ length: 8 }, (_, i) => i);

export default function App() {
  const [text, setText] = useState("");
  // 解析結果の強さ（0..1）
  const [scores, setScores] = useState({ water: 0, wind: 0, fire: 0 });
  // 連想された単語
  const [associations, setAssociations] = useState([]);

  // 埋め込みモデルの状態: off → loading → ready
  const [embedState, setEmbedState] = useState("off");
  const [busy, setBusy] = useState(false);

  const wI = scores.water; // 水の強さ
  const fI = scores.wind; // 風の強さ
  const flI = scores.fire; // 炎の強さ（→蒸気）
  const total = wI + fI + flI;

  // ===== 解析実行 =====
  const analyze = async (value) => {
    const t = value ?? text;
    setScores(keywordScores(t)); // まず辞書で即反映
    setAssociations([]);
    if (embedState === "ready") {
      setBusy(true);
      try {
        const r = await analyzeFull(t); // 連想ゲーム＋スコア
        if (r) {
          setScores(r.scores);
          setAssociations(r.associations);
        }
      } finally {
        setBusy(false);
      }
    }
  };

  // ===== 埋め込みモデルを起動時に自動ロード（常にベクトル解析） =====
  useEffect(() => {
    let cancelled = false;
    setEmbedState("loading");
    loadEmbedder()
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
  const steamCount = flI > 0.02 ? Math.max(2, Math.round(flI * 10)) : 0;

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

      {/* ====== スコア表示（左上） ====== */}
      <div className="score-panel">
        <div className="score-title">スコア</div>
        <ScoreRow label="水" value={wI} color="#5fd0ff" />
        <ScoreRow label="風" value={fI} color="#9fc3ff" />
        <ScoreRow label="炎" value={flI} color="#ff9a3c" />

        {associations.length > 0 && (
          <div className="assoc">
            <div className="assoc-label">連想ゲーム</div>
            <div className="assoc-words">
              {associations.map((a) => (
                <span key={a.word} className={`assoc-word el-${a.element ?? "none"}`}>
                  {a.word}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

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
          {busy ? "実行中…" : "実行"}
        </button>
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
      </div>

      {/* ====== 風（右から左へ） ====== */}
      {windCount > 0 && (
        <div className="wind" aria-hidden>
          {Array.from({ length: windCount }, (_, i) => (
            <span
              key={i}
              className="wind-line"
              style={{
                top: `${(i / windCount) * 150}px`,
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

      {/* ====== やかん＋火＋蒸気（左下） ====== */}
      <div className="kettle-area">
        {/* 蒸気：注ぎ口から立ち上る（炎の強さで本数・速度が変化） */}
        {steamCount > 0 && (
          <div className="steam" aria-hidden>
            {Array.from({ length: steamCount }, (_, i) => (
              <span
                key={i}
                className="steam-puff"
                style={{
                  left: `${i * 6}px`,
                  animationDuration: `${1.6 / (0.4 + flI)}s`,
                  animationDelay: `${i * -0.22}s`,
                  opacity: 0.4 + flI * 0.5,
                }}
              />
            ))}
          </div>
        )}
        <Kettle intensity={flI} />
      </div>
    </div>
  );
}

/* ---------- スコア1行（ラベル＋バー＋％） ---------- */
function ScoreRow({ label, value, color }) {
  return (
    <div className="score-row">
      <span className="score-label">{label}</span>
      <span className="score-bar">
        <span
          className="score-fill"
          style={{ width: `${Math.round(value * 100)}%`, background: color }}
        />
      </span>
      <span className="score-pct">{Math.round(value * 100)}%</span>
    </div>
  );
}

/* ---------- タービン本体 ---------- */
function Turbine({ angle, glow }) {
  return (
    <svg
      className="turbine-svg"
      viewBox="-110 -110 220 220"
      width="400"
      height="400"
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

/* ---------- 扇風機（横向き＝側面ビュー、左へ送風） ---------- */
function Fan({ intensity }) {
  const spinning = intensity > 0.02;
  // 強いほど速く回す（duration 短く）
  const dur = spinning ? 0.5 / (0.3 + intensity) : 0;
  return (
    <svg width="130" height="140" viewBox="0 0 130 140" className="fan-svg">
      {/* 台座 */}
      <ellipse cx="72" cy="128" rx="30" ry="7" fill="#6c7a90" />
      {/* 支柱 */}
      <rect x="67" y="62" width="9" height="64" fill="#6c7a90" />
      {/* モーター本体（羽根の後ろ＝右側） */}
      <rect x="70" y="36" width="30" height="34" rx="15" fill="#5a6678" />
      <rect x="92" y="46" width="14" height="14" rx="4" fill="#6c7a90" />

      {/* 羽根のディスクを横方向に圧縮して側面ビューに見せる */}
      <g transform="translate(58 53) scale(0.34 1)">
        {/* ガード（側面なので縦長の輪に見える） */}
        <circle r="40" fill="none" stroke="#5a6678" strokeWidth="3" />
        <g
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
      </g>
    </svg>
  );
}

/* ---------- やかん＋火（左下） ---------- */
function Kettle({ intensity }) {
  const burning = intensity > 0.02;
  // 炎が強いほど大きく・速く揺れる
  const flameScale = 0.5 + intensity * 0.9;
  const flicker = burning ? 0.7 / (0.3 + intensity) : 0;
  return (
    <svg width="150" height="170" viewBox="0 0 150 170" className="kettle-svg">
      <defs>
        <linearGradient id="flame" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#ff7a18" />
          <stop offset="55%" stopColor="#ffb02e" />
          <stop offset="100%" stopColor="#ffe66d" />
        </linearGradient>
      </defs>

      {/* やかん本体 */}
      <g transform="translate(75 95)">
        {/* 注ぎ口（右上へ） */}
        <path
          d="M 34 -8 L 56 -34 L 60 -28 L 40 -2 Z"
          fill="#b9c4d6"
          stroke="#8895aa"
          strokeWidth="1.5"
        />
        {/* 胴体 */}
        <ellipse cx="0" cy="2" rx="40" ry="34" fill="#c7d2e3" stroke="#8895aa" strokeWidth="2" />
        <ellipse cx="0" cy="2" rx="40" ry="34" fill="url(#hub)" opacity="0.25" />
        {/* 取っ手 */}
        <path
          d="M -22 -28 Q 0 -58 22 -28"
          fill="none"
          stroke="#8895aa"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* ふた */}
        <ellipse cx="0" cy="-30" rx="18" ry="6" fill="#aab6c9" />
        <circle cx="0" cy="-36" r="5" fill="#8895aa" />
      </g>

      {/* コンロ／火 */}
      <g transform="translate(75 150)">
        {/* バーナー台 */}
        <rect x="-46" y="6" width="92" height="9" rx="4" fill="#4a5568" />
        <rect x="-30" y="0" width="60" height="8" rx="3" fill="#3a4150" />
        {/* 炎（揺らめき） */}
        {burning && (
          <g transform={`scale(${flameScale})`}>
          <g
            className="flame"
            style={{ animationDuration: `${flicker}s` }}
          >
            {[-20, -7, 6, 19].map((x, i) => (
              <path
                key={i}
                d={`M ${x} 2 C ${x - 9} -10 ${x - 5} -24 ${x} -34 C ${
                  x + 5
                } -24 ${x + 9} -10 ${x} 2 Z`}
                fill="url(#flame)"
                opacity="0.92"
                style={{ transformBox: "fill-box", transformOrigin: "bottom" }}
              />
            ))}
            {/* 中心の明るい芯 */}
            <path
              d="M -6 2 C -12 -8 -6 -20 0 -28 C 6 -20 12 -8 6 2 Z"
              fill="#fff3c4"
              opacity="0.9"
            />
          </g>
          </g>
        )}
      </g>
    </svg>
  );
}
