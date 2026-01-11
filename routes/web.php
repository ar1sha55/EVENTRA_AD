<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\EventsController;
use App\Http\Controllers\EventBlastController;
use App\Http\Controllers\EventDocumentationController;
use App\Http\Controllers\EventFeedbackController;
use App\Http\Controllers\ParticipantsController;
use App\Http\Controllers\TestController;
use App\Http\Controllers\ManagerDashboardController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\MailController;
use App\Http\Controllers\ManageMembersController;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\ContactSupportController;
use App\Http\Controllers\AdminManageUsersController;
use App\Http\Controllers\AdminSupportController;
use App\Http\Middleware\RoleMiddleware;

Route::get('/', function () {
    return redirect('/login');
})->name('home');

// =========================================================================
// Cron Job Endpoint (for external scheduler trigger - UptimeRobot)
// =========================================================================
Route::get('/cron/run', function () {
    // Validate secret token
    $token = request()->query('token');
    if ($token !== config('app.cron_secret')) {
        abort(403, 'Unauthorized');
    }
    
    // Run Laravel scheduler
    Artisan::call('schedule:run');
    
    return response()->json([
        'success' => true,
        'message' => 'Scheduler executed successfully',
        'output' => Artisan::output(),
        'timestamp' => now()->toDateTimeString(),
    ]);
})->name('cron.run');

// =========================================================================
// Diagnostics Endpoints (for debugging)
// =========================================================================
Route::get('/diagnostics/blast-status', [\App\Http\Controllers\DiagnosticsController::class, 'checkBlastStatus'])
    ->middleware(\App\Http\Middleware\VerifyCronToken::class)
    ->name('diagnostics.blast-status');

Route::get('/diagnostics/test-scheduler', [\App\Http\Controllers\DiagnosticsController::class, 'testScheduler'])
    ->middleware(\App\Http\Middleware\VerifyCronToken::class)
    ->name('diagnostics.test-scheduler');

// =========================================================================
// Diagnostic Endpoint (for checking Telegram config)
// =========================================================================
Route::get('/test-telegram-config', function () {
    $botToken = config('services.telegram.bot_token');
    $channelId = config('services.telegram.channel_id');
    
    return response()->json([
        'bot_token_set' => !empty($botToken),
        'channel_id_set' => !empty($channelId),
        'bot_token_length' => strlen($botToken ?? ''),
        'channel_id_value' => $channelId ? substr($channelId, 0, 5) . '...' : 'not set',
        'config_cached' => app()->configurationIsCached(),
        'timestamp' => now()->toDateTimeString(),
    ]);
});

// =========================================================================
// Authenticated Users (All Roles)
// =========================================================================
Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/api/dashboard/activity-chart', [DashboardController::class, 'getActivityChartData'])->name('api.dashboard.activity-chart');

    // Event Joining & Viewing
    Route::get('/join-events', [EventsController::class, 'joinEvents'])->name('join-events');
    Route::post('/events/{event}/register', [EventsController::class, 'register'])->name('events.register');

    // Participant Management (User's own)
    Route::delete('/participants/{participant}', [ParticipantsController::class, 'destroy'])->name('participants.destroy');

    // Public/General Pages
    Route::get('/events-gallery', [EventsController::class, 'eventsGallery'])->name('events-gallery');
    Route::get('/api/events-gallery', [EventsController::class, 'getEventsGalleryData'])->name('api.events-gallery');

    // Event Feedback Routes
    Route::get('/api/events/{event}/feedback', [EventFeedbackController::class, 'show'])->name('api.events.feedback.show');
    Route::post('/api/events/{event}/feedback', [EventFeedbackController::class, 'store'])->name('api.events.feedback.store');

    // Announcements (for all users to view)
    Route::get('/announcement', [AnnouncementController::class, 'showForMembers'])->name('announcement');

    // Contact Support
    Route::get('/contact-support', [ContactSupportController::class, 'index'])->name('contact-support');
    Route::post('/contact-support', [ContactSupportController::class, 'store'])->name('contact-support.store');
    Route::get('/support-history', [ContactSupportController::class, 'history'])->name('support-history');

    // Chat
    Route::post('/chat', [ChatController::class, 'chat']);
    Route::post('/chat/clear', [ChatController::class, 'clear']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::get('/notifications/recent', [NotificationController::class, 'recent'])->name('notifications.recent');
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount'])->name('notifications.unreadCount');
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.markAsRead');
    Route::put('/notifications/{id}/unread', [NotificationController::class, 'markAsUnread'])->name('notifications.markAsUnread');
    Route::put('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead'])->name('notifications.markAllAsRead');
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy'])->name('notifications.destroy');

    // Sidebar badge counts
    Route::get('/api/sidebar-badges', [NotificationController::class, 'getSidebarBadges'])->name('api.sidebar-badges');
});

