$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
$env:PYTHONPATH = "."

if (-not (Test-Path "player_data\February_10")) {
    Write-Host "Missing player_data. Download zip and extract to ./player_data/"
    exit 1
}

if (-not (Test-Path "frontend\dist\index.html")) {
    Push-Location frontend
    npm install
    npm run build
    Pop-Location
}

python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
