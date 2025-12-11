<?php

namespace App\Services;

use App\Models\Event;
use App\Models\User;
use App\Models\Participant;
use App\Models\UserPreference;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RecommendationService
{
    /**
     * Get personalized event recommendations for a user
     *
     * @param User $user
     * @param int $limit
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getPersonalizedRecommendations(User $user, int $limit = 3)
    {
        try {
            // Get events user hasn't registered for
            $registeredEventIds = Participant::where('user_id', $user->id)
                ->pluck('event_id')
                ->toArray();

            $availableEvents = Event::where('status', 'published')
                ->where('start_date', '>=', now())
                ->whereNotIn('id', $registeredEventIds)
                ->get();

            if ($availableEvents->isEmpty()) {
                return collect();
            }

            // Get user preferences
            $userPreference = UserPreference::where('user_id', $user->id)->first();

            // Get user's past registrations for behavior analysis
            $pastRegistrations = Participant::where('user_id', $user->id)
                ->with('event')
                ->get();

            // Score each event
            $scoredEvents = $availableEvents->map(function ($event) use ($user, $userPreference, $pastRegistrations) {
                $score = $this->calculateEventScore($event, $user, $userPreference, $pastRegistrations);
                $event->recommendation_score = $score['total'];
                $event->recommendation_reasons = $score['reasons'];
                return $event;
            });

            // Sort by score and return top N
            return $scoredEvents->sortByDesc('recommendation_score')
                ->take($limit)
                ->values();

        } catch (\Exception $e) {
            Log::error("Recommendation Service Error: " . $e->getMessage());
            // Fallback to simple date-based sorting
            return Event::where('status', 'published')
                ->where('start_date', '>=', now())
                ->whereNotIn('id', $registeredEventIds ?? [])
                ->orderBy('start_date', 'asc')
                ->limit($limit)
                ->get();
        }
    }

    /**
     * Calculate comprehensive score for an event
     *
     * @param Event $event
     * @param User $user
     * @param UserPreference|null $preference
     * @param \Illuminate\Support\Collection $pastRegistrations
     * @return array
     */
    private function calculateEventScore(Event $event, User $user, $preference, $pastRegistrations): array
    {
        $scores = [];
        $reasons = [];
        $totalScore = 0;

        // 1. INTEREST MATCH SCORE (40%) - Based on user preferences
        $interestScore = $this->calculateInterestScore($event, $preference);
        if ($interestScore['score'] > 0) {
            $scores['interest'] = $interestScore['score'] * 0.40;
            $totalScore += $scores['interest'];
            if (!empty($interestScore['reason'])) {
                $reasons[] = $interestScore['reason'];
            }
        }

        // 2. BEHAVIORAL SIMILARITY SCORE (25%) - Based on past registrations
        $behaviorScore = $this->calculateBehaviorScore($event, $pastRegistrations);
        if ($behaviorScore['score'] > 0) {
            $scores['behavior'] = $behaviorScore['score'] * 0.25;
            $totalScore += $scores['behavior'];
            if (!empty($behaviorScore['reason'])) {
                $reasons[] = $behaviorScore['reason'];
            }
        }

        // 3. FACULTY CORRELATION SCORE (20%) - Popular with user's faculty
        $facultyScore = $this->calculateFacultyScore($event, $user);
        if ($facultyScore['score'] > 0) {
            $scores['faculty'] = $facultyScore['score'] * 0.20;
            $totalScore += $scores['faculty'];
            if (!empty($facultyScore['reason'])) {
                $reasons[] = $facultyScore['reason'];
            }
        }

        // 4. COLLABORATIVE FILTERING SCORE (15%) - Similar users
        $collaborativeScore = $this->calculateCollaborativeScore($event, $user, $pastRegistrations);
        if ($collaborativeScore['score'] > 0) {
            $scores['collaborative'] = $collaborativeScore['score'] * 0.15;
            $totalScore += $scores['collaborative'];
            if (!empty($collaborativeScore['reason'])) {
                $reasons[] = $collaborativeScore['reason'];
            }
        }

        // 5. BONUS FACTORS
        // Urgency bonus - events happening soon
        $daysUntil = now()->diffInDays($event->start_date, false);
        if ($daysUntil >= 0 && $daysUntil <= 7) {
            $urgencyBonus = (7 - $daysUntil) * 0.5;
            $totalScore += $urgencyBonus;
            $reasons[] = "Starting soon!";
        }

        // Availability bonus - spots filling up
        if ($event->capacity) {
            $registered = Participant::where('event_id', $event->id)
                ->whereIn('status', ['APPROVED', 'PENDING'])
                ->count();
            $availabilityRatio = $registered / $event->capacity;
            if ($availabilityRatio > 0.7 && $availabilityRatio < 1.0) {
                $totalScore += 2;
                $reasons[] = "Filling fast!";
            }
        }

        // Free event bonus (slight preference for free events)
        if (!$event->fee || $event->fee == 0) {
            if ($preference && $preference->event_type_preference === 'free') {
                $totalScore += 3;
                $reasons[] = "Free event";
            }
        }

        // Normalize total score to 0-100 range
        $totalScore = min(100, max(0, $totalScore));

        return [
            'total' => round($totalScore, 2),
            'breakdown' => $scores,
            'reasons' => array_unique($reasons)
        ];
    }

    /**
     * Calculate score based on user's stated interests
     */
    private function calculateInterestScore(Event $event, $preference): array
    {
        if (!$preference || empty($preference->interest_keywords)) {
            return ['score' => 0, 'reason' => ''];
        }

        $keywords = $preference->interest_keywords;
        $eventText = strtolower($event->name . ' ' . $event->description);

        $matchCount = 0;
        $matchedInterests = [];

        foreach ($keywords as $keyword) {
            $keyword = strtolower(trim($keyword));
            if (str_contains($eventText, $keyword)) {
                $matchCount++;
                $matchedInterests[] = $keyword;
            }
        }

        if ($matchCount > 0) {
            $score = ($matchCount / count($keywords)) * 100;
            $reason = "Matches your interest in " . implode(', ', array_slice($matchedInterests, 0, 2));
            return ['score' => $score, 'reason' => $reason];
        }

        return ['score' => 0, 'reason' => ''];
    }

    /**
     * Calculate score based on similarity to past events user joined
     */
    private function calculateBehaviorScore(Event $event, $pastRegistrations): array
    {
        if ($pastRegistrations->isEmpty()) {
            return ['score' => 0, 'reason' => ''];
        }

        $eventText = strtolower($event->name . ' ' . $event->description);
        $maxSimilarity = 0;
        $mostSimilarEvent = null;

        foreach ($pastRegistrations as $registration) {
            if (!$registration->event) continue;

            $pastEventText = strtolower($registration->event->name . ' ' . $registration->event->description);
            $similarity = $this->calculateTextSimilarity($eventText, $pastEventText);

            if ($similarity > $maxSimilarity) {
                $maxSimilarity = $similarity;
                $mostSimilarEvent = $registration->event;
            }
        }

        if ($maxSimilarity > 0.3) {
            $score = $maxSimilarity * 100;
            $reason = $mostSimilarEvent ? "Similar to '{$mostSimilarEvent->name}' you attended" : '';
            return ['score' => $score, 'reason' => $reason];
        }

        return ['score' => 0, 'reason' => ''];
    }

    /**
     * Calculate score based on faculty popularity
     */
    private function calculateFacultyScore(Event $event, User $user): array
    {
        if (!$user->faculty) {
            return ['score' => 0, 'reason' => ''];
        }

        // Count how many users from same faculty registered
        $facultyParticipants = Participant::where('event_id', $event->id)
            ->whereHas('user', function ($query) use ($user) {
                $query->where('faculty', $user->faculty);
            })
            ->count();

        $totalParticipants = Participant::where('event_id', $event->id)->count();

        if ($facultyParticipants > 0 && $totalParticipants > 0) {
            $facultyRatio = $facultyParticipants / max($totalParticipants, 1);
            $score = $facultyRatio * 100;

            if ($facultyParticipants >= 5) {
                $facultyName = strtoupper($user->faculty);
                $reason = "Popular with {$facultyName} students ({$facultyParticipants} registered)";
                return ['score' => $score, 'reason' => $reason];
            }
        }

        return ['score' => 0, 'reason' => ''];
    }

    /**
     * Calculate score based on what similar users are joining
     */
    private function calculateCollaborativeScore(Event $event, User $user, $pastRegistrations): array
    {
        // Find users with similar registration patterns (same faculty + similar events)
        $userEventIds = $pastRegistrations->pluck('event_id')->toArray();

        if (empty($userEventIds)) {
            return ['score' => 0, 'reason' => ''];
        }

        // Find users who registered for similar events
        $similarUsers = Participant::whereIn('event_id', $userEventIds)
            ->where('user_id', '!=', $user->id)
            ->select('user_id')
            ->distinct()
            ->limit(50)
            ->pluck('user_id');

        if ($similarUsers->isEmpty()) {
            return ['score' => 0, 'reason' => ''];
        }

        // Check how many of these similar users are joining this event
        $similarUsersJoining = Participant::where('event_id', $event->id)
            ->whereIn('user_id', $similarUsers)
            ->count();

        if ($similarUsersJoining > 0) {
            $score = min(100, $similarUsersJoining * 20);
            $reason = "Volunteers with similar interests are joining";
            return ['score' => $score, 'reason' => $reason];
        }

        return ['score' => 0, 'reason' => ''];
    }

    /**
     * Calculate text similarity using Jaccard similarity
     */
    private function calculateTextSimilarity(string $text1, string $text2): float
    {
        // Simple word-based Jaccard similarity
        $words1 = array_unique(str_word_count($text1, 1));
        $words2 = array_unique(str_word_count($text2, 1));

        if (empty($words1) || empty($words2)) {
            return 0;
        }

        $intersection = count(array_intersect($words1, $words2));
        $union = count(array_unique(array_merge($words1, $words2)));

        return $union > 0 ? $intersection / $union : 0;
    }

    /**
     * Extract volunteering interest keywords from user text input
     */
    public function extractInterestKeywords(string $text): array
    {
        $text = strtolower($text);

        // Volunteering categories with their related keywords
        $categories = [
            'community' => ['community', 'service', 'outreach', 'charity', 'helping', 'volunteer'],
            'education' => ['education', 'teaching', 'tutoring', 'mentor', 'mentoring', 'training', 'workshop', 'academic'],
            'environment' => ['environment', 'environmental', 'cleanup', 'sustainability', 'recycling', 'tree planting', 'green', 'nature'],
            'healthcare' => ['health', 'healthcare', 'medical', 'wellness', 'blood donation', 'fitness', 'mental health'],
            'technology' => ['technology', 'tech', 'coding', 'programming', 'digital', 'it', 'innovation', 'software', 'computer'],
            'sports' => ['sports', 'sport', 'fitness', 'recreation', 'tournament', 'active', 'physical', 'athletic'],
            'arts' => ['arts', 'art', 'cultural', 'culture', 'performance', 'music', 'creative', 'design', 'theatre'],
            'research' => ['research', 'science', 'scientific', 'study', 'academic', 'lab', 'experiment']
        ];

        $extractedKeywords = [];

        foreach ($categories as $category => $keywords) {
            foreach ($keywords as $keyword) {
                if (str_contains($text, $keyword)) {
                    $extractedKeywords[] = $category;
                    break; // Only add category once
                }
            }
        }

        // Also extract any explicit keywords mentioned
        $words = str_word_count($text, 1);
        foreach ($words as $word) {
            if (strlen($word) > 3 && !in_array($word, ['event', 'events', 'show', 'find', 'looking', 'interested', 'want'])) {
                $extractedKeywords[] = $word;
            }
        }

        return array_unique($extractedKeywords);
    }
}
