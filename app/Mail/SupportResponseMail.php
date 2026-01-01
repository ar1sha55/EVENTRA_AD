<?php

namespace App\Mail;

use App\Models\SupportTicket;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Contracts\Queue\ShouldQueue;

class SupportResponseMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public SupportTicket $ticket)
    {
    }

    public function envelope(): Envelope
    {
        $statusText = match($this->ticket->status) {
            'resolved' => 'Resolved',
            'in_progress' => 'In Progress',
            default => 'Updated'
        };

        return new Envelope(
            subject: "Support Ticket #{$this->ticket->id} - {$statusText}: {$this->ticket->subject}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.support-response',
            with: [
                'ticket' => $this->ticket,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
