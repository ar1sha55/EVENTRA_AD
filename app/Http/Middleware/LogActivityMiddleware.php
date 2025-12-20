<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\ActivityLog;

class LogActivityMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Log successful login attempts
        if ($request->is('login') && $response->isSuccessful() && auth()->check()) {
            ActivityLog::logActivity(
                action: 'auth.login',
                description: "User '" . auth()->user()->name . "' logged in successfully",
                properties: [
                    'user_id' => auth()->id(),
                    'user_role' => auth()->user()->role,
                ]
            );
        }

        return $response;
    }
}
