<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventFeedback;
use App\Models\Participant;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

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

        $event = Event::create($validated);

        // Send notification to all members when a new event is published
        if ($event->status === 'published') {
            $members = User::where('role', 'member')->get();
            foreach ($members as $member) {
                NotificationService::notifyNewEvent($member, $event, sendEmail: true);
            }

            // Notify the manager who created the event
            NotificationService::notifyManagerEventCreated(Auth::user(), $event, sendEmail: true);
        }

        // Reload events list
        $events = Event::with(['user', 'participants'])
            ->latest()
            ->get();

        // Context-aware success messages
        if ($event->status === 'published') {
            $flashMessage = "Event published successfully! All members have been notified.";
            $shouldPromptBlast = true;
        } else {
            $flashMessage = "Event saved as draft! You can publish it anytime from the events list.";
            $shouldPromptBlast = false;
        }

        // Return Inertia response with flash data as props
        return Inertia::render('Manager/ManageEvents', [
            'events' => $events,
            'flash' => [
                'success' => $flashMessage,
                'event_id' => $event->id,
                'prompt_blast' => $shouldPromptBlast,
            ],
        ]);
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

        $oldStatus = $event->status;
        $event->update($validated);

        // Send notification to all members when event changes to published
        if ($oldStatus !== 'published' && $validated['status'] === 'published') {
            $members = User::where('role', 'member')->get();
            foreach ($members as $member) {
                NotificationService::notifyNewEvent($member, $event, sendEmail: true);
            }

            // Notify the manager who published the event
            NotificationService::notifyManagerEventCreated(Auth::user(), $event, sendEmail: true);
        }

        // Reload events list
        $events = Event::with(['user', 'participants'])
            ->latest()
            ->get();

        // Context-aware messages based on status change
        $message = $this->getUpdateMessage($oldStatus, $event->status);
        $shouldPromptBlast = ($oldStatus !== 'published' && $event->status === 'published');

        // Return Inertia response with flash data as props
        return Inertia::render('Manager/ManageEvents', [
            'events' => $events,
            'flash' => [
                'success' => $message,
                'event_id' => $event->id,
                'prompt_blast' => $shouldPromptBlast,
            ],
        ]);
    }

    /**
     * Update only the event status (for quick status changes)
     */
    public function updateStatus(Request $request, Event $event)
    {
        $validated = $request->validate([
            'status' => 'required|in:draft,published,archived',
        ]);

        $oldStatus = $event->status;
        $newStatus = $validated['status'];

        $event->update(['status' => $newStatus]);

        // Send notification to all members when event changes to published
        if ($oldStatus !== 'published' && $newStatus === 'published') {
            $members = User::where('role', 'member')->get();
            foreach ($members as $member) {
                NotificationService::notifyNewEvent($member, $event, sendEmail: true);
            }
            NotificationService::notifyManagerEventCreated(Auth::user(), $event, sendEmail: true);
        }

        // Reload events list (consistent with store/update methods)
        $events = Event::with(['user', 'participants'])
            ->latest()
            ->get();

        // Context-aware messages
        $message = $this->getUpdateMessage($oldStatus, $newStatus);
        $shouldPromptBlast = ($oldStatus !== 'published' && $newStatus === 'published');

        // Return Inertia response with flash data as props
        return Inertia::render('Manager/ManageEvents', [
            'events' => $events,
            'flash' => [
                'success' => $message,
                'event_id' => $event->id,
                'prompt_blast' => $shouldPromptBlast,
            ],
        ]);
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

    public function bulkUpdateStatus(Request $request)
    {
        $validated = $request->validate([
            'event_ids' => 'required|array',
            'event_ids.*' => 'exists:events,id',
            'status' => 'required|in:draft,published,archived',
        ]);

        $eventIds = $validated['event_ids'];
        $newStatus = $validated['status'];

        // Update all selected events
        Event::whereIn('id', $eventIds)->update(['status' => $newStatus]);

        // Send notifications if publishing events
        if ($newStatus === 'published') {
            $publishedEvents = Event::whereIn('id', $eventIds)->get();
            $members = User::where('role', 'member')->get();

            foreach ($publishedEvents as $event) {
                foreach ($members as $member) {
                    NotificationService::notifyNewEvent($member, $event, sendEmail: false);
                }
            }
        }

        return back()->with('success', count($eventIds) . " event(s) updated to {$newStatus}");
    }

    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'event_ids' => 'required|array',
            'event_ids.*' => 'exists:events,id',
        ]);

        $eventIds = $validated['event_ids'];
        $events = Event::whereIn('id', $eventIds)->get();

        // Delete associated files
        foreach ($events as $event) {
            if ($event->image_path && Storage::disk('public')->exists($event->image_path)) {
                Storage::disk('public')->delete($event->image_path);
            }
            if ($event->qr_code_path && Storage::disk('public')->exists($event->qr_code_path)) {
                Storage::disk('public')->delete($event->qr_code_path);
            }
        }

        // Delete events
        Event::whereIn('id', $eventIds)->delete();

        return back()->with('success', count($eventIds) . " event(s) deleted successfully");
    }

    /**
     * Get context-aware update message based on status change
     */
    private function getUpdateMessage($oldStatus, $newStatus)
    {
        // Draft → Published
        if ($oldStatus !== 'published' && $newStatus === 'published') {
            return "Event published! All members have been notified.";
        }

        // Published → Draft
        if ($oldStatus === 'published' && $newStatus === 'draft') {
            return "Event unpublished. It's now hidden from members.";
        }

        // Any → Archived
        if ($newStatus === 'archived') {
            return "Event archived successfully.";
        }

        // Editing draft
        if ($newStatus === 'draft') {
            return "Draft updated successfully!";
        }

        // Editing published event
        if ($newStatus === 'published') {
            return "Event updated! Changes have been saved.";
        }

        return "Event updated successfully!";
    }

    public function joinEvents()
    {
        $user = Auth::user();

        // Check and notify about incomplete profile
        NotificationService::checkAndNotifyIncompleteProfile($user);

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
            return redirect()->route('join-events')->with('error', 'This event is not available for registration.');
        }

        // 2. Check if user is already registered
        $existingParticipant = Participant::where('user_id', Auth::id())
            ->where('event_id', $event->id)
            ->first();

        // Allow re-registration ONLY if status is 'rejected'
        if ($existingParticipant && $existingParticipant->status !== 'rejected') {
            return redirect()->route('join-events')->with('error', 'You are already registered for this event.');
        }

        // 3. Check capacity (Count approved and pending, ignore rejected)
        if ($event->capacity) {
            $currentParticipants = Participant::where('event_id', $event->id)
                ->whereIn('status', ['approved', 'pending_approval'])
                ->count();

            if ($currentParticipants >= $event->capacity) {
                return redirect()->route('join-events')->with('error', 'This event is fully booked.');
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

                // Notify managers about re-registration
                $managers = User::where('role', 'manager')->orWhere('role', 'admin')->get();
                foreach ($managers as $manager) {
                    NotificationService::notifyManagerPendingRegistration($manager, Auth::user(), $event);
                }

                return redirect()->route('join-events')->with('success', 'Re-registration submitted! Please wait for approval.');
            } else {
                // NEW REGISTRATION (Paid)
                $participant = Participant::create([
                    'user_id' => Auth::id(),
                    'event_id' => $event->id,
                    'status' => 'pending_approval',
                    'payment_proof_path' => $paymentProofPath,
                    'registration_date' => now(),
                ]);

                // Notify managers about new registration
                $managers = User::where('role', 'manager')->orWhere('role', 'admin')->get();
                foreach ($managers as $manager) {
                    NotificationService::notifyManagerPendingRegistration($manager, Auth::user(), $event);
                }

                return redirect()->route('join-events')->with('success', 'Registration submitted! Your payment proof will be verified.');
            }
        }

        // 5. Handle Free Events
        if ($existingParticipant) {
            // RE-REGISTRATION (Free)
            $existingParticipant->update([
                'status' => 'approved',
                'registration_date' => now(),
            ]);

            // Notify member about successful re-registration
            NotificationService::notifyRegistrationApproved(Auth::user(), $event);

            // Notify managers about re-registration
            $managers = User::where('role', 'manager')->orWhere('role', 'admin')->get();
            foreach ($managers as $manager) {
                NotificationService::notifyManagerNewRegistration($manager, Auth::user(), $event);
            }

             return redirect()->route('join-events')->with('success', 'You have successfully re-registered for the event!');
        } else {
            // NEW REGISTRATION (Free)
            $participant = Participant::create([
                'user_id' => Auth::id(),
                'event_id' => $event->id,
                'status' => 'approved',
                'registration_date' => now(),
            ]);

            // Notify member about successful registration
            NotificationService::notifyRegistrationApproved(Auth::user(), $event);

            // Notify managers about new registration
            $managers = User::where('role', 'manager')->orWhere('role', 'admin')->get();
            foreach ($managers as $manager) {
                NotificationService::notifyManagerNewRegistration($manager, Auth::user(), $event);
            }

            return redirect()->route('join-events')->with('success', 'Successfully registered for the event!');
        }
    }

    public function participants(Event $event)
    {
        $participants = Participant::with('user')
            ->where('event_id', $event->id)
            ->whereHas('user') // Ensure user exists
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

    /**
     * Toggle gallery visibility for an event
     */
    public function toggleGalleryVisibility(Event $event)
    {
        $event->update([
            'is_gallery_visible' => !$event->is_gallery_visible
        ]);

        return back()->with('success', $event->is_gallery_visible
            ? 'Event is now visible in gallery'
            : 'Event is now hidden from gallery');
    }

    /**
     * Display the public events gallery page
     */
    public function eventsGallery()
    {
        return inertia('EventsGallery');
    }

    /**
     * Get events gallery data (public API)
     * Returns past published events that have photo documentation
     */
    public function getEventsGalleryData()
    {
        $events = Event::where('end_date', '<', now())
            ->where('status', 'published')
            ->where('is_gallery_visible', true)
            ->with(['documentation' => function($query) {
                $query->orderBy('sort_order')
                    ->orderBy('created_at', 'desc');
            }])
            ->withCount([
                'participants as approved_participants_count' => function($query) {
                    $query->where('status', 'approved');
                }
            ])
            ->orderBy('end_date', 'desc')
            ->get()
            ->map(function($event) {
                // Calculate attendance rate
                $attendanceRate = $event->capacity > 0
                    ? round(($event->approved_participants_count / $event->capacity) * 100, 2)
                    : 0;

                // Separate documentation by type
                $photos = $event->documentation->where('type', 'photo')->values();
                $documents = $event->documentation->where('type', 'document')->values();
                $summaries = $event->documentation->where('type', 'summary')->values();

                // Get user's feedback if authenticated
                $userFeedback = Auth::check()
                    ? EventFeedback::where('event_id', $event->id)
                        ->where('user_id', Auth::id())
                        ->first()
                    : null;

                // Check if user participated in this event
                $userParticipated = Auth::check()
                    && Participant::where('event_id', $event->id)
                        ->where('user_id', Auth::id())
                        ->where('status', 'approved')
                        ->exists();

                // Check if user can submit feedback
                $canSubmitFeedback = Auth::check()
                    && $event->end_date < now()
                    && $userParticipated;

                return [
                    'id' => $event->id,
                    'name' => $event->name,
                    'description' => $event->description,
                    'location' => $event->location,
                    'start_date' => $event->start_date,
                    'end_date' => $event->end_date,
                    'image_path' => $event->image_path,
                    'approved_participants_count' => $event->approved_participants_count,
                    'attendance_rate' => $attendanceRate,
                    'photos' => $photos,
                    'documents' => $documents,
                    'summaries' => $summaries,
                    'photos_count' => $photos->count(),
                    'documents_count' => $documents->count(),
                    'summaries_count' => $summaries->count(),
                    'total_documentation_count' => $event->documentation->count(),
                    'user_feedback' => $userFeedback,
                    'can_submit_feedback' => $canSubmitFeedback,
                    'user_participated' => $userParticipated,
                ];
            });

        return response()->json([
            'success' => true,
            'events' => $events,
        ]);
    }
}