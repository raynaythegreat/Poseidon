#!/bin/bash

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$PROJECT_DIR/.poseidon.pids"
LOG_FILE="$PROJECT_DIR/.poseidon.log"
USE_CLOUDFLARED_TUNNEL="${USE_CLOUDFLARED_TUNNEL:-0}"
SYNC_CLOUDFLARED_URL="${SYNC_CLOUDFLARED_URL:-0}"

# Function to kill a process tree
kill_tree() {
  local pid=$1
  if [ -z "$pid" ]; then return; fi
  local children=$(pgrep -P $pid)
  for child in $children; do
    kill_tree $child
  done
  kill -9 $pid 2>/dev/null
}

function stop_processes() {
  if [ -f "$PID_FILE" ]; then
    echo "🛑 Stopping existing Poseidon processes..."
    while read pid; do
      if ps -p $pid > /dev/null; then
        kill_tree $pid
      fi
    done < "$PID_FILE"
    rm "$PID_FILE"
  fi
  
  pkill -f "next-server" 2>/dev/null
  pkill -f "next start" 2>/dev/null
  pkill -f "next dev" 2>/dev/null
  pkill -f "watch-ngrok" 2>/dev/null
  pkill -f "electron" 2>/dev/null
  echo "✅ Stopped."
}

function start_processes() {
  cd "$PROJECT_DIR" || exit 1
  echo "🚀 Starting Poseidon..."
  
  # Use Dev Server for stability
  echo "   - Starting Development Server..."
  nohup npm run dev > "$LOG_FILE" 2>&1 &
  DEV_PID=$!
  echo $DEV_PID >> "$PID_FILE"
  
  echo "   - Waiting for server..."
  sleep 5
  
  echo "   - Starting Ngrok Sync..."
  nohup npm run watch-ngrok >> "$LOG_FILE" 2>&1 &
  WATCH_PID=$!
  echo $WATCH_PID >> "$PID_FILE"

  # Start Electron in development mode (foreground for window to appear)
  echo "   - Starting Electron..."
  npm run electron-dev &
  ELECTRON_PID=$!
  echo $ELECTRON_PID >> "$PID_FILE"

  # Cloudflare Tunnel for Ollama
  if command -v cloudflared &> /dev/null && [ "$USE_CLOUDFLARED_TUNNEL" = "1" ]; then
    echo "   - Starting Cloudflare Tunnel..."
    nohup cloudflared tunnel --url http://localhost:11434 --metrics localhost:49589 > "$PROJECT_DIR/.cloudflared.log" 2>&1 &
    CF_PID=$!
    echo $CF_PID >> "$PID_FILE"
    
    # Wait for URL and Update Env
    (
      for i in {1..20}; do
        if grep -q "trycloudflare.com" "$PROJECT_DIR/.cloudflared.log"; then
          CF_URL=$(grep -o 'https://[^ ]*\.trycloudflare.com' "$PROJECT_DIR/.cloudflared.log" | tail -1)
          if [ -n "$CF_URL" ]; then
            echo "   ✅ Cloudflare Tunnel Active: $CF_URL"
            if [ "$SYNC_CLOUDFLARED_URL" = "1" ]; then
              if grep -q "OLLAMA_BASE_URL=" "$PROJECT_DIR/.env.local"; then
                sed -i "s|OLLAMA_BASE_URL=.*|OLLAMA_BASE_URL=$CF_URL|" "$PROJECT_DIR/.env.local"
              else
                echo "OLLAMA_BASE_URL=$CF_URL" >> "$PROJECT_DIR/.env.local"
              fi
            fi
          fi
          break
        fi
        sleep 1
      done
    ) &
  fi
  
  echo "✅ Poseidon is running!"
  echo "   - App: http://localhost:1998"
}

case "$1" in
  start)
    if [ -f "$PID_FILE" ]; then
      echo "⚠️  Poseidon seems to be running. Use 'restart'."
    else
      start_processes
    fi
    ;;  stop)
    stop_processes
    ;;  restart)
    stop_processes
    start_processes
    ;;  *)
    echo "Usage: $0 {start|stop|restart}"
    exit 1
    ;;esac
