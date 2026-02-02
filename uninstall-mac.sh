#!/bin/bash

# Poseidon AI - Uninstallation Script (macOS)
# This script removes Poseidon from your system

set -e

echo "🔱 Poseidon AI - Uninstallation"
echo "================================="
echo ""

# Detect macOS
if [ "$(uname)" != "Darwin" ]; then
    echo "❌ This script is for macOS only"
    exit 1
fi

INSTALL_DIR="$HOME/Poseidon"

if [ ! -d "$INSTALL_DIR" ]; then
    echo "⚠️  Poseidon is not installed at $INSTALL_DIR"
    echo "Nothing to uninstall."
    exit 0
fi

echo "This will remove Poseidon from your system."
echo ""
echo "Install location: $INSTALL_DIR"
echo ""
read -p "Continue with uninstall? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Uninstallation cancelled."
    exit 0
fi

echo ""
echo "🛑 Stopping any running Poseidon processes..."

# Stop Poseidon if running
if [ -f "$INSTALL_DIR/poseidon.sh" ]; then
    cd "$INSTALL_DIR"
    ./poseidon.sh stop 2>/dev/null || true
fi

# Kill any remaining processes
pkill -f "Poseidon" 2>/dev/null || true
pkill -f "electron.*Poseidon" 2>/dev/null || true

echo "✓ Processes stopped"

# Remove .app bundle from Applications
echo ""
echo "🗑️  Removing app bundle..."

if [ -d "/Applications/Poseidon.app" ]; then
    rm -rf "/Applications/Poseidon.app"
    echo "✓ Removed Poseidon.app from Applications"
fi

# Remove locally built .app
if [ -d "$INSTALL_DIR/Poseidon.app" ]; then
    rm -rf "$INSTALL_DIR/Poseidon.app"
    echo "✓ Removed local Poseidon.app"
fi

# Remove Poseidon directory
echo ""
echo "🗑️  Removing Poseidon directory..."
rm -rf "$INSTALL_DIR"
echo "✓ Removed $INSTALL_DIR"

# Ask about configuration files
echo ""
CONFIG_FILE="$HOME/.env.local"
if [ -f "$CONFIG_FILE" ] && grep -q "POSEISON\|CLAUDE_API_KEY\|OPENAI_API_KEY" "$CONFIG_FILE" 2>/dev/null; then
    echo "⚠️  Configuration file found at $CONFIG_FILE"
    read -p "Remove configuration file too? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp "$CONFIG_FILE" "$CONFIG_FILE.backup" 2>/dev/null || true
        sed -i.bak '/POSEISON/d; /CLAUDE_API_KEY/d; /OPENAI_API_KEY/d; /GOOGLE_API_KEY/d; /GLM_API_KEY/d; /GROQ_API_KEY/d; /OPENROUTER_API_KEY/d; /FIREWORKS_API_KEY/d; /OLLAMA_BASE_URL/d; /GITHUB_TOKEN/d' "$CONFIG_FILE" 2>/dev/null || true
        rm -f "$CONFIG_FILE.bak"
        echo "✓ Configuration entries removed"
    fi
fi

# Remove from PATH if added
SHELL_RC=""
if [ -n "$ZSH_VERSION" ]; then
    SHELL_RC="$HOME/.zshrc"
else
    SHELL_RC="$HOME/.bash_profile"
fi

if grep -q "Poseidon" "$SHELL_RC" 2>/dev/null; then
    echo ""
    echo "🔧 Removing Poseidon from PATH in $SHELL_RC..."
    sed -i.bak '/Poseidon/d' "$SHELL_RC" 2>/dev/null || true
    rm -f "$SHELL_RC.bak"
    echo "✓ Removed from PATH"
    echo "  Please run: source $SHELL_RC"
fi

echo ""
echo "✅ Uninstallation Complete!"
echo ""
echo "Poseidon has been removed from your system."
echo ""
echo "Note: If you want to completely remove all traces:"
echo "  - Check $HOME/.poseidon.log for any logs"
echo "  - Check $HOME/.poseidon.pids for any PID files"
echo "  - Empty your Trash if you dragged Poseidon there"
echo ""
