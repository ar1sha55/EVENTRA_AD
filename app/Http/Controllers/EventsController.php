<?php

namespace App\Http\Controllers;

use App\Models\Event;
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
            'image'       => 'nullable|image|max:10240', // 10MB max
        ]);

        // Handle poster upload
        if ($request->hasFile('image')) {
            $validated['image_path'] = $request->file('image')->store('events', 'public');
        }

        // Assign the authenticated manager as creator
        $validated['user_id'] = Auth::id();
        $validated['status'] = 'draft';

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
}
