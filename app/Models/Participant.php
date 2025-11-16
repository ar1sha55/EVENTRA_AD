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
}