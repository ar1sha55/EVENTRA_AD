<?php

namespace App\Http\Responses;

use Illuminate\Support\Facades\Auth;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use App\Models\ActivityLog;

class LoginResponse implements LoginResponseContract
{
    /**
     * Create an HTTP response that represents the object.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function toResponse($request)
    {
        // Get the currently authenticated user
        $user = Auth::user();

        // Log successful login
        ActivityLog::logActivity(
            action: 'auth.login',
            description: "User '{$user->name}' logged in successfully",
            properties: [
                'user_id' => $user->id,
                'user_role' => $user->role,
            ]
        );

        // Check role and redirect accordingly
        if ($user->role === 'manager') {
            return redirect()->route('manager.dashboard');
        }

        if ($user->role === 'admin') {
            // Assuming you have an admin dashboard route, otherwise send them to manager or default
            return redirect()->route('system-control'); 
        }

        // Default for 'user' role or any others
        return redirect()->route('dashboard');
    }
}