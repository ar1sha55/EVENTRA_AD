<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventFeedback;
use App\Models\Participant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class EventFeedbackController extends Controller
{
    /**
     * Store or update feedback for an event
     */
    public function store(Request $request, Event $event)
    {
        try {
            // Validate input
            $validated = $request->validate([
                'rating' => 'required|integer|min:1|max:5',
                'comment' => 'nullable|string|max:1000',
            ]);

            // Check if event has ended
            if ($event->end_date >= now()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Feedback can only be submitted after the event has ended.',
                ], 400);
            }

            // Check if user is an approved participant
            $participant = Participant::where('event_id', $event->id)
                ->where('user_id', Auth::id())
                ->where('status', 'APPROVED')
                ->first();

            if (!$participant) {
                return response()->json([
                    'success' => false,
                    'message' => 'You must be an approved participant to submit feedback.',
                ], 403);
            }

            // Check if feedback already exists
            $existingFeedback = EventFeedback::where('event_id', $event->id)
                ->where('user_id', Auth::id())
                ->first();

            if ($existingFeedback) {
                // Update existing feedback
                $existingFeedback->update([
                    'rating' => $validated['rating'],
                    'comment' => $validated['comment'] ?? null,
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Feedback updated successfully!',
                    'feedback' => $existingFeedback,
                ]);
            }

            // Create new feedback
            $feedback = EventFeedback::create([
                'event_id' => $event->id,
                'user_id' => Auth::id(),
                'participant_id' => $participant->id,
                'rating' => $validated['rating'],
                'comment' => $validated['comment'] ?? null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Feedback submitted successfully!',
                'feedback' => $feedback,
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error submitting feedback: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit feedback. Please try again.',
            ], 500);
        }
    }

    /**
     * Get user's feedback for an event
     */
    public function show(Event $event)
    {
        try {
            $feedback = EventFeedback::where('event_id', $event->id)
                ->where('user_id', Auth::id())
                ->first();

            $canSubmit = $this->canSubmitFeedback($event);

            return response()->json([
                'success' => true,
                'feedback' => $feedback,
                'can_submit' => $canSubmit,
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching feedback: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch feedback.',
            ], 500);
        }
    }

    /**
     * Check if user can submit feedback
     */
    private function canSubmitFeedback(Event $event): bool
    {
        // Event must have ended
        if ($event->end_date >= now()) {
            return false;
        }

        // User must be approved participant
        $isApprovedParticipant = Participant::where('event_id', $event->id)
            ->where('user_id', Auth::id())
            ->where('status', 'APPROVED')
            ->exists();

        return $isApprovedParticipant;
    }
}
