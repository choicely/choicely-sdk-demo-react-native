#!/usr/bin/env bash
set -euo pipefail

WITH_ENVIRONMENT="$REACT_NATIVE_PATH/scripts/xcode/with-environment.sh"
REACT_NATIVE_XCODE="$REACT_NATIVE_PATH/scripts/react-native-xcode.sh"

/usr/bin/env bash -c "$WITH_ENVIRONMENT $REACT_NATIVE_XCODE"
