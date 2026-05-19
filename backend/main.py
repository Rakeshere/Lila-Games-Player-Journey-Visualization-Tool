import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.config import DATA_DIR, DATE_FOLDERS, MAP_CONFIG, MINIMAP_DIR
from backend.data_service import DataService

ROOT = Path(__file__).resolve().parents[1]
FRONTEND_DIST = ROOT / "frontend" / "dist"

service = DataService()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    if os.getenv("BUILD_MATCH_INDEX", "1") == "1":
        service.build_match_index()
    yield


app = FastAPI(title="LILA Player Journey Visualizer", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok", "matches": len(service.get_match_index())}


@app.get("/api/maps")
def get_maps():
    return [
        {
            "id": map_id,
            "label": cfg["label"],
            "image": f"/minimaps/{cfg['image']}",
            "scale": cfg["scale"],
            "origin_x": cfg["origin_x"],
            "origin_z": cfg["origin_z"],
        }
        for map_id, cfg in MAP_CONFIG.items()
    ]


@app.get("/api/dates")
def get_dates():
    return [
        {
            "id": folder,
            "label": folder.replace("February_", "Feb "),
            "iso": f"2026-02-{folder.split('_')[1]}",
        }
        for folder in DATE_FOLDERS
        if (DATA_DIR / folder).exists()
    ]


@app.get("/api/matches")
def list_matches(
    map_id: str | None = None,
    date: str | None = None,
    search: str | None = None,
    limit: int = Query(200, le=1000),
):
    matches = service.filter_matches(map_id=map_id, date=date, search=search)
    matches = sorted(matches, key=lambda m: m["player_count"], reverse=True)
    return {"matches": matches[:limit], "total": len(matches)}


@app.get("/api/match/{match_id}")
def get_match(match_id: str):
    data = service.get_match_data(match_id)
    if not data:
        raise HTTPException(404, "Match not found")
    return data


@app.get("/api/heatmap")
def get_heatmap(
    map_id: str,
    type: str = Query("traffic", pattern="^(kills|deaths|traffic)$"),
    date: str | None = None,
    grid_size: int = Query(40, ge=16, le=80),
):
    dates = [date] if date and date.startswith("February") else None
    return service.get_heatmap(map_id, type, dates=dates, grid_size=grid_size)


# Static assets (local/Docker only — Vercel serves dist/ + public/minimaps)
IS_VERCEL = os.getenv("VERCEL") == "1"

if not IS_VERCEL:
    app.mount("/minimaps", StaticFiles(directory=str(MINIMAP_DIR)), name="minimaps")

if FRONTEND_DIST.exists() and not IS_VERCEL:
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/{full_path:path}")
    def spa(full_path: str):
        index = FRONTEND_DIST / "index.html"
        if full_path.startswith("api"):
            raise HTTPException(404)
        file_path = FRONTEND_DIST / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(index)
