# Deploy on Railway (from GitHub)

Repo: https://github.com/Rakeshere/Lila-Games-Player-Journey-Visualization-Tool

## Option A — Railway Dashboard (recommended)

1. Go to https://railway.com/new
2. **Deploy from GitHub repo** → authorize GitHub → select `Lila-Games-Player-Journey-Visualization-Tool`
3. Railway detects `Dockerfile` automatically (see `railway.toml`)
4. Click **Deploy** — first build takes ~15–25 min (downloads game data in Docker)
5. Open **Settings → Networking → Generate Domain**
6. Test: `https://YOUR-APP.up.railway.app/api/health`

## Option B — Railway CLI

```bash
npm install -g @railway/cli
railway login
cd your-project-folder
railway init
railway up
railway domain
```

## Environment variables (optional)

| Key | Value |
|-----|--------|
| `PYTHONPATH` | `/app` |
| `BUILD_MATCH_INDEX` | `1` |

`PORT` is set automatically by Railway.

## Notes

- Full FastAPI + DuckDB runtime (not the Vercel static build)
- Docker image downloads `player_data` during build via `gdown`
- Health check: `/api/health`
