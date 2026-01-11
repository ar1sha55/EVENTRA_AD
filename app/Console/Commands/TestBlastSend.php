<?php

namespace App\Console\Commands;

use App\Models\Event;
use App\Models\EventBlast;
use App\Services\TelegramService;
use Illuminate\Console\Command;

class TestBlastSend extends Command
{
    protected $signature = 'blast:test {event_id?}';
    protected $description = 'Test sending a blast for an event';

    protected $telegramService;

    public function __construct(TelegramService $telegramService)
    {
        parent::__construct();
        $this->telegramService = $telegramService;
    }

    public function handle()
    {
        $eventId = $this->argument('event_id');

        if (!$eventId) {
            // Get the first published event
            $event = Event::where('status', 'published')->first();
            
            if (!$event) {
                $this->error('No published events found!');
                return 1;
            }
        } else {
            $event = Event::find($eventId);
            
            if (!$event) {
                $this->error("Event with ID {$eventId} not found!");
                return 1;
            }
        }

        $this->info("Testing blast for event: {$event->name} (ID: {$event->id})");
        $this->newLine();

        // Check for pending blasts for this event
        $pendingBlasts = EventBlast::where('event_id', $event->id)
            ->where('status', 'pending')
            ->get();

        $this->info("Pending blasts: " . $pendingBlasts->count());

        if ($pendingBlasts->isEmpty()) {
            $this->warn('No pending blasts found. Creating a test blast...');
            
            $blast = EventBlast::create([
                'event_id' => $event->id,
                'user_id' => 1,
                'message' => "🧪 Test blast for: {$event->name}",
                'caption' => "🎉 *{$event->name}*\n\n📝 {$event->description}\n\n📅 {$event->start_date->format('d M Y, h:i A')}",
                'blast_type' => 'immediate',
                'status' => 'pending',
            ]);
            
            $this->info("Created test blast with ID: {$blast->id}");
        } else {
            $blast = $pendingBlasts->first();
            $this->info("Using existing blast with ID: {$blast->id}");
        }

        $this->newLine();
        $this->info('Attempting to send blast...');
        $this->newLine();

        try {
            $message = $blast->caption ?? $blast->message;
            
            $this->line("Message to send:");
            $this->line("---");
            $this->line($message);
            $this->line("---");
            $this->newLine();

            $telegramMessageId = $this->telegramService->sendBlast($event, $message);

            if ($telegramMessageId) {
                $blast->markAsSent($telegramMessageId);
                $this->info("✓ Blast sent successfully!");
                $this->line("Telegram Message ID: {$telegramMessageId}");
                return 0;
            } else {
                $blast->markAsFailed('Failed to send message to Telegram');
                $this->error("✗ Blast failed to send (no message ID returned)");
                $this->warn("Check the Laravel logs for detailed error information:");
                $this->line("storage/logs/laravel.log");
                return 1;
            }
        } catch (\Exception $e) {
            $blast->markAsFailed($e->getMessage());
            $this->error("✗ Exception occurred: {$e->getMessage()}");
            $this->newLine();
            $this->line("Stack trace:");
            $this->line($e->getTraceAsString());
            return 1;
        }
    }
}
