<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule tasks
// Changed to everyMinute() so it runs whenever UptimeRobot triggers (every ~5 min)
// instead of waiting for exact 5-minute marks (XX:00, XX:05, etc.)
Schedule::command('blasts:send-scheduled')
    ->everyMinute()
    ->appendOutputTo(storage_path('logs/scheduler-blasts.log'));
    
Schedule::command('notifications:send-upcoming-events')
    ->dailyAt('09:00')
    ->appendOutputTo(storage_path('logs/scheduler-notifications.log'));
