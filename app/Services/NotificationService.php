<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use App\Mail\NotificationMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Create a notification for a user
     */
    public static function create(
        User $user,
        string $type,
        string $title,
        string $message,
        array $data = [],
        bool $sendEmail = true
    ): Notification {
        $notification = Notification::create([
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
            'sent_via_email' => false,
        ]);

        if ($sendEmail) {
            self::sendEmail($notification);
        }

        return $notification;
    }

    /**
     * Send email notification
     */
    private static function sendEmail(Notification $notification): void
    {
        try {
            Mail::to($notification->user->email)->send(
                new NotificationMail($notification)
            );

            $notification->update(['sent_via_email' => true]);
        } catch (\Exception $e) {
            Log::error('Failed to send notification email: ' . $e->getMessage());
        }
    }

    /**
     * Notify user about upcoming event (7, 3, 2, 1 days before)
     */
    public static function notifyUpcomingEvent(User $user, $event): void
    {
        $daysUntil = now()->diffInDays($event->start_date);

        // Create more specific messages based on days until event
        $title = match(true) {
            $daysUntil === 0 => 'Event Starting Today!',
            $daysUntil === 1 => 'Event Tomorrow!',
            $daysUntil <= 3 => 'Event Starting Soon',
            default => 'Upcoming Event Reminder'
        };

        $dayText = $daysUntil === 1 ? 'day' : 'days';
        $message = match(true) {
            $daysUntil === 0 => "'{$event->name}' is starting today! Don't forget to attend.",
            $daysUntil === 1 => "'{$event->name}' is starting tomorrow on " . date('F j, Y', strtotime($event->start_date)) . ". Get ready!",
            default => "The event '{$event->name}' is starting in {$daysUntil} {$dayText} on " . date('F j, Y', strtotime($event->start_date)) . "."
        };

        self::create(
            $user,
            Notification::TYPE_EVENT_UPCOMING,
            $title,
            $message,
            [
                'event_id' => $event->id,
                'event_name' => $event->name,
                'start_date' => $event->start_date,
            ],
            true // Send email notification
        );
    }

    /**
     * Notify user about new event
     */
    public static function notifyNewEvent(User $user, $event): void
    {
        self::create(
            $user,
            Notification::TYPE_EVENT_NEW,
            'New Event Published',
            "A new event '{$event->name}' has been published. Register now!",
            [
                'event_id' => $event->id,
                'event_name' => $event->name,
                'start_date' => $event->start_date,
            ]
        );
    }

    /**
     * Notify manager about successful event creation
     */
    public static function notifyManagerEventCreated(User $manager, $event): void
    {
        self::create(
            $manager,
            Notification::TYPE_EVENT_NEW,
            'Event Created Successfully',
            "Your event '{$event->name}' has been created and published successfully. Members have been notified.",
            [
                'event_id' => $event->id,
                'event_name' => $event->name,
                'start_date' => $event->start_date,
            ]
        );
    }

    /**
     * Notify user about registration approval
     */
    public static function notifyRegistrationApproved(User $user, $event): void
    {
        self::create(
            $user,
            Notification::TYPE_REGISTRATION_APPROVED,
            'Registration Approved',
            "Your registration for '{$event->name}' has been approved!",
            [
                'event_id' => $event->id,
                'event_name' => $event->name,
                'start_date' => $event->start_date,
            ]
        );
    }

    /**
     * Notify user about registration rejection
     */
    public static function notifyRegistrationRejected(User $user, $event, string $reason = ''): void
    {
        $message = "Your registration for '{$event->name}' has been rejected.";
        if ($reason) {
            $message .= " Reason: {$reason}";
        }

        self::create(
            $user,
            Notification::TYPE_REGISTRATION_REJECTED,
            'Registration Rejected',
            $message,
            [
                'event_id' => $event->id,
                'event_name' => $event->name,
                'reason' => $reason,
            ]
        );
    }

    /**
     * Notify user about volunteer ranking update
     */
    public static function notifyRankingUpdate(User $user, int $newRank, int $totalHours): void
    {
        self::create(
            $user,
            Notification::TYPE_RANKING_UPDATE,
            'Volunteer Ranking Updated',
            "Great job! You're now ranked #{$newRank} with {$totalHours} hours of volunteer work!",
            [
                'rank' => $newRank,
                'total_hours' => $totalHours,
            ],
            true // Send email for ranking updates
        );
    }

    /**
     * Notify manager about pending registration
     */
    public static function notifyManagerPendingRegistration($manager, User $user, $event): void
    {
        self::create(
            $manager,
            Notification::TYPE_REGISTRATION_PENDING,
            'Registration Awaiting Approval',
            "{$user->name} has registered for '{$event->name}' and is awaiting your approval.",
            [
                'event_id' => $event->id,
                'event_name' => $event->name,
                'user_id' => $user->id,
                'user_name' => $user->name,
            ]
        );
    }

    /**
     * Notify manager about new member registration
     */
    public static function notifyManagerNewRegistration($manager, User $user, $event): void
    {
        self::create(
            $manager,
            Notification::TYPE_NEW_REGISTRATION,
            'New Event Registration',
            "{$user->name} has registered for the event '{$event->name}'.",
            [
                'event_id' => $event->id,
                'event_name' => $event->name,
                'user_id' => $user->id,
                'user_name' => $user->name,
            ]
        );
    }

    /**
     * Notify a single manager about upcoming event
     */
    public static function notifyManagerUpcomingEvent(User $manager, $event): void
    {
        $daysUntil = now()->diffInDays($event->start_date);

        $title = match(true) {
            $daysUntil === 0 => 'Event Starting Today!',
            $daysUntil === 1 => 'Event Tomorrow - Action Required',
            $daysUntil <= 3 => 'Event Starting Soon',
            default => 'Upcoming Event Reminder'
        };

        $dayText = $daysUntil === 1 ? 'day' : 'days';
        $message = match(true) {
            $daysUntil === 0 => "The event '{$event->name}' is starting today! Ensure all preparations are complete.",
            $daysUntil === 1 => "The event '{$event->name}' is starting tomorrow. Review participant registrations and final preparations.",
            default => "The event '{$event->name}' is starting in {$daysUntil} {$dayText}. Review participant registrations and preparations."
        };

        self::create(
            $manager,
            Notification::TYPE_EVENT_UPCOMING,
            $title,
            $message,
            [
                'event_id' => $event->id,
                'event_name' => $event->name,
                'start_date' => $event->start_date,
            ],
            true // Send email notification
        );
    }

    /**
     * Notify all managers about upcoming event
     */
    public static function notifyManagersUpcomingEvent($event): void
    {
        $managers = User::where('role', 'manager')->get();

        foreach ($managers as $manager) {
            self::notifyManagerUpcomingEvent($manager, $event);
        }
    }

    /**
     * Notify manager about their action (approval/rejection) confirmation
     */
    public static function notifyManagerActionConfirmation($manager, User $user, $event, string $action): void
    {
        $type = $action === 'approved'
            ? Notification::TYPE_MANAGER_APPROVED_REGISTRATION
            : Notification::TYPE_MANAGER_REJECTED_REGISTRATION;

        $title = $action === 'approved'
            ? 'Registration Approved'
            : 'Registration Rejected';

        $message = "You have {$action} {$user->name}'s registration for '{$event->name}'.";

        self::create(
            $manager,
            $type,
            $title,
            $message,
            [
                'event_id' => $event->id,
                'event_name' => $event->name,
                'user_id' => $user->id,
                'user_name' => $user->name,
                'action' => $action,
            ]
        );
    }

    /**
     * Mark notification as read
     */
    public static function markAsRead(int $notificationId, int $userId): bool
    {
        $notification = Notification::where('id', $notificationId)
            ->where('user_id', $userId)
            ->first();

        if ($notification) {
            $notification->markAsRead();
            return true;
        }

        return false;
    }

    /**
     * Mark notification as unread
     */
    public static function markAsUnread(int $notificationId, int $userId): bool
    {
        $notification = Notification::where('id', $notificationId)
            ->where('user_id', $userId)
            ->first();

        if ($notification) {
            $notification->markAsUnread();
            return true;
        }

        return false;
    }

    /**
     * Mark all notifications as read for a user
     */
    public static function markAllAsRead(int $userId): void
    {
        Notification::where('user_id', $userId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    /**
     * Get unread notification count for a user
     */
    public static function getUnreadCount(int $userId): int
    {
        return Notification::where('user_id', $userId)
            ->whereNull('read_at')
            ->count();
    }

    /**
     * Delete old read notifications (older than 30 days)
     */
    public static function cleanupOldNotifications(): void
    {
        Notification::whereNotNull('read_at')
            ->where('read_at', '<', now()->subDays(30))
            ->delete();
    }

    /**
     * Check and notify user about incomplete profile
     */
    public static function checkAndNotifyIncompleteProfile(User $user): void
    {
        // Don't notify managers and admins
        if (in_array($user->role, ['manager', 'admin'])) {
            return;
        }

        // If profile is complete, remove any existing incomplete profile notifications
        if ($user->isProfileComplete()) {
            Notification::where('user_id', $user->id)
                ->where('type', Notification::TYPE_PROFILE_INCOMPLETE)
                ->delete();
            return;
        }

        // Check if user already has an unread profile incomplete notification
        $existingNotification = Notification::where('user_id', $user->id)
            ->where('type', Notification::TYPE_PROFILE_INCOMPLETE)
            ->whereNull('read_at')
            ->first();

        if ($existingNotification) {
            // Update existing notification with current missing fields
            $missingFields = $user->getMissingProfileFields();
            $message = self::generateProfileIncompleteMessage($missingFields);

            $existingNotification->update([
                'message' => $message,
                'data' => ['missing_fields' => $missingFields],
            ]);
        } else {
            // Create new notification
            $missingFields = $user->getMissingProfileFields();
            $message = self::generateProfileIncompleteMessage($missingFields);

            self::create(
                $user,
                Notification::TYPE_PROFILE_INCOMPLETE,
                'Complete Your Profile',
                $message,
                ['missing_fields' => $missingFields],
                true // Send email for profile reminders
            );
        }
    }

    /**
     * Generate profile incomplete message based on missing fields
     */
    private static function generateProfileIncompleteMessage(array $missingFields): string
    {
        $fieldNames = [
            'profile_picture' => 'profile picture',
            'secondary_email' => 'secondary email',
            'phone_number' => 'phone number',
            'faculty' => 'faculty',
        ];

        $missing = array_map(fn($field) => $fieldNames[$field] ?? $field, $missingFields);

        if (count($missing) === 1) {
            return "Please complete your profile by adding your {$missing[0]}.";
        }

        $lastField = array_pop($missing);
        return "Please complete your profile by adding your " . implode(', ', $missing) . " and {$lastField}.";
    }

    /**
     * Batch check and notify all members with incomplete profiles
     */
    public static function notifyAllIncompleteProfiles(): void
    {
        $members = User::where('role', 'member')->get();

        foreach ($members as $member) {
            self::checkAndNotifyIncompleteProfile($member);
        }
    }
}
