#!/bin/bash
# After install script to set up the poseidon wrapper

set -e

# Remove tsconfig.json to prevent Next.js from trying to use TypeScript
# The production build doesn't need TypeScript
rm -f /opt/Poseidon/resources/app/tsconfig.json

# Fix permissions on the app directory
# Allow the app to write temporary files
chmod -R u+w /opt/Poseidon/resources/app/

# Install the wrapper script
cat > /opt/Poseidon/poseidon-wrapper.sh << 'WRAPPER_EOF'
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
