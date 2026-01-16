from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import PredictRequest, PredictResponse, MetaResponse
from app.services.model_service import load_bundle, predict_one

app = FastAPI(title="Course Load Risk API", version="0.1.0")

# For frontend dev (Vite)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5555"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def _startup():
    load_bundle()

@app.get("/health")
def health():
    return {"ok": True}

@app.get("/meta", response_model=MetaResponse)
def meta():
    b = load_bundle()
    return MetaResponse(
        model_tag=b.meta.get("model_tag", "baseline_v1"),
        feature_names=b.feature_names,
        meta=b.meta,
    )

@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    try:
        score, level = predict_one(req.features)
        b = load_bundle()
        return PredictResponse(
            model_tag=b.meta.get("model_tag", "baseline_v1"),
            risk_score=score,
            risk_level=level,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")
