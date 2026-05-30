import { useState, useEffect, useRef, useCallback } from "react";
import {
  fetchDelivery,
  SAMPLES,
  isApiConfigured,
} from "./deliveryApi";
import { rollTurbineRun } from "./turbinePools";
import {
  createFluidFromQuestion,
  applyTurbineTransform,
} from "./fluidState";
import FluidStream, { TurbineSvg } from "./FluidStream";

const STEP_MS = [900, 1100, 1100, 1400];
const DELIVERY_LABEL = "届いたアイデア";

export default function App() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [chainStep, setChainStep] = useState(-1);
  const [passIndex, setPassIndex] = useState(0);
  const [fluidState, setFluidState] = useState(null);
  const [fluidType, setFluidType] = useState("liquid");
  const [fluidMeta, setFluidMeta] = useState(null);
  const [passSteps, setPassSteps] = useState([]);
  const [routePath, setRoutePath] = useState("");
  const [turbines, setTurbines] = useState([]);
  const [highlightOrder, setHighlightOrder] = useState(-1);
  const [result, setResult] = useState(null);
  const [showDelivery, setShowDelivery] = useState(false);
  const [visibleCardCount, setVisibleCardCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [lightOn, setLightOn] = useState(false);
  const [capsuleOut, setCapsuleOut] = useState(false);
  const [turbineAngle, setTurbineAngle] = useState(0);
  const timersRef = useRef([]);
  const deliveryRef = useRef(null);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  useEffect(() => {
    if (chainStep < 1) return undefined;
    let raf;
    let last = null;
    const speed = 240 + Math.min(chainStep, 4) * 40;
    const tick = (t) => {
      if (last == null) last = t;
      const dt = (t - last) / 1000;
      last = t;
      setTurbineAngle((a) => (a + speed * dt) % 360);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [chainStep]);

  useEffect(() => {
    if (!showDelivery || !result?.deliveryItems?.length) return undefined;

    setVisibleCardCount(0);
    const scrollTimer = setTimeout(() => {
      deliveryRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 200);

    const cardTimers = result.deliveryItems.map((_, i) =>
      setTimeout(() => setVisibleCardCount(i + 1), 500 + i * 700)
    );

    return () => {
      clearTimeout(scrollTimer);
      cardTimers.forEach(clearTimeout);
    };
  }, [showDelivery, result]);

  const resetShow = () => {
    clearTimers();
    setChainStep(-1);
    setPassIndex(0);
    setFluidState(null);
    setFluidType("liquid");
    setFluidMeta(null);
    setPassSteps([]);
    setRoutePath("");
    setTurbines([]);
    setHighlightOrder(-1);
    setResult(null);
    setShowDelivery(false);
    setVisibleCardCount(0);
    setStatusMessage("");
    setLightOn(false);
    setCapsuleOut(false);
    setBusy(false);
  };

  const runChain = async () => {
    if (busy) return;
    resetShow();
    setBusy(true);

    const rolled = rollTurbineRun();
    setFluidType(rolled.fluidType);
    setFluidMeta(rolled.fluidMeta);
    setPassSteps(rolled.passSteps);
    setRoutePath(rolled.routePath);
    setTurbines(rolled.turbines);

    let fluid = createFluidFromQuestion(text, rolled.fluidType);
    setFluidState(fluid);
    setChainStep(0);
    setPassIndex(0);
    setHighlightOrder(-1);
    setStatusMessage(
      `${rolled.fluidMeta.label}に変えています…（${rolled.fluidMeta.flowLabel}）`
    );

    const apiPromise = fetchDelivery(text, {
      turbines: rolled.turbines,
      fluidType: rolled.fluidType,
      fluidMeta: rolled.fluidMeta,
    });
    apiPromise.then((data) => setResult(data)).catch(() => {});

    let delayAcc = STEP_MS[0];

    rolled.turbines.forEach((t, i) => {
      timersRef.current.push(
        setTimeout(() => {
          setChainStep(i + 1);
          setPassIndex(i + 1);
          setHighlightOrder(t.passageOrder);
          setStatusMessage(`${t.label}：${t.value} — 流体が変わりました`);
          fluid = applyTurbineTransform(fluid, t.id, t.value);
          setFluidState({ ...fluid });
        }, delayAcc)
      );
      delayAcc += STEP_MS[Math.min(i + 1, STEP_MS.length - 1)];
    });

    timersRef.current.push(
      setTimeout(async () => {
        try {
          const data = await apiPromise;
          setResult(data);
        } catch {
          /* 内部フォールバック */
        }
        setHighlightOrder(-1);
        setPassIndex(rolled.passSteps.length - 1);
        setLightOn(true);
        setCapsuleOut(true);
        setChainStep(4);
        setStatusMessage("質問への答えを届けました！");
        setShowDelivery(true);
        setBusy(false);
      }, delayAcc)
    );
  };

  const renderTurbine = (t, isHighlight, glowing) => (
    <TurbineSvg
      id={t.id}
      angle={turbineAngle * (t.passageOrder % 2 === 0 ? 1 : -1)}
      size={72}
      glowing={glowing}
    />
  );

  return (
    <div className="app">
      <header className="header">
        <p className="eyebrow">意外発送タービン</p>
        <h1 className="headline">質問を流体に変え、タービンで答えを届ける。</h1>
        <p className="sub">
          液体は下へ、蒸気は上へ — タービンは毎回バラバラの位置に現れます。
          <strong>「{DELIVERY_LABEL}」</strong>に届きます。
        </p>
        {!isApiConfigured() && (
          <p className="hint-banner">
            お試しボタンですぐ体験できます。自由な質問への回答は、デモ版では簡易的です。
          </p>
        )}
      </header>

      <section className="input-panel">
        <label className="input-label" htmlFor="user-text">
          質問を1行で入力してください
        </label>
        <input
          id="user-text"
          className="input-field"
          type="text"
          value={text}
          placeholder="例：タービンって何？ / 風力発電の仕組みは？"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !busy && runChain()}
          disabled={busy}
        />
        <div className="sample-row">
          <button
            type="button"
            className="button-sample"
            disabled={busy}
            onClick={() => setText(SAMPLES.question)}
          >
            お試し：タービンって何？
          </button>
          <button
            type="button"
            className="button-sample"
            disabled={busy}
            onClick={() => setText(SAMPLES.questionWind)}
          >
            お試し：風力発電
          </button>
        </div>
        <button
          type="button"
          className="button-primary"
          onClick={runChain}
          disabled={busy}
        >
          {busy ? "答えを届けています…" : "仕掛けを動かす"}
        </button>
      </section>

      {statusMessage && (
        <p className="status-banner" role="status">
          {statusMessage}
        </p>
      )}

      <section className="stage" aria-live="polite">
        <FluidStream
          fluidState={fluidState || createFluidFromQuestion(text, fluidType)}
          fluidType={fluidType}
          passIndex={passIndex}
          passSteps={passSteps}
          routePath={routePath}
          turbines={turbines}
          highlightOrder={highlightOrder}
          active={chainStep >= 0}
          turbineAngle={turbineAngle}
          lightOn={lightOn}
          onTurbineRender={renderTurbine}
        />

        <div className="delivery-rail-wrap">
          <div className="delivery-rail">
            <span className="tube-label">配達口</span>
            <div className="tube" />
            <div className={`capsule ${capsuleOut ? "out" : ""}`}>📦</div>
            <div className={`bulb ${lightOn ? "on" : ""}`} aria-hidden />
            <div
              className={`flow-arrow ${capsuleOut ? "flow" : ""} ${fluidType === "steam" ? "arrow-up" : ""}`}
            >
              {fluidType === "steam" ? "▲" : "▼"}
            </div>
          </div>
        </div>

        <div
          ref={deliveryRef}
          id="delivery-box"
          className={`delivery-box ${showDelivery ? "received" : ""} ${busy ? "waiting" : ""}`}
          aria-label={DELIVERY_LABEL}
        >
          <div className="delivery-box-header">
            <span className="delivery-icon" aria-hidden>
              📬
            </span>
            <h2 className="delivery-box-title">{DELIVERY_LABEL}</h2>
          </div>

          {!showDelivery && !busy && (
            <p className="delivery-placeholder">
              質問を入力して「仕掛けを動かす」と、
              <br />
              <strong>ここに条件付きの答え</strong>が自動で届きます
            </p>
          )}

          {busy && !showDelivery && (
            <p className="delivery-placeholder pulse">流体がタービンを通過中…</p>
          )}

          {showDelivery && result && (
            <div className="delivery-content">
              {fluidMeta && (
                <p className="fluid-recap">
                  今回の流体：{fluidMeta.label}（{fluidMeta.flowLabel}）
                </p>
              )}
              {result.question && (
                <p className="question-echo">
                  <span className="question-label">質問</span>
                  {result.question}
                </p>
              )}
              {result.turbineRecap && (
                <p className="turbine-recap">
                  通過したタービン：{result.turbineRecap}
                </p>
              )}
              {result.fallback && (
                <p className="demo-note">
                  デモ版の回答です。お試しの質問でお楽しみください。
                </p>
              )}
              <ul className="delivery-list">
                {result.deliveryItems.map((item, i) => (
                  <li
                    key={`${item.headline}-${i}`}
                    className={`delivery-card ${i < visibleCardCount ? "visible" : "hidden"}`}
                  >
                    <span className="card-badge">回答 {i + 1}</span>
                    <h3>{item.headline}</h3>
                    <p>{item.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
