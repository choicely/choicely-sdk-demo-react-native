#!/usr/bin/env bash

if [ -z "$1" ]; then
  echo "Usage: $0 <port>"
  exit 1
fi

PORT="$1"

# Find all PIDs using the port
PIDS=$(lsof -ti :$PORT)

if [ -z "$PIDS" ]; then
  echo "No process found using port $PORT"
else
  echo "Killing processes on port $PORT: $PIDS"
  kill -9 $PIDS
fi
