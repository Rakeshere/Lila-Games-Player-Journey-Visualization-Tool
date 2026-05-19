FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl unzip && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gdown

COPY backend/ ./backend/
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Download telemetry at image build (not in GitHub)
RUN gdown 19N6ASpZJkexYb-v3m5XU_xvi-YywRTe9 -O /tmp/player_data.zip \
    && unzip -q -o /tmp/player_data.zip -d /app \
    && rm /tmp/player_data.zip \
    && test -d /app/player_data/February_10

ENV PYTHONPATH=/app
ENV BUILD_MATCH_INDEX=1

RUN python -c "from backend.data_service import DataService; DataService().build_match_index(force=True)"

EXPOSE 8000

COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh
CMD ["/app/start.sh"]
