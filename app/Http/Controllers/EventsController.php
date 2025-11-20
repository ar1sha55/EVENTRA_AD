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
        $events = Event::with(['user', 'participants'])
            ->latest()
            ->get();

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

        if ($request->hasFile('image')) {
            $validated['image_path'] = $request->file('image')->store('events', 'public');
        }

        if ($request->hasFile('qr_code_image')) {
            $validated['qr_code_path'] = $request->file('qr_code_image')->store('qrcodes', 'public');
        }

        if (isset($validated['fee']) && $validated['fee'] == 0) {
            $validated['fee'] = null;
        }

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

        if ($request->hasFile('image')) {
            if ($event->image_path && Storage::disk('public')->exists($event->image_path)) {
                Storage::disk('public')->delete($event->image_path);
            }
            $validated['image_path'] = $request->file('image')->store('events', 'public');
        }

        if ($request->hasFile('qr_code_image')) {
            if ($event->qr_code_path && Storage::disk('public')->exists($event->qr_code_path)) {
                Storage::disk('public')->delete($event->qr_code_path);
            }
            $validated['qr_code_path'] = $request->file('qr_code_image')->store('qrcodes', 'public');
        }

        if (isset($validated['fee']) && $validated['fee'] == 0) {
            $validated['fee'] = null;
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
        // 1. Check if event is published
        if ($event->status !== 'published') {
            return back()->with('error', 'This event is not available for registration.');
        }

        // 2. Check if user is already registered
        $existingParticipant = Participant::where('user_id', Auth::id())
            ->where('event_id', $event->id)
            ->first();

        // LOGIC CHANGE: Allow re-registration ONLY if status is 'rejected'
        if ($existingParticipant && $existingParticipant->status !== 'rejected') {
            return back()->with('error', 'You are already registered for this event.');
        }

        // 3. Check capacity (Count approved and pending, ignore rejected)
        if ($event->capacity) {
            $currentParticipants = Participant::where('event_id', $event->id)
                ->whereIn('status', ['approved', 'pending_approval'])
                ->count();

            if ($currentParticipants >= $event->capacity) {
                return back()->with('error', 'This event is fully booked.');
            }
        }

        // 4. Handle Paid Events
        if ($event->fee && $event->fee > 0) {
            $validated = $request->validate([
                'payment_proof' => 'required|image|max:10240', // 10MB max
            ]);

            $paymentProofPath = $request->file('payment_proof')->store('payment_proofs', 'public');

            if ($existingParticipant) {
                // RE-REGISTRATION (Paid): Update existing record
                
                // Delete old rejected proof to clean up storage
                if ($existingParticipant->payment_proof_path && Storage::disk('public')->exists($existingParticipant->payment_proof_path)) {
                    Storage::disk('public')->delete($existingParticipant->payment_proof_path);
                }

                $existingParticipant->update([
                    'status' => 'pending_approval', // Reset to pending
                    'payment_proof_path' => $paymentProofPath, // New proof
                    'registration_date' => now(), // Update date
                ]);

                return back()->with('success', 'Re-registration submitted! Please wait for approval.');
            } else {
                // NEW REGISTRATION (Paid)
                Participant::create([
                    'user_id' => Auth::id(),
                    'event_id' => $event->id,
                    'status' => 'pending_approval',
                    'payment_proof_path' => $paymentProofPath,
                    'registration_date' => now(),
                ]);
                return back()->with('success', 'Registration submitted! Your payment proof will be verified.');
            }
        }

        // 5. Handle Free Events
        if ($existingParticipant) {
            // RE-REGISTRATION (Free)
            $existingParticipant->update([
                'status' => 'approved',
                'registration_date' => now(),
            ]);
             return back()->with('success', 'You have successfully re-registered for the event!');
        } else {
            // NEW REGISTRATION (Free)
            Participant::create([
                'user_id' => Auth::id(),
                'event_id' => $event->id,
                'status' => 'approved',
                'registration_date' => now(),
            ]);
            return back()->with('success', 'Successfully registered for the event!');
        }
    }

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
    
    // Add this method if you are using the handleStatusChange router.put logic
    public function updateParticipantStatus(Request $request, Participant $participant)
    {
        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
        ]);

        $participant->update(['status' => $validated['status']]);

        return back()->with('success', 'Participant status updated.');
    }
}