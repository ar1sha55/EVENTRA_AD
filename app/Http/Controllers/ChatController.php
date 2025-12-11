<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use App\Models\Event;
use App\Models\User;
use App\Models\Participant;
use App\Models\UserPreference;
use App\Services\RecommendationService;
use Illuminate\Support\Facades\DB;

class ChatController extends Controller
{
    public function chat(Request $request)
    {
        $message = $request->input('message');

        // Security: Ensure user is authenticated
        if (!Auth::check()) {
            return response()->json([
                'reply' => "Please [login](/login) to use the chatbot."
            ], 401);
        }

        try {
            $response = $this->getGeminiChatResponse($message);
            return response()->json(['reply' => $response]);
        } catch (\Throwable $e) {
            Log::error("Chatbot Error: " . $e->getMessage(), [
                'user_id' => Auth::id(),
                'message' => $message,
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'reply' => "I'm experiencing technical difficulties. Please try again in a moment, or [contact support](/contact-support) if the issue persists."
            ], 500);
        }
    }

    /**
     * Clear chat history from session
     */
    public function clear(Request $request)
    {
        Session::forget('chat_history');
        return response()->json(['success' => true]);
    }

    private function getGeminiChatResponse(string $userMessage): string
    {
        // Detect and store user interests if mentioned
        $this->detectAndStoreInterests($userMessage);

        $apiKey = env('GEMINI_API_KEY');

        if (empty($apiKey)) {
            return "System Configuration Error: The API Key is missing.";
        }

        $model = 'gemini-2.5-flash'; 

        // 1. Retrieve Chat History from Session (Limit to last 5 turns to save tokens)
        $history = Session::get('chat_history', []);
        
        // 2. Build the Payload
        // We start with the System Instruction as a "user" message (Gemini convention for REST)
        $contents = [
            [
                'role' => 'user',
                'parts' => [['text' => $this->buildSystemPrompt()]]
            ],
            [
                'role' => 'model',
                'parts' => [['text' => "Understood. I am ready to assist " . (Auth::user()->name ?? 'the guest') . "."]]
            ]
        ];

        // Append History (The "Memory")
        foreach ($history as $turn) {
            $contents[] = $turn;
        }

        // Append the NEW User Message
        $contents[] = [
            'role' => 'user',
            'parts' => [['text' => $userMessage]]
        ];

        // 3. Call API
        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
        ])->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}", [
            'contents' => $contents
        ]);

        if ($response->failed()) {
            $errorBody = $response->json();
            $errorMessage = $errorBody['error']['message'] ?? $response->body();
            return "System Error: " . $errorMessage;
        }

        $botReply = $response->json('candidates.0.content.parts.0.text') ?? "I'm not sure how to answer that.";

        // 4. Save the new interaction to Session History
        $this->updateHistory($userMessage, $botReply);

        return $botReply;
    }

    /**
     * Stores the latest interaction in the session.
     */
    private function updateHistory($userMsg, $botMsg)
    {
        $history = Session::get('chat_history', []);
        
        // Add User Message
        $history[] = ['role' => 'user', 'parts' => [['text' => $userMsg]]];
        // Add Bot Message
        $history[] = ['role' => 'model', 'parts' => [['text' => $botMsg]]];

        // Keep only the last 20 messages (10 turns) for better context
        if (count($history) > 20) {
            $history = array_slice($history, -20);
        }

        Session::put('chat_history', $history);
    }

    private function buildSystemPrompt(): string
    {
        $user = Auth::user();
        $userName = $user->name;
        $userRole = $user->role;

        // Get role-specific data
        $navData = $this->getSmartNavigation();
        $eventData = $this->getRichEventData();
        $personalData = $this->getPersonalizedUserData();
        $faqData = $this->getExpandedFaq();
        $quickActions = $this->getQuickActions();
        $roleCapabilities = $this->getRoleCapabilities();
        $recommendationGuidance = $this->getRecommendationGuidance();

        return <<<EOT
You are **EventraBot**, the intelligent AI assistant for Eventra - the premier event management platform.

**Current User:** {$userName} (Role: {$userRole})

### YOUR MISSION:
Be helpful, proactive, and context-aware. Provide accurate information, suggest relevant actions, and guide users efficiently through the platform.

### CORE INSTRUCTIONS:
1. **Personalization:** Address {$userName} by name occasionally. Tailor responses based on their role ({$userRole}).
2. **Memory:** You have conversation history. Reference previous messages for context and continuity.
3. **Navigation:** ALWAYS use Markdown links for pages: `[Page Name](/url)`. Make navigation effortless.
4. **Clarity:** Be concise but comprehensive. Use bullet points for multi-step guidance.
5. **Proactivity:** Suggest relevant next steps based on user questions.
6. **Scope:** Only discuss Eventra-related topics. Politely decline off-topic requests.
7. **Formatting:** Use **bold** for emphasis, bullet lists for options, and numbered lists for steps.

{$roleCapabilities}

### PERSONALIZED DATA:
{$personalData}

### AVAILABLE NAVIGATION:
{$navData}

### UPCOMING EVENTS:
{$eventData}

### QUICK ACTIONS YOU CAN SUGGEST:
{$quickActions}

### FREQUENTLY ASKED QUESTIONS:
{$faqData}

{$recommendationGuidance}

### RESPONSE GUIDELINES:
- Start with a direct answer
- Provide relevant links
- Suggest logical next steps
- Be empathetic and encouraging
- If uncertain, guide to appropriate help resources
EOT;
    }

    private function getSmartNavigation(): string
    {
        $user = Auth::user();
        $routes = [
            ['name' => 'Dashboard', 'url' => '/dashboard', 'desc' => 'View your registered events and activity'],
            ['name' => 'Join Events', 'url' => '/join-events', 'desc' => 'Discover and register for upcoming events'],
            ['name' => 'Events Gallery', 'url' => '/events-gallery', 'desc' => 'Browse past event photos and highlights'],
            ['name' => 'Announcements', 'url' => '/announcement', 'desc' => 'View latest platform announcements'],
            ['name' => 'Profile Settings', 'url' => '/settings/profile', 'desc' => 'Update your profile, password, and preferences'],
            ['name' => 'Support', 'url' => '/contact-support', 'desc' => 'Get help from our support team'],
        ];

        // Manager & Admin routes
        if (in_array($user->role, ['manager', 'admin'])) {
            $routes[] = ['name' => 'Manager Dashboard', 'url' => '/manager/dashboard', 'desc' => 'View statistics and manage your club'];
            $routes[] = ['name' => 'Manage Events', 'url' => '/events', 'desc' => 'Create, edit, and manage all your events'];
            $routes[] = ['name' => 'Analytics', 'url' => '/manager/manage-analytics', 'desc' => 'View detailed event analytics and reports'];
            $routes[] = ['name' => 'Manage Members', 'url' => '/manager/manage-members', 'desc' => 'View and manage event participants'];
            $routes[] = ['name' => 'Event Blast', 'url' => '/manager/event-blast', 'desc' => 'Send mass notifications to participants'];
            $routes[] = ['name' => 'Send Announcement', 'url' => '/manager/send-announcement', 'desc' => 'Post announcements to users'];
        }

        // Admin-only routes
        if ($user->role === 'admin') {
            $routes[] = ['name' => 'System Control', 'url' => '/admin/system-control', 'desc' => 'Access admin system controls'];
        }

        $output = "";
        foreach ($routes as $route) {
            $output .= "- **{$route['name']}** → `{$route['url']}` - {$route['desc']}\n";
        }
        return $output;
    }

    private function getRichEventData(): string
    {
        try {
            $events = Event::where('start_date', '>=', now())
                ->orderBy('start_date', 'asc')
                ->limit(8)
                ->get();

            if ($events->isEmpty()) {
                return "No upcoming events scheduled at the moment. Check back soon for new events!";
            }

            $output = "";
            foreach ($events as $event) {
                $date = $event->start_date->format('M d, Y');
                $time = $event->start_date->format('g:i A');
                $location = $event->location ?? 'TBA';
                $capacity = $event->capacity ?? null;

                // Count current participants (only approved and pending take up spots)
                $registered = Participant::where('event_id', $event->id)
                    ->whereIn('status', ['APPROVED', 'PENDING'])
                    ->count();

                $capacityDisplay = $capacity ? $capacity : 'Unlimited';
                $spotsLeft = $capacity ? ($capacity - $registered) : null;

                // Availability status
                $availabilityBadge = '';
                if ($capacity && $spotsLeft <= 0) {
                    $availabilityBadge = ' • ⚠️ **FULL**';
                } elseif ($spotsLeft && $spotsLeft <= 5) {
                    $availabilityBadge = " • 🔥 **Only {$spotsLeft} spots left!**";
                } elseif ($spotsLeft && $spotsLeft <= 10) {
                    $availabilityBadge = " • ⚡ **{$spotsLeft} spots remaining**";
                }

                $output .= "**{$event->name}**{$availabilityBadge}\n";
                $output .= "📅 {$date} at {$time}\n";
                $output .= "📍 {$location}\n";

                // Capacity and fee on same line
                $details = "👥 {$registered}/" . ($capacity ?? 'Unlimited');
                if ($event->fee && $event->fee > 0) {
                    $details .= " • 💵 RM " . number_format($event->fee, 2);
                } else {
                    $details .= " • 🎉 **FREE**";
                }
                $output .= "{$details}\n\n";
            }
            return $output;
        } catch (\Exception $e) {
            Log::error("ChatBot Event Data Error: " . $e->getMessage());
            return "Unable to load event data at the moment.";
        }
    }

    private function getExpandedFaq(): string
    {
        $user = Auth::user();
        $faq = [];

        // Common FAQs for all users
        $faq[] = "**Q: How do I register for an event?**\nA: Go to [Join Events](/join-events), browse available events, and click 'Register' on the event you want to join. For paid events, you'll need to upload payment proof.";
        $faq[] = "**Q: How do I make payment for paid events?**\nA: After clicking register on a paid event, you'll see a QR code. Scan it with your banking app to make payment, then take a screenshot and upload it as proof. Your registration will be pending until the manager approves your payment.";
        $faq[] = "**Q: Where can I view my registered events?**\nA: Visit your [Dashboard](/dashboard) to see all events you've registered for, along with their approval status (Approved, Pending, or Rejected).";
        $faq[] = "**Q: How do I cancel my event registration?**\nA: You can unregister from events on the [Join Events](/join-events) page. Click on the event you're registered for and click 'Unregister'. Note: Some events may have cancellation deadlines.";
        $faq[] = "**Q: How do I update my profile information?**\nA: Go to [Profile Settings](/settings/profile) to update your name, email, faculty, and profile picture.";
        $faq[] = "**Q: How do I change my password?**\nA: Navigate to [Password Settings](/settings/password) to update your password securely.";
        $faq[] = "**Q: What if my registration is rejected?**\nA: If your registration is rejected (usually due to payment issues), you'll see the status on your [Dashboard](/dashboard). You can try registering again with valid payment proof.";

        // Manager-specific FAQs
        if (in_array($user->role, ['manager', 'admin'])) {
            $faq[] = "**Q: How do I create a new event?**\nA: Go to [Manage Events](/events) and click the 'Create Event' button at the top right. Fill in the event details in the modal form that appears.";
            $faq[] = "**Q: How do I manage participant approvals?**\nA: Go to [Manage Events](/events), find your event, and click on the participants count or actions menu to view and approve/reject registrations.";
            $faq[] = "**Q: How can I send announcements to participants?**\nA: Use [Event Blast](/manager/event-blast) to send targeted notifications to event participants, or [Send Announcement](/manager/send-announcement) for general announcements.";
            $faq[] = "**Q: Where can I view event analytics?**\nA: Check [Analytics](/manager/manage-analytics) for detailed reports on attendance, revenue, and engagement, or view quick stats on your [Manager Dashboard](/manager/dashboard).";
            $faq[] = "**Q: How do I edit or delete an event?**\nA: Go to [Manage Events](/events), find the event, click the three-dot menu, and select Edit or Delete.";
        }

        // Admin-specific FAQs
        if ($user->role === 'admin') {
            $faq[] = "**Q: How do I access system controls?**\nA: Go to [System Control](/admin/system-control) for administrative functions.";
            $faq[] = "**Q: Can I manage all users and events?**\nA: Yes, as an admin you have full access to all platform features and data.";
        }

        return implode("\n\n", $faq);
    }

    /**
     * Get personalized user data based on their role and activity
     */
    private function getPersonalizedUserData(): string
    {
        $user = Auth::user();
        $data = [];

        try {
            if ($user->role === 'member') {
                // Member: Show their registrations and participation stats
                $registrations = Participant::where('user_id', $user->id)
                    ->with('event')
                    ->orderBy('registration_date', 'desc')
                    ->get();

                $upcomingEvents = $registrations->filter(function($p) {
                    return $p->event && $p->event->start_date >= now();
                });

                $approvedCount = $registrations->where('status', 'APPROVED')->count();
                $pendingCount = $registrations->where('status', 'PENDING')->count();
                $totalEvents = $registrations->count();
                $upcomingCount = $upcomingEvents->count();

                $data[] = "**📊 Your Activity:**";
                $data[] = "- Total Registered: {$totalEvents} events";
                $data[] = "- Status: ✅ {$approvedCount} approved | ⏳ {$pendingCount} pending";

                // Show upcoming registered events with reminders
                if ($upcomingEvents->isNotEmpty()) {
                    $data[] = "";
                    $data[] = "---";
                    $data[] = "## 🎫 Your Upcoming Events";
                    $data[] = "";

                    foreach ($upcomingEvents->take(3) as $participant) {
                        $event = $participant->event;
                        if ($event) {
                            $date = $event->start_date->format('M d, Y');
                            $time = $event->start_date->format('g:i A');
                            $daysUntil = now()->diffInDays($event->start_date, false);

                            // Status badge
                            $statusBadge = '';
                            if ($participant->status === 'APPROVED') {
                                $statusBadge = '✅ **Approved**';
                            } elseif ($participant->status === 'PENDING') {
                                $statusBadge = '⏳ **Pending Approval**';
                            } else {
                                $statusBadge = '❌ **Rejected**';
                            }

                            // Urgency badge
                            $urgencyBadge = '';
                            if ($daysUntil <= 1 && $participant->status === 'APPROVED') {
                                $urgencyBadge = ' • 🔥 **TOMORROW!**';
                            } elseif ($daysUntil <= 3 && $participant->status === 'APPROVED') {
                                $urgencyBadge = ' • ⚡ **Very Soon**';
                            } elseif ($daysUntil <= 7) {
                                $urgencyBadge = ' • 📌 **This Week**';
                            }

                            $data[] = "**{$event->name}**";
                            $data[] = "{$statusBadge}{$urgencyBadge}";
                            $data[] = "📅 {$date} at {$time}";
                            $data[] = "📍 {$event->location}";
                            $data[] = "";
                        }
                    }

                    if ($upcomingEvents->count() > 3) {
                        $data[] = "_+ " . ($upcomingEvents->count() - 3) . " more events on your [Dashboard](/dashboard)_";
                        $data[] = "";
                    }
                }

                // Smart Event Recommendations using AI
                $recommendationService = new RecommendationService();
                $recommendedEvents = $recommendationService->getPersonalizedRecommendations($user, 3);

                if ($recommendedEvents->isNotEmpty()) {
                    $data[] = "\n---";
                    $data[] = "## 🎯 Personalized for You";
                    $data[] = "";

                    $rank = 1;
                    foreach ($recommendedEvents as $event) {
                        $date = $event->start_date->format('M d, Y');
                        $time = $event->start_date->format('g:i A');
                        $daysUntil = now()->diffInDays($event->start_date, false);

                        // Match score badge
                        $matchScore = isset($event->recommendation_score) ? round($event->recommendation_score) : null;
                        $scoreBadge = "";
                        if ($matchScore) {
                            if ($matchScore >= 90) {
                                $scoreBadge = "🔥 **{$matchScore}% Perfect Match**";
                            } elseif ($matchScore >= 80) {
                                $scoreBadge = "⭐ **{$matchScore}% Great Match**";
                            } elseif ($matchScore >= 70) {
                                $scoreBadge = "✨ **{$matchScore}% Good Match**";
                            } else {
                                $scoreBadge = "💫 **{$matchScore}% Match**";
                            }
                        }

                        // Event card
                        $data[] = "### {$rank}. {$event->name}";
                        if ($scoreBadge) {
                            $data[] = "{$scoreBadge}";
                        }
                        $data[] = "";

                        // Event details
                        $data[] = "📅 **{$date}** at {$time}";
                        $data[] = "📍 **{$event->location}**";

                        // Fee info
                        if ($event->fee && $event->fee > 0) {
                            $data[] = "💵 RM " . number_format($event->fee, 2);
                        } else {
                            $data[] = "🎉 **FREE Event**";
                        }

                        // Capacity info
                        if ($event->capacity) {
                            $registered = Participant::where('event_id', $event->id)
                                ->whereIn('status', ['APPROVED', 'PENDING'])
                                ->count();
                            $spotsLeft = $event->capacity - $registered;

                            if ($spotsLeft <= 0) {
                                $data[] = "⚠️ **FULL** ({$registered}/{$event->capacity})";
                            } elseif ($spotsLeft <= 5) {
                                $data[] = "🔥 **Only {$spotsLeft} spots left!** ({$registered}/{$event->capacity})";
                            } else {
                                $data[] = "👥 {$registered}/{$event->capacity} registered";
                            }
                        }

                        $data[] = "";

                        // Why recommended section
                        if (isset($event->recommendation_reasons) && !empty($event->recommendation_reasons)) {
                            $data[] = "**Why we recommend this:**";
                            foreach (array_slice($event->recommendation_reasons, 0, 2) as $reason) {
                                $data[] = "• {$reason}";
                            }
                            $data[] = "";
                        }

                        // Urgency indicator
                        if ($daysUntil <= 2 && $daysUntil >= 0) {
                            $data[] = "⏰ **Starting very soon!**";
                            $data[] = "";
                        } elseif ($daysUntil <= 7 && $daysUntil > 2) {
                            $data[] = "📌 Starting this week";
                            $data[] = "";
                        }

                        if ($rank < $recommendedEvents->count()) {
                            $data[] = "---";
                        }

                        $rank++;
                    }

                    $data[] = "";
                    $data[] = "**[📋 View All Events](/join-events)** • **[✅ My Registrations](/dashboard)**";

                    // Encourage users to set preferences if they haven't
                    $userPreference = UserPreference::where('user_id', $user->id)->first();
                    if (!$userPreference || empty($userPreference->interest_keywords)) {
                        $data[] = "";
                        $data[] = "---";
                        $data[] = "💡 **Pro Tip:** Tell me your volunteering interests (e.g., 'I like community service and tech') to get even better recommendations!";
                    }
                } elseif ($upcomingEvents->isEmpty()) {
                    $data[] = "\n**💡 Get Started:**";
                    $data[] = "No events yet! [Browse events](/join-events) to find volunteering opportunities.";
                }

            } elseif (in_array($user->role, ['manager', 'admin'])) {
                // Manager/Admin: Show system-wide statistics (matching Manager Dashboard)

                // System-wide statistics
                $upcomingEventsCount = Event::where('status', 'published')
                    ->where('start_date', '>', now())
                    ->count();

                $completedEventsCount = Event::where('status', 'published')
                    ->where('end_date', '<', now())
                    ->count();

                $totalMembersCount = User::where('role', 'member')->count();

                $totalRegistrations = Participant::count();
                $pendingRegistrations = Participant::where('status', 'PENDING')->count();

                $data[] = "**Club Management Overview:**";
                $data[] = "- 📅 Upcoming Events: {$upcomingEventsCount}";
                $data[] = "- ✅ Completed Events: {$completedEventsCount}";
                $data[] = "- 👥 Total Members: {$totalMembersCount}";
                $data[] = "- 📝 Total Registrations: {$totalRegistrations}";

                if ($pendingRegistrations > 0) {
                    $data[] = "- ⚠️ **{$pendingRegistrations} Pending Approvals** - [Review Now](/events)";
                }

                // Show manager's personal events
                $myEvents = Event::where('user_id', $user->id)
                    ->where('start_date', '>=', now())
                    ->where('status', 'published')
                    ->orderBy('start_date', 'asc')
                    ->limit(3)
                    ->get();

                if ($myEvents->isNotEmpty()) {
                    $data[] = "\n**Your Upcoming Events:**";
                    foreach ($myEvents as $event) {
                        $date = $event->start_date->format('M d, Y');
                        $participantCount = Participant::where('event_id', $event->id)
                            ->whereIn('status', ['APPROVED', 'PENDING'])
                            ->count();
                        $data[] = "- **{$event->name}** - {$date} ({$participantCount} registered)";
                    }
                } else {
                    $data[] = "\n**Your Events:** No upcoming events. [Create one now](/events)!";
                }
            }

        } catch (\Exception $e) {
            Log::error("ChatBot Personalized Data Error: " . $e->getMessage());
            $data[] = "Unable to load personalized data.";
        }

        return implode("\n", $data);
    }

    /**
     * Get role-specific capabilities description
     */
    private function getRoleCapabilities(): string
    {
        $user = Auth::user();

        if ($user->role === 'member') {
            return <<<EOT
### YOUR CAPABILITIES (Member):
- Browse and register for events
- Upload payment proof for paid events
- View and manage your registrations
- Cancel event registrations
- Update your profile and password
- View event galleries and announcements
- Contact support for assistance
EOT;
        } elseif ($user->role === 'manager') {
            return <<<EOT
### YOUR CAPABILITIES (Manager):
- All member capabilities, PLUS:
- Create and manage events
- Approve/reject participant registrations
- Send announcements and event blasts to participants
- View detailed analytics and reports
- Manage event participants and attendance
EOT;
        } elseif ($user->role === 'admin') {
            return <<<EOT
### YOUR CAPABILITIES (Administrator):
- All manager capabilities, PLUS:
- Access system-wide controls
- Manage all users and events across the platform
- Override settings and configurations
- Access administrative reports and logs
EOT;
        }

        return "";
    }

    /**
     * Get quick action suggestions based on role
     */
    private function getQuickActions(): string
    {
        $user = Auth::user();
        $actions = [];

        if ($user->role === 'member') {
            $actions[] = "- [Join Events](/join-events) - Discover and register";
            $actions[] = "- [My Dashboard](/dashboard) - View registrations";
            $actions[] = "- [Profile Settings](/settings/profile) - Update info";
            $actions[] = "- [Event Gallery](/events-gallery) - Past events";
            $actions[] = "- [Contact Support](/contact-support) - Get help";
        } elseif (in_array($user->role, ['manager', 'admin'])) {
            $actions[] = "- [Manager Dashboard](/manager/dashboard) - View club statistics";
            $actions[] = "- [Manage Events](/events) - Create and manage events";
            $actions[] = "- [View Analytics](/manager/manage-analytics) - Detailed reports";
            $actions[] = "- [Send Event Blast](/manager/event-blast) - Notify participants";
            $actions[] = "- [Manage Members](/manager/manage-members) - View participants";
        }

        if ($user->role === 'admin') {
            $actions[] = "- [System Control Panel](/admin/system-control) - Admin functions";
        }

        return implode("\n", $actions);
    }

    /**
     * Get recommendation guidance for the chatbot
     */
    private function getRecommendationGuidance(): string
    {
        $user = Auth::user();

        // Only provide recommendation guidance for members
        if ($user->role !== 'member') {
            return "";
        }

        // Check if user has preferences
        $userPreference = UserPreference::where('user_id', $user->id)->first();
        $hasPreferences = $userPreference && !empty($userPreference->interest_keywords);

        $guidance = <<<EOT

### 🎯 SMART EVENT RECOMMENDATIONS (Important Feature):

**This is a VOLUNTEERING club platform.** All events are volunteering opportunities.

**When user asks for recommendations** (e.g., "🎯 Recommend events for me", "suggest events", "what events should I join"):

EOT;

        if (!$hasPreferences) {
            $guidance .= <<<EOT

**STEP 1: Ask about their volunteering interests first** (they haven't told you yet):
"Great! I'd love to find the perfect volunteering opportunities for you! 🎯

What type of volunteering interests you most? You can mention multiple interests:

🤝 **Community Service** - Outreach, charity, helping communities
👨‍🏫 **Education & Teaching** - Tutoring, mentoring, training
🌳 **Environment** - Cleanup, sustainability, tree planting
🏥 **Healthcare & Wellness** - Health camps, blood donation, fitness
💻 **Technology** - Tech workshops, digital literacy, innovation
⚽ **Sports & Recreation** - Sports events, fitness activities
🎨 **Arts & Culture** - Cultural programs, performances, creative projects
📚 **Academic Development** - Workshops, seminars, skill training

Just type your interests (e.g., 'community service, teaching' or 'tech, environment')!"

**STEP 2: After they respond with interests:**
- Thank them
- Confirm their interests
- Show them personalized recommendations from the "Smart Recommendations" already in PERSONALIZED DATA section
- Explain why each event matches their interests

**IMPORTANT:** The personalized recommendations are ALREADY in the PERSONALIZED DATA section above. Just present them nicely with explanations based on the user's stated interests.

EOT;
        } else {
            $keywords = implode(', ', $userPreference->interest_keywords);
            $guidance .= <<<EOT

**USER'S SAVED INTERESTS:** {$keywords}

When they ask for recommendations:
- Present the "Smart Recommendations" already shown in PERSONALIZED DATA section
- Explain why each event matches their interests ({$keywords})
- Show match scores and reasons provided
- Encourage them to explore and register

If they mention NEW interests different from their saved ones:
- Acknowledge the new interests
- Let them know you can provide recommendations based on these new interests too
- Ask if they want to update their preferences

EOT;
        }

        $guidance .= <<<EOT

**DETECTING RECOMMENDATION REQUESTS:**
Users might ask in various ways:
- "Recommend events for me" / "Suggest events"
- "What events should I join?"
- "Show me tech events" / "Find community service events"
- "Events for me" / "What's good for me?"

**NATURAL LANGUAGE SEARCH:**
If they ask for specific types (e.g., "show me tech events", "free events", "events this weekend"):
- Look at the UPCOMING EVENTS section above
- Filter/highlight events matching their criteria
- Explain why these match what they're looking for

**REMEMBER:**
- Recommendations are ALREADY calculated and shown in PERSONALIZED DATA
- Your job is to present them conversationally and explain the matches
- Be encouraging and enthusiastic about volunteering!
- Always end with a call-to-action: [View All Events](/join-events) or [Register Now](/join-events)

EOT;

        return $guidance;
    }

    /**
     * Detect and store user interests from their message
     */
    private function detectAndStoreInterests(string $message): void
    {
        $user = Auth::user();

        // Only process for members
        if ($user->role !== 'member') {
            return;
        }

        // Keywords that indicate user is stating their interests
        $interestIndicators = [
            'interested in', 'interest in', 'like', 'love', 'enjoy', 'prefer',
            'passionate about', 'want to', 'looking for', 'into'
        ];

        $messageLower = strtolower($message);
        $isStatingInterests = false;

        foreach ($interestIndicators as $indicator) {
            if (str_contains($messageLower, $indicator)) {
                $isStatingInterests = true;
                break;
            }
        }

        // Also detect if message contains volunteering category keywords
        $hasVolunteeringKeywords = str_contains($messageLower, 'community') ||
                                   str_contains($messageLower, 'education') ||
                                   str_contains($messageLower, 'teaching') ||
                                   str_contains($messageLower, 'environment') ||
                                   str_contains($messageLower, 'tech') ||
                                   str_contains($messageLower, 'health') ||
                                   str_contains($messageLower, 'sports') ||
                                   str_contains($messageLower, 'arts') ||
                                   str_contains($messageLower, 'culture');

        if ($isStatingInterests || $hasVolunteeringKeywords) {
            try {
                $recommendationService = new RecommendationService();
                $keywords = $recommendationService->extractInterestKeywords($message);

                if (!empty($keywords)) {
                    // Get or create user preference
                    $userPreference = UserPreference::firstOrNew(['user_id' => $user->id]);

                    // Merge with existing keywords
                    $existingKeywords = $userPreference->interest_keywords ?? [];
                    $mergedKeywords = array_unique(array_merge($existingKeywords, $keywords));

                    $userPreference->interest_keywords = $mergedKeywords;
                    $userPreference->asked_about_interests = true;
                    $userPreference->last_updated = now();
                    $userPreference->save();

                    Log::info("User interests updated", [
                        'user_id' => $user->id,
                        'keywords' => $mergedKeywords
                    ]);
                }
            } catch (\Exception $e) {
                Log::error("Error storing user interests: " . $e->getMessage());
            }
        }
    }
}