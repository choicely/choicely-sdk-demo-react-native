#!/usr/bin/env bash
set -euo pipefail

: "${REACT_NATIVE_PATH:?REACT_NATIVE_PATH is not defined (export REACT_NATIVE_PATH=/path/to/react-native)}"

WITH_ENVIRONMENT="$REACT_NATIVE_PATH/scripts/xcode/with-environment.sh"
REACT_NATIVE_XCODE="$REACT_NATIVE_PATH/scripts/react-native-xcode.sh"

export ENTRY_FILE=${1:-src/index.js}

/usr/bin/env bash -c "$WITH_ENVIRONMENT $REACT_NATIVE_XCODE"
