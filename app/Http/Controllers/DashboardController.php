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
            // Step 1: Get IDs of top participants based on total hours
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

            // Step 2: Fetch full details including recent history for these users
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
                    // Use the helper to get full faculty name
                    'faculty' => $user->faculty ? $this->getFacultyFullName($user->faculty) : 'Not Specified',
                    'faculty_code' => $user->faculty,
                    'profile_picture' => $user->profile_picture,
                    'total_hours' => (float) $totalHours,
                    'events_participated' => $eventsParticipated,
                    // Include specific event history if your frontend needs it
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
            Log::error('Error fetching top volunteers: ' . $e->getMessage());
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
        $user = auth()->user();

        // Get data for the last 6 months
        $monthsData = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthsData[] = now()->subMonths($i)->format('M');
        }

        // Get user's approved participations grouped by month
        $participations = DB::table('participants')
            ->join('events', 'participants.event_id', '=', 'events.id')
            ->where('participants.user_id', $user->id)
            ->where('participants.status', 'APPROVED')
            ->where('events.start_date', '>=', now()->subMonths(6))
            ->select(
                DB::raw('DATE_FORMAT(events.start_date, "%Y-%m") as month'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('month')
            ->get()
            ->keyBy('month');

        // Build the chart data
        $chartData = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $monthKey = $date->format('Y-m');
            $monthName = $date->format('M');

            $chartData[] = [
                'name' => $monthName,
                'events' => $participations->has($monthKey) ? (int) $participations[$monthKey]->count : 0
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $chartData
        ]);
    }
}