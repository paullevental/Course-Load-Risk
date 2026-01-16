from pathlib import Path
import os

# backend/ directory
BACKEND_DIR = Path(__file__).resolve().parents[1]

MODEL_TAG = os.getenv("MODEL_TAG", "baseline_v1")
MODEL_DIR = BACKEND_DIR / "model_store" / MODEL_TAG

MODEL_PATH = MODEL_DIR / "model.joblib"
FEATURE_NAMES_PATH = MODEL_DIR / "feature_names.json"
META_PATH = MODEL_DIR / "meta.json"

