<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\TestController;
use App\Http\Middleware\RoleMiddleware;
use App\Http\Controllers\DashboardController;


   Route::get('/', function () {
    return redirect('/login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('/profile', function () {
        return Inertia::render('profile');
    })->name('profile');
// Events routes for regular users
    Route::get('/events', function () {
        return Inertia::render('events');
    })->name('events');
    
    Route::get('/qr-scanner', function () {
        return Inertia::render('qr-scanner');
    })->name('qr-scanner');
    
    Route::get('/events-galleria', function () {
        return Inertia::render('events-galleria');
    })->name('events-galleria');
    
    Route::get('/announcement', function () {
        return Inertia::render('announcement');
    })->name('announcement');
    
    Route::get('/contact-support', function () {
        return Inertia::render('contact-support');
    })->name('contact-support');
});

    
   // Manager Routes (authenticated + verified + role:manager,admin)
Route::middleware(['auth', 'verified', 'role:manager,admin'])->group(function () {
    Route::get('/manager/members', [TestController::class, 'manager'])->name('manager');
    
    Route::get('/managemembers', function () {
        return Inertia::render('managemembers');
    })->name('managemembers');
    
    Route::get('/sendmessage', function () {
        return Inertia::render('sendmessage');
    })->name('sendmessage');
    
    Route::get('/manageevents', function () {
        return Inertia::render('manageevents');
    })->name('manageevents');
    
    Route::get('/manageanalytics', function () {
        return Inertia::render('manageanalytics');
    })->name('manageanalytics');
    
    Route::get('/Mannouncement', function () {
        return Inertia::render('Mannouncement');
    })->name('Mannouncement');
});


Route::middleware('auth', 'verified', 'role:admin')->group(function () {
Route::get('/admin/system', [TestController::class, 'admin'])->name('admin');
Route::get('/adminsystem', function () {
        return Inertia::render('adminsystem');
    })->name('adminsystem');
});

require __DIR__.'/settings.php';
