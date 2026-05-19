#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Create Python virtualenv"
python3 -m venv .build-venv
# shellcheck disable=SC1091
source .build-venv/bin/activate
pip install --upgrade pip
pip install -r requirements-vercel.txt

echo "==> Download game data if missing"
if [ ! -d "player_data/February_10" ]; then
  gdown 19N6ASpZJkexYb-v3m5XU_xvi-YywRTe9 -O player_data.zip
  unzip -q -o player_data.zip
  rm -f player_data.zip
fi

if [ ! -d "player_data/minimaps" ]; then
  echo "ERROR: player_data missing after download"
  exit 1
fi

echo "==> Precompute static JSON (no Python Lambda on Vercel)"
export PYTHONPATH=.
python scripts/build_static_data.py

echo "==> Copy minimaps"
mkdir -p frontend/public/minimaps
cp -r player_data/minimaps/* frontend/public/minimaps/

echo "==> Build frontend (static data mode)"
echo "VITE_STATIC_DATA=true" > frontend/.env.production
cd frontend
npm run build
cd ..

echo "==> Vercel build done (static site only)"
