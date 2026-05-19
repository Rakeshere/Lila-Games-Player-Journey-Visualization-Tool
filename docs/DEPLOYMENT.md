# Deployment

## Vercel (recommended)

1. Import [the GitHub repository](https://github.com/Rakeshere/Lila-Games-Player-Journey-Visualization-Tool) on [vercel.com](https://vercel.com).
2. Use default settings from `vercel.json` (build runs `scripts/vercel-build.sh`).
3. The build downloads `player_data` from Google Drive automatically.
4. Verify: `https://<your-app>.vercel.app/api/health`

Environment variables (optional):

| Variable | Value |
|----------|--------|
| `BUILD_MATCH_INDEX` | `1` |
| `PYTHONPATH` | `.` |

## Docker

```bash
docker build -t lila-journey .
docker run -p 8000:8000 -e BUILD_MATCH_INDEX=1 lila-journey
```

Requires `player_data/` in the image or mounted as a volume.

## Render

- **Build:** `pip install -r requirements.txt && cd frontend && npm ci && npm run build`
- **Start:** `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- **Env:** `PYTHONPATH=.`, `BUILD_MATCH_INDEX=1`
