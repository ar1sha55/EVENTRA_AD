<?php

namespace App\Http\Controllers;

use App\Models\Participant;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ParticipantsController extends Controller
{
   
    public function updateStatus(Request $request, Participant $participant)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending_approval,approved,rejected',
        ]);

        $oldStatus = $participant->status;
        $newStatus = $validated['status'];

        $participant->update([
            'status' => $newStatus,
        ]);

        // Send notification to participant when status changes
        if ($oldStatus !== $newStatus) {
            $event = $participant->event;
            $user = $participant->user;

            if ($newStatus === 'approved') {
                NotificationService::notifyRegistrationApproved($user, $event);
                // Notify manager that they approved the registration
                NotificationService::notifyManagerActionConfirmation(Auth::user(), $user, $event, 'approved');
            } elseif ($newStatus === 'rejected') {
                NotificationService::notifyRegistrationRejected($user, $event);
                // Notify manager that they rejected the registration
                NotificationService::notifyManagerActionConfirmation(Auth::user(), $user, $event, 'rejected');
            }
        }

        $statusMessage = match($newStatus) {
            'approved' => 'Participant approved successfully!',
            'rejected' => 'Participant rejected.',
            default => 'Participant status updated.',
        };

        return back()->with('success', $statusMessage);
    }

   
    public function destroy(Participant $participant)
    {
        // Ensure user can only delete their own participation
        if ($participant->user_id !== Auth::id()) {
            return redirect()->route('join-events')->with('error', 'Unauthorized action.');
        }

        // Delete payment proof if exists
        if ($participant->payment_proof_path && Storage::disk('public')->exists($participant->payment_proof_path)) {
            Storage::disk('public')->delete($participant->payment_proof_path);
        }

        $participant->delete();

        return redirect()->route('join-events')->with('success', 'Successfully unregistered from the event.');
    }
}