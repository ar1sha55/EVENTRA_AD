<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\EventsController;
use App\Http\Controllers\EventBlastController;
use App\Http\Controllers\ParticipantsController;
use App\Http\Controllers\TestController;
use App\Http\Controllers\ManagerDashboardController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\EventDocumentationController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\MailController;
use App\Http\Controllers\ManageMembersController;
use App\Http\Middleware\RoleMiddleware;

Route::get('/', function () {
    return redirect('/login');
})->name('home');

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
    Route::get('/announcement', [TestController::class, 'announcement'])->name('announcement');
    Route::get('/contact-support', [TestController::class, 'contactSupport'])->name('contact-support');

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
});

// =========================================================================
// Managers & Admins Only
// =========================================================================
Route::middleware(['auth', 'verified', 'role:manager,admin'])->group(function () {
    // --- Manager Dashboard (Page Load) ---
    // This loads the Inertia React page
    Route::get('/manager/dashboard', [ManagerDashboardController::class, 'index'])->name('manager.dashboard');

    // --- Event Management (CRUD) ---
    Route::resource('events', EventsController::class);
    Route::post('/events/{event}/broadcast', [ManagerDashboardController::class, 'broadcast'])->name('events.broadcast');
    
    // --- Participant Management (Manager View) ---
    Route::get('/events/{event}/participants', [EventsController::class, 'participants'])->name('events.participants');
    Route::put('/participants/{participant}/status', [ParticipantsController::class, 'updateStatus'])->name('participants.updateStatus');
    
   // --- Member Management (CRUD) ---
    Route::get('/manager/manage-members', [ManageMembersController::class, 'index'])->name('manage-members');
    Route::post('/manager/members', [ManageMembersController::class, 'store'])->name('members.store');
    Route::get('/manager/members/{member}', [ManageMembersController::class, 'show'])->name('members.show');
    Route::put('/manager/members/{member}', [ManageMembersController::class, 'update'])->name('members.update');
    Route::delete('/manager/members/{member}', [ManageMembersController::class, 'destroy'])->name('members.destroy');

    // --- Other Manager Pages ---
    Route::get('/manager/manage-analytics', [TestController::class, 'manageAnalytics'])->name('manage-analytics');
    Route::get('/manager/send-announcement', [TestController::class, 'sendAnnouncement'])->name('send-announcement');

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
});

// =========================================================================
// Admins Only
// =========================================================================
Route::middleware(['auth', 'verified', 'role:admin'])->group(function () {
    Route::get('admin/system-control', [TestController::class, 'systemControl'])->name('system-control');
});

require __DIR__.'/settings.php';