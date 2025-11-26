<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventBlast extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id',
        'user_id',
        'message',
        'caption',
        'blast_type',
        'scheduled_at',
        'status',
        'telegram_message_id',
        'error_message',
        'sent_at',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'sent_at' => 'datetime',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeReadyToSend($query)
    {
        return $query->where('status', 'pending')
            ->where(function ($q) {
                $q->where('blast_type', 'immediate')
                    ->orWhere(function ($q2) {
                        $q2->where('blast_type', 'scheduled')
                            ->where('scheduled_at', '<=', now());
                    });
            });
    }

    public function markAsSent($telegramMessageId = null)
    {
        $this->update([
            'status' => 'sent',
            'sent_at' => now(),
            'telegram_message_id' => $telegramMessageId,
        ]);
    }

    public function markAsFailed($error)
    {
        $this->update([
            'status' => 'failed',
            'error_message' => $error,
        ]);
    }
}
