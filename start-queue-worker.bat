@echo off
title EVENTRA Queue Worker
echo ========================================
echo EVENTRA Email Queue Worker
echo ========================================
echo.
echo Starting queue worker...
echo Press Ctrl+C to stop
echo.

cd /d "%~dp0"
php artisan queue:work --sleep=3 --tries=3 --max-time=3600

pause
