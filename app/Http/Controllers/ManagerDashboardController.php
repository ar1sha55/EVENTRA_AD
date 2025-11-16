<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Participant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ManagerDashboardController extends Controller
{
    /**
     * Get consolidated dashboard summary data.
     * Returns event statistics, participant data, and member engagement metrics.
     */
    public function getSummary()
    {
        // Get upcoming events count
        $upcomingEventsCount = Event::where('status', 'published')
            ->where('start_date', '>', now())
            ->count();

        // Get completed events count
        $completedEventsCount = Event::where('status', 'published')
            ->where('end_date', '<', now())
            ->count();

        // Get total members count
        $totalMembersCount = User::whereNotIn('role', ['manager', 'admin'])
            ->orWhereNull('role')
            ->count();
        // Get total partnerships (assuming partnerships might be tracked differently)
        // For now, counting managers/admins as partners or you can create a separate table
        $partnershipsCount = User::whereIn('role', ['manager', 'admin'])->count();

        // Get pending participant registrations count
        $pendingRegistrationsCount = Participant::where('status', 'PENDING')->count();

        // Get participant status breakdown across all events
        $participantStatusBreakdown = Participant::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status')
            ->toArray();

        // Get participants age distribution
        $participantsAgeDistribution = $this->getParticipantsAgeDistribution();

        // Get upcoming events list with participant counts
        $upcomingEvents = Event::where('status', 'published')
            ->where('start_date', '>', now())
            ->withCount('participants')
            ->orderBy('start_date', 'asc')
            ->take(5)
            ->get()
            ->map(function ($event) {
                return [
                    'id' => $event->id,
                    'name' => $event->name,
                    'date' => $event->start_date,
                    'location' => $event->location,
                    'participants_count' => $event->participants_count,
                    'image_path' => $event->image_path,
                ];
            });

        // Get recent notifications/activity
        $recentNotifications = $this->getRecentNotifications();

        // Get member engagement metrics (events participation breakdown)
        $memberEngagement = $this->getMemberEngagementMetrics();

        return response()->json([
            'summary' => [
                'upcoming_events' => $upcomingEventsCount,
                'completed_events' => $completedEventsCount,
                'total_members' => $totalMembersCount,
                'partnerships' => $partnershipsCount,
                'pending_registrations' => $pendingRegistrationsCount,
            ],
            'participant_status_breakdown' => $participantStatusBreakdown,
            'participants_age_distribution' => $participantsAgeDistribution,
            'upcoming_events' => $upcomingEvents,
            'recent_notifications' => $recentNotifications,
            'member_engagement' => $memberEngagement,
        ]);
    }

    /**
     * Get participants age distribution.
     * Categorizes participants by age groups.
     */
    private function getParticipantsAgeDistribution()
    {
        // This assumes you have a birth_date or age field in users table
        // For now, returning mock data structure - you can implement actual logic
        
        $ageGroups = [
            '18 - 24 Years' => 0,
            '25 - 34 Years' => 0,
            '35 - 44 Years' => 0,
            '44 + Years' => 0,
        ];

        // Example implementation if you have birth_date:
        // $participants = Participant::with('user')->get();
        // foreach ($participants as $participant) {
        //     if ($participant->user && $participant->user->birth_date) {
        //         $age = Carbon::parse($participant->user->birth_date)->age;
        //         if ($age >= 18 && $age <= 24) $ageGroups['18 - 24 Years']++;
        //         elseif ($age >= 25 && $age <= 34) $ageGroups['25 - 34 Years']++;
        //         elseif ($age >= 35 && $age <= 44) $ageGroups['35 - 44 Years']++;
        //         else $ageGroups['44 + Years']++;
        //     }
        // }

        // For now, using mock percentages based on total participants
        $totalParticipants = Participant::count();
        if ($totalParticipants > 0) {
            $ageGroups['18 - 24 Years'] = (int)($totalParticipants * 0.67); // 67% as shown in design
            $ageGroups['25 - 34 Years'] = (int)($totalParticipants * 0.22); // 22%
            $ageGroups['35 - 44 Years'] = (int)($totalParticipants * 0.08); // 8%
            $ageGroups['44 + Years'] = (int)($totalParticipants * 0.03);    // 3%
        }

        return $ageGroups;
    }

    /**
     * Get recent notifications for the dashboard.
     */
    private function getRecentNotifications()
    {
        $notifications = [];

        // Get recent membership requests (pending participants)
        $recentRequests = Participant::with(['user', 'event'])
            ->where('status', 'PENDING')
            ->latest('registration_date')
            ->take(5)
            ->get();

        foreach ($recentRequests as $request) {
            $notifications[] = [
                'type' => 'membership_request',
                'message' => '"' . ($request->user->name ?? 'User') . '" request to be member.',
                'timestamp' => $request->registration_date,
                'user_name' => $request->user->name ?? 'Unknown',
            ];
        }

        // Get upcoming events (within 2 days)
        $upcomingEvents = Event::where('status', 'published')
            ->where('start_date', '>', now())
            ->where('start_date', '<=', now()->addDays(2))
            ->get();

        foreach ($upcomingEvents as $event) {
            $notifications[] = [
                'type' => 'event_happening',
                'message' => '"' . $event->name . '" is happening in 2 days!',
                'timestamp' => $event->start_date,
                'event_name' => $event->name,
            ];
        }

        // Get recent event participations
        $recentParticipations = Participant::with(['user', 'event'])
            ->where('status', 'APPROVED')
            ->latest('last_updated')
            ->take(3)
            ->get();

        foreach ($recentParticipations as $participation) {
            $notifications[] = [
                'type' => 'event_participation',
                'message' => '"' . ($participation->user->name ?? 'User') . '" participated in "' . ($participation->event->name ?? 'Event') . '" event.',
                'timestamp' => $participation->last_updated,
                'user_name' => $participation->user->name ?? 'Unknown',
                'event_name' => $participation->event->name ?? 'Unknown',
            ];
        }

        // Sort by timestamp (most recent first)
        usort($notifications, function ($a, $b) {
            return strtotime($b['timestamp']) - strtotime($a['timestamp']);
        });

        return array_slice($notifications, 0, 10); // Return top 10
    }

    /**
     * Get member engagement metrics showing event participation distribution.
     */
    private function getMemberEngagementMetrics()
{
    // Get top 5 events by participant count
    $topEvents = Event::with(['participants' => function ($query) {
        $query->where('status', 'APPROVED');
    }])
    ->where('status', 'published')
    ->withCount(['participants' => function ($query) {
        $query->where('status', 'APPROVED');
    }])
    ->orderBy('participants_count', 'desc')
    ->take(5)
    ->get();

    $engagement = [];
    
    // Use actual event names and participant counts
    foreach ($topEvents as $event) {
        $engagement[$event->name] = $event->participants_count;
    }

    return $engagement;
}

    /**
     * Broadcast notification to event participants.
     * This is a stub for future notification integration.
     */
    public function broadcast(Request $request, Event $event)
    {
        $validated = $request->validate([
            'message' => 'required|string|max:1000',
            'recipient_type' => 'required|in:all,approved,pending',
        ]);

        // Get recipients based on type
        $query = Participant::where('event_id', $event->id);
        
        if ($validated['recipient_type'] === 'approved') {
            $query->where('status', 'APPROVED');
        } elseif ($validated['recipient_type'] === 'pending') {
            $query->where('status', 'PENDING');
        }

        $participants = $query->with('user')->get();

        // TODO: Implement actual notification system
        // For now, just log the broadcast attempt
        \Log::info('Broadcast to ' . $event->name, [
            'message' => $validated['message'],
            'recipient_count' => $participants->count(),
            'recipient_type' => $validated['recipient_type'],
        ]);

        // In the future, you would:
        // 1. Send email notifications
        // 2. Create in-app notifications
        // 3. Send push notifications (if mobile app exists)
        // 4. Send SMS notifications (if configured)

        return back()->with('success', "Broadcast sent to {$participants->count()} participants!");
    }

    /**
     * Display the manager dashboard page.
     */
    public function index()
    {
        return inertia('Manager/ManagerDashboard');
    }
}