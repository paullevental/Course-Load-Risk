import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import { getMeta, predict, MetaResponse, PredictResponse } from "./api";
import RiskMeter from "./components/RiskMeter";

type Status = "loading" | "ready" | "predicting" | "error";

function isNumericLike(v: string) {
  if (v.trim() === "") return false;
  return !Number.isNaN(Number(v));
}

export default function App() {
  const [meta, setMeta] = useState<MetaResponse | null>(null);
  const [features, setFeatures] = useState<Record<string, string>>({});
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Load /meta on page load
  useEffect(() => {
    (async () => {
      try {
        setStatus("loading");
        const m = await getMeta();
        setMeta(m);

        // Initialize feature inputs
        const init: Record<string, string> = {};
        for (const f of m.feature_names ?? []) init[f] = "";
        setFeatures(init);

        setStatus("ready");
      } catch (e: any) {
        setStatus("error");
        setErrorMsg(e?.message ?? String(e));
      }
    })();
  }, []);

  const featureNames = useMemo(() => meta?.feature_names ?? [], [meta]);

  function onChange(name: string, value: string) {
    setFeatures((prev) => ({ ...prev, [name]: value }));
  }

  function fillExample() {
    // Quick demo values. Adjust these later to match your feature meanings.
    const ex: Record<string, string> = {};
    for (const f of featureNames) ex[f] = "0";

    // Give a few “common” names better demo defaults if they exist
    if (ex["credits"] !== undefined) ex["credits"] = "18";
    if (ex["work_hours"] !== undefined) ex["work_hours"] = "10";
    if (ex["gpa"] !== undefined) ex["gpa"] = "3.2";
    if (ex["num_courses"] !== undefined) ex["num_courses"] = "5";

    setFeatures(ex);
    setResult(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setResult(null);

    // Basic validation: ensure no empty fields
    const missing = featureNames.filter((f) => (features[f] ?? "").trim() === "");
    if (missing.length > 0) {
      setErrorMsg(`Missing values for: ${missing.slice(0, 8).join(", ")}${missing.length > 8 ? "..." : ""}`);
      return;
    }

    try {
      setStatus("predicting");

      // Cast numeric-looking strings into numbers
      const casted: Record<string, any> = {};
      for (const f of featureNames) {
        const v = features[f];
        casted[f] = isNumericLike(v) ? Number(v) : v;
      }

      const r = await predict(casted);
      setResult(r);
      setStatus("ready");
    } catch (e: any) {
      setStatus("error");
      setErrorMsg(e?.message ?? String(e));
    }
  }

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>Course Load Evaluator</h1>
          <p className="sub">
            Enter your course-load features to estimate risk of overload.
          </p>
        </div>

        <div className="metaCard">
          <div className="metaRow">
            <span className="metaLabel">Backend</span>
            <span className="metaValue">localhost:8000</span>
          </div>
          <div className="metaRow">
            <span className="metaLabel">Model</span>
            <span className="metaValue">{meta?.model_tag ?? "…"}</span>
          </div>
        </div>
      </header>

      <main className="grid">
        <section className="card">
          <div className="cardHeader">
            <h2>Inputs</h2>
            <div className="btnRow">
              <button className="btn btnGhost" type="button" onClick={fillExample} disabled={status !== "ready"}>
                Fill example
              </button>
            </div>
          </div>

          {status === "loading" && <p>Loading model metadata…</p>}

          {status !== "loading" && meta && (
            <form className="form" onSubmit={onSubmit}>
              <div className="formGrid">
                {featureNames.map((name) => (
                  <label key={name} className="field">
                    <div className="fieldLabel">{name}</div>
                    <input
                      className="input"
                      value={features[name] ?? ""}
                      onChange={(e) => onChange(name, e.target.value)}
                      placeholder="Enter a value"
                    />
                  </label>
                ))}
              </div>

              {errorMsg && <div className="error">{errorMsg}</div>}

              <button className="btn btnPrimary" type="submit" disabled={status === "predicting"}>
                {status === "predicting" ? "Evaluating…" : "Evaluate risk"}
              </button>
            </form>
          )}
        </section>

        <section className="card">
          <h2>Result</h2>

          {!result && (
            <p className="muted">
              Run an evaluation to see a risk score and risk category.
            </p>
          )}

          {result && (
            <>
              <RiskMeter score={result.risk_score} level={result.risk_level} />

              <div className="resultBox">
                <div className="resultRow">
                  <span className="muted">Risk score</span>
                  <span className="strong">{result.risk_score.toFixed(3)}</span>
                </div>
                <div className="resultRow">
                  <span className="muted">Risk level</span>
                  <span className="strong">{String(result.risk_level).toUpperCase()}</span>
                </div>
              </div>

              <details className="details">
                <summary>Raw response</summary>
                <pre>{JSON.stringify(result, null, 2)}</pre>
              </details>
            </>
          )}
        </section>
      </main>

      <footer className="footer">
        <span className="muted">
          Tip: Keep your backend running at <code>localhost:8000</code> while using the UI.
        </span>
      </footer>
    </div>
  );
}
