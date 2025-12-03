<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Participant;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class DiagnoseNotifications extends Command
{
    protected $signature = 'diagnose:notifications';
    protected $description = 'Diagnose notification and registration issues';

    public function handle()
    {
        $this->info('=== EVENTRA Notification Diagnostic ===');
        $this->newLine();

        // Check recent participants
        $this->info('Recent Participants (Last 5):');
        $participants = DB::table('participants')->orderBy('id', 'desc')->limit(5)->get();
        if ($participants->isEmpty()) {
            $this->warn('No participants found!');
        } else {
            foreach ($participants as $p) {
                $this->line("ID: {$p->id} | User: {$p->user_id} | Event: {$p->event_id} | Status: {$p->status} | Registered: {$p->registration_date}");
            }
        }
        $this->newLine();

        // Check recent notifications
        $this->info('Recent Notifications (Last 5):');
        $notifications = Notification::orderBy('id', 'desc')->limit(5)->get();
        if ($notifications->isEmpty()) {
            $this->warn('No notifications found!');
        } else {
            foreach ($notifications as $n) {
                $email = $n->sent_via_email ? '✓' : '✗';
                $this->line("ID: {$n->id} | User: {$n->user_id} | Type: {$n->type} | Email: {$email} | Title: {$n->title}");
            }
        }
        $this->newLine();

        // Check managers
        $this->info('Manager/Admin Users:');
        $managers = User::where('role', 'manager')->orWhere('role', 'admin')->get();
        if ($managers->isEmpty()) {
            $this->error('No managers or admins found!');
        } else {
            foreach ($managers as $m) {
                $this->line("ID: {$m->id} | Name: {$m->name} | Email: {$m->email} | Role: {$m->role}");
            }
        }
        $this->newLine();

        // Check queue status
        $this->info('Queue Status:');
        $pendingJobs = DB::table('jobs')->count();
        $failedJobs = DB::table('failed_jobs')->count();
        $this->line("Pending jobs: {$pendingJobs}");
        $this->line("Failed jobs: {$failedJobs}");
        $this->newLine();

        // Check config
        $this->info('Email Configuration:');
        $this->line("Mail driver: " . config('mail.default'));
        $this->line("Mail from: " . config('mail.from.address'));
        $this->newLine();

        $this->info('Diagnostic complete!');
        return 0;
    }
}
