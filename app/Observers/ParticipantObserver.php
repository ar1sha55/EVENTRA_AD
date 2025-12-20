<?php

namespace App\Observers;

use App\Models\Participant;
use App\Models\ActivityLog;

class ParticipantObserver
{
    /**
     * Handle the Participant "created" event.
     */
    public function created(Participant $participant): void
    {
        $participant->load(['user', 'event']); // Eager load relationships

        ActivityLog::logActivity(
            action: 'registration.created',
            description: "{$participant->user->name} registered for event '{$participant->event->name}' (status: {$participant->status})",
            resourceType: 'Participant',
            resourceId: $participant->id,
            properties: [
                'user_id' => $participant->user_id,
                'user_name' => $participant->user->name,
                'event_id' => $participant->event_id,
                'event_name' => $participant->event->name,
                'status' => $participant->status,
            ]
        );
    }

    /**
     * Handle the Participant "updated" event.
     */
    public function updated(Participant $participant): void
    {
        $changes = $participant->getChanges();

        // Don't log if only timestamps changed
        if (count($changes) === 1 && isset($changes['updated_at'])) {
            return;
        }

        $participant->load(['user', 'event']); // Eager load relationships

        // Special handling for status changes (pending → approved/rejected)
        if (isset($changes['status'])) {
            $oldStatus = $participant->getOriginal('status');
            $newStatus = $changes['status'];

            // Determine action based on new status
            $action = match($newStatus) {
                'approved' => 'registration.approved',
                'rejected' => 'registration.rejected',
                default => 'registration.status_changed',
            };

            $description = match($newStatus) {
                'approved' => "{$participant->user->name}'s registration for '{$participant->event->name}' was approved",
                'rejected' => "{$participant->user->name}'s registration for '{$participant->event->name}' was rejected",
                default => "{$participant->user->name}'s registration for '{$participant->event->name}' status changed to '{$newStatus}'",
            };

            ActivityLog::logActivity(
                action: $action,
                description: $description,
                resourceType: 'Participant',
                resourceId: $participant->id,
                oldValues: ['status' => $oldStatus],
                newValues: ['status' => $newStatus],
                properties: [
                    'user_id' => $participant->user_id,
                    'user_name' => $participant->user->name,
                    'event_id' => $participant->event_id,
                    'event_name' => $participant->event->name,
                ]
            );
        } else {
            // Regular update
            $changedFields = implode(', ', array_keys($changes));

            ActivityLog::logActivity(
                action: 'registration.updated',
                description: "{$participant->user->name}'s registration for '{$participant->event->name}' was updated (fields: {$changedFields})",
                resourceType: 'Participant',
                resourceId: $participant->id,
                oldValues: array_intersect_key($participant->getOriginal(), $changes),
                newValues: $changes
            );
        }
    }

    /**
     * Handle the Participant "deleted" event.
     */
    public function deleted(Participant $participant): void
    {
        $participant->load(['user', 'event']); // Eager load relationships

        ActivityLog::logActivity(
            action: 'registration.cancelled',
            description: "{$participant->user->name}'s registration for '{$participant->event->name}' was cancelled",
            resourceType: 'Participant',
            resourceId: $participant->id,
            oldValues: [
                'user_name' => $participant->user->name,
                'event_name' => $participant->event->name,
                'status' => $participant->status,
            ]
        );
    }
}
