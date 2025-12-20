<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class Event extends Model
{
    use HasFactory;

    // Allow mass assignment for these fields
    protected $fillable = [
        'name',
        'description',
        'start_date',
        'end_date',
        'location',
        'capacity',
        'fee',
        'status',
        'user_id',
        'image_path',
        'qr_code_path',
        'telegram_message_id',
        'is_gallery_visible',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'fee' => 'decimal:2',
        'capacity' => 'integer',
    ];

    /**
     * Relationship: Event belongs to a User (creator)
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The participants that belong to the event.
     */
    public function participants()
    {
        return $this->hasMany(Participant::class);
    }

    /**
     * The documentation that belongs to the event.
     */
    public function documentation()
    {
        return $this->hasMany(EventDocumentation::class);
    }

    /**
     * The feedback that belongs to the event.
     */
    public function feedbacks()
    {
        return $this->hasMany(EventFeedback::class);
    }
}