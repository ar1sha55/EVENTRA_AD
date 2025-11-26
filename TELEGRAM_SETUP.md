# Telegram Event Auto-Publishing Setup Guide

This guide will help you set up automatic publishing of events to your Telegram channel when event managers create or update events on the website.

## Features

- **Automatic Publishing**: When an event manager creates an event with "published" status, it's automatically posted to your Telegram channel
- **Auto-Update**: When event details are updated, the Telegram message is automatically updated
- **Auto-Delete**: When an event is deleted or archived, the Telegram message is removed
- **Image Support**: Events with posters are posted as photos with captions
- **Formatted Messages**: Events are formatted with event details including date, location, capacity, and fee information

## Prerequisites

1. A Telegram Bot (created via [@BotFather](https://t.me/botfather))
2. A Telegram Channel where events will be published
3. Bot added as an administrator to your channel

## Step 1: Create a Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Start a chat and send `/newbot`
3. Follow the prompts to:
   - Choose a name for your bot (e.g., "Eventra Events Bot")
   - Choose a username for your bot (must end in 'bot', e.g., "eventra_events_bot")
4. BotFather will give you a **Bot Token** - save this! It looks like:
   ```
   1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ
   ```

## Step 2: Create a Telegram Channel

1. In Telegram, create a new channel (or use an existing one)
2. Make the channel public or private (both work)
3. Add your bot as an administrator:
   - Go to channel settings → Administrators
   - Add your bot
   - Give it permission to "Post Messages"

## Step 3: Get Your Channel ID

### For Public Channels:
- Your channel ID is simply `@your_channel_username`
- Example: `@eventra_events`

### For Private Channels:
1. Forward any message from your channel to [@userinfobot](https://t.me/userinfobot)
2. The bot will reply with the channel ID (looks like `-100123456789`)
3. Or use [@getidsbot](https://t.me/getidsbot) - just add it to your channel

## Step 4: Configure Environment Variables

1. Open your `.env` file in the project root
2. Add these two lines at the end:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHANNEL_ID=@your_channel_username_or_id_here
```

**Example:**
```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ
TELEGRAM_CHANNEL_ID=@eventra_events
```

Or for private channels:
```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ
TELEGRAM_CHANNEL_ID=-100123456789
```

## Step 5: Run Database Migration

Run the following command to add the `telegram_message_id` column to the events table:

```bash
php artisan migrate
```

## Step 6: Clear Config Cache (Important!)

After updating the `.env` file, clear the configuration cache:

```bash
php artisan config:clear
```

## Testing the Integration

1. Log in as an event manager
2. Create a new event with status set to "published"
3. Check your Telegram channel - the event should appear automatically!

### What Gets Posted:

```
🎉 *New Event: Event Name*

Event description here...

📅 *Start:* 25 Nov 2025, 10:00 AM
📅 *End:* 25 Nov 2025, 05:00 PM
📍 *Location:* Event Venue
👥 *Capacity:* 100 participants
💰 *Fee:* RM 50.00

✨ Register now on our website!
```

## How It Works

### Automatic Publishing Scenarios:

1. **Creating Published Event**: Event is immediately posted to Telegram
2. **Creating Draft Event**: Nothing happens yet
3. **Publishing Draft Event**: When you change status from "draft" to "published", it gets posted
4. **Updating Published Event**: If you update event details (name, date, location, etc.), the Telegram message updates
5. **Archiving Event**: When status changes to "archived", the Telegram message is deleted
6. **Deleting Event**: The Telegram message is automatically deleted

### Files Modified:

- `app/Services/TelegramService.php` - Handles all Telegram API interactions
- `app/Observers/EventObserver.php` - Automatically detects event changes
- `app/Models/Event.php` - Added `telegram_message_id` field
- `app/Providers/AppServiceProvider.php` - Registers the event observer
- `config/services.php` - Added Telegram configuration
- `database/migrations/..._add_telegram_message_id_to_events_table.php` - Database migration

## Troubleshooting

### Events aren't posting to Telegram:

1. **Check bot token and channel ID** in `.env`
   ```bash
   php artisan config:clear
   ```

2. **Verify bot is admin** in your channel with "Post Messages" permission

3. **Check logs** for errors:
   ```bash
   tail -f storage/logs/laravel.log
   ```

4. **Test the configuration** in tinker:
   ```bash
   php artisan tinker
   >>> $telegram = app(\App\Services\TelegramService::class);
   >>> $event = \App\Models\Event::first();
   >>> $telegram->publishEvent($event);
   ```

### Common Issues:

**Error: "Bot was blocked by the user"**
- Make sure the bot is added as an administrator to the channel, not just a member

**Error: "Chat not found"**
- Double-check your channel ID
- For public channels, ensure you include the @ symbol
- For private channels, ensure you have the correct numeric ID

**Error: "Telegram bot token or channel ID not configured"**
- Your `.env` variables aren't loaded
- Run: `php artisan config:clear`

**Messages not updating:**
- This is expected if you manually delete the Telegram message
- The system needs the message ID to update it

## Manual Publishing

If you want to manually publish existing events to Telegram, use Laravel Tinker:

```bash
php artisan tinker
```

Then:
```php
$telegram = app(\App\Services\TelegramService::class);
$event = \App\Models\Event::find(1); // Replace 1 with your event ID
$telegram->publishEvent($event);
```

## Disabling Auto-Publishing

To temporarily disable Telegram publishing without removing the code:

1. Comment out the observer registration in `app/Providers/AppServiceProvider.php`:
```php
// Event::observe(EventObserver::class);
```

2. Clear config:
```bash
php artisan config:clear
```

## Security Notes

- Keep your `TELEGRAM_BOT_TOKEN` secret - never commit it to version control
- The `.env` file is already in `.gitignore`
- Only event managers can create/update events, so only authorized users can publish to Telegram
- The bot can only post to channels where it's an administrator

## Support

If you encounter issues:
1. Check the Laravel logs: `storage/logs/laravel.log`
2. Verify your bot token is correct
3. Ensure the bot has admin permissions in the channel
4. Test with a simple event first

---

**Ready to go!** Create a published event and watch it appear in your Telegram channel automatically! 🎉
