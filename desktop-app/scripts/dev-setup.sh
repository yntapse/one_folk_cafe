#!/bin/bash
# Development setup script for One Folk Cafe Desktop App

set -e

echo "🚀 Setting up One Folk Cafe Desktop App development environment..."

# Check for required tools
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

if ! command -v rustc &> /dev/null; then
    echo "❌ Rust not found. Please install from https://rustup.rs/"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install Node dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Install Tauri CLI if not present
if ! command -v cargo-tauri &> /dev/null; then
    echo "🔧 Installing Tauri CLI..."
    cargo install tauri-cli --version "^2.0"
fi

# Build Rust dependencies
echo "🦀 Fetching Rust dependencies..."
cd src-tauri
cargo fetch
cd ..

echo ""
echo "✨ Setup complete!"
echo ""
echo "To start development server:"
echo "  npm run tauri:dev"
echo ""
echo "To build for production:"
echo "  npm run tauri:build"
echo ""
echo "The app will be available at http://localhost:1420 in dev mode"