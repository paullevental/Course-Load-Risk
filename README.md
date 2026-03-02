## Course Load Risk

This repo is a small end‑to‑end demo for estimating how risky a student’s course load is.
It has:
- a **FastAPI backend** that loads a trained model and exposes `/meta` and `/predict` endpoints
- a **React frontend** that lets you enter features and see a risk score and category.

The goal is that, from a clean checkout, you can start the backend, start the frontend, and immediately play with the model.

---

## Project structure

- **`backend/`** – FastAPI app and model bundle
  - `app/main.py` – FastAPI app with `/health`, `/meta`, and `/predict`
  - `app/services/model_service.py` – loads the serialized model and runs a single prediction
  - `app/schemas.py` – Pydantic request/response schemas
  - `app/core/config.py` – paths to the model files
  - `notebooks/01_model_dev.ipynb` – model development notebook
  - `model_store/<MODEL_TAG>/` – directory where the trained model and metadata live
    - `model.joblib` – serialized model pipeline (e.g. scikit‑learn)
    - `feature_names.json` – ordered list of feature names expected by the model
    - `meta.json` – extra metadata, including optional `risk_thresholds` used to bucket scores

- **`frontend/`** – React single‑page app
  - `src/App.tsx` – main UI: renders inputs for each feature and shows the prediction
  - `src/api.ts` – small client for calling the backend’s `/meta` and `/predict`
  - `src/components/RiskMeter.tsx` – visual meter for the risk score
  - `frontend/README.md` – the standard Create React App instructions

---

## Backend – FastAPI service

### Requirements

- Python 3.10+ (repo currently uses a `.venv` inside `backend/`)
- Typical packages: `fastapi`, `uvicorn[standard]`, `pydantic`, `pandas`, `joblib`, and `scikit-learn`

You can either reuse the existing virtualenv or create a fresh one:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install fastapi "uvicorn[standard]" pydantic pandas joblib scikit-learn
```

### Model files

The API expects a model bundle under `backend/model_store/<MODEL_TAG>/`:

- `model.joblib`
- `feature_names.json`
- `meta.json`

By default, `MODEL_TAG` is `baseline_v1`, so the expected folder is:

```text
backend/model_store/baseline_v1/
```

If any of these files are missing, calls to `/meta` or `/predict` will fail with a helpful error message.

### Running the backend

From the `backend` directory (with the virtualenv activated):

```bash
uvicorn app.main:app --reload --port 8000
```

The FastAPI app will be available at `http://localhost:8000`.

Useful endpoints:

- `GET /health` – basic health check (`{"ok": true}`)
- `GET /meta` – returns `model_tag`, `feature_names`, and `meta` from the model bundle
- `POST /predict` – accepts a JSON body and returns the risk score and level

Example `POST /predict` request:

```json
{
  "features": {
    "credits": 18,
    "work_hours": 10,
    "gpa": 3.2,
    "num_courses": 5
  }
}
```

The model service computes a probability‑like **risk score** in \[0, 1\] and uses thresholds in `meta["risk_thresholds"]` (or sensible defaults) to bucket it into **low**, **medium**, or **high**.

---

## Frontend – React app

The frontend is a Create React App project that talks to the backend at `http://localhost:8000`.

### Install and run

```bash
cd frontend
npm install
npm start
```

This will start the dev server on `http://localhost:3000`.
The backend CORS settings already allow this origin.

### How it works

- On load, the app calls `GET /meta` to discover:
  - the active `model_tag`
  - the list of `feature_names`
  - any extra metadata
- It then renders an input field for each feature.
- When you submit the form, it:
  - casts numeric‑looking inputs to numbers
  - sends them to `POST /predict`
  - displays the returned risk score and level in the `RiskMeter` component.

There is a **“Fill example”** button that pre‑fills some common feature names (like `credits`, `work_hours`, `gpa`, `num_courses`) with reasonable demo values so you can quickly see a prediction.

For more detailed CRA commands (testing, building, etc.), see `frontend/README.md`.

---

## Running the whole project

1. **Start the backend**
   - Ensure the model files exist under `backend/model_store/baseline_v1/`.
   - Activate the virtualenv (or install the backend dependencies).
   - Run:
     ```bash
     cd backend
     uvicorn app.main:app --reload --port 8000
     ```

2. **Start the frontend**
   - In another terminal:
     ```bash
     cd frontend
     npm install   # first time only
     npm start
     ```

3. **Use the app**
   - Open `http://localhost:3000` in your browser.
   - Wait for the metadata to load (you’ll see the model tag in the header).
   - Fill in the feature inputs (or click **Fill example**).
   - Click **Evaluate risk** to see:
     - a numeric risk score (0–1, shown as 0–100%)
     - a risk level badge (`LOW`, `MEDIUM`, or `HIGH`).

That’s it—this repo is meant to stay simple and focused: a small, clear example of serving a trained model via FastAPI and exploring it through a lightweight React UI.

