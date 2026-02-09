import React from "react";
import "./RiskMeter.css";

type Props = {
  score: number;     
  level: string;  
};

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

export default function RiskMeter({ score, level }: Props) {
  const s = clamp01(score);
  const pct = Math.round(s * 100);

  return (
    <div className="meter">
      <div className="meterHeader">
        <div className="meterTitle">Risk score</div>
        <div className={`pill pill-${level}`}>{level.toUpperCase()}</div>
      </div>

      <div className="barOuter">
        <div className="barInner" style={{ width: `${pct}%` }} />
      </div>

      <div className="meterFooter">
        <span>0%</span>
        <span className="pct">{pct}%</span>
        <span>100%</span>
      </div>
    </div>
  );
}
