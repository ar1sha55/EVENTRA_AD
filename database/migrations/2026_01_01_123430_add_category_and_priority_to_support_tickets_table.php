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
        Schema::table('support_tickets', function (Blueprint $table) {
            $table->enum('category', ['general', 'technical', 'account', 'event', 'payment', 'other'])->default('general')->after('message');
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium')->after('category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('support_tickets', function (Blueprint $table) {
            $table->dropColumn(['category', 'priority']);
        });
    }
};
