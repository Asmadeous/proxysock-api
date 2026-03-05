#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# deploy.sh — Deploy proxysock-api on the target VM
# Runs on the VM via SSH from GitHub Actions
# Usage: ./script/deploy.sh <image_tag> <environment>
# Example: ./script/deploy.sh staging staging
#          ./script/deploy.sh latest production
# ─────────────────────────────────────────────────────────────
set -euo pipefail

IMAGE_TAG="${1:?Usage: deploy.sh <image_tag> <environment>}"
ENVIRONMENT="${2:?Usage: deploy.sh <image_tag> <environment>}"
APP_DIR="/opt/proxysock-api"
REGISTRY="${DOCKER_REGISTRY:-ghcr.io/asmadeous}/proxysock-api"
COMPOSE_FILE="$APP_DIR/docker-compose.yml"
ENV_FILE="$APP_DIR/.env"
HEALTH_URL="http://localhost/up"
HEALTH_RETRIES=30
HEALTH_INTERVAL=2

log() { echo "[deploy $(date '+%H:%M:%S')] $*"; }

# ─── Pre-flight checks ──────────────────────────────────────
log "Starting deployment: $REGISTRY:$IMAGE_TAG ($ENVIRONMENT)"

if [ ! -f "$COMPOSE_FILE" ]; then
  log "ERROR: $COMPOSE_FILE not found. Run setup-vm.sh first."
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  log "ERROR: $ENV_FILE not found. Create it from .env.example first."
  exit 1
fi

# ─── Pull new image ─────────────────────────────────────────
log "Pulling image $REGISTRY:$IMAGE_TAG..."
docker pull "$REGISTRY:$IMAGE_TAG"
docker tag "$REGISTRY:$IMAGE_TAG" "$REGISTRY:current"

# ─── Save current image for rollback ────────────────────────
PREVIOUS_IMAGE=$(docker inspect --format='{{.Image}}' proxysock-web 2>/dev/null || echo "")
if [ -n "$PREVIOUS_IMAGE" ]; then
  docker tag "$PREVIOUS_IMAGE" "$REGISTRY:rollback" 2>/dev/null || true
  log "Saved rollback image: $PREVIOUS_IMAGE"
fi

# ─── Deploy ──────────────────────────────────────────────────
log "Running database migrations..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" run --rm \
  -e IMAGE_TAG="$IMAGE_TAG" \
  web bin/rails db:prepare 2>&1 || {
    log "ERROR: Migration failed! Aborting deployment."
    exit 1
  }

log "Restarting application..."
IMAGE_TAG="$IMAGE_TAG" docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --no-deps web

# ─── Health check ────────────────────────────────────────────
log "Waiting for health check..."
HEALTHY=false
for i in $(seq 1 $HEALTH_RETRIES); do
  if curl -sf --max-time 5 "$HEALTH_URL" > /dev/null 2>&1; then
    HEALTHY=true
    break
  fi
  log "Health check attempt $i/$HEALTH_RETRIES..."
  sleep $HEALTH_INTERVAL
done

if [ "$HEALTHY" = true ]; then
  log "✅ Deployment successful! App is healthy."
  # Clean up old images
  docker image prune -f > /dev/null 2>&1 || true
  exit 0
fi

# ─── Rollback ────────────────────────────────────────────────
log "❌ Health check failed! Rolling back..."
if [ -n "$PREVIOUS_IMAGE" ]; then
  docker tag "$REGISTRY:rollback" "$REGISTRY:current"
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --no-deps web
  log "Rolled back to previous image. Check logs: docker compose -f $COMPOSE_FILE logs web"
else
  log "No previous image to roll back to."
fi
exit 1
