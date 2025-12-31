#!/usr/bin/env bash
set -euo pipefail

source_env_if_exists() {
  local file="$1"
  [[ -f "$file" ]] || return 0
  set -a
  # shellcheck disable=SC1090
  source "$file"
  set +a
}

for f in \
  "${PROJECT_DIR}/../default.env" \
  "${PROJECT_DIR}/../.env"
do
  source_env_if_exists "$f"
done
