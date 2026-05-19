# Deployment

## Vercel (static site — recommended)

The production build **does not use a Python Lambda**. During CI, telemetry is processed once into JSON under `frontend/public/data/`, then served as static files. This avoids the 250 MB serverless bundle limit.

1. Import the repo on [vercel.com](https://vercel.com).
2. Default settings from `vercel.json` apply automatically.
3. Build runs `scripts/vercel-build.sh` (downloads data, precomputes JSON, builds React).
4. Verify: `https://<your-app>.vercel.app/data/health.json`

## Local development (full API)

```bash
pip install -r requirements.txt
# extract player_data/
cd frontend && npm install && npm run build && cd ..
$env:PYTHONPATH="."; python -m uvicorn backend.main:app --port 8000
```

Uses FastAPI + DuckDB at runtime (no `VITE_STATIC_DATA`).

## Docker / Render

See `Dockerfile` and `render.yaml` for a single container with live parquet queries.
