#!/bin/bash
# After install script to set up the poseidon wrapper

set -e

# Install the wrapper script
cat > /opt/Poseidon/poseidon-wrapper.sh << 'WRAPPER_EOF'
#!/bin/bash
# Wrapper script to kill existing Poseidon processes before launching

# Kill any existing poseiden processes
pkill -9 poseidon 2>/dev/null || true

# Kill any dev server on port 1998
fuser -k 1998/tcp 2>/dev/null || true

# Wait a moment for processes to terminate
sleep 1

# Check if port 1998 is still in use and force kill if needed
if command -v ss >/dev/null 2>&1 && ss -tlnp 2>/dev/null | grep -q 1998; then
    PORT_PID=$(ss -tlnp 2>/dev/null | grep 1998 | grep -oP 'pid=\K\d+' | head -1)
    if [ -n "$PORT_PID" ]; then
        kill -9 "$PORT_PID" 2>/dev/null || true
    fi
    sleep 1
fi

# Start the actual app
exec /opt/Poseidon/poseidon "$@"
WRAPPER_EOF

chmod +x /opt/Poseidon/poseidon-wrapper.sh

# Update the desktop entry to use the wrapper
if [ -f /usr/share/applications/poseidon.desktop ]; then
    sed -i 's|^Exec=.*|Exec=/opt/Poseidon/poseidon-wrapper.sh %U|' /usr/share/applications/poseidon.desktop
fi

# Update desktop database
if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database /usr/share/applications || true
fi

exit 0
