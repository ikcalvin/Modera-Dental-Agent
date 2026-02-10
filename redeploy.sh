#!/usr/bin/env bash
set -euo pipefail

echo "==> Pulling latest code..."
git pull origin main

echo "==> Rebuilding and restarting container..."
docker compose up -d --build

echo "==> Cleaning up old images..."
docker image prune -f

echo "==> Done! Current status:"
docker compose ps
