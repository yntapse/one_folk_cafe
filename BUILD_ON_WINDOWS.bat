@echo off
title One Folk Cafe - Windows Build Script
echo.
echo ============================================================
echo One Folk Cafe Desktop App - Automated Windows Build
echo ============================================================
echo.
echo This script will:
echo  1. Check prerequisites (Node.js, Rust)
echo  2. Install npm dependencies
echo  3. Build the Windows MSI installer
echo  4. Create client-ready ZIP package
echo.
echo Press any key to continue, or Ctrl+C to cancel...
pause >nul
echo.

:: Check Node.js
echo [1/5] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found!
    echo Please install from https://nodejs.org/ (LTS version)
    echo Then restart this script.
    pause
    exit /b 1
)
for /f "delims=" %%a in ('node --version') do set NODE_VER=%%a
echo OK: Node.js %NODE_VER%

:: Check npm
echo.
echo [2/5] Checking npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm not found!
    pause
    exit /b 1
)
for /f "delims=" %%a in ('npm --version') do set NPM_VER=%%a
echo OK: npm %NPM_VER%

:: Check Rust
echo.
echo [3/5] Checking Rust...
rustc --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Rust not found!
    echo Installing Rust...
    curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs -o rustup-init.exe
    rustup-init.exe -y
    del rustup-init.exe
    echo.
    echo IMPORTANT: Please CLOSE and REOPEN this command prompt, then run this script again!
    pause
    exit /b 1
)
for /f "delims=" %%a in ('rustc --version') do set RUST_VER=%%a
echo OK: %RUST_VER%

:: Install dependencies
echo.
echo [4/5] Installing npm dependencies (this may take a minute)...
npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)

echo.
echo Installing additional UI dependencies...
npm install @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu class-variance-authority @hookform/resolvers @tanstack/react-query-devtools
if %errorlevel% neq 0 (
    echo WARNING: Some UI dependencies may have failed, but continuing...
)

:: Build
echo.
echo [5/5] Building MSI installer (this takes 3-5 minutes)...
echo.
npm run dist
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Build failed!
    echo.
    echo Common fixes:
    echo  - Install Visual Studio Build Tools (Desktop C++ workload)
    echo  - Run: cargo clean (in src-tauri folder)
    echo  - Update Rust: rustup update stable
    pause
    exit /b 1
)

echo.
echo ============================================================
echo BUILD SUCCESSFUL!
echo ============================================================
echo.
echo Your distribution package is ready at:
echo   dist-client\One-Folk-Cafe-Admin-v1.0.0-Windows.zip
echo.
echo Send this ZIP to your client.
echo They just: Extract -> Double-click install.bat
echo.
echo Default login: admin / admin123
echo.
pause