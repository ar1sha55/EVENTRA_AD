<?php

namespace App\Console\Commands;

use App\Models\EventBlast;
use App\Services\TelegramService;
use Illuminate\Console\Command;

class SendScheduledBlasts extends Command
{
    protected $signature = 'blasts:send-scheduled';
    protected $description = 'Send scheduled and recurring event blasts to Telegram';

    protected $telegramService;

    public function __construct(TelegramService $telegramService)
    {
        parent::__construct();
        $this->telegramService = $telegramService;
    }

    public function handle()
    {
        $this->info('Checking for scheduled blasts...');

        $blasts = EventBlast::readyToSend()
            ->with('event')
            ->get();

        if ($blasts->isEmpty()) {
            $this->info('No blasts ready to send.');
            return 0;
        }

        $this->info("Found {$blasts->count()} blast(s) to send.");

        $sent = 0;
        $failed = 0;

        foreach ($blasts as $blast) {
            $this->info("Sending blast #{$blast->id} for event: {$blast->event->name}");

            try {
                $message = $blast->caption ?? $blast->message;
                $telegramMessageId = $this->telegramService->sendBlast($blast->event, $message);

                if ($telegramMessageId) {
                    $blast->markAsSent($telegramMessageId);
                    $this->info("✓ Blast #{$blast->id} sent successfully!");
                    $sent++;
                } else {
                    $blast->markAsFailed('Failed to send message to Telegram');
                    $this->error("✗ Blast #{$blast->id} failed to send.");
                    $failed++;
                }
            } catch (\Exception $e) {
                $blast->markAsFailed($e->getMessage());
                $this->error("✗ Blast #{$blast->id} error: {$e->getMessage()}");
                $failed++;
            }
        }

        $this->info("\nSummary:");
        $this->info("Sent: {$sent}");
        $this->error("Failed: {$failed}");

        return 0;
    }
}
