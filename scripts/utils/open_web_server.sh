#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 PATH PORT" >&2
  echo "Example: $0 ./public 8001" >&2
  exit 1
fi

SERVE_PATH="$1"
PORT="$2"

SERVER_PID=""

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "[http-server] Shutting down (pid $SERVER_PID)..."
    # First ask nicely
    kill "$SERVER_PID" 2>/dev/null || true
    # Wait for it to actually exit so the port is freed
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}

# Ctrl+C
trap 'echo "[http-server] Caught SIGINT (Ctrl+C)"; cleanup; exit 0' INT
# kill, system shutdowns, etc.
trap 'echo "[http-server] Caught SIGTERM"; cleanup; exit 0' TERM
# Ctrl+\ on some setups
trap 'echo "[http-server] Caught SIGQUIT"; cleanup; exit 0' QUIT
# Ctrl+Z – instead of stopping, we shut down cleanly and exit
trap 'echo "[http-server] Caught SIGTSTP (Ctrl+Z)"; cleanup; exit 0' TSTP

# Start http-server in the background
npx -y http-server "$SERVE_PATH" -p "$PORT" -a 127.0.0.1 \
  --no-dotfiles -r --log-ip -U -c-1 --cors -d false -i false &
SERVER_PID=$!

echo "[http-server] Serving '$SERVE_PATH' on http://127.0.0.1:$PORT (pid $SERVER_PID)"

# Wait until http-server exits (or until a signal triggers cleanup)
wait "$SERVER_PID"
