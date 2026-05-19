#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

export PYTHONPATH=.

echo "==> Install Python deps"
pip install -r requirements-vercel.txt

echo "==> Download game data if missing (not stored in GitHub)"
if [ ! -d "player_data/February_10" ]; then
  pip install gdown
  gdown 19N6ASpZJkexYb-v3m5XU_xvi-YywRTe9 -O player_data.zip
  unzip -q -o player_data.zip
  rm -f player_data.zip
fi

if [ ! -d "player_data/minimaps" ]; then
  echo "ERROR: player_data missing after download"
  exit 1
fi

echo "==> Build match index"
python -c "from backend.data_service import DataService; DataService().build_match_index(force=True)"

echo "==> Copy minimaps into frontend public"
mkdir -p frontend/public/minimaps
cp -r player_data/minimaps/* frontend/public/minimaps/

echo "==> Build frontend"
cd frontend
npm ci
npm run build
cd ..

echo "==> Vercel build done"
