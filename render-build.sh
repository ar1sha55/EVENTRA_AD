#!/usr/bin/env bash
# Render.com build script for Laravel + React (Inertia.js)

set -o errexit

echo "Installing PHP dependencies..."
composer install --optimize-autoloader --no-dev

echo "Installing Node.js dependencies..."
npm ci

echo "Building frontend assets..."
npm run build

echo "Caching Laravel configuration..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "Build completed successfully!"
