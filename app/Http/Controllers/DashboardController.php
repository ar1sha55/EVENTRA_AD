<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\User;
use App\Models\Participant; // Added this
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log; // Added this
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        // Check and notify about incomplete profile
        NotificationService::checkAndNotifyIncompleteProfile($user);

        // 1. Fetch upcoming published events
        $upcomingEvents = Event::where('status', 'published')
            ->where('start_date', '>=', now())
            ->with(['participants' => function($query) {
                $query->select('id', 'user_id', 'event_id', 'status', 'registration_date', 'last_updated');
            }])
            ->orderBy('start_date', 'asc')
            ->limit(10)
            ->get(['id', 'name', 'start_date', 'end_date', 'location', 'description', 'capacity', 'fee', 'status', 'image_path', 'qr_code_path']);

        // 2. Fetch user's registered events
        $registeredEvents = Event::whereHas('participants', function($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->with(['participants' => function($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->select('id', 'user_id', 'event_id', 'status', 'registration_date');
            }])
            ->orderBy('start_date', 'desc')
            ->get(['id', 'name', 'start_date', 'end_date', 'location', 'image_path'])
            ->map(function($event) {
                $participant = $event->participants->first();
                return [
                    'id' => $event->id,
                    'name' => $event->name,
                    'start_date' => $event->start_date,
                    'end_date' => $event->end_date,
                    'location' => $event->location,
                    'image_path' => $event->image_path,
                    'status' => $participant->status,
                    'registration_date' => $participant->registration_date,
                ];
            });

        // 4. Count total events for stats
        $totalEvents = Event::count();
        $upcomingEventsCount = Event::where('status', 'published')
            ->where('start_date', '>=', now())
            ->count();

        // 5. Get top volunteers (Using the new Logic from Manager Dashboard)
        $topVolunteers = $this->getTopVolunteers();

        // 6. Get recent notifications for dashboard
        $recentNotifications = $user->notifications()
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return Inertia::render('dashboard', [
            'upcomingEvents' => $upcomingEvents,
            'registeredEvents' => $registeredEvents,
            'topVolunteers' => $topVolunteers,
            'recentNotifications' => $recentNotifications,
            'stats' => [
                'totalEvents' => $totalEvents,
                'upcomingEventsCount' => $upcomingEventsCount,
            ],
        ]);
    }

    // --- Private Helper Methods (Ported from ManagerDashboard) ---

    /**
     * Get top participants by total volunteer hours with full faculty names
     */
    private function getTopVolunteers()
    {
        try {
            // Get all approved participants with their events
            $allParticipations = DB::table('participants')
                ->join('users', 'participants.user_id', '=', 'users.id')
                ->join('events', 'participants.event_id', '=', 'events.id')
                ->where('participants.status', 'APPROVED')
                ->whereNotNull('users.name')
                ->whereNotNull('events.start_date')
                ->whereNotNull('events.end_date')
                ->select(
                    'users.id as user_id',
                    'users.name',
                    'users.email',
                    'users.faculty',
                    'users.profile_picture',
                    'events.id as event_id',
                    'events.name as event_name',
                    'events.start_date',
                    'events.end_date'
                )
                ->get();

            // Group by user and calculate hours in PHP (database-agnostic)
            $userHours = [];
            foreach ($allParticipations as $participation) {
                $userId = $participation->user_id;
                
                // Calculate hours using PHP date functions
                $startDate = strtotime($participation->start_date);
                $endDate = strtotime($participation->end_date);
                $hours = abs($endDate - $startDate) / 3600; // Convert seconds to hours
                
                if (!isset($userHours[$userId])) {
                    $userHours[$userId] = [
                        'user' => $participation,
                        'total_hours' => 0,
                        'events' => []
                    ];
                }
                
                $userHours[$userId]['total_hours'] += $hours;
                $userHours[$userId]['events'][] = [
                    'id' => $participation->event_id,
                    'name' => $participation->event_name,
                    'date' => $participation->start_date,
                    'hours' => round($hours, 2)
                ];
            }

            // Sort by total hours and get top 10
            usort($userHours, function($a, $b) {
                return $b['total_hours'] <=> $a['total_hours'];
            });
            
            $topParticipants = [];
            foreach (array_slice($userHours, 0, 10) as $userData) {
                $user = $userData['user'];
                
                $topParticipants[] = [
                    'id' => $user->user_id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'faculty' => $user->faculty ? $this->getFacultyFullName($user->faculty) : 'Not Specified',
                    'faculty_code' => $user->faculty,
                    'profile_picture' => $user->profile_picture,
                    'total_hours' => round($userData['total_hours'], 2),
                    'events_participated' => count($userData['events']),
                    'participated_events' => $userData['events']
                ];
            }

            return $topParticipants;

        } catch (\Exception $e) {
            Log::error('Error fetching top volunteers: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return [];
        }
    }

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
     * Get user's activity chart data (events participated by month)
     */
    public function getActivityChartData(Request $request)
    {
        try {
            $user = auth()->user();

            // Get all approved participations from the last 6 months
            $participations = DB::table('participants')
                ->join('events', 'participants.event_id', '=', 'events.id')
                ->where('participants.user_id', $user->id)
                ->where('participants.status', 'APPROVED')
                ->where('events.start_date', '>=', now()->subMonths(6))
                ->select('events.start_date')
                ->get();

            // Group participations by month manually (database-agnostic)
            $monthCounts = [];
            foreach ($participations as $participation) {
                $monthKey = date('Y-m', strtotime($participation->start_date));
                $monthCounts[$monthKey] = ($monthCounts[$monthKey] ?? 0) + 1;
            }

            // Build the chart data for the last 6 months
            $chartData = [];
            for ($i = 5; $i >= 0; $i--) {
                $date = now()->subMonths($i);
                $monthKey = $date->format('Y-m');
                $monthName = $date->format('M');

                $chartData[] = [
                    'name' => $monthName,
                    'events' => $monthCounts[$monthKey] ?? 0
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $chartData
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching activity chart data: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch activity chart data',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }
}