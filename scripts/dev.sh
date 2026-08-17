#!/usr/bin/env bash
set -u
cd "$(dirname "$0")/.."
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=3072}"
port="${PORT:-3000}"
while true; do
  echo "[versebill] starting next on :${port}"
  npx next dev --port "$port"
  code=$?
  echo "[versebill] next exited ${code}; restarting in 2s"
  sleep 2
done
