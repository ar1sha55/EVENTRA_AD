<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserPreference extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'interest_keywords',
        'event_type_preference',
        'time_preference',
        'asked_about_interests',
        'last_updated',
    ];

    protected $casts = [
        'interest_keywords' => 'array',
        'asked_about_interests' => 'boolean',
        'last_updated' => 'datetime',
    ];

    /**
     * Get the user that owns the preference.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
