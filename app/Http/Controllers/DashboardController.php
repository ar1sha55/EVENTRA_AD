<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        // Fetch upcoming published events (start_date >= today) with participants
        $upcomingEvents = Event::where('status', 'published')
            ->where('start_date', '>=', now())
            ->with(['participants' => function($query) {
                $query->select('id', 'user_id', 'event_id', 'status', 'registration_date', 'last_updated');
            }])
            ->orderBy('start_date', 'asc')
            ->limit(10)
            ->get(['id', 'name', 'start_date', 'end_date', 'location', 'description', 'capacity', 'fee', 'status', 'image_path', 'qr_code_path']);

        // Fetch upcoming events for notifications (next 60 days)
        $notificationEvents = Event::where('status', 'published')
            ->where('start_date', '>=', now())
            ->where('start_date', '<=', now()->addDays(60))
            ->orderBy('start_date', 'asc')
            ->limit(5)
            ->get(['id', 'name', 'start_date']);

        // Fetch user's registered events
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

        // Count total events for stats
        $totalEvents = Event::count();
        $upcomingEventsCount = Event::where('status', 'published')
            ->where('start_date', '>=', now())
            ->count();

        // Get top volunteers based on total hours from registered events
        $topVolunteers = User::select([
                'users.id',
                'users.name',
                'users.email',
                'users.faculty',
                'users.profile_picture',
                DB::raw('COUNT(DISTINCT participants.event_id) as events_participated'),
                DB::raw('COALESCE(SUM(TIMESTAMPDIFF(HOUR, events.start_date, events.end_date)), 0) as total_hours')
            ])
            ->join('participants', 'users.id', '=', 'participants.user_id')
            ->join('events', 'participants.event_id', '=', 'events.id')
            ->groupBy('users.id', 'users.name', 'users.email', 'users.faculty', 'users.profile_picture')
            ->orderByDesc('total_hours')
            ->limit(10)
            ->get();

        return Inertia::render('dashboard', [
            'upcomingEvents' => $upcomingEvents,
            'notificationEvents' => $notificationEvents,
            'registeredEvents' => $registeredEvents,
            'topVolunteers' => $topVolunteers,
            'stats' => [
                'totalEvents' => $totalEvents,
                'upcomingEventsCount' => $upcomingEventsCount,
            ],
        ]);
    }
}
