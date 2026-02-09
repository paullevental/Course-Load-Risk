export type MetaResponse = {
  model_tag: string;
  feature_names: string[] | null;
  meta: Record<string, any>;
};

export type PredictResponse = {
  model_tag: string;
  risk_score: number;
  risk_level: "low" | "medium" | "high" | string;
  details?: Record<string, any> | null;
};

const API_BASE = "http://localhost:8000";

export async function getMeta(): Promise<MetaResponse> {
  const res = await fetch(`${API_BASE}/meta`);
  if (!res.ok) {
    throw new Error("Failed to fetch /meta");
  }
  return res.json();
}

export async function predict(features: Record<string, any>): Promise<PredictResponse> {
  const res = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ features }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail ?? "Prediction failed");
  }

  return res.json();
}
