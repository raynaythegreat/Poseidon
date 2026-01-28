#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SVG_SOURCE="${ROOT_DIR}/public/trident.svg"

if [[ ! -f "${SVG_SOURCE}" ]]; then
  echo "Missing ${SVG_SOURCE}" >&2
  exit 1
fi

if ! command -v rsvg-convert >/dev/null 2>&1; then
  echo "Missing rsvg-convert (needed to render SVG -> PNG)." >&2
  exit 1
fi

TMP_DIR="$(mktemp -d)"
cleanup() { rm -rf "${TMP_DIR}"; }
trap cleanup EXIT

BASE_PNG="${TMP_DIR}/icon-1024.png"
# Force an opaque render (RGB) so iconutil accepts the iconset.
rsvg-convert -b "#050D14" -w 1024 -h 1024 "${SVG_SOURCE}" -o "${BASE_PNG}"

# Update PNG icons used by Electron Builder (win/linux + app resources)
cp "${BASE_PNG}" "${ROOT_DIR}/build/icon.png"
cp "${BASE_PNG}" "${ROOT_DIR}/public/icon.png"

echo "Generated:"
echo "- ${ROOT_DIR}/public/icon.png"
echo "- ${ROOT_DIR}/build/icon.png"
