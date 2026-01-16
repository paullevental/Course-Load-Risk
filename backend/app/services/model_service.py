import json
from dataclasses import dataclass
from typing import Any, Dict, List, Tuple, Optional
import joblib
import pandas as pd
from pathlib import Path



APP_DIR = Path(__file__).resolve().parents[1]     # backend/app
BACKEND_DIR = APP_DIR.parent                      # backend/
MODEL_TAG = "baseline_v1"

MODEL_DIR = BACKEND_DIR / "model_store" / MODEL_TAG
MODEL_PATH = MODEL_DIR / "model.joblib"
FEATURE_NAMES_PATH = MODEL_DIR / "feature_names.json"
META_PATH = MODEL_DIR / "meta.json"

@dataclass
class Bundle:
    pipeline: Any
    feature_names: List[str]
    meta: Dict[str, Any]


_bundle: Bundle | None = None


def load_bundle() -> Bundle:
    global _bundle
    if _bundle is not None:
        return _bundle

    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model not found at: {MODEL_PATH}")

    pipeline = joblib.load(MODEL_PATH)

    feature_names = None
    if FEATURE_NAMES_PATH.exists():
        feature_names = json.loads(FEATURE_NAMES_PATH.read_text(encoding="utf-8"))

    meta = {}
    if META_PATH.exists():
        meta = json.loads(META_PATH.read_text(encoding="utf-8"))

    _bundle = Bundle(pipeline=pipeline, feature_names=feature_names, meta=meta)
    return _bundle


def _bucket(score: float, meta: Dict[str, Any]) -> str:

    low = 0.33
    high = 0.66

    thresholds = meta.get("risk_thresholds") or meta.get("thresholds") or {}
    low = float(thresholds.get("low", low))
    high = float(thresholds.get("high", high))

    if score < low:
        return "low"
    if score < high:
        return "medium"
    return "high"


def predict_one(features: Dict[str, Any]) -> Tuple[float, str]:
    b = load_bundle()

    df = pd.DataFrame([features])

    if b.feature_names:
        missing = [c for c in b.feature_names if c not in df.columns]
        if missing:
            raise ValueError(f"Missing required features: {missing}")
        df = df[b.feature_names]

    pipe = b.pipeline

    if hasattr(pipe, "predict_proba"):
        proba = pipe.predict_proba(df)
        score = float(proba[0][1])
    else:
        pred = pipe.predict(df)
        score = float(pred[0])

    level = _bucket(score, b.meta)
    return score, level
