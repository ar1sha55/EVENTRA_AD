<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Participant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class EventsController extends Controller
{
    /**
     * Display all events created by the manager.
     */
    public function index()
    {
        $events = Event::with('user')->latest()->get();

        return inertia('Manager/ManageEvents', [
            'events' => $events,
        ]);
    }

    /**
     * Store a newly created event.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'required|string',
            'start_date'  => 'required|date',
            'end_date'    => 'required|date|after_or_equal:start_date',
            'location'    => 'required|string|max:255',
            'capacity'    => 'nullable|integer',
            'fee'         => 'nullable|numeric',
            'status'      => 'required|in:draft,published,archived',
            'image'       => 'nullable|image|max:10240', // 10MB max
        ]);

        // Handle poster upload
        if ($request->hasFile('image')) {
            $validated['image_path'] = $request->file('image')->store('events', 'public');
        }

        // Assign the authenticated manager as creator
        $validated['user_id'] = Auth::id();

        Event::create($validated);

        return back()->with('success', 'Event created successfully!');
    }

    /**
     * Update an existing event.
     */
    public function update(Request $request, Event $event)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'required|string',
            'start_date'  => 'required|date',
            'end_date'    => 'required|date|after_or_equal:start_date',
            'location'    => 'required|string|max:255',
            'capacity'    => 'nullable|integer',
            'fee'         => 'nullable|numeric',
            'status'      => 'required|in:draft,published,archived',
            'image'       => 'nullable|image|max:10240',
        ]);

        // If new image is uploaded, delete old one
        if ($request->hasFile('image')) {

            // delete old poster
            if ($event->image_path && Storage::disk('public')->exists($event->image_path)) {
                Storage::disk('public')->delete($event->image_path);
            }

            // upload new poster
            $validated['image_path'] = $request->file('image')->store('events', 'public');
        }

        $event->update($validated);

        return back()->with('success', 'Event updated successfully!');
    }

    /**
     * Delete event.
     */
    public function destroy(Event $event)
    {
        // Delete poster
        if ($event->image_path && Storage::disk('public')->exists($event->image_path)) {
            Storage::disk('public')->delete($event->image_path);
        }

        $event->delete();

        return back()->with('success', 'Event deleted successfully!');
    }

    /**
     * Display the participants of an event.
     */
    public function participants(Event $event)
    {
        $event->load(['participants.user']);

        return inertia('Manager/ManageParticipants', [
            'event' => $event,
            'participants' => $event->participants,
        ]);
    }

    /**
     * Display a list of events for users to join.
     * Only show published events to members.
     */
    public function joinEvents()
    {
        // Filter to only show published events
        $events = Event::where('status', 'published')
            ->with('participants.user')
            ->orderBy('start_date', 'asc')
            ->get();

        return inertia('JoinEvents', [
            'events' => $events,
        ]);
    }

    /**
     * Register the authenticated user for an event.
     * Security: Only allow registration for published events.
     */
    public function register(Request $request, Event $event)
    {
        // Security check: Prevent registration for non-published events
        if ($event->status !== 'published') {
            return back()->with('error', 'This event is not available for registration.');
        }

        $user = Auth::user();

        // Check if the user is already registered
        $existingParticipant = Participant::where('user_id', $user->id)
            ->where('event_id', $event->id)
            ->first();

        if ($existingParticipant) {
            return back()->with('error', 'You are already registered for this event.');
        }

        // Check if event has capacity and if it's full
        if ($event->capacity) {
            $currentParticipants = Participant::where('event_id', $event->id)->count();
            
            if ($currentParticipants >= $event->capacity) {
                return back()->with('error', 'This event has reached its maximum capacity.');
            }
        }

        // Create a new participant
        Participant::create([
            'user_id'  => $user->id,
            'event_id' => $event->id,
            'status'   => 'PENDING',
            'registration_date' => now(),
        ]);

        return back()->with('success', 'You have successfully registered for the event. Please wait for approval.');
    }
}