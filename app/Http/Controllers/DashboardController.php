<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
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

        // Count total events for stats
        $totalEvents = Event::count();
        $upcomingEventsCount = Event::where('status', 'published')
            ->where('start_date', '>=', now())
            ->count();

        return Inertia::render('dashboard', [
            'upcomingEvents' => $upcomingEvents,
            'notificationEvents' => $notificationEvents,
            'stats' => [
                'totalEvents' => $totalEvents,
                'upcomingEventsCount' => $upcomingEventsCount,
            ],
        ]);
    }
}
