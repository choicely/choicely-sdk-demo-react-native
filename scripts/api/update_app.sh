#!/usr/bin/env bash
set -euo pipefail

: "${CHOICELY_API_BASE:?Environment variable CHOICELY_API_BASE is required}"
: "${CHOICELY_APP_KEY:?Environment variable CHOICELY_APP_KEY is required}"
: "${CHOICELY_API_KEY:?Environment variable CHOICELY_API_KEY is required}"
: "${HOST_TUNNEL_METRO:?Environment variable HOST_TUNNEL_METRO is required}"
: "${HOST_TUNNEL_WEB:?Environment variable HOST_TUNNEL_WEB is required}"

URL="${CHOICELY_API_BASE%/}/apps/${CHOICELY_APP_KEY}/"

# Build JSON payload
read -r -d '' PAYLOAD <<EOF || true
{
  "rn_config": {
    "dev": {
      "mobile_bundle_url": "${HOST_TUNNEL_METRO}",
      "web_bundle_url": "${HOST_TUNNEL_WEB}"
    }
  },
  "custom_data": {
    "mobile_bundle_url": "${HOST_TUNNEL_METRO}",
    "web_bundle_url": "${HOST_TUNNEL_WEB}"
  }
}
EOF

echo "PATCH $URL"
curl -sS \
  -X PATCH "$URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${CHOICELY_API_KEY}" \
  --fail-with-body \
  -d "$PAYLOAD"
echo
