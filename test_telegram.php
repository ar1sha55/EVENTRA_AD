<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Services\TelegramService;
use App\Models\Event;

echo "Testing Telegram Integration...\n\n";

// Test 1: Check configuration
echo "1. Checking configuration...\n";
$botToken = config('services.telegram.bot_token');
$channelId = config('services.telegram.channel_id');

if (!$botToken) {
    echo "   ❌ TELEGRAM_BOT_TOKEN is not configured!\n";
    exit(1);
}
if (!$channelId) {
    echo "   ❌ TELEGRAM_CHANNEL_ID is not configured!\n";
    exit(1);
}

echo "   ✅ Bot Token: " . substr($botToken, 0, 10) . "...\n";
echo "   ✅ Channel ID: {$channelId}\n\n";

// Test 2: Check if TelegramService can be instantiated
echo "2. Testing TelegramService instantiation...\n";
try {
    $telegram = app(TelegramService::class);
    echo "   ✅ TelegramService created successfully\n\n";
} catch (\Exception $e) {
    echo "   ❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}

// Test 3: Send a test message
echo "3. Sending test message to Telegram...\n";
try {
    $response = \Illuminate\Support\Facades\Http::post("https://api.telegram.org/bot{$botToken}/sendMessage", [
        'chat_id' => $channelId,
        'text' => "🧪 *Test Message from Eventra*\n\nThis is a test message to verify Telegram integration is working!\n\nTimestamp: " . now()->toDateTimeString(),
        'parse_mode' => 'Markdown',
    ]);

    if ($response->successful()) {
        $messageId = $response->json('result.message_id');
        echo "   ✅ Test message sent successfully! Message ID: {$messageId}\n\n";
    } else {
        echo "   ❌ Failed to send message\n";
        echo "   Response: " . $response->body() . "\n";
        exit(1);
    }
} catch (\Exception $e) {
    echo "   ❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}

// Test 4: Try to publish a real event (if any exist)
echo "4. Testing with a real event...\n";
try {
    $event = Event::where('status', 'published')->first();

    if (!$event) {
        echo "   ⚠️  No published events found in database\n";
        echo "   💡 Create a published event to test automatic posting\n\n";
    } else {
        echo "   Found event: {$event->name}\n";
        echo "   Attempting to publish to Telegram...\n";

        $success = $telegram->publishEvent($event);

        if ($success) {
            echo "   ✅ Event published successfully to Telegram!\n";
            echo "   Telegram Message ID: {$event->telegram_message_id}\n\n";
        } else {
            echo "   ❌ Failed to publish event\n";
            echo "   Check storage/logs/laravel.log for details\n\n";
        }
    }
} catch (\Exception $e) {
    echo "   ❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}

echo "============================================\n";
echo "✅ Telegram integration test completed!\n";
echo "============================================\n";
