<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    /**
     * Get all notifications for the authenticated user
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $notifications = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('Notifications', [
            'notifications' => $notifications,
        ]);
    }

    /**
     * Get unread notifications count
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $user = $request->user();
        $count = NotificationService::getUnreadCount($user->id);

        return response()->json(['count' => $count]);
    }

    /**
     * Get recent notifications (for dropdown)
     */
    public function recent(Request $request): JsonResponse
    {
        $user = $request->user();

        $notifications = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return response()->json($notifications);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $success = NotificationService::markAsRead($id, $user->id);

        if ($success) {
            return response()->json(['message' => 'Notification marked as read']);
        }

        return response()->json(['message' => 'Notification not found'], 404);
    }

    /**
     * Mark notification as unread
     */
    public function markAsUnread(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $success = NotificationService::markAsUnread($id, $user->id);

        if ($success) {
            return response()->json(['message' => 'Notification marked as unread']);
        }

        return response()->json(['message' => 'Notification not found'], 404);
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();
        NotificationService::markAllAsRead($user->id);

        return response()->json(['message' => 'All notifications marked as read']);
    }

    /**
     * Delete a notification
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $notification = Notification::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if ($notification) {
            $notification->delete();
            return response()->json(['message' => 'Notification deleted']);
        }

        return response()->json(['message' => 'Notification not found'], 404);
    }

    /**
     * Get sidebar badge counts for navigation items
     */
    public function getSidebarBadges(Request $request): JsonResponse
    {
        $user = $request->user();
        $badges = [];

        // For all users: unread notifications
        $badges['unread_notifications'] = NotificationService::getUnreadCount($user->id);

        // For all users: support tickets with new admin responses
        if ($user) {
            $userTicketsWithNewResponses = \App\Models\SupportTicket::where('user_id', $user->id)
                ->where('status', '!=', 'pending')
                ->whereNotNull('admin_response')
                ->whereColumn('updated_at', '>', 'created_at')
                ->count();
            $badges['my_tickets'] = $userTicketsWithNewResponses;
        }

        // For admins: pending support tickets
        if ($user->role === 'admin') {
            $badges['support_tickets'] = \App\Models\SupportTicket::where('status', 'pending')->count();
        }

        return response()->json($badges);
    }
}
