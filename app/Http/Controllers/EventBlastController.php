<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventBlast;
use App\Services\CaptionGeneratorService;
use App\Services\TelegramService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EventBlastController extends Controller
{
    protected $telegramService;
    protected $captionGenerator;

    public function __construct(TelegramService $telegramService, CaptionGeneratorService $captionGenerator)
    {
        $this->telegramService = $telegramService;
        $this->captionGenerator = $captionGenerator;
    }

    public function index()
    {
        $events = Event::where('status', 'published')
            ->with('user')
            ->latest()
            ->get();

        $blasts = EventBlast::with(['event', 'user'])
            ->latest()
            ->paginate(10);

        $captionStyles = $this->captionGenerator->getAvailableStyles();

        return inertia('Manager/EventBlast', [
            'events' => $events,
            'blasts' => $blasts,
            'captionStyles' => $captionStyles,
        ]);
    }

    public function generateCaption(Request $request)
    {
        $validated = $request->validate([
            'event_id' => 'required|exists:events,id',
            'style' => 'required|in:engaging,professional,casual,urgent,minimal',
        ]);

        $event = Event::findOrFail($validated['event_id']);
        $caption = $this->captionGenerator->generate($event, $validated['style']);

        return response()->json([
            'caption' => $caption,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'event_id' => 'required|exists:events,id',
            'message' => 'required|string',
            'caption' => 'nullable|string',
            'blast_type' => 'required|in:immediate,scheduled',
            'scheduled_at' => 'required_if:blast_type,scheduled|nullable|date|after:now',
        ]);

        $validated['user_id'] = Auth::id();
        $validated['status'] = 'pending';

        $blast = EventBlast::create($validated);

        // If immediate, send right away
        if ($validated['blast_type'] === 'immediate') {
            $this->sendBlast($blast);
        }

        return back()->with('success', 'Event blast created successfully!');
    }

    protected function sendBlast(EventBlast $blast)
    {
        try {
            $event = $blast->event;
            $message = $blast->caption ?? $blast->message;

            $telegramMessageId = $this->telegramService->sendBlast($event, $message);

            if ($telegramMessageId) {
                $blast->markAsSent($telegramMessageId);
                return true;
            } else {
                $blast->markAsFailed('Failed to send message to Telegram');
                return false;
            }
        } catch (\Exception $e) {
            $blast->markAsFailed($e->getMessage());
            return false;
        }
    }

    public function cancel(EventBlast $blast)
    {
        if ($blast->status === 'sent') {
            return back()->with('error', 'Cannot cancel a blast that has already been sent.');
        }

        $blast->update(['status' => 'cancelled']);

        return back()->with('success', 'Blast cancelled successfully.');
    }

    public function retry(EventBlast $blast)
    {
        if ($blast->status !== 'failed') {
            return back()->with('error', 'Only failed blasts can be retried.');
        }

        $blast->update([
            'status' => 'pending',
            'error_message' => null,
        ]);

        $this->sendBlast($blast);

        return back()->with('success', 'Blast retry initiated.');
    }

    public function history()
    {
        $blasts = EventBlast::with(['event', 'user'])
            ->latest()
            ->paginate(20);

        return inertia('Manager/BlastHistory', [
            'blasts' => $blasts,
        ]);
    }
}
