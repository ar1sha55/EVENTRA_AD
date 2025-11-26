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
        Schema::create('participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('event_id')->constrained()->onDelete('cascade');
            $table->string('status')->default('PENDING');
            $table->string('payment_proof_path')->nullable(); // removed ->after
            $table->decimal('hours_logged', 8, 2)->default(0);
            $table->timestamp('registration_date')->nullable();
            $table->timestamp('last_updated')->nullable();

            // Unique constraint to prevent duplicate user-event registrations
            $table->unique(['event_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('participants');
    }
};
