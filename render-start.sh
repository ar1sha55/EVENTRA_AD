#!/usr/bin/env bash
# Render.com start script for Laravel

set -o errexit

echo "Running database migrations..."
php artisan migrate --force

echo "Starting Laravel server..."
php artisan serve --host=0.0.0.0 --port=$PORT
