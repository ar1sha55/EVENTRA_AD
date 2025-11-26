<?php

namespace App\Http\Responses;

use Illuminate\Support\Facades\Auth;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

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