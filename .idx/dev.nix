# To learn more about how to use Nix to configure your environment
# see: https://developers.google.com/idx/guides/customize-idx-env
{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-25.05";
  # Use https://search.nixos.org/packages to find packages
  packages = [ pkgs.bash pkgs.nodejs_20 pkgs.jdk17 pkgs.gradle_8 ];
  # Sets environment variables in the workspace
  env = { };
  idx = {
    # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    extensions = [
      "vscjava.vscode-java-pack"
      "fwcd.kotlin"
      "msjsdiag.vscode-react-native"
    ];
    workspace = {
      # Runs when a workspace is first created with this `dev.nix` file
      onCreate = {
        bash-setup = ''
        set -eo pipefail
        cd $HOME
        cat > ~/.bashrc <<'BASHRC'
        unset PROMPT_COMMAND
        __vsc_prompt_cmd_original() { :; }
        BASHRC
        exit
        '';
        create-env = ''
        cat > .env <<'EOF'
        GEMINI_API_KEY=""
        WEB_HOST_METRO="redirect.test.choicely.link/8932-${WEB_HOST}"

        EOF
        '';
        remove-junk = ''
        set -eo pipefail
        rm -rf flutter myapp
        exit
        '';
      };
      # Runs when a workspace restarted
      onStart = {
        npm-start = ''
        set -eo pipefail
        echo -e "\033[1;33mStarting Metro development server...\033[0m"
        npm start
        '';
        android-emulator = ''
        set -eo pipefail
        echo -e "\033[1;33mWaiting for Android emulator to be ready...\033[0m"
        # Wait for the device connection command to finish
        adb -s emulator-5554 wait-for-device
        echo -e "\033[1;33mOptimizing Android emulator...\033[0m"
        adb -s emulator-5554 shell settings put global window_animation_scale 0
        adb -s emulator-5554 shell settings put global transition_animation_scale 0
        adb -s emulator-5554 shell settings put global animator_duration_scale 0
        adb -s emulator-5554 shell settings put secure location_mode 0
        exit
        '';
        android-build = ''
        set -eo pipefail
        rm -rf ./android/app/build
        rm -rf ./android/.gradle
        rm -rf ./.gradle
        chmod a+x gradlew && \
        ./gradlew :android:app:installDebug -PreactNativeArchitectures=x86_64 --stacktrace
        adb -s emulator-5554 shell monkey -p com.choicely.sdk.rn.debug -c android.intent.category.LAUNCHER 1
        exit
        '';
      };
    };
    # Enable previews and customize configuration
    previews = {
      enable = true;
      previews = {
        android = {
          # noop
          command = [ "tail" "-f" "/dev/null" ];
          manager = "android";
        };
      };
    };
  };
}
