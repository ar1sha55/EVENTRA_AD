<?php

namespace App\Observers;

use App\Models\Event;
use App\Models\ActivityLog;
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
        // Log activity
        ActivityLog::logActivity(
            action: 'event.created',
            description: "Event '{$event->name}' was created with status '{$event->status}'",
            resourceType: 'Event',
            resourceId: $event->id,
            newValues: [
                'name' => $event->name,
                'status' => $event->status,
                'start_date' => $event->start_date,
                'location' => $event->location,
            ]
        );

        // Note: Telegram blast is NOT automatic on publish.
        // Manager must explicitly choose to blast via EventBlast page.
    }

   
    public function updated(Event $event): void
    {
        $changes = $event->getChanges();

        // Don't log if only timestamps changed
        if (!(count($changes) === 1 && isset($changes['updated_at']))) {
            // Special handling for status changes
            if (isset($changes['status'])) {
                $oldStatus = $event->getOriginal('status');
                $newStatus = $changes['status'];

                ActivityLog::logActivity(
                    action: 'event.status_changed',
                    description: "Event '{$event->name}' status changed from '{$oldStatus}' to '{$newStatus}'",
                    resourceType: 'Event',
                    resourceId: $event->id,
                    oldValues: ['status' => $oldStatus],
                    newValues: ['status' => $newStatus],
                    properties: [
                        'event_name' => $event->name,
                        'event_date' => $event->start_date,
                    ]
                );
            } else {
                // Regular update
                $changedFields = implode(', ', array_keys($changes));

                ActivityLog::logActivity(
                    action: 'event.updated',
                    description: "Event '{$event->name}' was updated (fields: {$changedFields})",
                    resourceType: 'Event',
                    resourceId: $event->id,
                    oldValues: array_intersect_key($event->getOriginal(), $changes),
                    newValues: $changes
                );
            }
        }

        // Note: Telegram blast is NOT automatic on publish.
        // Manager must explicitly choose to blast via EventBlast page.
        // However, if event was already blasted and details are updated, we update the Telegram message.
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
        // Log activity
        ActivityLog::logActivity(
            action: 'event.deleted',
            description: "Event '{$event->name}' was deleted (status was: {$event->status})",
            resourceType: 'Event',
            resourceId: $event->id,
            oldValues: [
                'name' => $event->name,
                'status' => $event->status,
                'start_date' => $event->start_date,
                'end_date' => $event->end_date,
                'location' => $event->location,
            ]
        );

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