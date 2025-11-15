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
    'image_path', // MUST MATCH the migration
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
        return $this->belongsToMany(User::class, 'participants', 'event_id', 'user_id')
            ->withPivot('status', 'id')
            ->withTimestamps('registration_date', 'last_updated');
    }
}
