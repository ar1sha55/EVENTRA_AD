<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Participant extends Model
{
    use HasFactory;

   
    protected $fillable = [
        'user_id',
        'event_id',
        'status',
        'payment_proof_path',
        'registration_date',
        'last_updated',
        'hours_logged', // Added this
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'registration_date' => 'datetime',
        'last_updated' => 'datetime',
        'hours_logged' => 'decimal:2', // Cast to decimal with 2 decimal places
    ];

    
    const CREATED_AT = 'registration_date';

   
    const UPDATED_AT = 'last_updated';

   
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the event that the participant belongs to.
     */
    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * Get the feedback submitted by the participant.
     */
    public function feedback()
    {
        return $this->hasOne(EventFeedback::class);
    }
}