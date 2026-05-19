"""
Precompute JSON assets for static Vercel deploy (no Python Lambda / DuckDB at runtime).
Output: frontend/public/data/
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "frontend" / "public" / "data"
sys.path.insert(0, str(ROOT))

from backend.config import DATA_DIR, DATE_FOLDERS, MAP_CONFIG  # noqa: E402
from backend.data_service import DataService  # noqa: E402


def main() -> None:
    if not (DATA_DIR / "February_10").exists():
        print("ERROR: player_data not found. Run from project root with data extracted.")
        sys.exit(1)

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "matches").mkdir(exist_ok=True)
    (OUT / "heatmaps").mkdir(exist_ok=True)

    svc = DataService()
    print("Building match index...")
    index = svc.build_match_index(force=True)

    maps = [
        {
            "id": mid,
            "label": cfg["label"],
            "image": f"/minimaps/{cfg['image']}",
            "scale": cfg["scale"],
            "origin_x": cfg["origin_x"],
            "origin_z": cfg["origin_z"],
        }
        for mid, cfg in MAP_CONFIG.items()
    ]

    dates = [
        {
            "id": folder,
            "label": folder.replace("February_", "Feb "),
            "iso": f"2026-02-{folder.split('_')[1]}",
        }
        for folder in DATE_FOLDERS
        if (DATA_DIR / folder).exists()
    ]

    with open(OUT / "maps.json", "w", encoding="utf-8") as f:
        json.dump(maps, f)

    with open(OUT / "dates.json", "w", encoding="utf-8") as f:
        json.dump(dates, f)

    with open(OUT / "matches.json", "w", encoding="utf-8") as f:
        json.dump(index, f)

    print(f"Exporting {len(index)} match files...")
    for i, m in enumerate(index):
        mid = m["match_id"]
        data = svc.get_match_data(mid)
        if not data:
            continue
        path = OUT / "matches" / f"{mid}.json"
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, separators=(",", ":"))
        if (i + 1) % 100 == 0:
            print(f"  {i + 1}/{len(index)}")

    for map_id in MAP_CONFIG:
        for htype in ("kills", "deaths", "traffic"):
            print(f"Heatmap {map_id} / {htype}")
            hm = svc.get_heatmap(map_id, htype, grid_size=40)
            out = OUT / "heatmaps" / f"{map_id}-{htype}.json"
            with open(out, "w", encoding="utf-8") as f:
                json.dump(hm, f, separators=(",", ":"))

    meta = {
        "status": "ok",
        "matches": len(index),
        "static": True,
    }
    with open(OUT / "health.json", "w", encoding="utf-8") as f:
        json.dump(meta, f)

    total_mb = sum(f.stat().st_size for f in OUT.rglob("*") if f.is_file()) / (1024 * 1024)
    print(f"Done. Static data size: {total_mb:.1f} MB in {OUT}")


if __name__ == "__main__":
    main()
