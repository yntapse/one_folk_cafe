<# 
.SYNOPSIS
    Builds One Folk Cafe Desktop App and creates client-ready distribution package
.DESCRIPTION
    This script builds the Tauri app and packages the MSI installer with helper scripts
    into a ZIP file ready for non-technical clients.
#>

param(
    [string]$OutputDir = "dist-client"
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  One Folk Cafe - Distribution Builder" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js not found. Install from https://nodejs.org/"
    exit 1
}

if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
    Write-Error "Rust not found. Install from https://rustup.rs/"
    exit 1
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm not found. Should come with Node.js"
    exit 1
}

Write-Host "✓ Node.js: $(node --version)" -ForegroundColor Green
Write-Host "✓ Rust: $(rustc --version)" -ForegroundColor Green
Write-Host "✓ npm: $(npm --version)" -ForegroundColor Green
Write-Host ""

# Install dependencies
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing Node.js dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) { Write-Error "npm install failed"; exit 1 }
}

# Build the app
Write-Host "" -ForegroundColor Yellow
Write-Host "Building production bundle..." -ForegroundColor Yellow
npm run tauri:build
if ($LASTEXITCODE -ne 0) { Write-Error "tauri:build failed"; exit 1 }

# Find MSI
$msiPath = Get-ChildItem "src-tauri\target\release\bundle\msi" -Filter "*.msi" | Select-Object -First 1
if (-not $msiPath) {
    Write-Error "MSI installer not found in src-tauri\target\release\bundle\msi"
    exit 1
}

Write-Host "✓ Found MSI: $($msiPath.FullName)" -ForegroundColor Green

# Create distribution folder
$version = (Get-Content package.json | ConvertFrom-Json).version
$appName = "One-Folk-Cafe-Admin-v${version}-Windows"
$distPath = Join-Path $OutputDir $appName

Write-Host "" -ForegroundColor Yellow
Write-Host "Creating client distribution package..." -ForegroundColor Yellow

if (Test-Path $OutputDir) { Remove-Item $OutputDir -Recurse -Force }
New-Item -ItemType Directory -Path $distPath | Out-Null

# Copy MSI
Copy-Item $msiPath.FullName (Join-Path $distPath "One-Folk-Cafe-Admin-Setup.msi")

# Create README.txt
$readme = @"
========================================
One Folk Cafe - Admin Panel Installer
========================================

VERSION: $version
DATE: $(Get-Date -Format "yyyy-MM-dd")

----------------------------------------
SYSTEM REQUIREMENTS
----------------------------------------
- Windows 10 or Windows 11 (64-bit)
- 4 GB RAM minimum (8 GB recommended)
- 500 MB free disk space
- No internet connection required after installation
- No additional software needed (Java, Python, Node.js, etc.)

----------------------------------------
INSTALLATION INSTRUCTIONS
----------------------------------------

METHOD 1: Double-click Installer (Recommended)
----------------------------------------------
1. Extract this ZIP file to a folder (e.g., Desktop)
2. Open the extracted folder
3. Double-click "One-Folk-Cafe-Admin-Setup.msi"
4. Follow the installation wizard:
   - Click "Next" on welcome screen
   - Choose install location (default is fine)
   - Click "Install"
   - Click "Finish" when done
5. Launch "One Folk Cafe Admin" from Start Menu or Desktop shortcut

METHOD 2: Run install.bat (Easiest)
-----------------------------------
1. Extract this ZIP file
2. Double-click "install.bat"
3. Press any key when prompted
4. Follow the MSI installer prompts

METHOD 3: Command Line (For IT Admin)
-------------------------------------
Open Command Prompt as Administrator and run:
  msiexec /i "One-Folk-Cafe-Admin-Setup.msi" /qn

----------------------------------------
AFTER INSTALLATION
----------------------------------------
1. Find "One Folk Cafe Admin" in Start Menu
2. Pin to Taskbar for easy access (right-click > Pin to Taskbar)
3. First launch will initialize the local database automatically

----------------------------------------
DEFAULT LOGIN CREDENTIALS
----------------------------------------
Username: admin
Password: admin123

⚠️  IMPORTANT: Change the password after first login!
   Go to Settings > Security > Change Password

----------------------------------------
DATA LOCATION (BACKUP THIS FOLDER)
----------------------------------------
All your cafe data is stored locally in:
  %APPDATA%\OneFolkCafe\

This folder contains:
- cafe.db          (Your database - ALL DATA)
- uploads/         (Product images)
- store.json       (App preferences)
- logs/            (Application logs)

TO BACKUP: Copy the entire "OneFolkCafe" folder to USB/external drive
TO RESTORE: Copy the folder back to %APPDATA%\

----------------------------------------
UNINSTALLATION
----------------------------------------
1. Open Windows Settings > Apps > Installed Apps
2. Find "One Folk Cafe Admin"
3. Click "..." > Uninstall
4. Follow prompts

Note: Your data in %APPDATA%\OneFolkCafe\ is NOT deleted during uninstall.
To completely remove data, manually delete that folder.

----------------------------------------
TROUBLESHOOTING
----------------------------------------
App won't start?
- Restart computer and try again
- Run as Administrator once
- Check Windows Defender isn't blocking it

Database errors?
- Delete %APPDATA%\OneFolkCafe\cafe.db and restart app (will recreate with sample data)
- This will RESET all your data!

Forgot password?
- Delete %APPDATA%\OneFolkCafe\cafe.db and restart
- Login with default: admin / admin123

----------------------------------------
SUPPORT
----------------------------------------
For technical support, contact your system administrator
or the developer who provided this software.

Application built with Tauri v2 + React + SQLite
Fully offline - No internet required
----------------------------------------
"@

Set-Content -Path (Join-Path $distPath "README.txt") -Value $readme -Encoding UTF8

