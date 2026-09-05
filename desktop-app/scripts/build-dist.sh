#!/bin/bash
# Build script for One Folk Cafe Desktop App - Creates client-ready distribution package

set -e

echo "🏗️  Building One Folk Cafe Desktop App for distribution..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the desktop-app directory"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

# Build the app
echo "🔨 Building production bundle..."
npm run tauri:build

# Find the MSI installer
MSI_PATH=$(find src-tauri/target/release/bundle/msi -name "*.msi" 2>/dev/null | head -1)

if [ -z "$MSI_PATH" ]; then
    echo "❌ MSI installer not found. Build may have failed."
    exit 1
fi

echo "✅ Found MSI: $MSI_PATH"

# Create distribution folder
DIST_DIR="dist-client"
VERSION=$(node -p "require('./package.json').version")
APP_NAME="One-Folk-Cafe-Admin-v${VERSION}-Windows"
DIST_PATH="${DIST_DIR}/${APP_NAME}"

echo "📦 Creating client distribution package..."
rm -rf "${DIST_DIR}"
mkdir -p "${DIST_PATH}"

# Copy MSI
cp "$MSI_PATH" "${DIST_PATH}/One-Folk-Cafe-Admin-Setup.msi"

# Copy README for client
cat > "${DIST_PATH}/README.txt" << 'EOF'
========================================
One Folk Cafe - Admin Panel Installer
========================================

VERSION: 1.0.0
DATE: $(date +"%Y-%m-%d")

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

METHOD 2: Command Line (For IT Admin)
-------------------------------------
Open Command Prompt as Administrator and run:
  msiexec /i "One-Folk-Cafe-Admin-Setup.msi" /qn

This installs silently without prompts.

----------------------------------------
AFTER INSTALLATION
----------------------------------------
1. Find "One Folk Cafe Admin" in Start Menu
2. Pin to Taskbar for easy access (right-click → Pin to Taskbar)
3. First launch will initialize the local database automatically

----------------------------------------
DEFAULT LOGIN CREDENTIALS
----------------------------------------
Username: admin
Password: admin123

⚠️  IMPORTANT: Change the password after first login!
   Go to Settings → Security → Change Password

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
1. Open Windows Settings → Apps → Installed Apps
2. Find "One Folk Cafe Admin"
3. Click "..." → Uninstall
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
EOF

# Create a simple install.bat for extra ease
cat > "${DIST_PATH}/install.bat" << 'EOF'
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
EOF

# Create uninstall helper
cat > "${DIST_PATH}/uninstall.bat" << 'EOF'
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
    wmic product where "name like 'One Folk Cafe%'" call uninstall
)
echo.
echo Application uninstalled.
echo Your data is preserved in %APPDATA%\OneFolkCafe\
echo.
pause
EOF

# Create backup helper
cat > "${DIST_PATH}/backup-data.bat" << 'EOF'
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
EOF

# Create restore helper
cat > "${DIST_PATH}/restore-data.bat" << 'EOF'
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
EOF

# Zip it up
echo "🗜️  Creating final ZIP package..."
cd "${DIST_DIR}"
zip -r "${APP_NAME}.zip" "${APP_NAME}" >/dev/null
cd ..

echo ""
echo "✅ ========================================="
echo "✅  DISTRIBUTION PACKAGE READY!"
echo "✅ ========================================="
echo ""
echo "📁 Location: ${DIST_DIR}/${APP_NAME}.zip"
echo ""
echo "📦 Package contains:"
echo "   - One-Folk-Cafe-Admin-Setup.msi  (Windows installer)"
echo "   - install.bat                     (Easy install helper)"
echo "   - uninstall.bat                   (Easy uninstall helper)"
echo "   - backup-data.bat                 (Backup tool)"
echo "   - restore-data.bat                (Restore tool)"
echo "   - README.txt                      (Instructions for client)"
echo ""
echo "📤 Send the ZIP file to your client."
echo "   They just: Download → Extract → Double-click install.bat"
echo ""
ls -lh "${DIST_DIR}/${APP_NAME}.zip"