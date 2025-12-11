<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'data',
        'read_at',
        'sent_via_email',
    ];

    protected $casts = [
        'data' => 'array',
        'read_at' => 'datetime',
        'sent_via_email' => 'boolean',
    ];

    // Notification types constants
    const TYPE_EVENT_UPCOMING = 'event_upcoming';
    const TYPE_EVENT_NEW = 'event_new';
    const TYPE_REGISTRATION_APPROVED = 'registration_approved';
    const TYPE_REGISTRATION_REJECTED = 'registration_rejected';
    const TYPE_RANKING_UPDATE = 'ranking_update';
    const TYPE_REGISTRATION_PENDING = 'registration_pending';
    const TYPE_NEW_REGISTRATION = 'new_registration';
    const TYPE_PROFILE_INCOMPLETE = 'profile_incomplete';
    const TYPE_MANAGER_APPROVED_REGISTRATION = 'manager_approved_registration';
    const TYPE_MANAGER_REJECTED_REGISTRATION = 'manager_rejected_registration';

    /**
     * Relationship with User
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(): void
    {
        $this->update(['read_at' => now()]);
    }

    /**
     * Mark notification as unread
     */
    public function markAsUnread(): void
    {
        $this->update(['read_at' => null]);
    }

    /**
     * Check if notification is read
     */
    public function isRead(): bool
    {
        return $this->read_at !== null;
    }

    /**
     * Check if notification is unread
     */
    public function isUnread(): bool
    {
        return $this->read_at === null;
    }

    /**
     * Scope for unread notifications
     */
    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    /**
     * Scope for read notifications
     */
    public function scopeRead($query)
    {
        return $query->whereNotNull('read_at');
    }
}
