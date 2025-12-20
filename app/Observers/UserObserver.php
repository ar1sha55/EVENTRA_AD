<?php

namespace App\Observers;

use App\Models\User;
use App\Models\ActivityLog;

class UserObserver
{
    /**
     * Handle the User "created" event.
     */
    public function created(User $user): void
    {
        ActivityLog::logActivity(
            action: 'user.created',
            description: "User '{$user->name}' was created with role '{$user->role}'",
            resourceType: 'User',
            resourceId: $user->id,
            newValues: [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'matric_id' => $user->matric_id,
            ]
        );
    }

    /**
     * Handle the User "updated" event.
     */
    public function updated(User $user): void
    {
        $changes = $user->getChanges();

        // Don't log if only timestamps changed
        if (count($changes) === 1 && isset($changes['updated_at'])) {
            return;
        }

        // Special handling for role changes
        if (isset($changes['role'])) {
            $oldRole = $user->getOriginal('role');
            $newRole = $changes['role'];

            ActivityLog::logActivity(
                action: 'user.role_changed',
                description: "User '{$user->name}' role changed from '{$oldRole}' to '{$newRole}' by " . (auth()->user()?->name ?? 'System'),
                resourceType: 'User',
                resourceId: $user->id,
                oldValues: ['role' => $oldRole],
                newValues: ['role' => $newRole]
            );
        } else {
            // Regular update
            $changedFields = implode(', ', array_keys($changes));

            ActivityLog::logActivity(
                action: 'user.updated',
                description: "User '{$user->name}' was updated (fields: {$changedFields})",
                resourceType: 'User',
                resourceId: $user->id,
                oldValues: array_intersect_key($user->getOriginal(), $changes),
                newValues: $changes
            );
        }
    }

    /**
     * Handle the User "deleted" event.
     */
    public function deleted(User $user): void
    {
        ActivityLog::logActivity(
            action: 'user.deleted',
            description: "User '{$user->name}' ({$user->email}, {$user->role}) was deleted",
            resourceType: 'User',
            resourceId: $user->id,
            oldValues: [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'matric_id' => $user->matric_id,
            ]
        );
    }
}
