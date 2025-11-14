#!/usr/bin/env bash
set -euo pipefail

URL="$1"

if [ -z "$1" ]; then
  echo "Usage: $0 URL"
  exit 1
fi

echo "[wait-bundle] Waiting for 200 from:"
echo "  $URL"

while :; do
  status_code="$(curl -s -o /dev/null -w '%{http_code}' "$URL" || true)"
  if [[ "$status_code" == "200" ]]; then
    echo "[wait-bundle] Got 200, bundle is ready."
    break
  fi
  echo "[wait-bundle] Got $status_code, retrying in 1s..."
  sleep 1
done
