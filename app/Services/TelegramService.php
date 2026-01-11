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
    protected function formatEventMessage(Event $event, ?string $customCaption = null): string
    {
        if ($customCaption) {
            return $customCaption . "\n\n" . $this->getWebsiteLink();
        }

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

        $message .= "\n" . $this->getWebsiteLink();

        return $message;
    }

    /**
     * Get formatted website link
     */
    protected function getWebsiteLink(): string
    {
        $websiteUrl = config('app.url');
        return "🌐 *Register Now:* {$websiteUrl}\n✨ _Join us and make a difference!_";
    }

    /**
     * Strip Markdown formatting from text
     */
    protected function stripMarkdown(string $text): string
    {
        // Remove Markdown formatting: *bold*, _italic_, `code`, [links](url)
        $text = preg_replace('/\*(.+?)\*/', '$1', $text); // Remove *bold*
        $text = preg_replace('/_(.+?)_/', '$1', $text);   // Remove _italic_
        $text = preg_replace('/`(.+?)`/', '$1', $text);   // Remove `code`
        $text = preg_replace('/\[(.+?)\]\(.+?\)/', '$1', $text); // Remove [text](url)

        return $text;
    }

    /**
     * Send a blast message (manual or automated)
     */
    public function sendBlast(Event $event, string $message, ?string $imagePath = null): ?int
    {
        Log::info('TelegramService::sendBlast called', [
            'event_id' => $event->id,
            'event_name' => $event->name,
            'bot_token_set' => !empty($this->botToken),
            'channel_id_set' => !empty($this->channelId),
            'channel_id' => $this->channelId,
            'message_length' => strlen($message),
            'has_image' => !is_null($imagePath) || !is_null($event->image_path),
        ]);

        if (!$this->botToken || !$this->channelId) {
            Log::warning('Telegram bot token or channel ID not configured');
            return null;
        }

        try {
            // Add website link to blast message if not already included
            if (!str_contains($message, config('app.url'))) {
                $message .= "\n\n" . $this->getWebsiteLink();
            }

            $messageId = null;

            // If custom image path is provided, use it; otherwise use event image
            $finalImagePath = $imagePath ?? $event->image_path;

            if ($finalImagePath && Storage::disk('public')->exists($finalImagePath)) {
                Log::info('Sending blast with photo', ['image_path' => $finalImagePath]);
                $messageId = $this->sendPhotoByPath($finalImagePath, $message);
            } else {
                Log::info('Sending blast as text message');
                $messageId = $this->sendMessage($message);
            }

            if ($messageId) {
                Log::info('Blast sent successfully', ['message_id' => $messageId]);
            } else {
                Log::warning('Blast failed - no message ID returned');
            }

            return $messageId;

        } catch (\Exception $e) {
            Log::error('Failed to send blast to Telegram: ' . $e->getMessage(), [
                'exception' => get_class($e),
                'trace' => $e->getTraceAsString(),
            ]);
            return null;
        }
    }

    /**
     * Send a text message to the channel
     */
    protected function sendMessage(string $message): ?int
    {
        // First attempt with Markdown
        $response = Http::post("{$this->baseUrl}/sendMessage", [
            'chat_id' => $this->channelId,
            'text' => $message,
            'parse_mode' => 'Markdown',
        ]);

        if ($response->successful()) {
            return $response->json('result.message_id');
        }

        // Log the error response from Telegram
        Log::error('Telegram sendMessage failed', [
            'status' => $response->status(),
            'response' => $response->json(),
            'message_length' => strlen($message),
        ]);

        // Check if it's a parse error and retry without Markdown
        $errorDescription = $response->json('description', '');
        if (str_contains($errorDescription, 'parse') || str_contains($errorDescription, 'markdown') || str_contains($errorDescription, 'entities')) {
            Log::info('Retrying message without Markdown parse mode');

            $retryResponse = Http::post("{$this->baseUrl}/sendMessage", [
                'chat_id' => $this->channelId,
                'text' => $this->stripMarkdown($message), // Remove Markdown formatting
                'parse_mode' => null,
            ]);

            if ($retryResponse->successful()) {
                Log::info('Message sent successfully without Markdown');
                return $retryResponse->json('result.message_id');
            }
        }

        // Check if message is too long (Telegram limit is 4096 characters)
        if (strlen($message) > 4096) {
            Log::warning('Message too long, truncating');
            $truncatedMessage = substr($message, 0, 4093) . '...';
            
            $retryResponse = Http::post("{$this->baseUrl}/sendMessage", [
                'chat_id' => $this->channelId,
                'text' => $truncatedMessage,
                'parse_mode' => null,
            ]);

            if ($retryResponse->successful()) {
                Log::info('Truncated message sent successfully');
                return $retryResponse->json('result.message_id');
            }
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

        // Telegram caption limit is 1024 characters
        if (strlen($caption) > 1024) {
            Log::warning('Caption too long for photo, truncating', ['length' => strlen($caption)]);
            $caption = substr($caption, 0, 1021) . '...';
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

        // Log the error response from Telegram
        Log::error('Telegram sendPhoto failed', [
            'status' => $response->status(),
            'response' => $response->json(),
            'caption_length' => strlen($caption),
            'image_path' => $imagePath,
        ]);

        // If markdown parse error, retry without markdown
        $errorDescription = $response->json('description', '');
        if (str_contains($errorDescription, 'parse') || str_contains($errorDescription, 'markdown') || str_contains($errorDescription, 'entities')) {
            Log::info('Retrying photo with plain text caption');

            $retryResponse = Http::attach(
                'photo',
                file_get_contents($imagePath),
                basename($imagePath)
            )->post("{$this->baseUrl}/sendPhoto", [
                'chat_id' => $this->channelId,
                'caption' => $this->stripMarkdown($caption),
                'parse_mode' => null,
            ]);

            if ($retryResponse->successful()) {
                Log::info('Photo sent successfully without Markdown');
                return $retryResponse->json('result.message_id');
            }
        }

        // If photo fails completely, fall back to text message
        Log::warning('Photo send failed, falling back to text message');
        return $this->sendMessage($caption);
    }

    /**
     * Send a photo by path with caption
     */
    protected function sendPhotoByPath(string $imagePath, string $caption): ?int
    {
        $fullPath = Storage::disk('public')->path($imagePath);

        if (!file_exists($fullPath)) {
            Log::warning("Image not found: {$fullPath}");
            return $this->sendMessage($caption);
        }

        // Telegram caption limit is 1024 characters
        if (strlen($caption) > 1024) {
            Log::warning('Caption too long for photo, truncating', ['length' => strlen($caption)]);
            $caption = substr($caption, 0, 1021) . '...';
        }

        $response = Http::attach(
            'photo',
            file_get_contents($fullPath),
            basename($fullPath)
        )->post("{$this->baseUrl}/sendPhoto", [
            'chat_id' => $this->channelId,
            'caption' => $caption,
            'parse_mode' => 'Markdown',
        ]);

        if ($response->successful()) {
            return $response->json('result.message_id');
        }

        // Log the error response from Telegram
        Log::error('Telegram sendPhotoByPath failed', [
            'status' => $response->status(),
            'response' => $response->json(),
            'caption_length' => strlen($caption),
            'image_path' => $fullPath,
        ]);

        // If markdown parse error, retry without markdown
        $errorDescription = $response->json('description', '');
        if (str_contains($errorDescription, 'parse') || str_contains($errorDescription, 'markdown') || str_contains($errorDescription, 'entities')) {
            Log::info('Retrying photo with plain text caption');

            $retryResponse = Http::attach(
                'photo',
                file_get_contents($fullPath),
                basename($fullPath)
            )->post("{$this->baseUrl}/sendPhoto", [
                'chat_id' => $this->channelId,
                'caption' => $this->stripMarkdown($caption),
                'parse_mode' => null,
            ]);

            if ($retryResponse->successful()) {
                Log::info('Photo sent successfully without Markdown');
                return $retryResponse->json('result.message_id');
            }
        }

        // If photo fails completely, fall back to text message
        Log::warning('Photo send failed, falling back to text message');
        return $this->sendMessage($caption);
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
