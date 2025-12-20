<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;

class ActivityLog extends Model
{
    use HasFactory;

    // Use Laravel's standard timestamps but we'll disable updated_at below
    public $timestamps = true;

    protected $fillable = [
        'user_id',
        'action',
        'resource_type',
        'resource_id',
        'description',
        'old_values',
        'new_values',
        'properties',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'properties' => 'array',
        'created_at' => 'datetime',
    ];

    /**
     * Relationship: Activity log belongs to a user
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Override to prevent updated_at from being set
     * We only want created_at for activity logs
     */
    public function setUpdatedAtAttribute($value)
    {
        // Intentionally do nothing - we don't want updated_at
    }

    /**
     * Helper method to log activity
     *
     * @param string $action Action identifier (e.g., 'user.created', 'event.updated')
     * @param string $description Human-readable description
     * @param string|null $resourceType Type of resource (e.g., 'User', 'Event')
     * @param int|null $resourceId ID of the resource
     * @param array|null $oldValues Old values for update operations
     * @param array|null $newValues New values for update operations
     * @param array|null $properties Additional contextual data
     * @return ActivityLog|null
     */
    public static function logActivity(
        string $action,
        string $description,
        ?string $resourceType = null,
        ?int $resourceId = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?array $properties = null
    ): ?self {
        try {
            return self::create([
                'user_id' => auth()->id(),
                'action' => $action,
                'resource_type' => $resourceType,
                'resource_id' => $resourceId,
                'description' => $description,
                'old_values' => $oldValues,
                'new_values' => $newValues,
                'properties' => $properties,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        } catch (\Exception $e) {
            // Log the error but don't fail the main operation
            Log::error('Failed to log activity: ' . $e->getMessage(), [
                'action' => $action,
                'description' => $description,
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return null;
        }
    }
}
