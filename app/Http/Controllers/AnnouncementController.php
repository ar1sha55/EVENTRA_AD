<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class AnnouncementController extends Controller
{
    /**
     * Display the send announcement page with history
     */
    public function index(Request $request): Response
    {
        $announcements = Announcement::with('user')
            ->latest()
            ->paginate(10);

        return Inertia::render('Manager/SendAnnouncement', [
            'announcements' => $announcements,
        ]);
    }

    /**
     * Send announcement to all members
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string|max:1000',
        ]);

        $user = $request->user();

        $result = NotificationService::sendAnnouncement(
            $user,
            $validated['title'],
            $validated['message']
        );

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message'],
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => $result['message'],
            'announcement_id' => $result['announcement_id'],
        ]);
    }

    /**
     * Get announcement history (API endpoint)
     */
    public function history(Request $request): JsonResponse
    {
        $announcements = Announcement::with('user')
            ->latest()
            ->paginate(10);

        return response()->json($announcements);
    }

    /**
     * Show announcements page for members
     */
    public function showForMembers(Request $request): Response
    {
        $announcements = Announcement::with('user')
            ->latest()
            ->get();

        return Inertia::render('Announcement', [
            'announcements' => $announcements,
        ]);
    }
}
