#!/usr/bin/env bash
set -euo pipefail

export HOST_TUNNEL_WEB=$(./scripts/utils/open_tunnel.sh "$WEB_PORT")
printf '%s="%s"\n' "HOST_TUNNEL_WEB" "$HOST_TUNNEL_WEB" >> .env

while :; do
  sleep 1
done
