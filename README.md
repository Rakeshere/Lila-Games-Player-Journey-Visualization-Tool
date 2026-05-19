# LILA BLACK — Player Journey Visualization

Web application for exploring player movement, combat, loot pickups, and storm deaths on official map minimaps. Built for level design and live-ops analysis using five days of production telemetry (February 10–14, 2026).

**Repository:** [github.com/Rakeshere/Lila-Games-Player-Journey-Visualization-Tool](https://github.com/Rakeshere/Lila-Games-Player-Journey-Visualization-Tool)

## Live demo

**Recommended:** Deploy on [Railway](https://railway.com) from GitHub — see Live: https://lila-player-journey-production.up.railway.app/

Local: **http://localhost:8000** after setup below.

## Features

- Movement paths on 1024×1024 minimaps (Ambrose Valley, Grand Rift, Lockdown)
- Event markers: kills, deaths, loot, storm deaths
- Human vs bot paths (solid vs dashed)
- Filters by map, date, and match
- Timeline playback with scrubbing
- Heatmaps: kills, deaths, traffic

## Tech stack

| Layer | Stack |
|-------|--------|
| Frontend | React, TypeScript, Vite, Canvas |
| Backend | FastAPI, DuckDB |
| Data | Apache Parquet |

## Quick start

### 1. Get the data

Download [player_data.zip](https://drive.google.com/file/d/19N6ASpZJkexYb-v3m5XU_xvi-YywRTe9/view?usp=sharing) and extract so `player_data/` contains `February_10` … `February_14` and `minimaps/`.

```bash
pip install gdown
gdown 19N6ASpZJkexYb-v3m5XU_xvi-YywRTe9 -O player_data.zip
unzip player_data.zip   # or Expand-Archive on Windows
```

### 2. Install and run

```bash
pip install -r requirements.txt
cd frontend && npm install && npm run build && cd ..

# Windows PowerShell
$env:PYTHONPATH="."
python -m uvicorn backend.main:app --reload --port 8000
```

Open ( https://lila-player-journey-production.up.railway.app/ )
    ( https://lila-player-journey-production-6edc.up.railway.app/ )

## Project structure

```
├── backend/          # API and data processing
├── frontend/         # React UI
├── api/              # Vercel serverless entry
├── scripts/          # Build utilities
├── ARCHITECTURE.md   # System design
├── INSIGHTS.md       # Telemetry findings
└── docs/DEPLOYMENT.md
```

## API

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check |
| `GET /api/maps` | Map list |
| `GET /api/dates` | Available dates |
| `GET /api/matches` | Match index (filterable) |
| `GET /api/match/{id}` | Journeys for one match |
| `GET /api/heatmap` | Density grid overlay |

## Deployment

**Vercel:** Static site — telemetry is baked into JSON at build time (no Python serverless, no 250 MB Lambda limit). See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

Game data is downloaded during the Vercel build (not stored in git).

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) — data flow and coordinate mapping
- [INSIGHTS.md](INSIGHTS.md) — patterns from the telemetry sample

## License

MIT — see [LICENSE](LICENSE).
