#!/bin/bash
# Wrapper script to kill existing Poseidon processes before launching

echo "Checking for existing Poseidon processes..."

# Kill any existing poseiden processes
pkill -9 poseidon 2>/dev/null

# Kill any dev server on port 1998
fuser -k 1998/tcp 2>/dev/null

# Wait a moment for processes to terminate
sleep 1

# Check if port 1998 is still in use and force kill if needed
if ss -tlnp 2>/dev/null | grep -q 1998; then
    echo "Port 1998 still in use, finding and killing process..."
    PORT_PID=$(ss -tlnp 2>/dev/null | grep 1998 | grep -oP 'pid=\K\d+' | head -1)
    if [ -n "$PORT_PID" ]; then
        kill -9 "$PORT_PID" 2>/dev/null
    fi
    sleep 1
fi

echo "Starting Poseidon..."
exec /opt/Poseidon/poseidon "$@"
