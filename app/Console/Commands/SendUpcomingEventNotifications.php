<?php

namespace App\Console\Commands;

use App\Models\Event;
use App\Models\Participant;
use App\Services\NotificationService;
use Illuminate\Console\Command;
use Carbon\Carbon;

class SendUpcomingEventNotifications extends Command
{
    protected $signature = 'notifications:send-upcoming-events';
    protected $description = 'Send countdown notifications for upcoming events (7, 3, 2, 1 days before)';

    public function handle()
    {
        $this->info('Checking for upcoming events...');

        // Define the days to send notifications
        $notificationDays = [7, 3, 2, 1];
        $totalSent = 0;

        foreach ($notificationDays as $days) {
            $sent = $this->sendNotificationsForDay($days);
            $totalSent += $sent;
        }

        $this->info("\nSummary: Sent {$totalSent} notification(s)");
        return 0;
    }

    private function sendNotificationsForDay(int $days): int
    {
        $targetDate = Carbon::today()->addDays($days);
        $dayText = $days === 1 ? 'day' : 'days';
        $this->info("\nChecking events starting on {$targetDate->toDateString()} ({$days} {$dayText} from now)...");

        // Find events that start on the target date
        $events = Event::where('status', 'published')
            ->whereDate('start_date', $targetDate->toDateString())
            ->get();

        if ($events->isEmpty()) {
            $this->info("No events found for {$days} days from now.");
            return 0;
        }

        $sent = 0;

        foreach ($events as $event) {
            $this->info("Processing event: {$event->name}");

            // Send notifications to all users (members and managers)
            $users = \App\Models\User::all();

            foreach ($users as $user) {
                // Check if notification already sent for this event and user today
                if (!$this->hasNotificationBeenSent($user, $event)) {
                    // Use role-appropriate notification
                    if ($user->role === 'manager' || $user->role === 'admin') {
                        NotificationService::notifyManagerUpcomingEvent($user, $event);
                    } else {
                        NotificationService::notifyUpcomingEvent($user, $event);
                    }
                    $sent++;
                }
            }

            $this->info("✓ Sent notifications for '{$event->name}' to all users");
        }

        return $sent;
    }

    /**
     * Check if notification has been sent to user for this event today
     */
    private function hasNotificationBeenSent($user, $event): bool
    {
        return \App\Models\Notification::where('user_id', $user->id)
            ->where('type', \App\Models\Notification::TYPE_EVENT_UPCOMING)
            ->where('data->event_id', $event->id)
            ->whereDate('created_at', Carbon::today())
            ->exists();
    }

}