// =========================================================================
// Managers & Admins Only
// =========================================================================
Route::middleware(['auth', 'verified', 'role:manager,admin'])->group(function () {
    // --- Manager Dashboard (Page Load) ---
    // This loads the Inertia React page
    Route::get('/manager/dashboard', [ManagerDashboardController::class, 'index'])->name('manager.dashboard');

    // --- Event Management (CRUD) ---
    Route::resource('events', EventsController::class)->except(['show', 'create', 'edit']);
    Route::put('/events/{event}/status', [EventsController::class, 'updateStatus'])->name('events.updateStatus');
    Route::post('/events/{event}/broadcast', [ManagerDashboardController::class, 'broadcast'])->name('events.broadcast');

    // --- Bulk Event Actions ---
    Route::put('/events/bulk/status', [EventsController::class, 'bulkUpdateStatus'])->name('events.bulk.status');
    Route::delete('/events/bulk/delete', [EventsController::class, 'bulkDelete'])->name('events.bulk.delete');

    // --- Participant Management (Manager View) ---
    Route::get('/events/{event}/participants', [EventsController::class, 'participants'])->name('events.participants');
    Route::put('/participants/{participant}/status', [ParticipantsController::class, 'updateStatus'])->name('participants.updateStatus');
    
   // --- Member Management (CRUD) ---
    Route::get('/manager/manage-members', [ManageMembersController::class, 'index'])->name('manage-members');
    Route::post('/manager/members', [ManageMembersController::class, 'store'])->name('members.store');
    Route::get('/manager/members/{member}', [ManageMembersController::class, 'show'])->name('members.show');
    Route::put('/manager/members/{member}', [ManageMembersController::class, 'update'])->name('members.update');
    Route::delete('/manager/members/{member}', [ManageMembersController::class, 'destroy'])->name('members.destroy');
    Route::post('/manager/members/bulk-delete', [ManageMembersController::class, 'bulkDelete'])->name('members.bulk-delete');

    // --- Other Manager Pages ---
    Route::get('/manager/manage-analytics', [TestController::class, 'manageAnalytics'])->name('manage-analytics');

    // --- Email Management ---
    Route::post('/manager/send-email', [MailController::class, 'sendToMember'])->name('mail.send');

    // --- Event Blast Routes ---
    Route::get('/manager/event-blast', [EventBlastController::class, 'index'])->name('event-blast');
    Route::post('/manager/event-blast', [EventBlastController::class, 'store'])->name('event-blast.store');
    Route::post('/manager/event-blast/generate-caption', [EventBlastController::class, 'generateCaption'])->name('event-blast.generate-caption');
    Route::post('/manager/event-blast/{blast}/cancel', [EventBlastController::class, 'cancel'])->name('event-blast.cancel');
    Route::post('/manager/event-blast/{blast}/retry', [EventBlastController::class, 'retry'])->name('event-blast.retry');
    Route::get('/manager/blast-history', [EventBlastController::class, 'history'])->name('blast-history');

    // --- Event Documentation Routes ---
    Route::get('/events/{event}/documentation', [EventDocumentationController::class, 'index'])->name('events.documentation.index');
    Route::post('/events/{event}/documentation', [EventDocumentationController::class, 'store'])->name('events.documentation.store');
    Route::put('/events/{event}/documentation/{documentation}', [EventDocumentationController::class, 'update'])->name('events.documentation.update');
    Route::delete('/events/{event}/documentation/{documentation}', [EventDocumentationController::class, 'destroy'])->name('events.documentation.destroy');

    // --- Event Gallery Visibility Toggle ---
    Route::post('/events/{event}/toggle-gallery-visibility', [EventsController::class, 'toggleGalleryVisibility'])->name('events.toggle-gallery-visibility');

    // --- Announcement Management ---
    Route::get('/manager/send-announcement', [AnnouncementController::class, 'index'])->name('send-announcement');
    Route::post('/manager/announcements', [AnnouncementController::class, 'store'])->name('announcements.store');
    Route::get('/manager/announcements/history', [AnnouncementController::class, 'history'])->name('announcements.history');
});

