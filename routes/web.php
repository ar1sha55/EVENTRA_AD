<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\EventsController;
use App\Http\Controllers\ParticipantsController;
use App\Http\Controllers\TestController;
use App\Http\Controllers\ManagerDashboardController;
<<<<<<< HEAD
=======
use App\Http\Controllers\DashboardController;
use App\Http\Middleware\RoleMiddleware;
>>>>>>> bb86ecaa55b485a82c9aadf05b230497c5c080ca

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
    Route::get('/manager/event-blast', [TestController::class, 'eventBlast'])->name('event-blast');
    Route::get('/manager/manage-analytics', [TestController::class, 'manageAnalytics'])->name('manage-analytics');
    Route::get('/manager/send-announcement', [TestController::class, 'sendAnnouncement'])->name('send-announcement');
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