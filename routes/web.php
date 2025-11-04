<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\TestController;
use App\Http\Middleware\RoleMiddleware;

Route::get('/', function () {
    return redirect('/login');
})->name('home');



Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

Route::middleware('auth', 'verified', 'role:manager,admin')->group(function () {
Route::get('/manager/members', [TestController::class, 'manager'])->name('manager');
});

Route::middleware('auth', 'verified', 'role:admin')->group(function () {
Route::get('/admin/system', [TestController::class, 'admin'])->name('admin');
});

require __DIR__.'/settings.php';
