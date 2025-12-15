#!/usr/bin/env zsh
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: $0 [--version <version>] [--dry-run]

Ensures the requested iOS simulator runtime is available to Xcode. Defaults to 26.2.
EOF
}

die(){ echo "error: $*" >&2; exit 1; }
have(){ command -v "$1" >/dev/null 2>&1; }

VERSION="26.2"
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    -v|--version)
      shift || die "missing version after $1"
      VERSION="${1:-}" && shift
      ;;
    -n|--dry-run)
      DRY_RUN=1
      shift
      ;;
    -h|--help)
      usage; exit 0
      ;;
    *)
      VERSION="$1"
      shift
      ;;
  esac
done
[[ -n "$VERSION" ]] || die "version must not be empty"

have xcrun || die "xcrun not found"
have xcodebuild || die "xcodebuild not found"
have ruby || die "ruby not found"

RUNTIME_ID="com.apple.CoreSimulator.SimRuntime.iOS-${VERSION//./-}"

runtime_installed() {
  local result
  result="$(xcrun simctl runtime list -j 2>/dev/null | ruby -rjson -e '
    target_id = ARGV[0]
    raw = JSON.parse(STDIN.read)
    runtimes = []

    case raw
    when Hash
      if raw["runtimes"].is_a?(Array)
        runtimes = raw["runtimes"]
      else
        runtimes = raw.values.select { |entry| entry.is_a?(Hash) && entry["runtimeIdentifier"] }
      end
    when Array
      runtimes = raw
    end

    found = runtimes.any? do |rt|
      next false unless rt.is_a?(Hash)
      ids = [rt["identifier"], rt["runtimeIdentifier"]].compact
      ids.include?(target_id)
    end

    puts(found ? "yes" : "no")
  ' "$RUNTIME_ID" || echo no)"
  [[ "$result" == "yes" ]]
}

if runtime_installed; then
  echo "iOS runtime $VERSION ($RUNTIME_ID) already installed"
  exit 0
fi

echo "iOS runtime $VERSION not found."
cmd=(xcodebuild -downloadPlatform iOS)

echo "Invoking: ${cmd[*]}"
if [[ $DRY_RUN -eq 1 ]]; then
  echo "Dry-run enabled; skipping download"
  exit 0
fi

"${cmd[@]}"

echo "Verifying runtime installation..."
if runtime_installed; then
  echo "iOS runtime $VERSION installed successfully"
else
  die "runtime $VERSION still missing; check Xcode > Settings > Platforms"
fi
