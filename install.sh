#!/bin/bash

# Poseidon AI - Production Installation Script
# This script installs Poseidon for production use on Linux Debian systems

set -e

echo "🔱 Poseidon AI - Production Installation"
echo "========================================="
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please don't run this script as root (without sudo)"
    exit 1
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VERSION=$VERSION_ID
    echo "✓ Detected OS: $OS $VERSION"
else
    echo "❌ Cannot detect OS. This script requires Debian/Ubuntu/Linux Mint."
    exit 1
fi

# Check for required commands
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed"
        return 1
    fi
    return 0
}

# Install dependencies if needed
echo ""
echo "📦 Checking system dependencies..."

if ! check_command node || ! check_command npm; then
    echo ""
    echo "Node.js is not installed. Installing Node.js 20.x..."

    # Update package list
    sudo apt update

    # Install prerequisites
    sudo apt install -y curl ca-certificates gnupg

    # Add NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

    # Install Node.js
    sudo apt install -y nodejs

    echo "✓ Node.js installed:"
    node --version
    npm --version
else
    echo "✓ Node.js found:"
    node --version
    npm --version
fi

# Check if git is installed
if ! check_command git; then
    echo ""
    echo "Installing Git..."
    sudo apt install -y git
fi

# Install Poseidon
echo ""
echo "🚀 Installing Poseidon AI..."

if [ -d "Poseidon" ]; then
    echo "⚠️  Directory 'Poseidon' already exists."
    read -p "Remove and reinstall? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf Poseidon
    else
        echo "Installation cancelled."
        exit 0
    fi
fi

# Clone the repository (fetch latest main branch)
git clone -b main --single-branch https://github.com/raynaythegreat/Poseidon.git
cd Poseidon

# Ensure we're at the latest commit on main
echo "📥 Fetching latest updates..."
git fetch origin main
git reset --hard origin/main
echo "✓ Updated to latest commit: $(git log -1 --format='%h - %s')"

# Install npm dependencies
echo ""
echo "📚 Installing npm dependencies..."
npm ci --production=false

# Build the app for production
echo ""
echo "🔨 Building application for production..."
npm run build

# Create desktop entry for easy launch
echo ""
echo "🖥️  Creating desktop shortcut..."

mkdir -p ~/.local/share/applications

cat > ~/.local/share/applications/poseidon.desktop <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Poseidon AI
Comment=AI-powered development command center
Exec=$HOME/Poseidon/poseidon.sh start
Icon=$HOME/Poseidon/build/icon.png
Terminal=false
Categories=Development;IDE;
StartupNotify=true
StartupWMClass=poseidon
EOF

chmod +x ~/.local/share/applications/poseidon.desktop
echo "✓ Desktop shortcut created"

# Update desktop database so the app appears in application menu
if command -v update-desktop-database &> /dev/null; then
    update-desktop-database ~/.local/share/applications 2>/dev/null || true
    echo "✓ Application menu updated"
fi

# Add to PATH if not already there
SHELL_RC=""
if [ -n "$ZSH_VERSION" ]; then
    SHELL_RC="$HOME/.zshrc"
else
    SHELL_RC="$HOME/.bashrc"
fi

if ! grep -q "Poseidon" "$SHELL_RC" 2>/dev/null; then
    echo ""
    echo "🔧 Adding Poseidon to PATH..."
    echo "" >> "$SHELL_RC"
    echo "# Poseidon AI" >> "$SHELL_RC"
    echo "export PATH=\"\$HOME/Poseidon:\$PATH\"" >> "$SHELL_RC"
    echo "✓ Added to PATH in $SHELL_RC"
    echo "  Please run: source $SHELL_RC"
fi

# Make scripts executable
chmod +x poseidon.sh
chmod +x install.sh

echo ""
echo "✅ Production Installation Complete!"
echo ""
echo "🚀 Starting Poseidon..."

# Start Poseidon in background, redirect to log
cd "$HOME/Poseidon"
./poseidon.sh start

# Wait a moment for server to start
sleep 3

echo ""
echo "✨ Poseidon desktop app is now running!"
echo ""
echo "   The Electron window should have opened automatically"
echo ""
echo "   To stop: ./poseidon.sh stop"
echo "   To restart: ./poseidon.sh restart"
echo ""
echo "📖 For documentation and updates:"
echo "   https://github.com/raynaythegreat/Poseidon"
echo ""
echo "💡 Tip: You can also launch Poseidon from your application menu!"
echo ""

