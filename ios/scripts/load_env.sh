#!/usr/bin/env bash
set -euo pipefail

ENV_FILE_DEFAULT="${PROJECT_DIR}/../default.env"
if [ -f "$ENV_FILE_DEFAULT" ]; then
  set -a
  source "$ENV_FILE_DEFAULT"
  set +a
fi
ENV_FILE="${PROJECT_DIR}/../.env"
if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

export RCT_METRO_PORT
