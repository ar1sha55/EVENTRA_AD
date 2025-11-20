<?php

namespace App\Http\Controllers;
use App\Models\Event;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;

class TestController extends Controller
{
    public function managemembers(): Response
    {
        return Inertia::render('Manager/ManageMembers');
    }


    public function eventsGallery(): Response
    {
        // Fetch only past published events (events that have already happened)
        $events = Event::where('status', 'published')
            ->where('start_date', '<', now())
            ->orderBy('start_date', 'desc')
            ->get();

        return Inertia::render('EventsGallery', [
            'events' => $events,
        ]);
    }

    public function announcement(): Response
    {
        return Inertia::render('Announcement');
    }

    public function contactSupport(): Response
    {
        return Inertia::render('ContactSupport');
    }

    public function eventBlast(): Response
    {
        return Inertia::render('Manager/EventBlast');
    }

    public function manageEvents(): Response
    {
        return Inertia::render('Manager/ManageEvents');
    }

    public function manageAnalytics(): Response
    {
        return Inertia::render('Manager/ManageAnalytics');
    }

    public function sendAnnouncement(): Response
    {
        return Inertia::render('Manager/SendAnnouncement');
    }

    public function systemControl(): Response
    {
        return Inertia::render('Admin/SystemControl');
    }


}
