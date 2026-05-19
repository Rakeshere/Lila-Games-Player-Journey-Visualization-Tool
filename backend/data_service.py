import json
import re
from pathlib import Path

import duckdb

from backend.config import (
    DATA_DIR,
    DATE_FOLDERS,
    DEATH_EVENTS,
    KILL_EVENTS,
    MAP_CONFIG,
    POSITION_EVENTS,
)
from backend.coords import is_bot_user, world_to_pixel

PARQUET_GLOB = str(DATA_DIR / "**" / "*.nakama-0").replace("\\", "/")
_CACHE_PATH = DATA_DIR / ".match_index.json"


def _decode_event(evt) -> str:
    if isinstance(evt, bytes):
        return evt.decode("utf-8")
    return str(evt)


def _ts_to_ms(ts) -> int:
    if hasattr(ts, "timestamp"):
        return int(ts.timestamp() * 1000)
    return int(ts)


class DataService:
    def __init__(self):
        self.con = duckdb.connect()
        self._match_index: list[dict] | None = None

    def parquet_pattern(self, dates: list[str] | None = None) -> str:
        if not dates:
            return PARQUET_GLOB
        parts = [str(DATA_DIR / d / "*.nakama-0").replace("\\", "/") for d in dates if d in DATE_FOLDERS]
        return parts[0] if len(parts) == 1 else "[" + ", ".join(f"'{p}'" for p in parts) + "]"

    def _match_date_map(self) -> dict[str, str]:
        mapping: dict[str, str] = {}
        for folder in DATE_FOLDERS:
            folder_path = DATA_DIR / folder
            if not folder_path.exists():
                continue
            for f in folder_path.iterdir():
                if "_" not in f.name:
                    continue
                _, rest = f.name.rsplit("_", 1)
                mid = rest.replace(".nakama-0", "")
                mapping[mid] = folder
        return mapping

    def build_match_index(self, force: bool = False) -> list[dict]:
        if not force and _CACHE_PATH.exists():
            with open(_CACHE_PATH, encoding="utf-8") as f:
                self._match_index = json.load(f)
                return self._match_index

        date_map = self._match_date_map()
        rows = self.con.execute(
            f"""
            SELECT
                regexp_replace(match_id, '\\.nakama-0$', '') AS match_id,
                map_id,
                epoch_ms(MIN(ts)) AS start_ts,
                epoch_ms(MAX(ts)) AS end_ts,
                COUNT(DISTINCT user_id) AS player_count,
                COUNT(*) AS event_count
            FROM read_parquet('{PARQUET_GLOB}', union_by_name=true)
            GROUP BY 1, 2
            ORDER BY start_ts
            """
        ).fetchall()

        index = []
        for match_id, map_id, start_ts, end_ts, player_count, event_count in rows:
            index.append(
                {
                    "match_id": match_id,
                    "map_id": map_id,
                    "date": date_map.get(match_id, "February_10"),
                    "start_ts": int(start_ts) if start_ts else 0,
                    "end_ts": int(end_ts) if end_ts else 0,
                    "player_count": int(player_count),
                    "event_count": int(event_count),
                }
            )

        with open(_CACHE_PATH, "w", encoding="utf-8") as f:
            json.dump(index, f)
        self._match_index = index
        return index

    def get_match_index(self) -> list[dict]:
        if self._match_index is None:
            self.build_match_index()
        return self._match_index or []

    def filter_matches(
        self,
        map_id: str | None = None,
        date: str | None = None,
        search: str | None = None,
    ) -> list[dict]:
        matches = self.get_match_index()
        if map_id:
            matches = [m for m in matches if m["map_id"] == map_id]
        if date:
            folder = date if date.startswith("February") else None
            if not folder and "-" in date:
                folder = f"February_{date.split('-')[-1].lstrip('0') or date.split('-')[-1]}"
            if folder:
                matches = [m for m in matches if m.get("date") == folder]
        if search:
            q = search.lower()
            matches = [m for m in matches if q in m["match_id"].lower()]
        return matches

    def get_match_data(self, match_id: str) -> dict | None:
        full_id = match_id if match_id.endswith(".nakama-0") else f"{match_id}.nakama-0"
        pattern = PARQUET_GLOB
        clean_id = match_id.replace(".nakama-0", "")
        rows = self.con.execute(
            f"""
            SELECT user_id, map_id, x, z, epoch_ms(ts) AS ts_ms,
                   CAST(event AS VARCHAR) AS event
            FROM read_parquet('{pattern}', union_by_name=true)
            WHERE regexp_replace(match_id, '\\.nakama-0$', '') = ?
            ORDER BY user_id, ts
            """,
            [clean_id],
        ).fetchall()

        if not rows:
            return None

        map_id = rows[0][1]
        players: dict[str, dict] = {}
        min_ts, max_ts = None, None

        for user_id, _, x, z, ts_ms, event in rows:
            event = _decode_event(event)
            ts_ms = int(ts_ms)
            min_ts = ts_ms if min_ts is None else min(min_ts, ts_ms)
            max_ts = ts_ms if max_ts is None else max(max_ts, ts_ms)

            if user_id not in players:
                bot = is_bot_user(str(user_id))
                players[user_id] = {
                    "user_id": str(user_id),
                    "is_bot": bot,
                    "path": [],
                    "events": [],
                }

            px, py = world_to_pixel(map_id, float(x), float(z))
            entry = {"x": px, "y": py, "ts": ts_ms, "event": event}

            if event in POSITION_EVENTS:
                players[user_id]["path"].append([px, py, ts_ms])
            else:
                players[user_id]["events"].append(entry)

        return {
            "match_id": match_id.replace(".nakama-0", ""),
            "map_id": map_id,
            "players": list(players.values()),
            "time_range": [min_ts or 0, max_ts or 0],
        }

    def get_heatmap(
        self,
        map_id: str,
        heatmap_type: str,
        dates: list[str] | None = None,
        grid_size: int = 32,
    ) -> dict:
        pattern = self.parquet_pattern(dates)
        read_expr = f"read_parquet('{pattern}', union_by_name=true)" if isinstance(pattern, str) and not pattern.startswith("[") else f"read_parquet({pattern}, union_by_name=true)"

        if heatmap_type == "kills":
            event_filter = "CAST(event AS VARCHAR) IN ('Kill', 'BotKill')"
        elif heatmap_type == "deaths":
            event_filter = "CAST(event AS VARCHAR) IN ('Killed', 'BotKilled', 'KilledByStorm')"
        else:
            event_filter = "CAST(event AS VARCHAR) IN ('Position', 'BotPosition')"

        rows = self.con.execute(
            f"""
            SELECT x, z, COUNT(*) AS weight
            FROM {read_expr}
            WHERE map_id = ? AND {event_filter}
            GROUP BY x, z
            """,
            [map_id],
        ).fetchall()

        cells: dict[tuple[int, int], float] = {}
        cell_w = 1024 / grid_size

        for x, z, weight in rows:
            px, py = world_to_pixel(map_id, float(x), float(z))
            gx = min(grid_size - 1, int(px / cell_w))
            gy = min(grid_size - 1, int(py / cell_w))
            cells[(gx, gy)] = cells.get((gx, gy), 0) + weight

        max_val = max(cells.values()) if cells else 1
        points = [
            {"gx": gx, "gy": gy, "intensity": round(v / max_val, 4)}
            for (gx, gy), v in cells.items()
        ]
        return {"grid_size": grid_size, "points": points}
