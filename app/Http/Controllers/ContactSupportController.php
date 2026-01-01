<?php

namespace App\Http\Controllers;

use App\Models\SupportTicket;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class ContactSupportController extends Controller
{
    /**
     * Display the contact support form
     */
    public function index(Request $request): Response
    {
        return Inertia::render('ContactSupport');
    }

    /**
     * Submit a new support ticket
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'subject' => 'required|string|max:255',
            'message' => 'required|string|max:2000',
            'category' => 'required|in:general,technical,account,event,payment,other',
        ]);

        $ticket = SupportTicket::create([
            'user_id' => $request->user()->id,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'subject' => $validated['subject'],
            'message' => $validated['message'],
            'category' => $validated['category'],
            'priority' => 'medium', // Default priority, admin can change
            'status' => 'pending',
        ]);

        // Notify admins and send email to support
        NotificationService::notifyAdminsOfSupportTicket($ticket);

        return response()->json([
            'success' => true,
            'message' => 'Your support ticket has been submitted successfully. We will get back to you soon.',
            'ticket_id' => $ticket->id,
        ]);
    }

    /**
     * Get user's support ticket history
     */
    public function history(Request $request): Response
    {
        $tickets = SupportTicket::where('user_id', $request->user()->id)
            ->with('respondedBy')
            ->latest()
            ->paginate(10);

        return Inertia::render('SupportHistory', [
            'tickets' => $tickets,
        ]);
    }
}
