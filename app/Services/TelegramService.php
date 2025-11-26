<?php

namespace App\Services;

use App\Models\Event;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class TelegramService
{
    protected $botToken;
    protected $channelId;
    protected $baseUrl;

    public function __construct()
    {
        $this->botToken = config('services.telegram.bot_token');
        $this->channelId = config('services.telegram.channel_id');
        $this->baseUrl = "https://api.telegram.org/bot{$this->botToken}";
    }

    /**
     * Publish an event to the Telegram channel
     */
    public function publishEvent(Event $event): bool
    {
        if (!$this->botToken || !$this->channelId) {
            Log::warning('Telegram bot token or channel ID not configured');
            return false;
        }

        try {
            $message = $this->formatEventMessage($event);
            $messageId = null;

            // If event has an image, send photo with caption
            if ($event->image_path && Storage::disk('public')->exists($event->image_path)) {
                $messageId = $this->sendPhoto($event, $message);
            } else {
                // Otherwise send text message
                $messageId = $this->sendMessage($message);
            }

            // Store the message ID in the event
            if ($messageId) {
                $event->telegram_message_id = $messageId;
                $event->saveQuietly(); // Save without triggering observers
                return true;
            }

            return false;

        } catch (\Exception $e) {
            Log::error('Failed to publish event to Telegram: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Format event details into a Telegram message
     */
    protected function formatEventMessage(Event $event): string
    {
        $message = "🎉 *New Event: {$event->name}*\n\n";
        $message .= "📝 " . strip_tags($event->description) . "\n\n";
        $message .= "📅 *Start:* " . $event->start_date->format('d M Y, h:i A') . "\n";
        $message .= "📅 *End:* " . $event->end_date->format('d M Y, h:i A') . "\n";
        $message .= "📍 *Location:* {$event->location}\n";

        if ($event->capacity) {
            $message .= "👥 *Capacity:* {$event->capacity} participants\n";
        }

        if ($event->fee && $event->fee > 0) {
            $message .= "💰 *Fee:* RM " . number_format($event->fee, 2) . "\n";
        } else {
            $message .= "🆓 *Free Event*\n";
        }

        $message .= "\n✨ Register now on our website!";

        return $message;
    }

    /**
     * Send a text message to the channel
     */
    protected function sendMessage(string $message): ?int
    {
        $response = Http::post("{$this->baseUrl}/sendMessage", [
            'chat_id' => $this->channelId,
            'text' => $message,
            'parse_mode' => 'Markdown',
        ]);

        if ($response->successful()) {
            return $response->json('result.message_id');
        }

        return null;
    }

    /**
     * Send a photo with caption to the channel
     */
    protected function sendPhoto(Event $event, string $caption): ?int
    {
        $imagePath = Storage::disk('public')->path($event->image_path);

        // Check if file exists
        if (!file_exists($imagePath)) {
            Log::warning("Event image not found: {$imagePath}");
            return $this->sendMessage($caption);
        }

        $response = Http::attach(
            'photo',
            file_get_contents($imagePath),
            basename($imagePath)
        )->post("{$this->baseUrl}/sendPhoto", [
            'chat_id' => $this->channelId,
            'caption' => $caption,
            'parse_mode' => 'Markdown',
        ]);

        if ($response->successful()) {
            return $response->json('result.message_id');
        }

        return null;
    }

    /**
     * Update an existing event message (for when events are updated)
     */
    public function updateEventMessage(Event $event, int $messageId): bool
    {
        if (!$this->botToken || !$this->channelId) {
            return false;
        }

        try {
            $message = $this->formatEventMessage($event);

            $response = Http::post("{$this->baseUrl}/editMessageText", [
                'chat_id' => $this->channelId,
                'message_id' => $messageId,
                'text' => $message,
                'parse_mode' => 'Markdown',
            ]);

            return $response->successful();

        } catch (\Exception $e) {
            Log::error('Failed to update Telegram message: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Delete a message from the channel
     */
    public function deleteMessage(int $messageId): bool
    {
        if (!$this->botToken || !$this->channelId) {
            return false;
        }

        try {
            $response = Http::post("{$this->baseUrl}/deleteMessage", [
                'chat_id' => $this->channelId,
                'message_id' => $messageId,
            ]);

            return $response->successful();

        } catch (\Exception $e) {
            Log::error('Failed to delete Telegram message: ' . $e->getMessage());
            return false;
        }
    }
}
