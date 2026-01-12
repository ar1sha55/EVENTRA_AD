<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Convert all lowercase status values to uppercase
        DB::table('participants')
            ->where('status', 'approved')
            ->update(['status' => 'APPROVED']);

        DB::table('participants')
            ->where('status', 'rejected')
            ->update(['status' => 'REJECTED']);

        DB::table('participants')
            ->where('status', 'pending')
            ->update(['status' => 'PENDING']);

        DB::table('participants')
            ->where('status', 'pending_approval')
            ->update(['status' => 'PENDING']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to lowercase if needed (for rollback)
        DB::table('participants')
            ->where('status', 'APPROVED')
            ->update(['status' => 'approved']);

        DB::table('participants')
            ->where('status', 'REJECTED')
            ->update(['status' => 'rejected']);

        DB::table('participants')
            ->where('status', 'PENDING')
            ->update(['status' => 'pending']);
    }
};
