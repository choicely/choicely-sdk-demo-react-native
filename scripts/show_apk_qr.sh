#!/usr/bin/env bash
set -euo pipefail

APK_PATH=./android/app/build/outputs/apk/debug
./scripts/utils/open_web_server.sh "$APK_PATH" "$APK_PORT" &

#./scripts/utils/open_tunnel.sh "$APK_PORT" "APK_HOST" &

QR_CODE_PATH=./out/qr-download-apk.png
./scripts/utils/make_qr.sh https://"$APK_HOST"/app-debug.apk $QR_CODE_PATH
#code -r -g $QR_CODE_PATH

wait
