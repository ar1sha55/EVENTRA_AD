<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SupportTicket extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'email',
        'subject',
        'message',
        'category',
        'priority',
        'status',
        'admin_response',
        'responded_by',
        'responded_at',
    ];

    // Category constants
    const CATEGORY_GENERAL = 'general';
    const CATEGORY_TECHNICAL = 'technical';
    const CATEGORY_ACCOUNT = 'account';
    const CATEGORY_EVENT = 'event';
    const CATEGORY_PAYMENT = 'payment';
    const CATEGORY_OTHER = 'other';

    // Priority constants
    const PRIORITY_LOW = 'low';
    const PRIORITY_MEDIUM = 'medium';
    const PRIORITY_HIGH = 'high';
    const PRIORITY_URGENT = 'urgent';

    public static function getCategories(): array
    {
        return [
            self::CATEGORY_GENERAL => 'General Inquiry',
            self::CATEGORY_TECHNICAL => 'Technical Issue',
            self::CATEGORY_ACCOUNT => 'Account Problem',
            self::CATEGORY_EVENT => 'Event Related',
            self::CATEGORY_PAYMENT => 'Payment Issue',
            self::CATEGORY_OTHER => 'Other',
        ];
    }

    public static function getPriorities(): array
    {
        return [
            self::PRIORITY_LOW => 'Low',
            self::PRIORITY_MEDIUM => 'Medium',
            self::PRIORITY_HIGH => 'High',
            self::PRIORITY_URGENT => 'Urgent',
        ];
    }

    protected $casts = [
        'responded_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function respondedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responded_by');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(TicketReply::class, 'support_ticket_id')->orderBy('created_at', 'asc');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeInProgress($query)
    {
        return $query->where('status', 'in_progress');
    }

    public function scopeResolved($query)
    {
        return $query->where('status', 'resolved');
    }

    public function scopeLatest($query)
    {
        return $query->orderBy('created_at', 'desc');
    }

    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            'pending' => 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'in_progress' => 'bg-blue-100 text-blue-800 border-blue-200',
            'resolved' => 'bg-green-100 text-green-800 border-green-200',
            default => 'bg-gray-100 text-gray-800 border-gray-200',
        };
    }

    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            'pending' => 'Pending',
            'in_progress' => 'In Progress',
            'resolved' => 'Resolved',
            default => 'Unknown',
        };
    }

    public function getPriorityColorAttribute(): string
    {
        return match($this->priority) {
            'low' => 'bg-gray-100 text-gray-800 border-gray-200',
            'medium' => 'bg-blue-100 text-blue-800 border-blue-200',
            'high' => 'bg-orange-100 text-orange-800 border-orange-200',
            'urgent' => 'bg-red-100 text-red-800 border-red-200',
            default => 'bg-gray-100 text-gray-800 border-gray-200',
        };
    }

    public function getCategoryLabelAttribute(): string
    {
        return self::getCategories()[$this->category] ?? 'General Inquiry';
    }
}
