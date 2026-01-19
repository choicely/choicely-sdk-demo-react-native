#!/usr/bin/env bash
# NOTE: This script MUST be run using 'source', not 'bash'.
#       source ./scripts/setup_dev_env.sh
#
# This script prepares your entire terminal session.

# Check if the script is being sourced or executed.
# This check works in both Bash and Zsh.
(return 0 2>/dev/null) && _IS_SOURCED=1 || _IS_SOURCED=0

if [[ "$_IS_SOURCED" == "1" ]]; then

    # --- Define a safe function for the setup logic ---
    # All logic is inside a function. On error, it will 'return', which
    # stops the function but will NOT kill your terminal.
    __setup_environment() {
        # Move to the project root directory. This is crucial.
        local SCRIPT_DIR
        local PROJECT_ROOT
        local SCRIPT_PATH
        
        # Robustly determine the script path in both Bash and Zsh.
        if [[ -n "$ZSH_VERSION" ]]; then
            # Zsh: use (%):-%x to get the sourced file path.
            # We use eval to prevent Bash from choking on Zsh syntax during parsing.
            SCRIPT_PATH="$(eval 'echo "${(%):-%x}"')"
        elif [[ -n "${BASH_SOURCE[0]}" ]]; then
            # Bash
            SCRIPT_PATH="${BASH_SOURCE[0]}"
        else
            # Fallback
            SCRIPT_PATH="$0"
        fi

        SCRIPT_DIR="$(cd "$(dirname "$SCRIPT_PATH")" &>/dev/null && pwd)"
        PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
        cd "$PROJECT_ROOT" || return 1

        # --- PART 1: ANDROID SDK ---
        echo "[INFO] Setting up PATH for Android SDK..."
        local SDK_ROOT
        if [[ -n "${ANDROID_HOME-}" && -d "$ANDROID_HOME" ]]; then
            SDK_ROOT="$ANDROID_HOME"
        elif [[ -n "${ANDROID_SDK_ROOT-}" && -d "$ANDROID_SDK_ROOT" ]]; then
            SDK_ROOT="$ANDROID_SDK_ROOT"
        elif [[ -d "$HOME/Library/Android/sdk" ]]; then
            SDK_ROOT="$HOME/Library/Android/sdk"
        else
            echo "[ERROR] Android SDK not found. Please ensure ANDROID_HOME is set or Android Studio is installed." >&2
            return 1 # Return from function on error
        fi

        local BUILD_TOOLS_PATH
        BUILD_TOOLS_PATH=$(find "$SDK_ROOT/build-tools" -mindepth 1 -maxdepth 1 -type d | sort -V | tail -n 1)

        if [[ ! -d "$BUILD_TOOLS_PATH" ]]; then
            echo "[ERROR] 'build-tools' directory not found in your Android SDK. Please install it via Android Studio's SDK Manager." >&2
            return 1
        fi

        export PATH="$BUILD_TOOLS_PATH:$PATH"
        echo "[OK] Android SDK Path is configured. 'zipalign' is now available."

        # --- PART 2: EXTERNAL TOOLS ---
        local tool_to_install
        for tool_to_install in "cloudflared:cloudflare/cloudflare/cloudflared" "qrencode:qrencode"; do
            local tool_name="${tool_to_install%%:*}"
            local package_name="${tool_to_install#*:}"

            if ! command -v "$tool_name" &> /dev/null; then
                echo "[PROMPT] Required tool '$tool_name' is not installed."
                
                # Cross-shell input reading
                echo -n "         Install '$package_name' via Homebrew now? (y/n) "
                if [ -n "$ZSH_VERSION" ]; then
                    read -k 1 -r REPLY
                else
                    read -n 1 -r REPLY
                fi
                echo # new line

                if [[ "$REPLY" =~ ^[Yy]$ ]]; then
                    if ! command -v brew &>/dev/null; then
                        echo "[ERROR] Homebrew is not installed. Please install it manually." >&2
                        return 1
                    fi
                    echo "[INFO] Installing '$package_name'..."
                    if ! brew install "$package_name"; then
                        echo "[ERROR] Homebrew failed to install '$package_name'." >&2
                        return 1
                    fi
                else
                    echo "[ABORT] Installation skipped. The script cannot continue." >&2
                    return 1
                fi
            fi
            echo "[OK] Tool '$tool_name' is available."
        done

        # --- PART 3: .env FILES ---
        echo "[INFO] Loading environment variables from .env files..."
        if [[ ! -f "default.env" ]]; then
            echo "[ERROR] 'default.env' file not found in project root." >&2
            return 1
        fi

        # 'set -a' exports all variables created. 'set +a' stops this behavior.
        set -a
        source "default.env" || true # The '|| true' is a final safeguard
        if [[ -f ".env" ]]; then
            source ".env" || true
        fi
        set +a
        echo "[OK] App keys have been loaded and exported."

        printf "\n[SUCCESS] Your environment is now fully configured for this terminal session.\n"
    }

    # Execute the function. The 'if' statement consumes the return code (0 or 1),
    # which is the key to preventing the parent terminal from exiting.
    if __setup_environment; then
        unset -f __setup_environment # Clean up the function from the user's shell
    else
        unset -f __setup_environment # Also clean up on failure
        echo "[FAILURE] Environment setup failed. Please see errors above." >&2
        # We do NOT return 1 here, as that would kill the terminal.
    fi

else
    # This part runs if the script is executed directly with 'bash' instead of 'source'
    echo "[ERROR] This script must be sourced, not run directly." >&2
    echo "        Please run: source ./scripts/setup_dev_env.sh" >&2
    exit 1
fi
