# Poseidon AI - Windows Installation Script
# This script installs Poseidon for production use on Windows systems

$ErrorActionPreference = "Stop"

Write-Host "🔱 Poseidon AI - Production Installation" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator (not recommended)
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if ($isAdmin) {
    Write-Host "⚠️  Warning: Running as administrator. Please run without admin rights for user installation." -ForegroundColor Yellow
    $response = Read-Host "Continue anyway? (y/n)"
    if ($response -ne 'y') {
        exit 0
    }
}

# Function to check if a command exists
function Test-Command {
    param($Command)
    $oldPreference = $ErrorActionPreference
    $ErrorActionPreference = "stop"
    try {
        if (Get-Command $Command) { return $true }
    }
    catch { return $false }
    finally { $ErrorActionPreference = $oldPreference }
}

# Check for Node.js
Write-Host ""
Write-Host "📦 Checking system dependencies..." -ForegroundColor Cyan

if (-not (Test-Command -Command "node")) {
    Write-Host ""
    Write-Host "Node.js is not installed. Installing Node.js LTS..." -ForegroundColor Yellow

    # Try winget first
    if (Test-Command -Command "winget") {
        winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
    } else {
        Write-Host "❌ Please install Node.js manually from https://nodejs.org/" -ForegroundColor Red
        exit 1
    }

    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

    Write-Host "✓ Node.js installed:" -ForegroundColor Green
    node --version
    npm --version
} else {
    Write-Host "✓ Node.js found:" -ForegroundColor Green
    node --version
    npm --version
}

# Check for Git
if (-not (Test-Command -Command "git")) {
    Write-Host ""
    Write-Host "Git is not installed. Installing Git..." -ForegroundColor Yellow

    if (Test-Command -Command "winget") {
        winget install Git.Git --accept-package-agreements --accept-source-agreements
    } else {
        Write-Host "❌ Please install Git manually from https://git-scm.com/download/win" -ForegroundColor Red
        exit 1
    }

    Write-Host "✓ Git installed" -ForegroundColor Green
}

# Install Poseidon
Write-Host ""
Write-Host "🚀 Installing Poseidon AI..." -ForegroundColor Cyan

$installDir = "$env:USERPROFILE\Poseidon"

if (Test-Path $installDir) {
    Write-Host "⚠️  Directory 'Poseidon' already exists at $installDir" -ForegroundColor Yellow
    $response = Read-Host "Remove and reinstall? (y/n)"
    if ($response -eq 'y') {
        Remove-Item -Recurse -Force $installDir
    } else {
        Write-Host "Installation cancelled."
        exit 0
    }
}

# Clone the repository (fetch latest main branch)
Write-Host "📥 Cloning repository..." -ForegroundColor Cyan
git clone -b main --single-branch https://github.com/raynaythegreat/Poseidon.git $installDir

# Ensure we're at the latest commit on main
Set-Location $installDir
Write-Host "📥 Fetching latest updates..." -ForegroundColor Cyan
git fetch origin main
git reset --hard origin/main
$latestCommit = git log -1 --format='%h - %s'
Write-Host "✓ Updated to latest commit: $latestCommit" -ForegroundColor Green

# Install npm dependencies
Write-Host ""
Write-Host "📚 Installing npm dependencies..." -ForegroundColor Cyan
npm ci

# Build the app for production
Write-Host ""
Write-Host "🔨 Building application for production..." -ForegroundColor Cyan
npm run build

# Build production Electron app
Write-Host ""
Write-Host "📦 Building production Electron app..." -ForegroundColor Cyan
npm run dist:win

# Create desktop shortcut
Write-Host ""
Write-Host "🖥️  Creating desktop shortcut..." -ForegroundColor Cyan

$WshShell = New-Object -ComObject WScript.Shell
$shortcutPath = "$env:USERPROFILE\Desktop\Poseidon.lnk"
$shortcut = $WshShell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "pwsh.exe"
$shortcut.Arguments = "-ExecutionPolicy Bypass -File `"$installDir\poseidon.sh`" start"
$shortcut.WorkingDirectory = $installDir
$shortcut.Description = "Poseidon AI - Development Command Center"
$shortcut.Save()

Write-Host "✓ Desktop shortcut created at $shortcutPath" -ForegroundColor Green

# Create Start Menu shortcut
$startMenuPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Poseidon.lnk"
$shortcut2 = $WshShell.CreateShortcut($startMenuPath)
$shortcut2.TargetPath = "pwsh.exe"
$shortcut2.Arguments = "-ExecutionPolicy Bypass -File `"$installDir\poseidon.sh`" start"
$shortcut2.WorkingDirectory = $installDir
$shortcut2.Description = "Poseidon AI"
$shortcut2.Save()

Write-Host "✓ Start Menu shortcut created" -ForegroundColor Green

# Add to PATH (persistent)
$regPath = "HKCU:\Environment"
$currentPath = (Get-ItemProperty -Path $regPath -Name Path -ErrorAction SilentlyContinue).Path

if ($currentPath -notlike "*Poseidon*") {
    Write-Host ""
    Write-Host "🔧 Adding Poseidon to user PATH..." -ForegroundColor Cyan

    $newPath = "$currentPath;$installDir"
    Set-ItemProperty -Path $regPath -Name Path -Value $newPath

    Write-Host "✓ Added to PATH (restart your terminal for changes to take effect)" -ForegroundColor Green
}

# Make scripts executable (for Git Bash compatibility)
git config core.fileMode false

Write-Host ""
Write-Host "✅ Production Installation Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Starting Poseidon production app..." -ForegroundColor Cyan

# Find and launch the built .exe
Set-Location $installDir
$exePath = Get-ChildItem -Path "dist" -Filter "Poseidon Setup *.exe" -ErrorAction SilentlyContinue | Select-Object -First 1

if ($exePath) {
    Start-Process -FilePath $exePath.FullName -Wait
    Write-Host ""
    Write-Host "✨ Poseidon desktop app is now running!" -ForegroundColor Green
    Write-Host ""
    Write-Host "   The production Electron app has launched"
    Write-Host ""
    Write-Host "   To start again: Run the installer from dist folder"
    Write-Host "   Or use the desktop/Start Menu shortcuts"
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "⚠️  Built app not found. You can start manually:" -ForegroundColor Yellow
    Write-Host "   cd Poseidon; npm run electron"
    Write-Host ""
}

Write-Host "📖 For documentation and updates:"
Write-Host "   https://github.com/raynaythegreat/Poseidon"
Write-Host ""
