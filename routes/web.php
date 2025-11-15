<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\EventsController;
use App\Http\Controllers\ParticipantsController;
use App\Http\Controllers\TestController;
use App\Http\Middleware\RoleMiddleware;

Route::get('/', function () {
    return redirect('/login');
})->name('home');



Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::post('/events/{event}/register', [EventsController::class, 'register'])->name('events.register');
    Route::get('/join-events', [EventsController::class, 'joinEvents'])->name('join-events');
    Route::delete('/participants/{participant}', [ParticipantsController::class, 'destroy'])->name('participants.destroy');
    Route::get('/events-gallery', [TestController::class, 'eventsGallery'])->name('events-gallery');
    Route::get('/announcement', [TestController::class, 'announcement'])->name('announcement');
    Route::get('/contact-support', [TestController::class, 'contactSupport'])->name('contact-support');
});

Route::middleware('auth', 'verified', 'role:manager,admin')->group(function () {
    Route::resource('events', EventsController::class);
    Route::get('/events/{event}/participants', [EventsController::class, 'participants'])->name('events.participants');
    Route::put('/participants/{participant}/status', [ParticipantsController::class, 'updateStatus'])->name('participants.updateStatus');
    Route::get('/manager/manage-members', [TestController::class, 'manageMembers'])->name('manage-members');
    Route::get('/manager/event-blast', [TestController::class, 'eventBlast'])->name('event-blast');
    Route::get('/manager/manage-analytics', [TestController::class, 'manageAnalytics'])->name('manage-analytics');
    Route::get('/manager/send-announcement', [TestController::class, 'sendAnnouncement'])->name('send-announcement');
});

Route::middleware('auth', 'verified', 'role:admin')->group(function () {
    Route::get('admin/system-control', [TestController::class, 'systemControl'])->name('system-control');
});

require __DIR__.'/settings.php';
