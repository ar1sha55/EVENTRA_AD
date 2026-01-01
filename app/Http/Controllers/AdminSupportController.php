<?php

namespace App\Http\Controllers;

use App\Models\SupportTicket;
use App\Models\TicketReply;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class AdminSupportController extends Controller
{
    /**
     * Display admin support tickets dashboard
     */
    public function index(Request $request): Response
    {
        $status = $request->query('status', 'all');

        $query = SupportTicket::with(['user', 'respondedBy'])->latest();

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        $tickets = $query->paginate(15);

        $stats = [
            'pending' => SupportTicket::where('status', 'pending')->count(),
            'in_progress' => SupportTicket::where('status', 'in_progress')->count(),
            'resolved' => SupportTicket::where('status', 'resolved')->count(),
            'total' => SupportTicket::count(),
        ];

        return Inertia::render('Admin/SupportTickets', [
            'tickets' => $tickets,
            'stats' => $stats,
            'currentStatus' => $status,
        ]);
    }

    /**
     * Show single ticket details
     */
    public function show(SupportTicket $ticket): Response
    {
        $ticket->load(['user', 'respondedBy']);

        return Inertia::render('Admin/SupportTicketDetail', [
            'ticket' => $ticket,
        ]);
    }

    /**
     * Update ticket status and response
     */
    public function update(Request $request, SupportTicket $ticket): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,in_progress,resolved',
            'priority' => 'sometimes|in:low,medium,high,urgent',
            'admin_response' => 'nullable|string|max:2000',
        ]);

        $updateData = [
            'status' => $validated['status'],
            'admin_response' => $validated['admin_response'] ?? $ticket->admin_response,
            'responded_by' => $request->user()->id,
            'responded_at' => now(),
        ];

        if (isset($validated['priority'])) {
            $updateData['priority'] = $validated['priority'];
        }

        $ticket->update($updateData);

        // Notify user of response
        if (!empty($validated['admin_response'])) {
            try {
                \Log::info('Attempting to send support response notification', [
                    'ticket_id' => $ticket->id,
                    'user_id' => $ticket->user_id,
                    'user_email' => $ticket->user->email,
                    'admin_response' => $validated['admin_response'],
                ]);

                NotificationService::notifyUserOfResponse($ticket);

                \Log::info('Support response notification sent successfully', [
                    'ticket_id' => $ticket->id,
                ]);
            } catch (\Exception $e) {
                \Log::error('Failed to send support response notification', [
                    'ticket_id' => $ticket->id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);

                // Don't fail the whole request if notification fails
                // But log it for debugging
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Ticket updated successfully',
            'ticket' => $ticket->load(['user', 'respondedBy']),
        ]);
    }

    /**
     * Delete ticket
     */
    public function destroy(SupportTicket $ticket): JsonResponse
    {
        $ticket->delete();

        return response()->json([
            'success' => true,
            'message' => 'Ticket deleted successfully',
        ]);
    }

    /**
     * Add a reply to a ticket
     */
    public function addReply(Request $request, SupportTicket $ticket): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string|max:2000',
        ]);

        $reply = TicketReply::create([
            'support_ticket_id' => $ticket->id,
            'user_id' => $request->user()->id,
            'message' => $validated['message'],
            'is_admin_reply' => true,
        ]);

        // Update ticket status to in_progress if it's pending
        if ($ticket->status === 'pending') {
            $ticket->update(['status' => 'in_progress']);
        }

        // Notify user of the reply
        try {
            NotificationService::notifyUserOfResponse($ticket->fresh(['user', 'respondedBy']));
        } catch (\Exception $e) {
            \Log::error('Failed to send notification for ticket reply', [
                'ticket_id' => $ticket->id,
                'error' => $e->getMessage(),
            ]);
        }

        $reply->load('user');

        return response()->json([
            'success' => true,
            'message' => 'Reply added successfully',
            'reply' => $reply,
            'ticket' => $ticket->fresh(['user', 'respondedBy', 'replies.user']),
        ]);
    }
}
