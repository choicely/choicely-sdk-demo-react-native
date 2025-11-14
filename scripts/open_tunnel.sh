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
echo "[tunnel] starting localtunnel on port $PORT..."
npx localtunnel --port "$PORT" >"$TMP_LOG" 2>&1 &
LT_PID=$!

echo "[tunnel] waiting for loca.lt URL..."
while ! grep -q 'your url is:' "$TMP_LOG"; do
  if ! kill -0 "$LT_PID" 2>/dev/null; then
    echo "[tunnel] localtunnel exited before printing URL" >&2
    cat "$TMP_LOG" >&2 || true
    exit 1
  fi
  sleep 0.25
done

TUNNEL_URL="$(grep 'your url is:' "$TMP_LOG" | head -n1 | awk '{print $NF}')"

export "$VAR_NAME=$TUNNEL_URL"
# append to .env (creates it if it doesn't exist)
printf '%s=%s\n' "$VAR_NAME" "$TUNNEL_URL" >> .env
echo "[tunnel] URL ($VAR_NAME): $TUNNEL_URL"

# keep localtunnel attached so Ctrl+C stops it
wait "$LT_PID"
