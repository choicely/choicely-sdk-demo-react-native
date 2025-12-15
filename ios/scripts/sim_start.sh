#!/usr/bin/env zsh

trap_card() {
  trap - SIGINT SIGQUIT SIGTSTP
	echo -e "\nGoodbye!"; exit 0
}
trap trap_card SIGINT SIGQUIT SIGTSTP

help() {
	cat <<- 'DESCRIPTION' >&2
	Run iOS simulator from the command line.
	USAGE
		./run-ios-sim [device_type] (e.g., "iPhone 13 mini")
	OPTIONS
	    -h --help     Show this help message.
	    -l --list     List available device types.
	    -i            Install script to ~/.local/bin (then call as `run-ios-sim`).
	DESCRIPTION
}
if [[ $1 = "-h" ]] || [[ $1 = "--help" ]]; then
	help
	exit 0
fi

[[ -n $(logname >/dev/null 2>&1) ]] && logged_in_user=$(logname) || logged_in_user=$(whoami)

logged_in_home=$(eval echo "~${logged_in_user}")

script_dir=$(dirname "$(readlink -f "$0")")

if [[ ! -f "${logged_in_home}/.local/bin/run-ios-sim" ]] && [[ "$1" = "-i" ]]; then
    mkdir -p "${logged_in_home}/.local/bin"
	ln -s "${script_dir}/$0" "${logged_in_home}/.local/bin/run-ios-sim" >/dev/null 2>&1
	echo "run-ios-sim installed to ${logged_in_home}/.local/bin"
	exit 0
elif [[ -f "${logged_in_home}/.local/bin/run-ios-sim" ]] && [[ "$1" = "-i" ]]; then
	echo "run-ios-sim already installed to ${logged_in_home}/.local/bin"
	exit 0
fi

if [[ $(xcrun simctl list >/dev/null 2>&1) -ne 0 ]]; then
    echo "Simulator not found. Please install Xcode."
    exit 1
fi
simctl_list=$(xcrun simctl list)

device_types=$(echo "$simctl_list" | awk '/Device Types/,/Runtimes/' | grep -E 'iPhone' | sed -E 's/ \(com.apple.*//')

if [[ $1 = "-l" ]] || [[ $1 = "--list" ]]; then
	echo "$device_types"
	exit 0
fi

if [[ $# -ge 1 ]]; then
	model="$*"
else
	echo "Enter phone model (e.g., iPhone 13 mini): "
	read -r model
fi

model=$(echo "$model" | awk '{print tolower($0)}' | awk '{$1=$1};1')

choice=$(echo "$device_types" | grep -i "$model")

if [ -z "$choice" ]; then
	echo "No simulator found for $model"
	exit 1
fi

if [ ${#choice} -gt 1 ]; then
	echo "Choose a device type: "
	echo "$choice" | awk '{print NR, $0}'
	read -r choice_number
	choice=$(echo "$choice" | awk "NR==$choice_number")
fi

app="Simulator"
[[ -n $(pgrep $app) ]] && open -a Simulator

if [[ -z $(echo "$simctl_list" | grep -E "$choice.*\(Booted\)") ]]; then
	xcrun simctl boot "$choice"
else
	echo "$choice already booted"
fi

exit 0
