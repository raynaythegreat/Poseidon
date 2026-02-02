# Poseidon AI - Uninstallation Script (Windows)
# This script removes Poseidon from your system

$ErrorActionPreference = "Stop"

Write-Host "🔱 Poseidon AI - Uninstallation" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

$installDir = "$env:USERPROFILE\Poseidon"

# Check if Poseidon is installed
if (-not (Test-Path $installDir)) {
    Write-Host "⚠️  Poseidon is not installed at $installDir" -ForegroundColor Yellow
    Write-Host "Nothing to uninstall."
    exit 0
}

Write-Host "This will remove Poseidon from your system."
Write-Host ""
Write-Host "Install location: $installDir"
Write-Host ""
$response = Read-Host "Continue with uninstall? (y/n)"
if ($response -ne 'y') {
    Write-Host "Uninstallation cancelled."
    exit 0
}

# Stop any running processes
Write-Host ""
Write-Host "🛑 Stopping any running Poseidon processes..." -ForegroundColor Cyan

if (Test-Path "$installDir\poseidon.sh") {
    Set-Location $installDir
    & bash poseidon.sh stop 2>$null
}

# Kill remaining processes
Get-Process | Where-Object {
    $_.ProcessName -like "*Poseidon*" -or
    $_.MainWindowTitle -like "*Poseidon*"
} | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "✓ Processes stopped" -ForegroundColor Green

# Remove desktop shortcuts
Write-Host ""
Write-Host "🗑️  Removing desktop shortcuts..." -ForegroundColor Cyan

$desktopShortcut = "$env:USERPROFILE\Desktop\Poseidon.lnk"
if (Test-Path $desktopShortcut) {
    Remove-Item $desktopShortcut -Force
    Write-Host "✓ Desktop shortcut removed" -ForegroundColor Green
}

$startMenuShortcut = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Poseidon.lnk"
if (Test-Path $startMenuShortcut) {
    Remove-Item $startMenuShortcut -Force
    Write-Host "✓ Start Menu shortcut removed" -ForegroundColor Green
}

# Remove Poseidon directory
Write-Host ""
Write-Host "🗑️  Removing Poseidon directory..." -ForegroundColor Cyan
Remove-Item -Recurse -Force $installDir
Write-Host "✓ Removed $installDir" -ForegroundColor Green

# Ask about configuration
Write-Host ""
$configFile = "$env:USERPROFILE\.env.local"
if (Test-Path $configFile) {
    $content = Get-Content $configFile -Raw
    if ($content -match "POSEISON|CLAUDE_API_KEY|OPENAI_API_KEY") {
        Write-Host "⚠️  Configuration file found at $configFile" -ForegroundColor Yellow
        $response = Read-Host "Remove configuration entries too? (y/n)"
        if ($response -eq 'y') {
            Copy-Item $configFile "$configFile.backup"
            # Remove Poseidon-related entries
            $newContent = $content -replace "(?m)^.*(POSEISON|CLAUDE_API_KEY|OPENAI_API_KEY|GOOGLE_API_KEY|GLM_API_KEY|GROQ_API_KEY|OPENROUTER_API_KEY|FIREWORKS_API_KEY|OLLAMA_BASE_URL|GITHUB_TOKEN)=.*`r`n", ""
            Set-Content -Path $configFile -Value $newContent
            Write-Host "✓ Configuration entries removed (backup saved)" -ForegroundColor Green
        }
    }
}

# Remove from PATH
Write-Host ""
$regPath = "HKCU:\Environment"
try {
    $currentPath = (Get-ItemProperty -Path $regPath -Name Path -ErrorAction SilentlyContinue).Path
    if ($currentPath -and $currentPath -like "*Poseidon*") {
        Write-Host "🔧 Removing Poseidon from user PATH..." -ForegroundColor Cyan
        $newPath = $currentPath -replace [regex]::Escape(";$installDir"), ""
        Set-ItemProperty -Path $regPath -Name Path -Value $newPath
        Write-Host "✓ Removed from PATH (restart your terminal for changes to take effect)" -ForegroundColor Green
    }
} catch {
    # Silently continue if PATH update fails
}

Write-Host ""
Write-Host "✅ Uninstallation Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Poseidon has been removed from your system."
Write-Host ""
Write-Host "Note: If you want to completely remove all traces:"
Write-Host "  - Check $HOME\.poseidon.log for any logs"
Write-Host "  - Check $HOME\.poseidon.pids for any PID files"
Write-Host "  - Empty your Recycle Bin"
Write-Host ""
