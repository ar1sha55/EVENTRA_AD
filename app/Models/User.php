<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'secondary_email',
        'matric_id',
        'role',
        'password',
        'phone_number',
        'nationality',
        'gender',
        'faculty',
        'profile_picture',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    /**
     * Get user's notifications
     */
    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    /**
     * Get user's unread notifications
     */
    public function unreadNotifications()
    {
        return $this->hasMany(Notification::class)->unread();
    }

    /**
     * Check if user's profile is complete
     */
    public function isProfileComplete(): bool
    {
        return !empty($this->profile_picture)
            && !empty($this->secondary_email)
            && !empty($this->phone_number)
            && !empty($this->faculty);
    }

    /**
     * Get missing profile fields
     */
    public function getMissingProfileFields(): array
    {
        $missing = [];

        if (empty($this->profile_picture)) {
            $missing[] = 'profile_picture';
        }

        if (empty($this->secondary_email)) {
            $missing[] = 'secondary_email';
        }

        if (empty($this->phone_number)) {
            $missing[] = 'phone_number';
        }

        if (empty($this->faculty)) {
            $missing[] = 'faculty';
        }

        return $missing;
    }
}
