<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActivityLogController extends Controller
{
    /**
     * Display activity logs with filtering
     */
    public function index(Request $request)
    {
        $query = ActivityLog::with('user:id,name,email')
            ->orderBy('created_at', 'desc');

        // Filter by search query (description, action, user name)
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('action', 'like', "%{$search}%")
                  ->orWhereHas('user', function($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by date range
        if ($request->filled('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }
        if ($request->filled('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        // Filter by action type
        if ($request->filled('action_filter')) {
            $query->where('action', 'like', $request->action_filter . '%');
        }

        // Filter by user
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by resource type
        if ($request->filled('resource_type')) {
            $query->where('resource_type', $request->resource_type);
        }

        // Pagination
        $logs = $query->paginate(25)->withQueryString();

        // Get unique action types for filter dropdown
        $actionTypes = ActivityLog::select('action')
            ->distinct()
            ->pluck('action')
            ->map(function($action) {
                return explode('.', $action)[0]; // Get prefix (user, event, auth, etc.)
            })
            ->unique()
            ->values();

        // Get all users for filter dropdown
        $users = \App\Models\User::select('id', 'name')
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/ActivityLogs', [
            'logs' => $logs,
            'actionTypes' => $actionTypes,
            'users' => $users,
            'filters' => $request->only(['search', 'from_date', 'to_date', 'action_filter', 'user_id', 'resource_type']),
        ]);
    }

    /**
     * Show detailed view of a single log
     */
    public function show(ActivityLog $activityLog)
    {
        $activityLog->load('user');

        return response()->json($activityLog);
    }

    /**
     * Export logs to CSV
     */
    public function export(Request $request)
    {
        $query = ActivityLog::with('user')
            ->orderBy('created_at', 'desc');

        // Apply same filters as index
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('action', 'like', "%{$search}%");
            });
        }

        if ($request->filled('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }
        if ($request->filled('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }
        if ($request->filled('action_filter')) {
            $query->where('action', 'like', $request->action_filter . '%');
        }

        $logs = $query->get();

        // Generate CSV
        $filename = 'activity-logs-' . now()->format('Y-m-d-His') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function() use ($logs) {
            $file = fopen('php://output', 'w');

            // CSV Header
            fputcsv($file, ['ID', 'Timestamp', 'User', 'Action', 'Resource Type', 'Resource ID', 'Description', 'IP Address']);

            // CSV Rows
            foreach ($logs as $log) {
                fputcsv($file, [
                    $log->id,
                    $log->created_at->format('Y-m-d H:i:s'),
                    $log->user ? $log->user->name : 'System',
                    $log->action,
                    $log->resource_type ?? '-',
                    $log->resource_id ?? '-',
                    $log->description,
                    $log->ip_address,
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
