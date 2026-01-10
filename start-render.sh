#!/usr/bin/env bash
# Combined web server + queue worker for Render.com
# This script runs both the Laravel web server and queue worker in one container

set -o errexit

echo "🚀 Starting EVENTRA_AD on Render.com..."

# Run database migrations
echo "📊 Running database migrations..."
php artisan migrate --force

# Clear and cache configurations for production
echo "⚙️ Optimizing application..."
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Start queue worker in background
echo "🔄 Starting queue worker..."
php artisan queue:work --tries=3 --timeout=90 --sleep=3 --daemon &

# Start web server
echo "🌐 Starting web server on port $PORT..."
php artisan serve --host=0.0.0.0 --port=$PORT
