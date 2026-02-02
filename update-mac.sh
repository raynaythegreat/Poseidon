#!/bin/bash

# Poseidon AI - Update Script (macOS)
# This script updates Poseidon to the latest version from GitHub

set -e

echo "🔱 Poseidon AI - Update to Latest Version"
echo "=========================================="
echo ""

# Detect macOS
if [ "$(uname)" != "Darwin" ]; then
    echo "❌ This script is for macOS only"
    exit 1
fi

INSTALL_DIR="$HOME/Poseidon"

# Check if Poseidon is installed
if [ ! -d "$INSTALL_DIR" ]; then
    echo "❌ Poseidon is not installed at $INSTALL_DIR"
    echo ""
    echo "Please install first:"
    echo "  curl -fsSL https://raw.githubusercontent.com/raynaythegreat/Poseidon/main/install-mac.sh | bash"
    exit 1
fi

cd "$INSTALL_DIR"

# Show current version
echo "📌 Current version:"
if [ -f package.json ]; then
    grep '"version"' package.json | head -1
fi

echo ""
echo "🔄 Checking for updates..."

# Save current commit
CURRENT_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")

# Fetch latest changes
echo "   Fetching latest from GitHub..."
git fetch origin main

# Get latest commit
LATEST_COMMIT=$(git rev-parse origin/main)

# Check if update is needed
if [ "$CURRENT_COMMIT" = "$LATEST_COMMIT" ]; then
    echo ""
    echo "✅ Already up to date!"
    echo ""
    echo "Current commit: $(git log -1 --format='%h - %s')"
    echo ""
    exit 0
fi

# Show what's new
echo ""
echo "📦 Updates available:"
git log --oneline $CURRENT_COMMIT..origin/main | head -5

echo ""
# Read from terminal when piped
read -p "Update to latest version? (y/n) " REPLY < /dev/tty
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Update cancelled."
    exit 0
fi

echo ""
echo "🚀 Updating Poseidon..."

# Stop running processes
echo "   - Stopping Poseidon..."
./poseidon.sh stop 2>/dev/null || true

# Pull latest changes
echo "   - Downloading latest code..."
git reset --hard origin/main

# Install updated dependencies
echo "   - Installing dependencies..."
npm ci

# Rebuild production app
echo "   - Rebuilding for production..."
npm run build

# Rebuild Electron app
echo "   - Rebuilding Electron app..."
npm run dist:mac

# Make scripts executable
chmod +x poseidon.sh
chmod +x uninstall-mac.sh

echo ""
echo "✅ Update Complete!"
echo ""

# Show new version
echo "📌 New version:"
grep '"version"' package.json | head -1

echo ""
echo "🚀 Starting Poseidon..."

# Find and launch the built .app
if [ -d "dist/Poseidon.app" ]; then
    open "dist/Poseidon.app" &
    sleep 3

    echo ""
    echo "✨ Poseidon has been updated and restarted!"
else
    echo ""
    echo "⚠️  Built app not found. Starting with npm..."
    npm run electron &
fi

echo ""
echo "📖 What's new:"
git log --oneline --graph --decorate $CURRENT_COMMIT..HEAD | head -5
echo ""
