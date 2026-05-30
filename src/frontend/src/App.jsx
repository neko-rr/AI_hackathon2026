import { useState, useEffect, useRef, useCallback } from "react";
import {
  fetchDelivery,
  SAMPLE_QUESTIONS,
  isApiConfigured,
} from "./deliveryApi";
import { rollTurbineRun } from "./turbinePools";
import {
  createFluidFromQuestion,
  applyTurbineTransform,
} from "./fluidState";
import FluidStream, { TurbineSvg } from "./FluidStream";
import IdeaTank, { TankIcon } from "./IdeaTank";

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
  const [turbineAngle, setTurbineAngle] = useState(0);
  const timersRef = useRef([]);
  const deliveryRef = useRef(null);
  const resultRef = useRef(null);
  const animationDoneRef = useRef(false);
  const [awaitingIdeas, setAwaitingIdeas] = useState(false);

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
    if (!showDelivery || awaitingIdeas || !result?.deliveryItems?.length) return undefined;

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
  }, [showDelivery, awaitingIdeas, result]);

  const finishWhenReady = useCallback((data) => {
    resultRef.current = data;
    setResult(data);
    setAwaitingIdeas(false);
    setStatusMessage("質問への答えを届けました！");
    if (animationDoneRef.current) {
      setBusy(false);
    }
  }, []);

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
    setBusy(false);
    setAwaitingIdeas(false);
    resultRef.current = null;
    animationDoneRef.current = false;
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

    resultRef.current = null;
    animationDoneRef.current = false;
    setAwaitingIdeas(false);

    const apiPromise = fetchDelivery(text, {
      turbines: rolled.turbines,
      fluidType: rolled.fluidType,
      fluidMeta: rolled.fluidMeta,
    });
    apiPromise.then(finishWhenReady).catch(() => {});

    let delayAcc = STEP_MS[0];

    rolled.turbines.forEach((t, i) => {
      timersRef.current.push(
        setTimeout(() => {
          setChainStep(i + 1);
          setPassIndex(i + 1);
          setHighlightOrder(t.passageOrder);
          if (!isApiConfigured()) {
            setStatusMessage(`${t.label}：${t.value} — 流体が変わりました`);
          }
          fluid = applyTurbineTransform(fluid, t.id, t.value);
          setFluidState({ ...fluid });
        }, delayAcc)
      );
      delayAcc += STEP_MS[Math.min(i + 1, STEP_MS.length - 1)];
    });

    timersRef.current.push(
      setTimeout(() => {
        animationDoneRef.current = true;
        setHighlightOrder(-1);
        setPassIndex(rolled.passSteps.length - 1);
        setLightOn(true);
        setChainStep(4);
        setShowDelivery(true);

        if (resultRef.current) {
          setStatusMessage("質問への答えを届けました！");
          setBusy(false);
        } else {
          setAwaitingIdeas(true);
          setStatusMessage(
            isApiConfigured()
              ? "アイデアが溜まり待ち中…"
              : "答えをまとめています…"
          );
        }
      }, delayAcc)
    );
  };

  const displayedStatus = (() => {
    if (awaitingIdeas && isApiConfigured()) {
      return "アイデアが溜まり待ち中…";
    }
    if (busy && isApiConfigured() && chainStep >= 1 && !awaitingIdeas) {
      return "AI が答えを届けています…";
    }
    return statusMessage;
  })();

  const renderTurbine = (t, isHighlight, glowing) => (
    <TurbineSvg
      id={t.id}
      angle={turbineAngle * (t.passageOrder % 2 === 0 ? 1 : -1)}
      size={72}
      glowing={glowing}
    />
  );

  const tankFill = (() => {
    if (showDelivery && result && !awaitingIdeas) return 100;
    if (awaitingIdeas) return 94;
    if (!busy) return 6;
    if (passIndex <= 0) return 18;
    if (passIndex === 1) return 42;
    if (passIndex === 2) return 68;
    if (passIndex >= 3) return 88;
    return 6;
  })();

  const tankIconFill = showDelivery && result && !awaitingIdeas ? 100 : Math.max(24, tankFill);

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
          placeholder="例：猫に好かれる方法 / 今日のご飯"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !busy && runChain()}
          disabled={busy}
        />
        <div className="sample-row">
          {SAMPLE_QUESTIONS.map((sample) => (
            <button
              key={sample.text}
              type="button"
              className="button-sample"
              disabled={busy}
              onClick={() => setText(sample.text)}
            >
              お試し：{sample.label}
            </button>
          ))}
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

      {displayedStatus && (
        <p className="status-banner" role="status">
          {displayedStatus}
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

        <IdeaTank
          fluidState={fluidState || createFluidFromQuestion(text, fluidType)}
          fluidType={fluidType}
          fillPercent={tankFill}
          flowing={busy || awaitingIdeas}
          received={showDelivery && !awaitingIdeas}
          label={fluidState?.label || text}
        />

        <div
          ref={deliveryRef}
          id="delivery-box"
          className={`delivery-box ${showDelivery ? "received" : ""} ${busy || awaitingIdeas ? "waiting" : ""}`}
          style={
            fluidState?.hue != null
              ? { "--delivery-hue": String(Math.round(fluidState.hue)) }
              : undefined
          }
          aria-label={DELIVERY_LABEL}
        >
          <div className="delivery-box-header">
            <TankIcon
              fluidState={fluidState || createFluidFromQuestion(text, fluidType)}
              fillPercent={tankIconFill}
              active={showDelivery && !awaitingIdeas}
              steam={fluidType === "steam"}
            />
            <h2 className="delivery-box-title">{DELIVERY_LABEL}</h2>
          </div>

          {!showDelivery && !busy && (
            <p className="delivery-placeholder">
              質問を入力して「仕掛けを動かす」と、
              <br />
              <strong>タンクに流体が溜まり、ここに答え</strong>が届きます
            </p>
          )}

          {busy && !showDelivery && (
            <p className="delivery-placeholder pulse">流体がタンクに流れ込んでいます…</p>
          )}

          {showDelivery && awaitingIdeas && (
            <p className="delivery-placeholder delivery-queue pulse">
              アイデアが溜まり待ち中…
            </p>
          )}

          {showDelivery && result && !awaitingIdeas && (
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
              {result.fallback && isApiConfigured() && (
                <p className="demo-note">
                  AI 接続に失敗したため、簡易回答を表示しています。API キーと接続設定を確認してください。
                </p>
              )}
              {result.fallback && !isApiConfigured() && (
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
              <div className="redeliver-row">
                <button
                  type="button"
                  className="button-redeliver"
                  onClick={runChain}
                >
                  もう一度届ける
                </button>
                <p className="redeliver-hint">タービンは毎回バラバラ。もう一度試してみてください。</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
