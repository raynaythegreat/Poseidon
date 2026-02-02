#!/bin/bash
# Wrapper script to kill existing Poseidon processes before launching

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Kill the electron process specifically (not this wrapper)
pgrep -f "Poseidon/poseidon " | xargs -r kill -9 2>/dev/null || true

# Kill any dev server on port 1998
fuser -k 1998/tcp 2>/dev/null || true

# Wait a moment for processes to terminate
sleep 2

# Check if port 1998 is still in use and force kill if needed
if command -v ss >/dev/null 2>&1; then
    PORT_PID=$(ss -tlnp 2>/dev/null | grep 1998 | grep -oP 'pid=\K\d+' | head -1 || true)
    if [ -n "$PORT_PID" ]; then
        kill -9 "$PORT_PID" 2>/dev/null || true
        sleep 1
    fi
fi

# Start the actual app
exec "$SCRIPT_DIR/poseidon" "$@"
