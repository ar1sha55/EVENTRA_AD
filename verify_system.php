<?php

/**
 * Complete System Verification Script
 * Checks all components of the Telegram Event Blast system
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "🔍 Telegram Event Blast System Verification\n";
echo "==========================================\n\n";

$allGreen = true;

// 1. Check Database Connection
echo "1. Database Connection...";
try {
    DB::connection()->getPdo();
    echo " ✅\n";
} catch (Exception $e) {
    echo " ❌ FAILED: {$e->getMessage()}\n";
    $allGreen = false;
}

// 2. Check event_blasts Table
echo "2. Event Blasts Table...";
try {
    if (Schema::hasTable('event_blasts')) {
        echo " ✅\n";
    } else {
        echo " ❌ MISSING\n";
        $allGreen = false;
    }
} catch (Exception $e) {
    echo " ❌ FAILED: {$e->getMessage()}\n";
    $allGreen = false;
}

// 3. Check Events Table
echo "3. Events Table...";
try {
    $eventCount = DB::table('events')->count();
    echo " ✅ ({$eventCount} events)\n";
} catch (Exception $e) {
    echo " ❌ FAILED: {$e->getMessage()}\n";
    $allGreen = false;
}

// 4. Check Telegram Configuration
echo "4. Telegram Configuration...";
$botToken = config('services.telegram.bot_token');
$channelId = config('services.telegram.channel_id');
if ($botToken && $channelId) {
    echo " ✅\n";
    echo "   - Bot Token: " . substr($botToken, 0, 20) . "...\n";
    echo "   - Channel ID: {$channelId}\n";
} else {
    echo " ❌ MISSING\n";
    $allGreen = false;
}

// 5. Check TelegramService
echo "5. TelegramService Class...";
try {
    $service = app(\App\Services\TelegramService::class);
    echo " ✅\n";
} catch (Exception $e) {
    echo " ❌ FAILED: {$e->getMessage()}\n";
    $allGreen = false;
}

// 6. Check CaptionGeneratorService
echo "6. CaptionGeneratorService Class...";
try {
    $captionService = app(\App\Services\CaptionGeneratorService::class);
    echo " ✅\n";
} catch (Exception $e) {
    echo " ❌ FAILED: {$e->getMessage()}\n";
    $allGreen = false;
}

// 7. Check EventBlastController
echo "7. EventBlastController Class...";
try {
    $controller = app(\App\Http\Controllers\EventBlastController::class);
    echo " ✅\n";
} catch (Exception $e) {
    echo " ❌ FAILED: {$e->getMessage()}\n";
    $allGreen = false;
}

// 8. Check EventBlast Model
echo "8. EventBlast Model...";
try {
    $model = new \App\Models\EventBlast();
    echo " ✅\n";
} catch (Exception $e) {
    echo " ❌ FAILED: {$e->getMessage()}\n";
    $allGreen = false;
}

// 9. Check Frontend File
echo "9. Frontend File (EventBlast.tsx)...";
$frontendFile = base_path('resources/js/pages/Manager/EventBlast.tsx');
if (file_exists($frontendFile)) {
    $fileSize = filesize($frontendFile);
    echo " ✅ (" . round($fileSize / 1024, 1) . " KB)\n";
} else {
    echo " ❌ MISSING\n";
    $allGreen = false;
}

// 10. Check Scheduled Command
echo "10. SendScheduledBlasts Command...";
try {
    $commands = Artisan::all();
    if (isset($commands['blasts:send-scheduled'])) {
        echo " ✅\n";
    } else {
        echo " ❌ NOT REGISTERED\n";
        $allGreen = false;
    }
} catch (Exception $e) {
    echo " ❌ FAILED: {$e->getMessage()}\n";
    $allGreen = false;
}

// 11. Test Telegram Connection (Optional)
echo "11. Telegram Connection Test...";
try {
    $telegramService = app(\App\Services\TelegramService::class);
    $response = Http::get("https://api.telegram.org/bot{$botToken}/getMe");

    if ($response->successful()) {
        $botInfo = $response->json();
        echo " ✅\n";
        echo "    - Bot Username: @{$botInfo['result']['username']}\n";
        echo "    - Bot ID: {$botInfo['result']['id']}\n";
    } else {
        echo " ⚠️  Could not verify bot\n";
    }
} catch (Exception $e) {
    echo " ⚠️  {$e->getMessage()}\n";
}

// 12. Check Routes
echo "12. Event Blast Routes...";
try {
    $routes = Route::getRoutes();
    $eventBlastRoutes = 0;
    foreach ($routes as $route) {
        if (str_contains($route->getName() ?? '', 'event-blast')) {
            $eventBlastRoutes++;
        }
    }
    if ($eventBlastRoutes >= 4) {
        echo " ✅ ({$eventBlastRoutes} routes)\n";
    } else {
        echo " ⚠️  Only {$eventBlastRoutes} routes found\n";
    }
} catch (Exception $e) {
    echo " ❌ FAILED: {$e->getMessage()}\n";
    $allGreen = false;
}

// 13. Check APP_URL
echo "13. APP_URL Configuration...";
$appUrl = config('app.url');
if ($appUrl) {
    echo " ✅ ({$appUrl})\n";
} else {
    echo " ⚠️  Not set\n";
}

echo "\n==========================================\n";

if ($allGreen) {
    echo "✅ ALL SYSTEMS OPERATIONAL!\n";
    echo "\n🚀 Your Telegram Event Blast system is ready to use!\n";
    echo "\nNext Steps:\n";
    echo "1. Start scheduler: php artisan schedule:work\n";
    echo "2. Login as Manager\n";
    echo "3. Go to: /manager/event-blast\n";
    echo "4. Send your first blast! 🎉\n";
} else {
    echo "❌ SOME ISSUES DETECTED\n";
    echo "\nPlease review the items marked with ❌ above.\n";
}

echo "\n";
