<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\TestController;
use App\Http\Middleware\RoleMiddleware;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

Route::middleware(['auth', 'verified', 'role:manager,admin'])->group(function () {
Route::get('manager/users', [TestController::class, 'manager'])->name('manager');
});

Route::middleware(['auth', 'verified', 'role:admin'])->group(function () {
Route::get('admin/system', [TestController::class, 'admin'])->name('admin');
});

require __DIR__.'/settings.php';

