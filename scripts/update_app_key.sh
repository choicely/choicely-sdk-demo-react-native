#!/usr/bin/env bash
set -euo pipefail
FILE="./.vscode/tasks.json"
NEW_WAK="${CHOICELY_APP_KEY}"
if [ ! -f "$FILE" ]; then
  echo "Error: $FILE not found" >&2
  exit 1
fi

# Escape chars that are special for sed replacement
SAFE_WAK="${NEW_WAK//\//\\/}"
SAFE_WAK="${SAFE_WAK//&/\\&}"

if ! grep -q 'wak=' "$FILE"; then
  echo "No 'wak=' found in $FILE" >&2
  exit 1
fi

tmp="$(mktemp)"

sed -E 's/(wak=)[^"& ]+/\1'"$SAFE_WAK"'/g' "$FILE" >"$tmp"

mv "$tmp" "$FILE"
echo "Updated wak in $FILE to: $NEW_WAK"
