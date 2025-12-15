#!/usr/bin/env zsh
set -euo pipefail

die(){ echo "error: $*" >&2; exit 1; }

# Optional overrides:
#   ./sim_build.sh [scheme] [simulatorName]
SCHEME_ARG="${1:-}"
SIM_NAME_ARG="${2:-}"

CONFIG="${CONFIGURATION:-Debug}"
DERIVED_DATA="${DERIVED_DATA:-.build/DerivedData-iOS}"
DEFAULT_SIM_NAME="${SIM_NAME_ARG:-${SIMULATOR_NAME:-iPhone 15}}"

command -v xcodebuild >/dev/null || die "xcodebuild not found"
command -v xcrun >/dev/null || die "xcrun not found"
command -v ruby >/dev/null || die "ruby not found"

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
IOS_DIR="$ROOT/ios"
cd "$IOS_DIR"


WORKSPACE="$(find . -maxdepth 1 -type d -name '*.xcworkspace' \
  -not -name 'Pods.xcworkspace' | sort | head -n 1 | sed 's|^./||' || true)"
PROJECT="$(find . -maxdepth 1 -type d -name '*.xcodeproj' | sort | head -n 1 | sed 's|^./||' || true)"

if [[ -n "$WORKSPACE" ]]; then
  BASE=(-workspace "$WORKSPACE")
  echo "Using workspace: $WORKSPACE"
elif [[ -n "$PROJECT" ]]; then
  BASE=(-project "$PROJECT")
  echo "Using project: $PROJECT"
else
  die "no .xcworkspace or .xcodeproj found in $IOS_DIR"
fi

WORKSPACE_NAME="${WORKSPACE%.xcworkspace}"
PROJECT_NAME="${PROJECT%.xcodeproj}"

# Hint scheme inference with names that usually match the main app target.
typeset -a SCHEME_HINTS=()
[[ -n "$WORKSPACE_NAME" ]] && SCHEME_HINTS+=("$WORKSPACE_NAME")
[[ -n "$PROJECT_NAME" && "$PROJECT_NAME" != "$WORKSPACE_NAME" ]] && SCHEME_HINTS+=("$PROJECT_NAME")

pick_scheme() {
  local json hints_payload=""
  echo "Picking scheme from ${WORKSPACE:-$PROJECT}... " >&2
  json="$(xcodebuild "${BASE[@]}" -list -json 2>/dev/null)" || return 1
  if (( ${#SCHEME_HINTS[@]:-0} )); then
    hints_payload="$(printf "%s\n" "${SCHEME_HINTS[@]}")"
  fi
  SCHEME_HINTS_PAYLOAD="$hints_payload" ruby -rjson -e '
    data = JSON.parse(STDIN.read)
    schemes =
      if data["workspace"] && data["workspace"]["schemes"]
        data["workspace"]["schemes"]
      elsif data["project"] && data["project"]["schemes"]
        data["project"]["schemes"]
      else
        []
      end

    hints = ENV.fetch("SCHEME_HINTS_PAYLOAD", "").split(/\n+/)

    # Prefer non-Pods and non-test schemes
    preferred = schemes.find { |s|
      !(s.start_with?("Pods")) &&
      !(s =~ /(Tests|UITests)\z/)
    }

    # Then try to match provided hints (workspace/project names)
    hints.each do |hint|
      next if hint.to_s.empty?
      candidate = schemes.find { |s| s.casecmp(hint).zero? }
      if candidate
        preferred = candidate
        break
      end
    end

    puts(preferred || schemes[0] || "")
  ' <<<"$json"
}

find_booted_udid() {
  xcrun simctl list devices -j | ruby -rjson -e '
    data = JSON.parse(STDIN.read)
    (data["devices"] || {}).each do |runtime, devs|
      next unless runtime.include?("SimRuntime.iOS-")
      devs.each do |d|
        next unless d["state"] == "Booted"
        next unless d.fetch("isAvailable", true)
        puts d["udid"]
        exit 0
      end
    end
    exit 1
  '
}

find_udid_by_name() {
  local name="$1"
  xcrun simctl list devices -j | ruby -rjson -e '
    name = ARGV[0]
    data = JSON.parse(STDIN.read)
    candidates = []

    (data["devices"] || {}).each do |runtime, devs|
      next unless runtime.include?("SimRuntime.iOS-")
      devs.each do |d|
        next unless d["name"] == name
        next unless d.fetch("isAvailable", true)
        candidates << d["udid"]
      end
    end

    # First match is good enough for our use.
    puts(candidates[0] || "")
  ' "$name"
}

boot_udid() {
  local udid="$1"
  xcrun simctl boot "$udid" >/dev/null 2>&1 || true
  open -a Simulator --args -CurrentDeviceUDID "$udid" >/dev/null 2>&1 || true
  xcrun simctl bootstatus "$udid" -b
}

# Scheme: arg > env > inferred
SCHEME="${SCHEME_ARG:-${SCHEME:-}}"
if [[ -z "$SCHEME" ]]; then
  SCHEME="$(pick_scheme || true)"
fi
[[ -n "$SCHEME" ]] || die "could not infer scheme (try: ./sim_build.sh <scheme>)"
echo "Selected scheme: $SCHEME"

# Simulator: booted > default by name (boot it)
UDID="${SIMULATOR_UDID:-}"
if [[ -z "$UDID" ]]; then
  UDID="$(find_booted_udid || true)"
fi
if [[ -z "$UDID" ]]; then
  UDID="$(find_udid_by_name "$DEFAULT_SIM_NAME")"
  [[ -n "$UDID" ]] || die "could not find simulator named: $DEFAULT_SIM_NAME"
  boot_udid "$UDID"
fi

mkdir -p "$(dirname "$DERIVED_DATA")"

echo "Building scheme=$SCHEME config=$CONFIG simulator_udid=$UDID"

# Ensure Swift package dependencies are resolved in non-interactive environments
# This fetches binary xcframeworks and updates workspace resolution so the product
# (for example: ChoicelyCore) is available to the build.
echo "Resolving Swift package dependencies..."
# When resolving for a workspace, xcodebuild requires a scheme to be specified.
if [[ -n "${WORKSPACE:-}" ]]; then
  xcodebuild "${BASE[@]}" -scheme "$SCHEME" -resolvePackageDependencies || die "Failed to resolve Swift package dependencies"
else
  xcodebuild "${BASE[@]}" -resolvePackageDependencies || die "Failed to resolve Swift package dependencies"
fi

xcodebuild \
  "${BASE[@]}" \
  -scheme "$SCHEME" \
  -configuration "$CONFIG" \
  -sdk iphonesimulator \
  -destination "platform=iOS Simulator,id=${UDID}" \
  -derivedDataPath "$DERIVED_DATA" \
  build
