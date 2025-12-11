<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventDocumentation extends Model
{
    use HasFactory;

    protected $table = 'event_documentation';

    protected $fillable = [
        'event_id',
        'type',
        'file_path',
        'title',
        'description',
        'sort_order',
        'uploaded_by',
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];

    /**
     * Relationship: Documentation belongs to an Event
     */
    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * Relationship: Documentation uploaded by a User
     */
    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
