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
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\MailController;
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

    // Event Joining & Viewing
    Route::get('/join-events', [EventsController::class, 'joinEvents'])->name('join-events');
    Route::post('/events/{event}/register', [EventsController::class, 'register'])->name('events.register');
    
    // Participant Management (User's own)
    Route::delete('/participants/{participant}', [ParticipantsController::class, 'destroy'])->name('participants.destroy');
    
    // Public/General Pages
    Route::get('/events-gallery', [TestController::class, 'eventsGallery'])->name('events-gallery');
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
    
    // --- Other Manager Pages ---
    Route::get('/manager/manage-members', [TestController::class, 'manageMembers'])->name('manage-members');
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
});

// =========================================================================
// API Routes (Used by Manager Dashboard Axios calls)
// =========================================================================
Route::middleware(['auth', 'verified', 'role:manager,admin'])->prefix('api')->group(function () {
    // This returns the JSON data for the charts/stats
    Route::get('/manager/dashboard/summary', [ManagerDashboardController::class, 'getSummary'])
        ->name('api.manager.dashboard.summary');
});

// =========================================================================
// Admins Only
// =========================================================================
Route::middleware(['auth', 'verified', 'role:admin'])->group(function () {
    Route::get('admin/system-control', [TestController::class, 'systemControl'])->name('system-control');
});

require __DIR__.'/settings.php';