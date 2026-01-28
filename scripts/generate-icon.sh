#!/bin/bash

# Generate a new Poseidon trident icon from SVG
# This script uses iconutil (macOS built-in) to create .icns from PNG files

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ICONSET_DIR="$SCRIPT_DIR/icon.iconset"
SOURCE_SVG="$PROJECT_DIR/icons/trident.svg"
ICNS_OUTPUT="$PROJECT_DIR/icon.icns"

echo "🔱 Generating Poseidon trident icon..."

# Create iconset directory
mkdir -p "$ICONSET_DIR"

# Check if rsvg-convert is available (for SVG to PNG conversion)
if command -v rsvg-convert &> /dev/null; then
    echo "Using rsvg-convert for SVG to PNG conversion..."

    # Generate all required sizes for macOS icon
    rsvg-convert -w 16 -h 16 "$SOURCE_SVG" -o "$ICONSET_DIR/icon_16x16.png"
    rsvg-convert -w 32 -h 32 "$SOURCE_SVG" -o "$ICONSET_DIR/icon_16x16@2x.png"
    rsvg-convert -w 32 -h 32 "$SOURCE_SVG" -o "$ICONSET_DIR/icon_32x32.png"
    rsvg-convert -w 64 -h 64 "$SOURCE_SVG" -o "$ICONSET_DIR/icon_32x32@2x.png"
    rsvg-convert -w 128 -h 128 "$SOURCE_SVG" -o "$ICONSET_DIR/icon_128x128.png"
    rsvg-convert -w 256 -h 256 "$SOURCE_SVG" -o "$ICONSET_DIR/icon_128x128@2x.png"
    rsvg-convert -w 256 -h 256 "$SOURCE_SVG" -o "$ICONSET_DIR/icon_256x256.png"
    rsvg-convert -w 512 -h 512 "$SOURCE_SVG" -o "$ICONSET_DIR/icon_256x256@2x.png"
    rsvg-convert -w 512 -h 512 "$SOURCE_SVG" -o "$ICONSET_DIR/icon_512x512.png"
    rsvg-convert -w 1024 -h 1024 "$SOURCE_SVG" -o "$ICONSET_DIR/icon_512x512@2x.png"

elif command -v convert &> /dev/null; then
    echo "Using ImageMagick convert for SVG to PNG conversion..."

    # Generate all required sizes using ImageMagick
    convert -background none -resize 16x16 "$SOURCE_SVG" "$ICONSET_DIR/icon_16x16.png"
    convert -background none -resize 32x32 "$SOURCE_SVG" "$ICONSET_DIR/icon_16x16@2x.png"
    convert -background none -resize 32x32 "$SOURCE_SVG" "$ICONSET_DIR/icon_32x32.png"
    convert -background none -resize 64x64 "$SOURCE_SVG" "$ICONSET_DIR/icon_32x32@2x.png"
    convert -background none -resize 128x128 "$SOURCE_SVG" "$ICONSET_DIR/icon_128x128.png"
    convert -background none -resize 256x256 "$SOURCE_SVG" "$ICONSET_DIR/icon_128x128@2x.png"
    convert -background none -resize 256x256 "$SOURCE_SVG" "$ICONSET_DIR/icon_256x256.png"
    convert -background none -resize 512x512 "$SOURCE_SVG" "$ICONSET_DIR/icon_256x256@2x.png"
    convert -background none -resize 512x512 "$SOURCE_SVG" "$ICONSET_DIR/icon_512x512.png"
    convert -background none -resize 1024x1024 "$SOURCE_SVG" "$ICONSET_DIR/icon_512x512@2x.png"
else
    echo "⚠️  Neither rsvg-convert nor ImageMagick found."
    echo "Please install one of them:"
    echo "  brew install librsvg"
    echo "  or"
    echo "  brew install imagemagick"
    exit 1
fi

# Create .icns file using iconutil
echo "Creating .icns file..."
iconutil -c icns "$ICONSET_DIR" -o "$ICNS_OUTPUT"

# Clean up iconset
rm -rf "$ICONSET_DIR"

echo "✅ Icon generated at $ICNS_OUTPUT"
