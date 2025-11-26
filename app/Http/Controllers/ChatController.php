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

        // Keep only the last 6 messages (3 turns) to prevent "Context Window" overflow
        if (count($history) > 6) {
            $history = array_slice($history, -6);
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
                $spotsLeft = $capacity ? ($capacity - $registered) : 'Many';
                $status = ($capacity && $spotsLeft <= 0) ? '🔴 *FULL*' : (is_numeric($spotsLeft) && $spotsLeft < 10 ? "⚠️ _{$spotsLeft} spots left_" : '');

                $output .= "- **{$event->name}** {$status}\n";
                $output .= "  📅 {$date} at {$time} | 📍 {$location}\n";
                $output .= "  👥 {$registered}/{$capacityDisplay} registered";

                if ($event->fee && $event->fee > 0) {
                    $output .= " | 💵 RM " . number_format($event->fee, 2);
                }

                $output .= "\n  🔗 [View & Register](/join-events)\n\n";
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
                    $hasUrgent = false;
                    $data[] = "\n**🎫 Your Registered Events:**";
                    foreach ($upcomingEvents->take(3) as $participant) {
                        $event = $participant->event;
                        if ($event) {
                            $date = $event->start_date->format('M d, Y');
                            $daysUntil = now()->diffInDays($event->start_date, false);

                            $statusIcon = $participant->status === 'APPROVED' ? '✅' : ($participant->status === 'PENDING' ? '⏳' : '❌');
                            $urgencyBadge = '';

                            if ($daysUntil <= 1 && $participant->status === 'APPROVED') {
                                $urgencyBadge = ' 🔥 **TOMORROW!**';
                                $hasUrgent = true;
                            } elseif ($daysUntil <= 3 && $participant->status === 'APPROVED') {
                                $urgencyBadge = ' ⚡ Starting soon';
                            }

                            $data[] = "- {$statusIcon} **{$event->name}**{$urgencyBadge}";
                            $data[] = "  📅 {$date} | 📍 {$event->location}";
                        }
                    }
                    if ($upcomingEvents->count() > 3) {
                        $data[] = "\n_+ " . ($upcomingEvents->count() - 3) . " more events_";
                    }
                }

                // Event recommendations (events they haven't registered for)
                $registeredEventIds = $registrations->pluck('event_id')->toArray();
                $recommendedEvents = Event::where('status', 'published')
                    ->where('start_date', '>=', now())
                    ->whereNotIn('id', $registeredEventIds)
                    ->orderBy('start_date', 'asc')
                    ->limit(2)
                    ->get();

                if ($recommendedEvents->isNotEmpty()) {
                    $data[] = "\n**💡 Recommended for You:**";
                    foreach ($recommendedEvents as $event) {
                        $date = $event->start_date->format('M d');
                        $daysUntil = now()->diffInDays($event->start_date, false);
                        $timing = $daysUntil <= 7 ? " (Soon!)" : "";
                        $data[] = "- **{$event->name}**{$timing}";
                        $data[] = "  📅 {$date} | 📍 {$event->location}";
                    }
                    $data[] = "\n[Browse All Events →](/join-events)";
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
}