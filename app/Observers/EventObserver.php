<?php

namespace App\Observers;

use App\Models\Event;
use App\Services\TelegramService;
use Illuminate\Support\Facades\Log;

class EventObserver
{
    protected $telegramService;

    public function __construct(TelegramService $telegramService)
    {
        $this->telegramService = $telegramService;
    }

   
    public function created(Event $event): void
    {
        // Only publish to Telegram if the event is published
        if ($event->status === 'published') {
            $this->publishToTelegram($event);
        }
    }

   
    public function updated(Event $event): void
    {
        // Check if status changed to 'published'
        if ($event->status === 'published' && $event->wasChanged('status')) {
            // If changing from draft/archived to published, publish for the first time
            if (!$event->telegram_message_id) {
                $this->publishToTelegram($event);
            }
        }

        // If event is published and details were updated
        if ($event->status === 'published' && $event->telegram_message_id) {
            // Check if important fields were updated
            $importantFields = ['name', 'description', 'start_date', 'end_date', 'location', 'capacity', 'fee'];
            if ($event->wasChanged($importantFields)) {
                $this->updateTelegramMessage($event);
            }
        }

        // If status changed from published to draft/archived, delete the Telegram message
        if ($event->status !== 'published' && $event->wasChanged('status') && $event->telegram_message_id) {
            $this->deleteTelegramMessage($event);
        }
    }

   
    public function deleted(Event $event): void
    {
        if ($event->telegram_message_id) {
            $this->deleteTelegramMessage($event);
        }
    }

    protected function publishToTelegram(Event $event): void
    {
        try {
            $success = $this->telegramService->publishEvent($event);

            if ($success) {
                Log::info("Event {$event->id} published to Telegram successfully");
            }
        } catch (\Exception $e) {
            Log::error("Failed to publish event {$event->id} to Telegram: " . $e->getMessage());
        }
    }

  
    protected function updateTelegramMessage(Event $event): void
    {
        try {
            $this->telegramService->updateEventMessage($event, (int) $event->telegram_message_id);
            Log::info("Event {$event->id} updated on Telegram successfully");
        } catch (\Exception $e) {
            Log::error("Failed to update event {$event->id} on Telegram: " . $e->getMessage());
        }
    }

   
    protected function deleteTelegramMessage(Event $event): void
    {
        try {
            $this->telegramService->deleteMessage((int) $event->telegram_message_id);
            $event->telegram_message_id = null;
            $event->saveQuietly(); // Save without triggering observers
            Log::info("Event {$event->id} removed from Telegram successfully");
        } catch (\Exception $e) {
            Log::error("Failed to delete event {$event->id} from Telegram: " . $e->getMessage());
        }
    }
}