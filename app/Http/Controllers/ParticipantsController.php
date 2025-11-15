<?php

namespace App\Http\Controllers;

use App\Models\Participant;
use Illuminate\Http\Request;

class ParticipantsController extends Controller
{
    /**
     * Update the status of a participant.
     */
    public function updateStatus(Request $request, Participant $participant)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:PENDING,APPROVED,REJECTED,pending,approved,rejected',
        ]);

        // Convert to uppercase for consistency
        $status = strtoupper($validated['status']);

        $participant->update([
            'status' => $status,
            'last_updated' => now(),
        ]);

        return back()->with('success', 'Participant status updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Participant $participant)
    {
        $participant->delete();

        return back()->with('success', 'You have successfully unregistered from the event.');
    }
}