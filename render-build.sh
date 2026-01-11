#!/usr/bin/env bash
# Render.com build script for Laravel + React (Inertia.js)

set -o errexit

echo "Installing PHP dependencies..."
composer install --optimize-autoloader --no-dev

echo "Installing Node.js dependencies..."
npm ci

echo "Building frontend assets..."
npm run build

# NOTE: Config caching is done at runtime in start-render.sh
# This ensures environment variables (like TELEGRAM_BOT_TOKEN) are available

echo "Build completed successfully!"
