<?php

namespace App\Providers;

use App\Models\Event;
use App\Models\User;
use App\Models\Participant;
use App\Observers\EventObserver;
use App\Observers\UserObserver;
use App\Observers\ParticipantObserver;
use Illuminate\Support\Facades\Event as EventFacade;
use Illuminate\Support\Facades\URL;
use Illuminate\Auth\Events\Login;
use App\Listeners\LogSuccessfulLogin;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Force HTTPS in production
        if (config('app.env') === 'production') {
            URL::forceScheme('https');
        }

        // Register observers for activity logging
        User::observe(UserObserver::class);
        Event::observe(EventObserver::class);
        Participant::observe(ParticipantObserver::class);

        // Note: Login tracking is handled in LoginResponse::toResponse()
        // No need for separate event listener
    }
}
