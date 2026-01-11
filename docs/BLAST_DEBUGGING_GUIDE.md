# Event Blast Debugging Guide

## Problem
Scheduled event blasts are failing immediately on Render deployment without showing error messages.

## Root Cause
The scheduler was redirecting all output to `/dev/null`, which silenced all error messages and logs.

## Changes Made

### 1. Enhanced Logging in `TelegramService.php`
- Added comprehensive logging at every step of the blast sending process
- Logs now include:
  - Bot token and channel ID configuration status
  - Message content and length
  - Telegram API responses (both success and failure)
  - Exception details with stack traces

### 2. Updated Scheduler Configuration (`routes/console.php`)
**Before:**
```php
Schedule::command('blasts:send-scheduled')->everyMinute();
```

**After:**
```php
Schedule::command('blasts:send-scheduled')
    ->everyMinute()
    ->appendOutputTo(storage_path('logs/scheduler-blasts.log'));
```

Now all scheduler output is saved to `storage/logs/scheduler-blasts.log` instead of being discarded.

### 3. Added Robust Error Handling
The `TelegramService` now handles common Telegram API errors:
- **Markdown parsing errors**: Automatically retries with plain text
- **Message too long**: Truncates messages over 4096 characters (Telegram limit)
- **Caption too long**: Truncates captions over 1024 characters (Telegram limit for photos)
- **Photo upload failures**: Falls back to text-only messages

### 4. Created Diagnostic Tools

#### New Artisan Commands:
1. **`php artisan telegram:test`** - Tests Telegram bot configuration and connection
2. **`php artisan blast:test [event_id]`** - Tests sending a blast for a specific event

#### New HTTP Endpoints:
1. **`/diagnostics/blast-status?token=YOUR_CRON_SECRET`**
   - Shows recent blast statuses
   - Displays Telegram configuration
   - Returns relevant log entries

2. **`/diagnostics/test-scheduler?token=YOUR_CRON_SECRET`**
   - Manually triggers the blast scheduler
   - Returns the command output

## Deployment Steps

### Step 1: Deploy Changes to Render
```bash
git add .
git commit -m "Add comprehensive blast debugging and error handling"
git push origin main
```

### Step 2: Clear Config Cache on Render
Run this command on your Render shell:
```bash
php artisan config:clear
php artisan cache:clear
```

### Step 3: Check Diagnostics
Visit this URL in your browser (replace with your actual domain and cron secret):
```
https://your-app.onrender.com/diagnostics/blast-status?token=YOUR_CRON_SECRET
```

This will show you:
- Recent blast statuses and any error messages
- Telegram configuration status
- Recent logs

### Step 4: Test the Scheduler Manually
Visit this URL:
```
https://your-app.onrender.com/diagnostics/test-scheduler?token=YOUR_CRON_SECRET
```

This will manually run the blast scheduler and show you the output.

### Step 5: Check Log Files
If you have access to Render's shell, check these log files:
```bash
# Scheduler blast logs
tail -f storage/logs/scheduler-blasts.log

# General Laravel logs (Telegram-related)
grep -i 'telegram\|sendBlast' storage/logs/laravel.log | tail -50

# All Laravel logs
tail -f storage/logs/laravel.log
```

## Common Issues and Solutions

### Issue 1: "Failed to send message to Telegram"
**Possible causes:**
- Bot token or channel ID is incorrect
- Bot is not added as admin to the Telegram channel
- Channel ID format is wrong (should be `@channelname` or `-100xxxxxxxxx`)

**Solution:**
1. Verify `TELEGRAM_BOT_TOKEN` in environment variables
2. Verify `TELEGRAM_CHANNEL_ID` in environment variables
3. Make sure the bot is added to the channel with admin rights
4. Run `php artisan config:clear` after changing environment variables

### Issue 2: Markdown Parse Errors
**Symptoms:** Blasts fail with parse mode errors

**Solution:** The system now automatically retries without Markdown formatting. Check logs to see if this is happening.

### Issue 3: Message Too Long
**Symptoms:** Blasts fail for events with long descriptions

**Solution:** The system now automatically truncates messages. Check logs to confirm.

### Issue 4: Image Upload Failures
**Symptoms:** Blasts with images fail

**Solution:** The system now falls back to text-only messages. Check logs to see if images are failing to upload.

## Monitoring

### Watch Scheduler Logs in Real-Time
If you have shell access:
```bash
tail -f storage/logs/scheduler-blasts.log
```

### Check Blast Status via API
Create a bookmark for quick access:
```
https://your-app.onrender.com/diagnostics/blast-status?token=YOUR_CRON_SECRET
```

### Manual Testing
To test a specific blast:
```bash
php artisan blast:test [event_id]
```

## Next Steps

1. Deploy all changes to Render
2. Clear config cache on production
3. Use the diagnostics endpoint to identify the actual error
4. Check the `scheduler-blasts.log` file for detailed output
5. Based on the error found, apply the appropriate solution from above

## Need More Help?

If the issue persists after following these steps:
1. Share the output from `/diagnostics/blast-status`
2. Share the contents of `storage/logs/scheduler-blasts.log`
3. Share any error messages from `storage/logs/laravel.log`
