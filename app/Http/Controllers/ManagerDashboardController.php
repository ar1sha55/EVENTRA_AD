<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Participant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ManagerDashboardController extends Controller
{
    /**
     * Faculty code to full name mapping
     */
    private function getFacultyFullName($code)
    {
        $faculties = [
            'fke' => 'Faculty of Electrical Engineering',
            'fkm' => 'Faculty of Mechanical Engineering',
            'fc' => 'Faculty of Computing',
            'fab' => 'Faculty of Built Environment and Surveying',
            'fka' => 'Faculty of Civil Engineering',
            'fs' => 'Faculty of Science',
            'fcee' => 'Faculty of Chemical and Energy Engineering',
            'fm' => 'Faculty of Management',
            'fssh' => 'Faculty of Social Sciences and Humanities',
        ];

        return $faculties[strtolower($code)] ?? ucfirst($code);
    }

    /**
     * Display the manager dashboard page.
     * Data is injected directly via props, no API call needed.
     */
    public function index()
    {
        try {
            // --- 1. Calculate Summary Statistics ---
            $upcomingEventsCount = Event::where('status', 'published')
                ->where('start_date', '>', now())
                ->count();

            $completedEventsCount = Event::where('status', 'published')
                ->where('end_date', '<', now())
                ->count();

            // Count members (not managers or admins)
            $totalMembersCount = User::where('role', 'member')->count();
            
            $totalRegistrationsCount = Participant::count();
            $pendingRegistrationsCount = Participant::where('status', 'PENDING')->count();

            // --- 2. Charts Data ---
            $participantStatusBreakdown = Participant::select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->pluck('count', 'status')
                ->toArray();

            $participantsFacultyDistribution = $this->getParticipantsFacultyDistribution();

            // --- 3. Upcoming Events List ---
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

            // --- 4. Other Metrics ---
            $recentNotifications = $this->getRecentNotifications();
            $memberEngagement = $this->getMemberEngagementMetrics();
            $topParticipants = $this->getTopParticipantsByHours();

            // --- 5. Return Inertia Response ---
            return Inertia::render('Manager/ManagerDashboard', [
                'dashboardData' => [
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
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Dashboard Load Error: ' . $e->getMessage());
            
            // In case of error, return with empty data or redirect
            return redirect()->route('dashboard')->with('error', 'Unable to load dashboard data.');
        }
    }

    // --- Helper Methods ---

    /**
     * Get participants faculty distribution with full faculty names
     */
    private function getParticipantsFacultyDistribution()
    {
        try {
            $rawDistribution = DB::table('participants')
                ->join('users', 'participants.user_id', '=', 'users.id')
                ->select('users.faculty', DB::raw('count(distinct participants.user_id) as count'))
                ->whereNotNull('users.faculty')
                ->where('users.faculty', '!=', '')
                ->groupBy('users.faculty')
                ->get();

            // Convert faculty codes to full names
            $distribution = [];
            foreach ($rawDistribution as $item) {
                $fullName = $this->getFacultyFullName($item->faculty);
                $distribution[$fullName] = $item->count;
            }

            return $distribution;

        } catch (\Exception $e) {
            Log::error('Error fetching faculty distribution: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Get top participants by total volunteer hours with full faculty names
     */
    private function getTopParticipantsByHours()
    {
        try {
            $topParticipantIds = DB::table('participants')
                ->join('users', 'participants.user_id', '=', 'users.id')
                ->join('events', 'participants.event_id', '=', 'events.id')
                ->select(
                    'users.id',
                    DB::raw('SUM(TIMESTAMPDIFF(HOUR, events.start_date, events.end_date)) as total_hours')
                )
                ->where('participants.status', 'APPROVED')
                ->whereNotNull('events.start_date')
                ->whereNotNull('events.end_date')
                ->whereNotNull('users.name')
                ->groupBy('users.id')
                ->orderByDesc('total_hours')
                ->limit(10)
                ->pluck('id')
                ->toArray();

            // Now fetch full details for these top participants
            $topParticipants = [];
            foreach ($topParticipantIds as $userId) {
                $user = User::find($userId);
                if (!$user) continue;

                // Get all events this user participated in
                $participatedEvents = DB::table('participants')
                    ->join('events', 'participants.event_id', '=', 'events.id')
                    ->where('participants.user_id', $userId)
                    ->where('participants.status', 'APPROVED')
                    ->whereNotNull('events.start_date')
                    ->whereNotNull('events.end_date')
                    ->select(
                        'events.id',
                        'events.name',
                        'events.start_date',
                        DB::raw('TIMESTAMPDIFF(HOUR, events.start_date, events.end_date) as hours')
                    )
                    ->orderBy('events.start_date', 'desc')
                    ->get();

                $totalHours = $participatedEvents->sum('hours');
                $eventsParticipated = $participatedEvents->count();

                $topParticipants[] = [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'faculty' => $user->faculty ? $this->getFacultyFullName($user->faculty) : 'Not Specified',
                    'faculty_code' => $user->faculty,
                    'profile_picture' => $user->profile_picture,
                    'total_hours' => (float) $totalHours,
                    'events_participated' => $eventsParticipated,
                    'participated_events' => $participatedEvents->map(function($event) {
                        return [
                            'id' => $event->id,
                            'name' => $event->name,
                            'date' => $event->start_date,
                            'hours' => (float) $event->hours,
                        ];
                    })->toArray(),
                ];
            }

            return $topParticipants;

        } catch (\Exception $e) {
            Log::error('Error fetching top participants: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Get recent notifications for dashboard
     */
    private function getRecentNotifications()
    {
        try {
            $notifications = [];

            // Get pending participation requests
            $recentRequests = Participant::with(['user', 'event'])
                ->where('status', 'PENDING')
                ->latest('registration_date')
                ->take(5)
                ->get();

            foreach ($recentRequests as $request) {
                if ($request->user && $request->event) {
                    $notifications[] = [
                        'type' => 'membership_request',
                        'message' => '"' . $request->user->name . '" requested to join "' . $request->event->name . '".',
                        'timestamp' => $request->registration_date,
                        'user_name' => $request->user->name,
                        'event_name' => $request->event->name,
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

            // Get recent approved participations
            $recentParticipations = Participant::with(['user', 'event'])
                ->where('status', 'APPROVED')
                ->latest('last_updated')
                ->take(3)
                ->get();

            foreach ($recentParticipations as $participation) {
                if ($participation->user && $participation->event) {
                    $notifications[] = [
                        'type' => 'event_participation',
                        'message' => '"' . $participation->user->name . '" joined "' . $participation->event->name . '".',
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

            return array_slice($notifications, 0, 10);

        } catch (\Exception $e) {
            Log::error('Error fetching notifications: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Get top 5 events by member engagement (approved participants)
     */
    private function getMemberEngagementMetrics()
    {
        try {
            $topEvents = Event::withCount(['participants' => function ($query) {
                $query->where('status', 'APPROVED');
            }])
            ->where('status', 'published')
            ->orderBy('participants_count', 'desc')
            ->take(5)
            ->get();

            $engagement = [];
            
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
     * Broadcast notification to event participants (stub for future implementation)
     */
    public function broadcast(Request $request, Event $event)
    {
        $validated = $request->validate([
            'message' => 'required|string|max:1000',
            'recipient_type' => 'required|in:all,approved,pending',
        ]);

        $query = Participant::where('event_id', $event->id);
        
        if ($validated['recipient_type'] === 'approved') {
            $query->where('status', 'APPROVED');
        } elseif ($validated['recipient_type'] === 'pending') {
            $query->where('status', 'PENDING');
        }

        $participants = $query->with('user')->get();

        Log::info('Broadcast to ' . $event->name, [
            'message' => $validated['message'],
            'recipient_count' => $participants->count(),
            'recipient_type' => $validated['recipient_type'],
        ]);

        // TODO: Implement actual notification system (email, SMS, push notifications)

        return back()->with('success', "Broadcast sent to {$participants->count()} participants!");
    }
}