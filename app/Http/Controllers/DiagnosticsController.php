<?php

namespace App\Http\Controllers;

use App\Models\EventBlast;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class DiagnosticsController extends Controller
{
    public function checkBlastStatus()
    {
        $recentBlasts = EventBlast::with('event')
            ->latest()
            ->take(10)
            ->get()
            ->map(function ($blast) {
                return [
                    'id' => $blast->id,
                    'event_name' => $blast->event->name ?? 'N/A',
                    'blast_type' => $blast->blast_type,
                    'status' => $blast->status,
                    'scheduled_at' => $blast->scheduled_at?->format('Y-m-d H:i:s'),
                    'sent_at' => $blast->sent_at?->format('Y-m-d H:i:s'),
                    'error_message' => $blast->error_message,
                    'telegram_message_id' => $blast->telegram_message_id,
                    'created_at' => $blast->created_at->format('Y-m-d H:i:s'),
                ];
            });

        $logs = [];
        
        // Get scheduler blast logs
        $schedulerLogPath = storage_path('logs/scheduler-blasts.log');
        if (File::exists($schedulerLogPath)) {
            $logs['scheduler_blasts'] = File::get($schedulerLogPath);
        }

        // Get recent Laravel logs
        $laravelLogPath = storage_path('logs/laravel.log');
        if (File::exists($laravelLogPath)) {
            $logs['laravel_recent'] = $this->getTailOfFile($laravelLogPath, 100);
        }

        // Get Telegram-related logs
        if (File::exists($laravelLogPath)) {
            $telegramLogs = shell_exec("grep -i 'telegram\|sendBlast\|sendMessage' " . escapeshellarg($laravelLogPath) . " | tail -50");
            $logs['telegram_logs'] = $telegramLogs ?: 'No Telegram logs found';
        }

        // Check Telegram config
        $config = [
            'bot_token_set' => !empty(config('services.telegram.bot_token')),
            'bot_token_length' => strlen(config('services.telegram.bot_token') ?? ''),
            'channel_id_set' => !empty(config('services.telegram.channel_id')),
            'channel_id_value' => config('services.telegram.channel_id'),
            'config_cached' => File::exists(base_path('bootstrap/cache/config.php')),
            'timestamp' => now()->format('Y-m-d H:i:s'),
        ];

        return response()->json([
            'config' => $config,
            'recent_blasts' => $recentBlasts,
            'logs' => $logs,
        ], 200, [], JSON_PRETTY_PRINT);
    }

    private function getTailOfFile($filepath, $lines = 50)
    {
        $file = new \SplFileObject($filepath, 'r');
        $file->seek(PHP_INT_MAX);
        $lastLine = $file->key();
        $startLine = max(0, $lastLine - $lines);
        
        $result = [];
        $file->seek($startLine);
        while (!$file->eof()) {
            $result[] = $file->current();
            $file->next();
        }
        
        return implode('', $result);
    }

    public function testScheduler(Request $request)
    {
        // Manually trigger the scheduler command
        \Illuminate\Support\Facades\Artisan::call('blasts:send-scheduled');
        $output = \Illuminate\Support\Facades\Artisan::output();

        return response()->json([
            'success' => true,
            'message' => 'Scheduler executed successfully',
            'output' => $output,
            'timestamp' => now()->format('Y-m-d H:i:s'),
        ]);
    }
}
