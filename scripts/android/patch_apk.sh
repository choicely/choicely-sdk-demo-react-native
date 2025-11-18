#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 BASE_APK NEW_CHOICELY_APP_KEY [OUT_APK]" >&2
  echo "Example: $0 base.apk new_app_key patched.apk" >&2
  exit 1
fi

BASE_APK="$1"
NEW_CHOICELY_APP_KEY="$2"
apk_dir="$(dirname -- "$BASE_APK")"
OUT_APK="${3:-$apk_dir/patched.apk}"
out_dir="$(dirname -- "$OUT_APK")"
out_file="$(basename -- "$OUT_APK")"
mkdir -p "$out_dir"
OUT_APK_FULL="$(realpath "$out_dir")/$out_file"

: "${APK_KEYSTORE:?Set APK_KEYSTORE to your keystore path}"
: "${APK_KEY_ALIAS:?Set APK_KEY_ALIAS to your key alias}"
: "${APK_STORE_PASS:?Set APK_STORE_PASS to your keystore password}"
: "${APK_KEY_PASS:?Set APK_KEY_PASS to your key password}"

CONTEXT_DIR="$(pwd)"
APK_KEYSTORE_FULL="$(realpath "$APK_KEYSTORE")"

WORKDIR="$(mktemp -d)"
cleanup() {
  trap - INT TERM QUIT EXIT TSTP
  rm -rf "$WORKDIR"
}
trap cleanup INT TERM QUIT EXIT TSTP

echo "[patch] Working directory: $WORKDIR"

TEMP_APK_NAME="base.apk"

cp "$BASE_APK" "$WORKDIR/$TEMP_APK_NAME"
cd "$WORKDIR"

echo "[patch] Unzipping base APK..."
mkdir extracted
unzip -q $TEMP_APK_NAME -d extracted

cd extracted

# 1) Remove existing signatures so we can re-sign cleanly
echo "[patch] Removing existing signatures (META-INF)..."
#rm -rf META-INF/* || true

# 2) Patch assets/choicely_config.json
CONFIG_PATH="assets/choicely_config.json"

if [ ! -f "$CONFIG_PATH" ]; then
  echo "[patch] ERROR: $CONFIG_PATH not found in APK" >&2
  exit 1
fi

echo "[patch] Patching $CONFIG_PATH with new choicely_app_key value..."

tmp_cfg="$(mktemp)"
jq --arg key "$NEW_CHOICELY_APP_KEY" '.choicely_app_key = $key' "$CONFIG_PATH" > "$tmp_cfg"
mv "$tmp_cfg" "$CONFIG_PATH"

# 3) Repack to unsigned APK (libs + resources.arsc uncompressed)
echo "[patch] Repacking unsigned APK (libs + resources.arsc uncompressed)..."
UNSIGNED_APK_NAME="$WORKDIR/unsigned.apk"
rm -f "$UNSIGNED_APK_NAME"

# We are currently in $WORKDIR/extracted

# 3a) Add resources.arsc uncompressed if present
if [ -f resources.arsc ]; then
  zip -0 "$UNSIGNED_APK_NAME" resources.arsc > /dev/null
fi

# 3b) Add native libs uncompressed if present
if [ -d lib ]; then
  zip -r -0 "$UNSIGNED_APK_NAME" lib > /dev/null
fi

# 3c) Add everything else with normal compression,
#     excluding lib/ and resources.arsc (already added)
zip -r "$UNSIGNED_APK_NAME" . -x "lib/*" "resources.arsc" > /dev/null

# 4) Align the APK (required for a proper installable package)
echo "[patch] Running zipalign..."
ALIGNED_APK_NAME="$WORKDIR/aligned.apk"
zipalign -p 4 "$UNSIGNED_APK_NAME" "$ALIGNED_APK_NAME"

# 5) Sign with your demo keystore
echo "[patch] Signing APK..."
apksigner sign \
  --ks "$APK_KEYSTORE_FULL" \
  --ks-key-alias "$APK_KEY_ALIAS" \
  --ks-pass "pass:${APK_STORE_PASS}" \
  --key-pass "pass:${APK_KEY_PASS}" \
  --out "$OUT_APK_FULL" \
  --min-sdk-version 24 \
  --v1-signing-enabled true \
  --v2-signing-enabled true \
  --lib-page-alignment 16384 \
  "$ALIGNED_APK_NAME"

echo "[patch] Done. Output APK: $OUT_APK"

zipalign -c -p 4 "$WORKDIR/$TEMP_APK_NAME"
zipalign -c -p 4 "$OUT_APK_FULL"
apksigner verify --print-certs "$WORKDIR/$TEMP_APK_NAME"
apksigner verify --print-certs "$OUT_APK_FULL"
aapt dump badging "$WORKDIR/$TEMP_APK_NAME" | head -n 10
aapt dump badging "$OUT_APK_FULL" | head -n 10
