#!/usr/bin/env bash
set -euo pipefail

COMPOSE_DIR="${EC2_COMPOSE_DIR:-/opt/autoparts}"
COMPOSE_SERVICE="${COMPOSE_SERVICE:-garage}"

cd "$COMPOSE_DIR"

docker compose pull "$COMPOSE_SERVICE"
docker compose up -d "$COMPOSE_SERVICE"
docker image prune -f >/dev/null

echo "Deployed ${COMPOSE_SERVICE} from the prebuilt registry image"
