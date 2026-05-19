"""Vercel ASGI handler."""
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

os.environ.setdefault("VERCEL", "1")
os.environ.setdefault("PYTHONPATH", str(ROOT))

from mangum import Mangum  # noqa: E402

from backend.data_service import DataService  # noqa: E402
from backend.main import app  # noqa: E402

# Build match index once per cold start (lifespan disabled on serverless)
if os.getenv("BUILD_MATCH_INDEX", "1") == "1":
    try:
        DataService().build_match_index()
    except Exception:
        pass

handler = Mangum(app, lifespan="off")
