<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TestTelegramConnection extends Command
{
    protected $signature = 'telegram:test';
    protected $description = 'Test Telegram bot configuration and connection';

    public function handle()
    {
        $this->info('Testing Telegram Configuration...');
        $this->newLine();

        // Check configuration
        $botToken = config('services.telegram.bot_token');
        $channelId = config('services.telegram.channel_id');

        $this->info('Configuration Check:');
        $this->line("Bot Token Set: " . ($botToken ? '✓ Yes' : '✗ No'));
        $this->line("Bot Token Length: " . strlen($botToken ?? ''));
        $this->line("Channel ID Set: " . ($channelId ? '✓ Yes' : '✗ No'));
        $this->line("Channel ID: " . ($channelId ?? 'Not set'));
        $this->newLine();

        if (!$botToken) {
            $this->error('Bot token is not configured!');
            $this->info('Set TELEGRAM_BOT_TOKEN in your .env file');
            return 1;
        }

        if (!$channelId) {
            $this->error('Channel ID is not configured!');
            $this->info('Set TELEGRAM_CHANNEL_ID in your .env file');
            return 1;
        }

        // Test bot connection
        $this->info('Testing Bot Connection...');
        $baseUrl = "https://api.telegram.org/bot{$botToken}";
        
        try {
            $response = Http::get("{$baseUrl}/getMe");
            
            if ($response->successful()) {
                $botInfo = $response->json('result');
                $this->info('✓ Bot connection successful!');
                $this->line("Bot Name: {$botInfo['first_name']}");
                $this->line("Bot Username: @{$botInfo['username']}");
            } else {
                $this->error('✗ Bot connection failed!');
                $this->line('Status: ' . $response->status());
                $this->line('Response: ' . $response->body());
                return 1;
            }
        } catch (\Exception $e) {
            $this->error('✗ Exception during bot test: ' . $e->getMessage());
            return 1;
        }

        $this->newLine();

        // Test sending a message to the channel
        $this->info('Testing Message Send to Channel...');
        
        try {
            $testMessage = "🧪 Test message from EVENTRA at " . now()->format('Y-m-d H:i:s');
            
            $response = Http::post("{$baseUrl}/sendMessage", [
                'chat_id' => $channelId,
                'text' => $testMessage,
                'parse_mode' => 'Markdown',
            ]);

            if ($response->successful()) {
                $messageId = $response->json('result.message_id');
                $this->info('✓ Test message sent successfully!');
                $this->line("Message ID: {$messageId}");
                $this->newLine();
                $this->info('Check your Telegram channel to verify the message was received.');
            } else {
                $this->error('✗ Failed to send message!');
                $this->line('Status: ' . $response->status());
                $this->line('Response: ' . json_encode($response->json(), JSON_PRETTY_PRINT));
                
                // Common error explanations
                $errorCode = $response->json('error_code');
                $errorDescription = $response->json('description');
                
                $this->newLine();
                $this->error('Error Details:');
                $this->line("Code: {$errorCode}");
                $this->line("Description: {$errorDescription}");
                
                if ($errorCode == 400) {
                    $this->warn("\nPossible issues:");
                    $this->line("- Channel ID might be incorrect");
                    $this->line("- Bot is not added as admin to the channel");
                    $this->line("- Message format is invalid");
                }
                
                if ($errorCode == 403) {
                    $this->warn("\nPossible issues:");
                    $this->line("- Bot doesn't have permission to post in the channel");
                    $this->line("- Bot was removed from the channel");
                }
                
                return 1;
            }
        } catch (\Exception $e) {
            $this->error('✗ Exception during message test: ' . $e->getMessage());
            Log::error('Telegram test failed', [
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return 1;
        }

        $this->newLine();
        $this->info('All tests passed! ✓');
        return 0;
    }
}
