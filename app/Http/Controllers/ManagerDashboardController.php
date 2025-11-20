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

            $totalMembersCount = User::where(function($query) {
                $query->whereNotIn('role', ['manager', 'admin'])
                      ->orWhereNull('role');
            })->count();
            
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

    // --- Helper Methods (Preserved) ---

    private function getParticipantsFacultyDistribution()
    {
        try {
            return DB::table('participants')
                ->join('users', 'participants.user_id', '=', 'users.id')
                ->select('users.faculty', DB::raw('count(distinct participants.user_id) as count'))
                ->whereNotNull('users.faculty')
                ->where('users.faculty', '!=', '')
                ->groupBy('users.faculty')
                ->pluck('count', 'faculty')
                ->toArray();
        } catch (\Exception $e) {
            Log::error('Error fetching faculty distribution: ' . $e->getMessage());
            return [];
        }
    }

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

    private function getRecentNotifications()
    {
        try {
            $notifications = [];

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

            usort($notifications, function ($a, $b) {
                return strtotime($b['timestamp']) - strtotime($a['timestamp']);
            });

            return array_slice($notifications, 0, 10);
        } catch (\Exception $e) {
            Log::error('Error fetching notifications: ' . $e->getMessage());
            return [];
        }
    }

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

        return back()->with('success', "Broadcast sent to {$participants->count()} participants!");
    }
}