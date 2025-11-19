<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Participant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class EventsController extends Controller
{
    
    public function index()
    {
        $events = Event::with('user')->latest()->get();

        return inertia('Manager/ManageEvents', [
            'events' => $events,
        ]);
    }

   
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'required|string',
            'start_date'  => 'required|date',
            'end_date'    => 'required|date|after_or_equal:start_date',
            'location'    => 'required|string|max:255',
            'capacity'    => 'nullable|integer|min:0',
            'fee'         => 'nullable|numeric|min:0',
            'status'      => 'required|in:draft,published,archived',
            'image'       => 'nullable|image|max:10240', // 10MB max
            'qr_code_image' => 'nullable|image|max:10240', // 10MB max
        ]);

        // Handle poster upload
        if ($request->hasFile('image')) {
            $validated['image_path'] = $request->file('image')->store('events', 'public');
        }

        // Handle QR code image upload (only if fee is greater than 0)
        if ($request->hasFile('qr_code_image')) {
            $validated['qr_code_path'] = $request->file('qr_code_image')->store('qrcodes', 'public');
        }

        // Convert fee to null if it's 0 or empty
        if (isset($validated['fee']) && $validated['fee'] == 0) {
            $validated['fee'] = null;
        }

        // Assign the authenticated manager as creator
        $validated['user_id'] = Auth::id();

        Event::create($validated);

        return back()->with('success', 'Event created successfully!');
    }

   
    public function update(Request $request, Event $event)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'required|string',
            'start_date'  => 'required|date',
            'end_date'    => 'required|date|after_or_equal:start_date',
            'location'    => 'required|string|max:255',
            'capacity'    => 'nullable|integer|min:0',
            'fee'         => 'nullable|numeric|min:0',
            'status'      => 'required|in:draft,published,archived',
            'image'       => 'nullable|image|max:10240',
            'qr_code_image' => 'nullable|image|max:10240',
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

        // Handle QR code image upload
        if ($request->hasFile('qr_code_image')) {
            // delete old QR code
            if ($event->qr_code_path && Storage::disk('public')->exists($event->qr_code_path)) {
                Storage::disk('public')->delete($event->qr_code_path);
            }
            // upload new QR code
            $validated['qr_code_path'] = $request->file('qr_code_image')->store('qrcodes', 'public');
        }

        // Convert fee to null if it's 0 or empty
        if (isset($validated['fee']) && $validated['fee'] == 0) {
            $validated['fee'] = null;
            
            // If fee is removed/set to 0 and a QR code exists, delete it
            if ($event->qr_code_path && Storage::disk('public')->exists($event->qr_code_path)) {
                Storage::disk('public')->delete($event->qr_code_path);
            }
            $validated['qr_code_path'] = null;
        }

        $event->update($validated);

        return back()->with('success', 'Event updated successfully!');
    }

   
    public function destroy(Event $event)
    {
        // Delete associated images
        if ($event->image_path && Storage::disk('public')->exists($event->image_path)) {
            Storage::disk('public')->delete($event->image_path);
        }
        if ($event->qr_code_path && Storage::disk('public')->exists($event->qr_code_path)) {
            Storage::disk('public')->delete($event->qr_code_path);
        }

        $event->delete();

        return back()->with('success', 'Event deleted successfully!');
    }


    public function joinEvents()
    {
        // Load all participants for upcoming published events only
        $events = Event::with(['participants'])
            ->where('status', 'published')
            ->where('start_date', '>=', now())
            ->orderBy('start_date', 'asc')
            ->get();

        return inertia('JoinEvents', [
            'events' => $events,
        ]);
    }

   
    public function register(Request $request, Event $event)
    {
        // Check if event is published
        if ($event->status !== 'published') {
            return back()->with('error', 'This event is not available for registration.');
        }

        // Check if user is already registered
        $existingParticipant = Participant::where('user_id', Auth::id())
            ->where('event_id', $event->id)
            ->first();

        if ($existingParticipant) {
            return back()->with('error', 'You are already registered for this event.');
        }

        // Check capacity
        if ($event->capacity) {
            $currentParticipants = Participant::where('event_id', $event->id)
                ->whereIn('status', ['approved', 'pending_approval'])
                ->count();

            if ($currentParticipants >= $event->capacity) {
                return back()->with('error', 'This event is fully booked.');
            }
        }

        // For paid events, require payment proof
        if ($event->fee && $event->fee > 0) {
            $validated = $request->validate([
                'payment_proof' => 'required|image|max:10240', // 10MB max
            ]);

            $paymentProofPath = $request->file('payment_proof')->store('payment_proofs', 'public');

            Participant::create([
                'user_id' => Auth::id(),
                'event_id' => $event->id,
                'status' => 'pending_approval',
                'payment_proof_path' => $paymentProofPath,
            ]);

            return back()->with('success', 'Registration submitted! Your payment proof will be verified by the event manager.');
        }

        // For free events, approve immediately
        Participant::create([
            'user_id' => Auth::id(),
            'event_id' => $event->id,
            'status' => 'approved',
        ]);

        return back()->with('success', 'Successfully registered for the event!');
    }

    /**
     * Display participants for a specific event.
     */
    public function participants(Event $event)
    {
        $participants = Participant::with('user')
            ->where('event_id', $event->id)
            ->latest()
            ->get();

        return inertia('Manager/ManageParticipants', [
            'event' => $event,
            'participants' => $participants,
        ]);
    }
}