#!/usr/bin/env bash
set -euo pipefail

APP_NAME="${APP_NAME:-garage_dashboard}"
CONTAINER_NAME="${CONTAINER_NAME:-garage-dashboard}"
IMAGE_NAME="${IMAGE_NAME:-garage-dashboard}"
BRANCH="${BRANCH:-harsh}"
HOST_PORT="${HOST_PORT:-3003}"
CONTAINER_PORT="${CONTAINER_PORT:-3003}"
APP_DIR="${APP_DIR:-$(pwd)}"
DOCKER_NETWORK="${DOCKER_NETWORK:-autoparts}"
PM2_APP_NAME="${PM2_APP_NAME:-}"
HEALTH_PATH="${HEALTH_PATH:-/dashboard}"

cd "$APP_DIR"

git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

docker network inspect "$DOCKER_NETWORK" >/dev/null 2>&1 || docker network create "$DOCKER_NETWORK"

GIT_SHA="$(git rev-parse --short HEAD)"
docker build --pull -t "$IMAGE_NAME:$GIT_SHA" -t "$IMAGE_NAME:latest" .

if [[ -n "$PM2_APP_NAME" ]] && command -v pm2 >/dev/null 2>&1; then
  pm2 stop "$PM2_APP_NAME" || true
  pm2 save || true
fi

docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true

ENV_ARGS=()
for env_file in .env .env.local; do
  if [[ -f "$env_file" ]]; then
    ENV_ARGS+=(--env-file "$env_file")
  fi
done

docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  --network "$DOCKER_NETWORK" \
  -p "127.0.0.1:${HOST_PORT}:${CONTAINER_PORT}" \
  "${ENV_ARGS[@]}" \
  "$IMAGE_NAME:$GIT_SHA"

sleep 5
curl -fsS "http://127.0.0.1:${HOST_PORT}${HEALTH_PATH}" >/dev/null

docker image prune -f >/dev/null
echo "Deployed ${APP_NAME} (${GIT_SHA}) on port ${HOST_PORT}"
