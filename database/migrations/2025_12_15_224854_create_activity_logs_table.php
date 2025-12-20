<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            // What happened
            $table->string('action'); // e.g., 'user.created', 'event.status_changed', 'login'
            $table->string('resource_type')->nullable(); // e.g., 'User', 'Event', 'Participant'
            $table->unsignedBigInteger('resource_id')->nullable();
            $table->text('description'); // Human-readable description

            // Metadata
            $table->json('old_values')->nullable(); // For update operations
            $table->json('new_values')->nullable(); // For update operations
            $table->json('properties')->nullable(); // Additional contextual data

            // Request context
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();

            $table->timestamp('created_at'); // Only created_at, no updated_at

            // Indexes for performance
            $table->index('user_id');
            $table->index('action');
            $table->index('resource_type');
            $table->index('created_at');
            $table->index(['resource_type', 'resource_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
