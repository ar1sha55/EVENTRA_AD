<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "===========================================\n";
echo "  TELEGRAM INTEGRATION DIAGNOSTIC TOOL\n";
echo "===========================================\n\n";

$botToken = config('services.telegram.bot_token');
$channelId = config('services.telegram.channel_id');

echo "📋 Current Configuration:\n";
echo "   Bot Token: {$botToken}\n";
echo "   Channel ID: {$channelId}\n\n";

echo "===========================================\n";
echo "  ISSUE DETECTED:\n";
echo "===========================================\n\n";

echo "❌ Error: Chat not found\n\n";

echo "This error means one of the following:\n\n";

echo "1️⃣  THE CHANNEL DOESN'T EXIST\n";
echo "   - Check if @eventrautm exists in Telegram\n";
echo "   - Try searching for it in Telegram app\n\n";

echo "2️⃣  THE BOT IS NOT AN ADMIN IN THE CHANNEL\n";
echo "   - Open your Telegram channel @eventrautm\n";
echo "   - Go to Channel Info → Administrators\n";
echo "   - Add your bot as an administrator\n";
echo "   - Give it 'Post Messages' permission\n\n";

echo "3️⃣  THE CHANNEL USERNAME IS WRONG\n";
echo "   - Double-check the channel username\n";
echo "   - It should be exactly: @eventrautm (with @)\n";
echo "   - Check for typos\n\n";

echo "===========================================\n";
echo "  HOW TO FIX:\n";
echo "===========================================\n\n";

echo "OPTION A: For PUBLIC Channels\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "1. Open Telegram and go to your channel\n";
echo "2. Tap the channel name at the top\n";
echo "3. Tap 'Edit' (or the pencil icon)\n";
echo "4. Check 'Type' - should be PUBLIC\n";
echo "5. Check the channel username (e.g., eventrautm)\n";
echo "6. Tap 'Administrators'\n";
echo "7. Add your bot (search for the bot name)\n";
echo "8. Give it 'Post Messages' permission ✅\n";
echo "9. Update .env with:\n";
echo "   TELEGRAM_CHANNEL_ID=@yourusername\n\n";

echo "OPTION B: For PRIVATE Channels\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "1. Add the bot as admin (same steps 1-8 above)\n";
echo "2. Forward ANY message from your channel to @userinfobot\n";
echo "3. @userinfobot will reply with the channel ID\n";
echo "4. It looks like: -1001234567890\n";
echo "5. Update .env with:\n";
echo "   TELEGRAM_CHANNEL_ID=-1001234567890\n\n";

echo "===========================================\n";
echo "  QUICK TEST:\n";
echo "===========================================\n\n";

echo "After fixing, test by running:\n";
echo "   php test_telegram.php\n\n";

echo "Or test directly in Telegram:\n";
echo "1. Send a message in your channel\n";
echo "2. If the bot is admin, the test should work\n\n";

echo "===========================================\n";
echo "  NEED HELP?\n";
echo "===========================================\n\n";

echo "Check TELEGRAM_SETUP.md for detailed instructions\n\n";

// Try to get bot info
echo "===========================================\n";
echo "  BOT INFORMATION:\n";
echo "===========================================\n\n";

try {
    $response = \Illuminate\Support\Facades\Http::get("https://api.telegram.org/bot{$botToken}/getMe");

    if ($response->successful()) {
        $bot = $response->json('result');
        echo "✅ Bot Details:\n";
        echo "   Name: {$bot['first_name']}\n";
        echo "   Username: @{$bot['username']}\n";
        echo "   Bot ID: {$bot['id']}\n\n";
        echo "Your bot is working! Now just add it to the channel.\n\n";
    } else {
        echo "❌ Bot token might be invalid\n";
        echo "Response: " . $response->body() . "\n\n";
    }
} catch (\Exception $e) {
    echo "❌ Error checking bot: " . $e->getMessage() . "\n\n";
}

echo "===========================================\n";
