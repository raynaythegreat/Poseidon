#!/bin/bash

# Poseidon AI - Uninstallation Script
# This script removes Poseidon from your system

set -e

echo "🔱 Poseidon AI - Uninstallation"
echo "================================="
echo ""

# Check if Poseidon directory exists
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
read -p "Continue with uninstall? (y/n) " REPLY < /dev/tty
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

# Remove desktop entry
echo ""
echo "🗑️  Removing desktop shortcuts..."

if [ -f ~/.local/share/applications/poseidon.desktop ]; then
    rm -f ~/.local/share/applications/poseidon.desktop
    echo "✓ Desktop entry removed"
fi

# Update desktop database
if command -v update-desktop-database &> /dev/null; then
    update-desktop-database ~/.local/share/applications 2>/dev/null || true
    echo "✓ Application menu updated"
fi

# Remove Poseidon directory
echo ""
echo "🗑️  Removing Poseidon directories..."
rm -rf "$INSTALL_DIR"
echo "✓ Removed $INSTALL_DIR"

# Remove alternate clone locations
rm -rf "$HOME/poseidon" 2>/dev/null || true
rm -rf "$HOME/.poseidon" 2>/dev/null || true

# Remove config directories
rm -rf "$HOME/.config/poseidon" 2>/dev/null || true
rm -rf "$HOME/.config/superpowers/conversation-archive/-home-*-Poseidon" 2>/dev/null || true

# Remove cache directories
rm -rf "$HOME/.cache/claude-cli-nodejs/-home-*-Poseidon" 2>/dev/null || true
rm -rf "$HOME/.claude/projects/-home-*-Poseidon" 2>/dev/null || true

# Clean up leftover log and PID files
echo ""
echo "🧹 Cleaning up leftover files..."
rm -f "$HOME/.poseidon.log" "$HOME/.poseidon.pids" "$HOME/.poseidon.log.old" 2>/dev/null || true
echo "✓ Config, cache, and log files removed"

# Ask about configuration files
echo ""
CONFIG_FILE="$HOME/.env.local"
if [ -f "$CONFIG_FILE" ] && grep -q "POSEIDON\|CLAUDE_API_KEY\|OPENAI_API_KEY" "$CONFIG_FILE" 2>/dev/null; then
    echo "⚠️  Configuration file found at $CONFIG_FILE"
    read -p "Remove configuration file too? (y/n) " REPLY < /dev/tty
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Backup and remove Poseidon-related entries
        cp "$CONFIG_FILE" "$CONFIG_FILE.backup" 2>/dev/null || true
        sed -i.backup '/POSEISON/d; /CLAUDE_API_KEY/d; /OPENAI_API_KEY/d; /GOOGLE_API_KEY/d; /GLM_API_KEY/d; /GROQ_API_KEY/d; /OPENROUTER_API_KEY/d; /FIREWORKS_API_KEY/d; /OLLAMA_BASE_URL/d; /GITHUB_TOKEN/d' "$CONFIG_FILE" 2>/dev/null || true
        echo "✓ Configuration entries removed (backup saved)"
    fi
fi

# Remove from PATH if added
SHELL_RC=""
if [ -n "$ZSH_VERSION" ]; then
    SHELL_RC="$HOME/.zshrc"
else
    SHELL_RC="$HOME/.bashrc"
fi

if grep -q "Poseidon" "$SHELL_RC" 2>/dev/null; then
    echo ""
    echo "🔧 Removing Poseidon from PATH in $SHELL_RC..."
    sed -i.backup '/Poseidon/d' "$SHELL_RC" 2>/dev/null || true
    echo "✓ Removed from PATH"
    echo "  Please run: source $SHELL_RC"
fi

echo ""
echo "✅ Uninstallation Complete!"
echo ""
echo "Poseidon has been removed from your system."
echo ""
