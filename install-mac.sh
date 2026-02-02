#!/bin/bash

# Poseidon AI - macOS Installation Script
# This script installs Poseidon for production use on macOS systems

set -e

echo "🔱 Poseidon AI - Production Installation"
echo "========================================="
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please don't run this script as root (without sudo)"
    exit 1
fi

# Detect macOS version
if [ "$(uname)" != "Darwin" ]; then
    echo "❌ This script is for macOS only"
    exit 1
fi

MACOS_VERSION=$(sw_vers -productVersion)
echo "✓ Detected macOS: $MACOS_VERSION"

# Check for required commands
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed"
        return 1
    fi
    return 0
}

# Install Homebrew if not present
if ! check_command brew; then
    echo ""
    echo "📦 Homebrew not found. Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    # Add Homebrew to PATH for Apple Silicon Macs
    if [ "$(uname -m)" = "arm64" ]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
fi

# Install dependencies if needed
echo ""
echo "📦 Checking system dependencies..."

if ! check_command node || ! check_command npm; then
    echo ""
    echo "Node.js is not installed. Installing Node.js LTS..."

    brew install node

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
    brew install git
fi

# Install Poseidon
echo ""
echo "🚀 Installing Poseidon AI..."

INSTALL_DIR="$HOME/Poseidon"

if [ -d "$INSTALL_DIR" ]; then
    echo "⚠️  Directory 'Poseidon' already exists at $INSTALL_DIR"
    read -p "Remove and reinstall? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$INSTALL_DIR"
    else
        echo "Installation cancelled."
        exit 0
    fi
fi

# Clone the repository (fetch latest main branch)
git clone -b main --single-branch https://github.com/raynaythegreat/Poseidon.git "$INSTALL_DIR"

cd "$INSTALL_DIR"

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

# Build production Electron app
echo ""
echo "📦 Building production Electron app..."
npm run dist:mac

# Create .app bundle for macOS
echo ""
echo "🖥️  Creating Poseidon.app bundle..."

APP_DIR="$INSTALL_DIR/Poseidon.app"
CONTENTS_DIR="$APP_DIR/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"
RESOURCES_DIR="$CONTENTS_DIR/Resources"

# Create .app structure
mkdir -p "$MACOS_DIR"
mkdir -p "$RESOURCES_DIR"

# Create Info.plist
cat > "$CONTENTS_DIR/Info.plist" <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>poseidon-launcher</string>
    <key>CFBundleIdentifier</key>
    <string>com.poseidon.app</string>
    <key>CFBundleName</key>
    <string>Poseidon</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>LSUIElement</key>
    <false/>
</dict>
</plist>
EOF

# Create launcher script
cat > "$MACOS_DIR/poseidon-launcher" <<EOF
#!/bin/bash
cd "$INSTALL_DIR"
./poseidon.sh start
EOF

chmod +x "$MACOS_DIR/poseidon-launcher"

# Copy icon if available
if [ -f "$INSTALL_DIR/build/icon.png" ]; then
    cp "$INSTALL_DIR/build/icon.png" "$RESOURCES_DIR/app.icns"
    # Convert to icns if sips is available
    if command -v sips &> /dev/null; then
        mkdir -p "$RESOURCES_DIR/icon.iconset"
        sips -z 16 16     "$INSTALL_DIR/build/icon.png" --out "$RESOURCES_DIR/icon.iconset/icon_16x16.png" &>/dev/null || true
        sips -z 32 32     "$INSTALL_DIR/build/icon.png" --out "$RESOURCES_DIR/icon.iconset/icon_16x16@2x.png" &>/dev/null || true
        sips -z 32 32     "$INSTALL_DIR/build/icon.png" --out "$RESOURCES_DIR/icon.iconset/icon_32x32.png" &>/dev/null || true
        sips -z 64 64     "$INSTALL_DIR/build/icon.png" --out "$RESOURCES_DIR/icon.iconset/icon_32x32@2x.png" &>/dev/null || true
        sips -z 128 128   "$INSTALL_DIR/build/icon.png" --out "$RESOURCES_DIR/icon.iconset/icon_128x128.png" &>/dev/null || true
        sips -z 256 256   "$INSTALL_DIR/build/icon.png" --out "$RESOURCES_DIR/icon.iconset/icon_128x128@2x.png" &>/dev/null || true
        sips -z 256 256   "$INSTALL_DIR/build/icon.png" --out "$RESOURCES_DIR/icon.iconset/icon_256x256.png" &>/dev/null || true
        sips -z 512 512   "$INSTALL_DIR/build/icon.png" --out "$RESOURCES_DIR/icon.iconset/icon_256x256@2x.png" &>/dev/null || true
        sips -z 512 512   "$INSTALL_DIR/build/icon.png" --out "$RESOURCES_DIR/icon.iconset/icon_512x512.png" &>/dev/null || true
        iconutil -c icns "$RESOURCES_DIR/icon.iconset" -o "$RESOURCES_DIR/app.icns" 2>/dev/null || rm -rf "$RESOURCES_DIR/icon.iconset"
    fi
fi

echo "✓ Poseidon.app bundle created"

# Make scripts executable
chmod +x "$INSTALL_DIR/poseidon.sh"
chmod +x "$INSTALL_DIR/install-mac.sh"

echo ""
echo "✅ Production Installation Complete!"
echo ""
echo "🚀 Starting Poseidon production app..."

# Find and launch the built .app
cd "$INSTALL_DIR"
DMG_APP=$(ls dist/*.dmg 2>/dev/null | head -1)

if [ -d "dist/Poseidon.app" ]; then
    open "dist/Poseidon.app" &
    sleep 3

    echo ""
    echo "✨ Poseidon desktop app is now running!"
    echo ""
    echo "   The production Electron app has launched"
    echo ""
    echo "   To start again: open ~/Poseidon/Poseidon.app"
    echo "   Or from Applications folder in Finder"
    echo ""
else
    echo ""
    echo "⚠️  Built app not found. You can start manually:"
    echo "   cd ~/Poseidon && npm run electron"
    echo ""
fi

echo "📖 For documentation and updates:"
echo "   https://github.com/raynaythegreat/Poseidon"
echo ""
