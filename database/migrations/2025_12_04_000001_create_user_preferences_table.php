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
        Schema::create('user_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade')->unique();
            $table->json('interest_keywords')->nullable(); // ["technology", "sports", "cultural"]
            $table->enum('event_type_preference', ['free', 'paid', 'both'])->default('both');
            $table->enum('time_preference', ['weekday', 'weekend', 'both'])->default('both');
            $table->boolean('asked_about_interests')->default(false); // Track if we've asked
            $table->timestamp('last_updated')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_preferences');
    }
};