# Create install.bat
$installBat = @"
@echo off
title One Folk Cafe Admin - Installer
echo.
echo ========================================
echo One Folk Cafe Admin Panel - Installation
echo ========================================
echo.
echo This will install the application on your computer.
echo.
echo Press any key to continue, or Ctrl+C to cancel...
pause >nul
echo.
echo Starting installer...
echo.
msiexec /i "One-Folk-Cafe-Admin-Setup.msi"
if %errorlevel% neq 0 (
    echo.
    echo Installation may have encountered an issue.
    echo Try running as Administrator.
    echo.
    pause
) else (
    echo.
    echo Installation completed successfully!
    echo You can now find "One Folk Cafe Admin" in your Start Menu.
    echo.
)
"@

Set-Content -Path (Join-Path $distPath "install.bat") -Value $installBat -Encoding ASCII

# Create uninstall.bat
$uninstallBat = @"
@echo off
title One Folk Cafe Admin - Uninstaller
echo.
echo ========================================
echo One Folk Cafe Admin Panel - Uninstall
echo ========================================
echo.
echo This will remove the application but KEEP your data.
echo Your data is stored in %APPDATA%\OneFolkCafe\
echo.
echo Press any key to continue, or Ctrl+C to cancel...
pause >nul
echo.
msiexec /x "One-Folk-Cafe-Admin-Setup.msi" /qn
if %errorlevel% neq 0 (
    echo.
    echo Trying alternative uninstall method...
    wmic product where "name like 'One Folk Cafe%%'" call uninstall
)
echo.
echo Application uninstalled.
echo Your data is preserved in %APPDATA%\OneFolkCafe\
echo.
pause
"@

Set-Content -Path (Join-Path $distPath "uninstall.bat") -Value $uninstallBat -Encoding ASCII

# Create backup-data.bat
$backupBat = @"
@echo off
title One Folk Cafe Admin - Backup Data
echo.
echo ========================================
echo One Folk Cafe Admin - Backup Tool
echo ========================================
echo.
echo This creates a backup of all your cafe data.
echo.
set BACKUP_DIR=%USERPROFILE%\Desktop\OneFolkCafe-Backup-%DATE:~-4,4%%DATE:~-10,2%%DATE:~-7,2%
echo Backup will be saved to: %BACKUP_DIR%
echo.
pause
mkdir "%BACKUP_DIR%" 2>nul
xcopy "%APPDATA%\OneFolkCafe" "%BACKUP_DIR%\OneFolkCafe" /E /I /H /Y
echo.
echo ========================================
echo Backup completed!
echo Location: %BACKUP_DIR%
echo ========================================
echo.
echo Copy this folder to USB drive for safekeeping.
echo.
pause
"@

Set-Content -Path (Join-Path $distPath "backup-data.bat") -Value $backupBat -Encoding ASCII

# Create restore-data.bat
$restoreBat = @"
@echo off
title One Folk Cafe Admin - Restore Data
echo.
echo ========================================
echo One Folk Cafe Admin - Restore Tool
echo ========================================
echo.
echo WARNING: This will REPLACE all current data with backup!
echo.
echo Make sure the app is CLOSED before proceeding.
echo.
set /p BACKUP_PATH="Enter full path to backup folder (e.g., D:\OneFolkCafe-Backup-20240115\OneFolkCafe): "
echo.
if not exist "%BACKUP_PATH%" (
    echo Folder not found: %BACKUP_PATH%
    pause
    exit /b
)
echo.
echo Restoring from: %BACKUP_PATH%
echo This will OVERWRITE current data. Continue? (Y/N)
set /p CONFIRM=
if /i "%CONFIRM%" neq "Y" (
    echo Cancelled.
    pause
    exit /b
)
echo.
echo Restoring...
rmdir /s /q "%APPDATA%\OneFolkCafe" 2>nul
xcopy "%BACKUP_PATH%" "%APPDATA%\OneFolkCafe" /E /I /H /Y
echo.
echo ========================================
echo Restore completed!
echo ========================================
echo You can now open the app with your restored data.
echo.
pause
"@

Set-Content -Path (Join-Path $distPath "restore-data.bat") -Value $restoreBat -Encoding ASCII

# Create ZIP
Write-Host "" -ForegroundColor Yellow
Write-Host "Creating ZIP package..." -ForegroundColor Yellow
Compress-Archive -Path (Join-Path $OutputDir $appName) -DestinationPath (Join-Path $OutputDir "$appName.zip") -Force

Write-Host ""
Write-Host "✅ =========================================" -ForegroundColor Green
Write-Host "✅  DISTRIBUTION PACKAGE READY!" -ForegroundColor Green
Write-Host "✅ =========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Location: $OutputDir\$appName.zip" -ForegroundColor Cyan
Write-Host ""
Write-Host "📦 Package contains:" -ForegroundColor Cyan
Write-Host "   - One-Folk-Cafe-Admin-Setup.msi  (Windows installer)"
Write-Host "   - install.bat                     (Easy install helper)"
Write-Host "   - uninstall.bat                   (Easy uninstall helper)"
Write-Host "   - backup-data.bat                 (Backup tool)"
Write-Host "   - restore-data.bat                (Restore tool)"
Write-Host "   - README.txt                      (Instructions for client)"
Write-Host ""
Write-Host "📤 Send the ZIP file to your client." -ForegroundColor Yellow
Write-Host "   They just: Download > Extract > Double-click install.bat" -ForegroundColor Yellow
Write-Host ""
(Get-Item (Join-Path $OutputDir "$appName.zip")).Length / 1MB | ForEach-Object { 
    Write-Host "📦 ZIP Size: $([math]::Round($_, 1)) MB" -ForegroundColor Cyan 
}