// =========================================================================
// API Routes (Used by Manager Dashboard Axios calls)
// =========================================================================
Route::middleware(['auth', 'verified', 'role:manager,admin'])->prefix('api')->group(function () {
    // This returns the JSON data for the charts/stats
    Route::get('/manager/dashboard/summary', [ManagerDashboardController::class, 'getSummary'])
        ->name('api.manager.dashboard.summary');

    // Past Events Analytics API
    Route::get('/manager/past-events-analytics', [ManagerDashboardController::class, 'getPastEventsAnalytics'])
        ->name('api.manager.past-events-analytics');
    Route::get('/manager/events/{event}/analytics', [ManagerDashboardController::class, 'getEventAnalytics'])
        ->name('api.manager.event.analytics');

    // Event Participants with Feedback API
    Route::get('/manager/events/{event}/participants', [ManagerDashboardController::class, 'getEventParticipants'])
        ->name('api.manager.event.participants');
});

// =========================================================================
// Admins Only
// =========================================================================
Route::middleware(['auth', 'verified', 'role:admin'])->group(function () {
    // Admin Dashboard
    Route::get('admin/dashboard', [AdminDashboardController::class, 'index'])->name('admin.dashboard');

    // Admin Dashboard API
    Route::get('api/admin/dashboard/stats', [AdminDashboardController::class, 'getStats'])->name('api.admin.dashboard.stats');

    // Manage Users Routes
    Route::get('admin/manage-users', [AdminManageUsersController::class, 'index'])->name('admin.manage-users');
    Route::post('admin/users', [AdminManageUsersController::class, 'store'])->name('admin.users.store');
    Route::get('admin/users/{user}', [AdminManageUsersController::class, 'show'])->name('admin.users.show');
    Route::put('admin/users/{user}', [AdminManageUsersController::class, 'update'])->name('admin.users.update');
    Route::delete('admin/users/{user}', [AdminManageUsersController::class, 'destroy'])->name('admin.users.destroy');
    Route::get('api/admin/users/statistics', [AdminManageUsersController::class, 'statistics'])->name('api.admin.users.statistics');
    Route::post('admin/users/bulk-delete', [AdminManageUsersController::class, 'bulkDelete'])->name('admin.users.bulk-delete');
    Route::post('admin/users/bulk-role', [AdminManageUsersController::class, 'bulkRole'])->name('admin.users.bulk-role');

    // Audit Trail Routes
    Route::get('admin/audit-trail', [ActivityLogController::class, 'index'])->name('admin.audit-trail');
    Route::get('admin/audit-trail/export', [ActivityLogController::class, 'export'])->name('admin.audit-trail.export');
    Route::get('admin/audit-trail/{activityLog}', [ActivityLogController::class, 'show'])->name('admin.audit-trail.show');

    // Support Ticket Management
    Route::get('admin/support-tickets', [AdminSupportController::class, 'index'])->name('admin.support-tickets');
    Route::get('admin/support-tickets/{ticket}', [AdminSupportController::class, 'show'])->name('admin.support-tickets.show');
    Route::put('admin/support-tickets/{ticket}', [AdminSupportController::class, 'update'])->name('admin.support-tickets.update');
    Route::delete('admin/support-tickets/{ticket}', [AdminSupportController::class, 'destroy'])->name('admin.support-tickets.destroy');
    Route::post('admin/support-tickets/{ticket}/reply', [AdminSupportController::class, 'addReply'])->name('admin.support-tickets.reply');
});

require __DIR__.'/settings.php';