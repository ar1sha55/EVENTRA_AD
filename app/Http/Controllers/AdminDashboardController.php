<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Event;
use App\Models\SupportTicket;
use App\Models\ActivityLog;
use App\Models\Participant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    /**
     * Display the admin dashboard page
     */
    public function index(): Response
    {
        return Inertia::render('Admin/AdminDashboard');
    }

    /**
     * Get dashboard statistics and data
     */
    public function getStats(): JsonResponse
    {
        // User statistics
        $totalUsers = User::count();
        $totalAdmins = User::where('role', 'admin')->count();
        $totalManagers = User::where('role', 'manager')->count();
        $totalMembers = User::where('role', 'member')->count();

        // Event statistics
        $totalEvents = Event::count();
        $activeEvents = Event::where('status', 'published')
            ->where('start_date', '>=', now())
            ->count();
        $pastEvents = Event::where('status', 'published')
            ->where('start_date', '<', now())
            ->count();

        // Support ticket statistics
        $totalSupportTickets = SupportTicket::count();
        $openTickets = SupportTicket::where('status', 'pending')->count();
        $resolvedTickets = SupportTicket::where('status', 'resolved')->count();
        $inProgressTickets = SupportTicket::where('status', 'in_progress')->count();

        // Registration statistics
        $totalRegistrations = Participant::count();
        $approvedRegistrations = Participant::where('status', 'approved')->count();
        $pendingRegistrations = Participant::where('status', 'pending_approval')->count();

        // User growth data (last 6 months)
        $userGrowthData = $this->getUserGrowthData();

        // Event status distribution
        $eventStatusData = [
            ['name' => 'Active', 'value' => $activeEvents],
            ['name' => 'Past', 'value' => $pastEvents],
            ['name' => 'Draft', 'value' => Event::where('status', 'draft')->count()],
        ];

        // Support ticket status distribution
        $ticketStatusData = [
            ['name' => 'Pending', 'value' => $openTickets],
            ['name' => 'In Progress', 'value' => $inProgressTickets],
            ['name' => 'Resolved', 'value' => $resolvedTickets],
        ];

        // Recent activities (last 10)
        $recentActivities = $this->getRecentActivities();

        return response()->json([
            'totalUsers' => $totalUsers,
            'totalAdmins' => $totalAdmins,
            'totalManagers' => $totalManagers,
            'totalMembers' => $totalMembers,
            'totalEvents' => $totalEvents,
            'activeEvents' => $activeEvents,
            'pastEvents' => $pastEvents,
            'totalSupportTickets' => $totalSupportTickets,
            'openTickets' => $openTickets,
            'resolvedTickets' => $resolvedTickets,
            'totalRegistrations' => $totalRegistrations,
            'approvedRegistrations' => $approvedRegistrations,
            'pendingRegistrations' => $pendingRegistrations,
            'userGrowthData' => $userGrowthData,
            'eventStatusData' => $eventStatusData,
            'ticketStatusData' => $ticketStatusData,
            'recentActivities' => $recentActivities,
        ]);
    }

    /**
     * Get user growth data for the last 6 months
     */
    private function getUserGrowthData(): array
    {
        $data = [];

        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $monthStart = $date->copy()->startOfMonth();
            $monthEnd = $date->copy()->endOfMonth();

            $count = User::whereBetween('created_at', [$monthStart, $monthEnd])->count();

            $data[] = [
                'month' => $date->format('M Y'),
                'users' => $count,
            ];
        }

        return $data;
    }

    /**
     * Get recent activity logs
     */
    private function getRecentActivities(): array
    {
        $activities = ActivityLog::with('user')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return $activities->map(function ($log) {
            // Determine activity type based on description or properties
            $type = 'general';
            if (str_contains(strtolower($log->description), 'user') || str_contains(strtolower($log->description), 'member')) {
                $type = 'user';
            } elseif (str_contains(strtolower($log->description), 'event')) {
                $type = 'event';
            } elseif (str_contains(strtolower($log->description), 'ticket') || str_contains(strtolower($log->description), 'support')) {
                $type = 'ticket';
            }

            return [
                'id' => $log->id,
                'description' => $log->description,
                'user' => $log->user ? $log->user->name : 'System',
                'time' => $log->created_at->diffForHumans(),
                'type' => $type,
            ];
        })->toArray();
    }
}
