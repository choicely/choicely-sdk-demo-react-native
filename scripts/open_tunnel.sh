#!/usr/bin/env bash
set -eo pipefail

PORT="$1"
VAR_NAME="$2"

if [ -z "$PORT" ] || [ -z "$VAR_NAME" ]; then
  echo "Usage: $0 <PORT> <ENV_VAR_NAME>" >&2
  exit 1
fi

case "$VAR_NAME" in
  ''|*[!A-Za-z0-9_]*)
    echo "Invalid env var name: $VAR_NAME" >&2
    exit 1
    ;;
esac

TMP_LOG="$(mktemp)"
echo "[tunnel] starting cloudflared on port $PORT..."
cloudflared tunnel --url "http://localhost:${PORT}" --no-autoupdate >"$TMP_LOG" 2>&1 &
CF_PID=$!

echo "[tunnel] waiting for cloudflared URL..."

TUNNEL_URL=""
while :; do
  if ! kill -0 "$CF_PID" 2>/dev/null; then
    echo "[tunnel] cloudflared exited before printing URL" >&2
    cat "$TMP_LOG" >&2 || true
    exit 1
  fi
  TUNNEL_URL="$(grep -o 'https://[^ ]*trycloudflare.com' "$TMP_LOG" | head -n1 || true)"
  if [ -n "$TUNNEL_URL" ]; then
    break
  fi
  sleep 0.25
done

STRIPPED_URL="${TUNNEL_URL#http://}"
STRIPPED_URL="${STRIPPED_URL#https://}"

export "$VAR_NAME=$STRIPPED_URL"
printf '%s="%s"\n' "$VAR_NAME" "$STRIPPED_URL" >> .env

echo "[tunnel] URL ($VAR_NAME): $STRIPPED_URL"

# Keep cloudflared attached so Ctrl+C will kill it
wait "$CF_PID"
