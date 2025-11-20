#!/usr/bin/env bash
set -euo pipefail

export HOST_TUNNEL_METRO=$(./scripts/utils/open_tunnel.sh "$RCT_METRO_PORT")
export HOST_TUNNEL_METRO="${HOST_TUNNEL_METRO#http://}"
export HOST_TUNNEL_METRO="${HOST_TUNNEL_METRO#https://}"
printf '%s="%s"\n' "HOST_TUNNEL_METRO" "$HOST_TUNNEL_METRO" >> .env
./scripts/update_app_key.sh
