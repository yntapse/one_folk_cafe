#!/usr/bin/env node
/**
 * Cross-platform distribution builder for One Folk Cafe Desktop App
 * Works on Windows, macOS, and Linux
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, rmSync, cpSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { homedir } from 'os';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const packageJson = JSON.parse(readFileSync(resolve('package.json'), 'utf-8'));
const VERSION = packageJson.version;
const APP_NAME = `One-Folk-Cafe-Admin-v${VERSION}-Windows`;
const DIST_DIR = 'dist-client';
const DIST_PATH = join(DIST_DIR, APP_NAME);

const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  bold: '\x1b[1m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function run(cmd, options = {}) {
  log(`  $ ${cmd}`, 'cyan');
  try {
    execSync(cmd, { stdio: 'inherit', ...options });
    return true;
  } catch (e) {
    log(`  ✗ Command failed: ${cmd}`, 'red');
    return false;
  }
}

function findMSI() {
  const msiDir = resolve('src-tauri/target/release/bundle/msi');
  if (!existsSync(msiDir)) return null;
  
  const files = require('fs').readdirSync(msiDir);
  const msi = files.find(f => f.endsWith('.msi'));
  return msi ? join(msiDir, msi) : null;
}

async function main() {
  log('\n============================================', 'cyan');
  log('  One Folk Cafe - Distribution Builder', 'cyan');
  log('============================================\n', 'cyan');

  // Check prerequisites
  log('Checking prerequisites...', 'yellow');
  
  const checks = [
    { cmd: 'node --version', name: 'Node.js' },
    { cmd: 'npm --version', name: 'npm' },
    { cmd: 'rustc --version', name: 'Rust' },
    { cmd: 'cargo --version', name: 'Cargo' }
  ];

  for (const check of checks) {
    try {
      const output = execSync(check.cmd, { encoding: 'utf-8', stdio: 'pipe' }).trim();
      log(`  ✓ ${check.name}: ${output}`, 'green');
    } catch {
      log(`  ✗ ${check.name} not found`, 'red');
      process.exit(1);
    }
  }

  // Install dependencies
  if (!existsSync('node_modules')) {
    log('\nInstalling Node.js dependencies...', 'yellow');
    if (!run('npm install')) process.exit(1);
  }

  // Build
  log('\nBuilding production bundle...', 'yellow');
  if (!run('npm run tauri:build')) process.exit(1);

  // Find MSI
  const msiPath = findMSI();
  if (!msiPath) {
    log('MSI installer not found!', 'red');
    process.exit(1);
  }
  log(`\n✓ Found MSI: ${msiPath}`, 'green');

  // Clean and create dist directory
  if (existsSync(DIST_DIR)) rmSync(DIST_DIR, { recursive: true, force: true });
  mkdirSync(DIST_PATH, { recursive: true });

  // Copy MSI
  cpSync(msiPath, join(DIST_PATH, 'One-Folk-Cafe-Admin-Setup.msi'));

  // Generate README.txt
  const readme = `========================================
One Folk Cafe - Admin Panel Installer
========================================

VERSION: ${VERSION}
DATE: ${new Date().toISOString().split('T')[0]}

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
  %APPDATA%\\OneFolkCafe\\

This folder contains:
- cafe.db          (Your database - ALL DATA)
- uploads/         (Product images)
- store.json       (App preferences)
- logs/            (Application logs)

TO BACKUP: Copy the entire "OneFolkCafe" folder to USB/external drive
TO RESTORE: Copy the folder back to %APPDATA%\\

----------------------------------------
UNINSTALLATION
----------------------------------------
1. Open Windows Settings > Apps > Installed Apps
2. Find "One Folk Cafe Admin"
3. Click "..." > Uninstall
4. Follow prompts

Note: Your data in %APPDATA%\\OneFolkCafe\\ is NOT deleted during uninstall.
To completely remove data, manually delete that folder.

----------------------------------------
TROUBLESHOOTING
----------------------------------------
App won't start?
- Restart computer and try again
- Run as Administrator once
- Check Windows Defender isn't blocking it

Database errors?
- Delete %APPDATA%\\OneFolkCafe\\cafe.db and restart app (will recreate with sample data)
- This will RESET all your data!

Forgot password?
- Delete %APPDATA%\\OneFolkCafe\\cafe.db and restart
- Login with default: admin / admin123

----------------------------------------
SUPPORT
----------------------------------------
For technical support, contact your system administrator
or the developer who provided this software.

Application built with Tauri v2 + React + SQLite
Fully offline - No internet required
----------------------------------------
`;

  writeFileSync(join(DIST_PATH, 'README.txt'), readme);

  // Generate install.bat
  const installBat = `@echo off
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
`;
  writeFileSync(join(DIST_PATH, 'install.bat'), installBat);

  // Generate uninstall.bat
  const uninstallBat = `@echo off
title One Folk Cafe Admin - Uninstaller
echo.
echo ========================================
echo One Folk Cafe Admin Panel - Uninstall
echo ========================================
echo.
echo This will remove the application but KEEP your data.
echo Your data is stored in %APPDATA%\\OneFolkCafe\\
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
echo Your data is preserved in %APPDATA%\\OneFolkCafe\\
echo.
pause
`;
  writeFileSync(join(DIST_PATH, 'uninstall.bat'), uninstallBat);

  // Generate backup-data.bat
  const backupBat = `@echo off
title One Folk Cafe Admin - Backup Data
echo.
echo ========================================
echo One Folk Cafe Admin - Backup Tool
echo ========================================
echo.
echo This creates a backup of all your cafe data.
echo.
set BACKUP_DIR=%USERPROFILE%\\Desktop\\OneFolkCafe-Backup-%DATE:~-4,4%%DATE:~-10,2%%DATE:~-7,2%
echo Backup will be saved to: %BACKUP_DIR%
echo.
pause
mkdir "%BACKUP_DIR%" 2>nul
xcopy "%APPDATA%\\OneFolkCafe" "%BACKUP_DIR%\\OneFolkCafe" /E /I /H /Y
echo.
echo ========================================
echo Backup completed!
echo Location: %BACKUP_DIR%
echo ========================================
echo.
echo Copy this folder to USB drive for safekeeping.
echo.
pause
`;
  writeFileSync(join(DIST_PATH, 'backup-data.bat'), backupBat);

  // Generate restore-data.bat
  const restoreBat = `@echo off
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
set /p BACKUP_PATH="Enter full path to backup folder (e.g., D:\\OneFolkCafe-Backup-20240115\\OneFolkCafe): "
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
rmdir /s /q "%APPDATA%\\OneFolkCafe" 2>nul
xcopy "%BACKUP_PATH%" "%APPDATA%\\OneFolkCafe" /E /I /H /Y
echo.
echo ========================================
echo Restore completed!
echo ========================================
echo You can now open the app with your restored data.
echo.
pause
`;
  writeFileSync(join(DIST_PATH, 'restore-data.bat'), restoreBat);

  // Create ZIP
  log('\nCreating ZIP package...', 'yellow');
  
  // Use platform-appropriate zip command
  const isWindows = process.platform === 'win32';
  if (isWindows) {
    run(`powershell -Command "Compress-Archive -Path '${DIST_PATH}' -DestinationPath '${DIST_DIR}/${APP_NAME}.zip' -Force"`);
  } else {
    run(`cd ${DIST_DIR} && zip -r "${APP_NAME}.zip" "${APP_NAME}" >/dev/null && cd ..`);
  }

  const zipPath = resolve(DIST_DIR, `${APP_NAME}.zip`);
  const stats = require('fs').statSync(zipPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);

  log('\n✅ =========================================', 'green');
  log('✅  DISTRIBUTION PACKAGE READY!', 'green');
  log('✅ =========================================', 'green');
  log(`\n📁 Location: ${zipPath}`, 'cyan');
  log(`📦 ZIP Size: ${sizeMB} MB`, 'cyan');
  log('\n📦 Package contains:', 'cyan');
  log('   - One-Folk-Cafe-Admin-Setup.msi  (Windows installer)');
  log('   - install.bat                     (Easy install helper)');
  log('   - uninstall.bat                   (Easy uninstall helper)');
  log('   - backup-data.bat                 (Backup tool)');
  log('   - restore-data.bat                (Restore tool)');
  log('   - README.txt                      (Instructions for client)');
  log('\n📤 Send the ZIP file to your client.', 'yellow');
  log('   They just: Download → Extract → Double-click install.bat', 'yellow');
}

main().catch(e => {
  log(`\n✗ Build failed: ${e.message}`, 'red');
  process.exit(1);
});