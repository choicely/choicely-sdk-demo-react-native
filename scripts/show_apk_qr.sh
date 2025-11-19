#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-${APK_PORT:-}}"
if [ -z "${PORT}" ]; then
  echo "Usage: $0 [PORT]"
  echo "  Either pass PORT as first argument or set APK_PORT in the environment."
  exit 1
fi

./scripts/utils/kill_port.sh "$PORT"
APK_PATH=./android/app/build/outputs/apk/debug
./scripts/utils/open_web_server.sh "$APK_PATH" "$PORT" &

APK_HOST=$(./scripts/utils/open_tunnel.sh "$PORT")
APK_HOST="${APK_HOST#http://}"
APK_HOST="${APK_HOST#https://}"

if [ -z "${APK_HOST:-}" ]; then
  echo "[show_apk_qr] ERROR: APK_HOST was not set by open_tunnel.sh" >&2
  exit 1
fi

echo "APK_HOST: $APK_HOST"
printf '%s="%s"\n' "APK_HOST" "$APK_HOST" >> .env

QR_CODE_PATH=./out/qr-download-apk.png
safe_app_name=${CHOICELY_APP_NAME//[^A-Za-z0-9_-]/-}
#./scripts/utils/make_qr.sh "https://$APK_HOST/$safe_app_name.apk" "$QR_CODE_PATH"
./scripts/utils/make_qr.sh "http://127.0.0.1:$PORT/$safe_app_name.apk" "$QR_CODE_PATH"
#code -r -g "$QR_CODE_PATH"

cleanup() {
  trap - INT TERM QUIT EXIT TSTP
  echo "Cleaning up..."
  local pidfile="./tmp/cloudflared-${PORT}.pid"
  if [ -f "$pidfile" ]; then
    echo "Found cloudflared pidfile $pidfile"
    local cf_pid
    cf_pid="$(cat "$pidfile" 2>/dev/null || true)"
    echo "cf_pid: $cf_pid"
    if [[ -n "${cf_pid:-}" ]] && kill -0 "$cf_pid" 2>/dev/null; then
      echo "Killing cloudflared process with pid $cf_pid"
      kill "$cf_pid" 2>/dev/null || true
    fi
  fi
}
trap cleanup INT TERM QUIT EXIT TSTP

wait
