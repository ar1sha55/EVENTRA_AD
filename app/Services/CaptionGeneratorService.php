<?php

namespace App\Services;

use App\Models\Event;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class CaptionGeneratorService
{
    /**
     * Generate a caption based on the selected style.
     * * @param Event $event
     * @param string $style
     * @return string
     */
    public function generate(Event $event, string $style = 'engaging'): string
    {
        // FUTURE UPGRADE: Uncomment this block if you install 'openai-php/laravel'
        /*
        if (config('services.openai.enabled')) {
            return $this->generateWithAI($event, $style);
        }
        */

        return match ($style) {
            'professional' => $this->generateProfessional($event),
            'casual'       => $this->generateCasual($event),
            'urgent'       => $this->generateUrgent($event),
            'minimal'      => $this->generateMinimal($event),
            default        => $this->generateEngaging($event),
        };
    }

    /**
     * Style: Engaging & Enthusiastic (Default)
     */
    protected function generateProfessional(Event $event): string
    {
        $lines = [
            "*{$event->name}*",
            "",
            "We cordially invite you to join us for " . $this->getEventType($event) . ".",
            "",
            "📅 *Date:* " . $event->start_date->format('l, F j, Y'),
            "🕐 *Time:* " . $event->start_date->format('g:i A') . " - " . $event->end_date->format('g:i A'),
            "📍 *Venue:* {$event->location}",
            $this->formatPriceLine($event, '💵 *Fee:*'),
            "",
            "Your participation would be highly appreciated.",
            "Please register via the link below to secure your attendance.",
        ];

        return $this->compile($lines);
    }

    /**
     * Style: Casual & Friendly
     */
    protected function generateCasual(Event $event): string
    {
        $lines = [
            "Hey everyone! 👋",
            "",
            "Exciting news! We're hosting *{$event->name}* and we'd love to see you there! 🎊",
            "",
            "📆 *When:* " . $event->start_date->format('M j, Y'),
            "⏰ *Time:* " . $event->start_date->format('g:i A'),
            "📌 *Where:* {$event->location}",
            $this->formatPriceLine($event, '💸 *Cost:*', "🎁 *Best part?* It's completely free!"),
            "",
            $this->getCasualClosing(),
        ];

        return $this->compile($lines);
    }

    /**
     * Style: High Urgency / FOMO
     */
    protected function generateUrgent(Event $event): string
    {
        $now = now();
        $start = $event->start_date;
        $diffDays = $now->diffInDays($start, false);
        $diffHours = $now->diffInHours($start, false);

        // Dynamic Header based on time left
        $header = match (true) {
            $diffHours < 0  => "🔴 *EVENT ENDED*",
            $diffHours < 24 => "⚡ *HAPPENING TODAY!* ⚡",
            $diffDays < 2   => "⚡ *TOMORROW!* Last Chance! ⚡",
            default         => "⚡ *HAPPENING SOON!* ⚡",
        };

        $lines = [
            $header,
            "",
            "*{$event->name}*",
            "",
            $diffDays > 1 ? "⏰ *Only {$diffDays} days left!*" : "⏰ *Don't miss out!*",
            "📅 " . $event->start_date->format('F j, Y @ g:i A'),
            "📍 {$event->location}",
            "",
            $event->capacity ? "⚠️ *Limited to {$event->capacity} participants!*" : null,
            "🚀 Register NOW before spots run out!",
        ];

        return $this->compile($lines);
    }

    /**
     * Style: Minimalist
     */
    protected function generateMinimal(Event $event): string
    {
        $lines = [
            "*{$event->name}*",
            "",
            $event->start_date->format('M j, Y • g:i A'),
            $event->location,
            $this->formatPriceLine($event, '', 'Free Admission'),
        ];

        return $this->compile($lines);
    }

    /**
     * Style: Engaging (The detailed default)
     */
    protected function generateEngaging(Event $event): string
    {
        $emojis = $this->getEventEmojis($event);
        
        $lines = [
            "{$emojis['main']} *{$event->name}* {$emojis['main']}",
            "",
            $this->getEventHook($event),
            "",
            "{$emojis['date']} *When:* " . $event->start_date->format('l, F j, Y'),
            "⏰ *Time:* " . $event->start_date->format('g:i A') . " - " . $event->end_date->format('g:i A'),
            "{$emojis['location']} *Where:* {$event->location}",
            $event->capacity ? "👥 *Slots:* {$event->capacity} pax" : null,
            $this->formatPriceLine($event, '💰 *Investment:*', "🆓 *It's FREE!*"),
            "",
            $this->getCallToAction($event),
        ];

        return $this->compile($lines);
    }

    // ----------------------------------------------------------------------
    // Helpers
    // ----------------------------------------------------------------------

    /**
     * Compiles an array of lines into a single string, removing nulls.
     */
    private function compile(array $lines): string
    {
        return implode("\n", array_filter($lines, fn($line) => !is_null($line)));
    }

    /**
     * Smart formatting for price lines
     */
    private function formatPriceLine(Event $event, string $prefix, string $freeText = 'Free'): string
    {
        if ($event->fee && $event->fee > 0) {
            return "{$prefix} RM " . number_format($event->fee, 2);
        }
        return $freeText;
    }

    /**
     * Get contextual emojis based on event content
     */
    protected function getEventEmojis(Event $event): array
    {
        $haystack = strtolower($event->name . ' ' . ($event->description ?? ''));

        $mainEmoji = match (true) {
            str_contains($haystack, 'workshop') || str_contains($haystack, 'learn') => '🛠️',
            str_contains($haystack, 'conference') || str_contains($haystack, 'talk') => '🎤',
            str_contains($haystack, 'volunteer') || str_contains($haystack, 'help') => '🤝',
            str_contains($haystack, 'food') || str_contains($haystack, 'dinner') => '🍽️',
            str_contains($haystack, 'sport') || str_contains($haystack, 'run') => '🏃',
            str_contains($haystack, 'music') || str_contains($haystack, 'concert') => '🎵',
            str_contains($haystack, 'party') || str_contains($haystack, 'celebration') => '🎉',
            str_contains($haystack, 'online') || str_contains($haystack, 'webinar') => '💻',
            default => '✨',
        };

        return [
            'main' => $mainEmoji,
            'date' => '📅',
            'location' => '📍',
        ];
    }

    protected function getEventHook(Event $event): string
    {
        $haystack = strtolower($event->name);

        if (str_contains($haystack, 'volunteer')) {
            return "Make a positive impact in our community! 🌍";
        }
        if (str_contains($haystack, 'workshop')) {
            return "Level up your skills with us! 🚀";
        }

        return collect([
            "Join us for an unforgettable experience!",
            "Be part of something special!",
            "Ready for something exciting?",
            "You don't want to miss this one!",
        ])->random();
    }

    protected function getCallToAction(Event $event): string
    {
        if ($event->capacity && $event->capacity < 50) {
            return "⚡ _Limited spots available - grab yours now!_";
        }

        return collect([
            "🌟 _Don't wait - register today!_",
            "✨ _Secure your spot now!_",
            "💫 _Bring a friend and join us!_",
            "🚀 _Sign up below!_",
        ])->random();
    }

    protected function getEventType(Event $event): string
    {
        $name = strtolower($event->name);
        
        return match (true) {
            str_contains($name, 'workshop') => 'an interactive workshop',
            str_contains($name, 'seminar') => 'an insightful seminar',
            str_contains($name, 'webinar') => 'an exclusive webinar',
            str_contains($name, 'volunteer') => 'a community volunteering event',
            default => 'this special event',
        };
    }

    protected function getCasualClosing(): string
    {
        return collect([
            "Can't wait to see you there! 🙌",
            "See you soon! 👋",
            "It's going to be awesome! ✨",
            "Don't be a stranger! 😊",
        ])->random();
    }

    /**
     * Styles for the frontend dropdown
     */
    public function getAvailableStyles(): array
    {
        return [
            ['value' => 'engaging', 'label' => 'Engaging & Enthusiastic', 'description' => 'Perfect for most events'],
            ['value' => 'professional', 'label' => 'Professional & Formal', 'description' => 'Ideal for corporate events'],
            ['value' => 'casual', 'label' => 'Casual & Friendly', 'description' => 'Great for community events'],
            ['value' => 'urgent', 'label' => 'Urgent & Time-Sensitive', 'description' => 'For last-minute reminders'],
            ['value' => 'minimal', 'label' => 'Minimal & Concise', 'description' => 'Short and simple'],
        ];
    }
}