# Poseidon AI - Update Script (Windows)
# This script updates Poseidon to the latest version from GitHub

$ErrorActionPreference = "Stop"

Write-Host "🔱 Poseidon AI - Update to Latest Version" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$installDir = "$env:USERPROFILE\Poseidon"

# Check if Poseidon is installed
if (-not (Test-Path $installDir)) {
    Write-Host "❌ Poseidon is not installed at $installDir" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install first:"
    Write-Host "  irm https://raw.githubusercontent.com/raynaythegreat/Poseidon/main/install.ps1 | iex"
    exit 1
}

Set-Location $installDir

# Show current version
Write-Host "📌 Current version:" -ForegroundColor Cyan
if (Test-Path package.json) {
    Select-String -Path package.json -Pattern '"version"' | Select-Object -First 1
}

Write-Host ""
Write-Host "🔄 Checking for updates..." -ForegroundColor Cyan

# Save current commit
$currentCommit = & git rev-parse HEAD 2>$null
if (-not $currentCommit) { $currentCommit = "unknown" }

# Fetch latest changes
Write-Host "   Fetching latest from GitHub..."
& git fetch origin main

# Get latest commit
$latestCommit = & git rev-parse origin/main

# Check if update is needed
if ($currentCommit -eq $latestCommit) {
    Write-Host ""
    Write-Host "✅ Already up to date!" -ForegroundColor Green
    Write-Host ""
    $log = & git log -1 --format="%h - %s"
    Write-Host "Current commit: $log"
    Write-Host ""
    exit 0
}

# Show what's new
Write-Host ""
Write-Host "📦 Updates available:" -ForegroundColor Yellow
& git log --oneline ($currentCommit + "..origin/main") | Select-Object -First 5

Write-Host ""
# Force interactive prompt even when piped
$response = Read-Host "Update to latest version? (y/n)"
if ($response -ne 'y') {
    Write-Host "Update cancelled."
    exit 0
}

Write-Host ""
Write-Host "🚀 Updating Poseidon..." -ForegroundColor Cyan

# Stop running processes
Write-Host "   - Stopping Poseidon..."
if (Test-Path poseidon.sh) {
    & bash poseidon.sh stop 2>$null
}

# Pull latest changes
Write-Host "   - Downloading latest code..."
& git reset --hard origin/main

# Install updated dependencies
Write-Host "   - Installing dependencies..."
npm ci

# Rebuild production app
Write-Host "   - Rebuilding for production..."
npm run build

# Rebuild Electron app
Write-Host "   - Rebuilding Electron app..."
npm run dist:win

# Make scripts executable
if (Get-Command bash -ErrorAction SilentlyContinue) {
    & bash -c "chmod +x poseidon.sh uninstall.sh 2>$null || true"
}

Write-Host ""
Write-Host "✅ Update Complete!" -ForegroundColor Green
Write-Host ""

# Show new version
Write-Host "📌 New version:" -ForegroundColor Cyan
if (Test-Path package.json) {
    Select-String -Path package.json -Pattern '"version"' | Select-Object -First 1
}

Write-Host ""
Write-Host "🚀 Starting Poseidon..." -ForegroundColor Cyan

# Find and launch the built .exe
$exePath = Get-ChildItem -Path "dist" -Filter "Poseidon Setup *.exe" -ErrorAction SilentlyContinue | Select-Object -First 1

if ($exePath) {
    Start-Process -FilePath $exePath.FullName
    Write-Host ""
    Write-Host "✨ Poseidon has been updated and restarted!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠️  Built app not found. Starting with npm..." -ForegroundColor Yellow
    npm run electron
}

Write-Host ""
Write-Host "📖 What's new:" -ForegroundColor Cyan
& git log --oneline --graph --decorate ("$currentCommit" + "..HEAD") | Select-Object -First 5
Write-Host ""
