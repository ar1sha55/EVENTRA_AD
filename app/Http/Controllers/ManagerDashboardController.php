<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Participant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ManagerDashboardController extends Controller
{
    /**
     * Get consolidated dashboard summary data.
     * Returns event statistics, participant data, and member engagement metrics.
     */
    public function getSummary()
    {
        try {
            // Get upcoming events count
            $upcomingEventsCount = Event::where('status', 'published')
                ->where('start_date', '>', now())
                ->count();

            // Get completed events count
            $completedEventsCount = Event::where('status', 'published')
                ->where('end_date', '<', now())
                ->count();

            // Get total members count
            $totalMembersCount = User::where(function($query) {
                $query->whereNotIn('role', ['manager', 'admin'])
                      ->orWhereNull('role');
            })->count();
            
            // Get total registrations (all participants across all events)
            $totalRegistrationsCount = Participant::count();

            // Get pending participant registrations count
            $pendingRegistrationsCount = Participant::where('status', 'PENDING')->count();

            // Get participant status breakdown across all events
            $participantStatusBreakdown = Participant::select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->get()
                ->pluck('count', 'status')
                ->toArray();

            // Get participants faculty distribution
            $participantsFacultyDistribution = $this->getParticipantsFacultyDistribution();

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

            // Get top participants by hours logged
            $topParticipants = $this->getTopParticipantsByHours();

            return response()->json([
                'summary' => [
                    'upcoming_events' => $upcomingEventsCount,
                    'completed_events' => $completedEventsCount,
                    'total_members' => $totalMembersCount,
                    'total_registrations' => $totalRegistrationsCount,
                    'pending_registrations' => $pendingRegistrationsCount,
                ],
                'participant_status_breakdown' => $participantStatusBreakdown,
                'participants_faculty_distribution' => $participantsFacultyDistribution,
                'upcoming_events' => $upcomingEvents,
                'recent_notifications' => $recentNotifications,
                'member_engagement' => $memberEngagement,
                'top_participants' => $topParticipants,
            ]);
        } catch (\Exception $e) {
            // Log the error for debugging
            Log::error('Dashboard API Error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            // Return error response with details
            return response()->json([
                'error' => true,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'summary' => [
                    'upcoming_events' => 0,
                    'completed_events' => 0,
                    'total_members' => 0,
                    'total_registrations' => 0,
                    'pending_registrations' => 0,
                ],
                'participant_status_breakdown' => [],
                'participants_faculty_distribution' => [],
                'upcoming_events' => [],
                'recent_notifications' => [],
                'member_engagement' => [],
                'top_participants' => [],
            ], 500);
        }
    }

    /**
     * Get participants faculty distribution.
     * Groups participants by their faculty from the users table.
     */
    private function getParticipantsFacultyDistribution()
    {
        try {
            // Get distinct participants with their faculty information
            $facultyDistribution = DB::table('participants')
                ->join('users', 'participants.user_id', '=', 'users.id')
                ->select('users.faculty', DB::raw('count(distinct participants.user_id) as count'))
                ->whereNotNull('users.faculty')
                ->where('users.faculty', '!=', '')
                ->groupBy('users.faculty')
                ->pluck('count', 'faculty')
                ->toArray();

            return $facultyDistribution;
        } catch (\Exception $e) {
            Log::error('Error fetching faculty distribution: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Get top participants by total hours logged.
     * Returns top 5 participants with most volunteer hours.
     */
    private function getTopParticipantsByHours()
{
    try {
        $topParticipants = DB::table('participants')
            ->join('users', 'participants.user_id', '=', 'users.id')
            ->join('events', 'participants.event_id', '=', 'events.id')
            ->select(
                'users.id',
                'users.name',
                'users.email',
                'users.faculty',
                'users.profile_photo_path',
                DB::raw('SUM(TIMESTAMPDIFF(HOUR, events.start_date, events.end_date)) as total_hours'),
                DB::raw('COUNT(participants.id) as events_participated')
            )
            ->where('participants.status', 'APPROVED')
            ->groupBy('users.id', 'users.name', 'users.email', 'users.faculty', 'users.profile_photo_path')
            ->orderByDesc('total_hours')
            ->limit(5)
            ->get()
            ->map(function ($participant) {
                return [
                    'id' => $participant->id,
                    'name' => $participant->name,
                    'email' => $participant->email,
                    'faculty' => $participant->faculty,
                    'profile_photo_path' => $participant->profile_photo_path,
                    'total_hours' => (float) $participant->total_hours,
                    'events_participated' => (int) $participant->events_participated,
                ];
            })
            ->toArray();

        return $topParticipants;

    } catch (\Exception $e) {
        Log::error('Error fetching top participants: ' . $e->getMessage());
        return [];
    }
}

    /**
     * Get recent notifications for the dashboard.
     */
    private function getRecentNotifications()
    {
        try {
            $notifications = [];

            // Get recent membership requests (pending participants)
            $recentRequests = Participant::with(['user', 'event'])
                ->where('status', 'PENDING')
                ->latest('registration_date')
                ->take(5)
                ->get();

            foreach ($recentRequests as $request) {
                if ($request->user) {
                    $notifications[] = [
                        'type' => 'membership_request',
                        'message' => '"' . $request->user->name . '" requested to participate.',
                        'timestamp' => $request->registration_date,
                        'user_name' => $request->user->name,
                    ];
                }
            }

            // Get upcoming events (within 2 days)
            $upcomingEvents = Event::where('status', 'published')
                ->where('start_date', '>', now())
                ->where('start_date', '<=', now()->addDays(2))
                ->get();

            foreach ($upcomingEvents as $event) {
                $notifications[] = [
                    'type' => 'event_happening',
                    'message' => '"' . $event->name . '" is happening soon!',
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
                if ($participation->user && $participation->event) {
                    $notifications[] = [
                        'type' => 'event_participation',
                        'message' => '"' . $participation->user->name . '" participated in "' . $participation->event->name . '".',
                        'timestamp' => $participation->last_updated,
                        'user_name' => $participation->user->name,
                        'event_name' => $participation->event->name,
                    ];
                }
            }

            // Sort by timestamp (most recent first)
            usort($notifications, function ($a, $b) {
                return strtotime($b['timestamp']) - strtotime($a['timestamp']);
            });

            return array_slice($notifications, 0, 10); // Return top 10
        } catch (\Exception $e) {
            Log::error('Error fetching notifications: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Get member engagement metrics showing event participation distribution.
     */
    private function getMemberEngagementMetrics()
    {
        try {
            // Get top 5 events by participant count
            $topEvents = Event::withCount(['participants' => function ($query) {
                $query->where('status', 'APPROVED');
            }])
            ->where('status', 'published')
            ->orderBy('participants_count', 'desc')
            ->take(5)
            ->get();

            $engagement = [];
            
            // Use actual event names and participant counts
            foreach ($topEvents as $event) {
                if ($event->participants_count > 0) {
                    $engagement[$event->name] = $event->participants_count;
                }
            }

            return $engagement;
        } catch (\Exception $e) {
            Log::error('Error fetching member engagement: ' . $e->getMessage());
            return [];
        }
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
        Log::info('Broadcast to ' . $event->name, [
            'message' => $validated['message'],
            'recipient_count' => $participants->count(),
            'recipient_type' => $validated['recipient_type'],
        ]);

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