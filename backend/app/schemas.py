from typing import Any, Dict, Optional, List
from pydantic import BaseModel

class PredictRequest(BaseModel):
    features: Dict[str, Any]

class PredictResponse(BaseModel):
    model_tag: str
    risk_score: float
    risk_level: str
    details: Optional[Dict[str, Any]] = None

class MetaResponse(BaseModel):
    model_tag: str
    feature_names: Optional[List[str]]
    meta: Dict[str, Any]