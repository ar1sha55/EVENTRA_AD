<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Login;
use App\Models\ActivityLog;

class LogSuccessfulLogin
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(Login $event): void
    {
        ActivityLog::logActivity(
            action: 'auth.login',
            description: "User '{$event->user->name}' logged in successfully",
            properties: [
                'user_id' => $event->user->id,
                'user_role' => $event->user->role,
            ]
        );
    }
}
