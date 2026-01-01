<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Support Ticket Response</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .header p {
            margin: 8px 0 0 0;
            opacity: 0.9;
            font-size: 14px;
        }
        .status-badge {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 15px;
        }
        .status-pending {
            background-color: #fef3c7;
            color: #92400e;
        }
        .status-in_progress {
            background-color: #dbeafe;
            color: #1e40af;
        }
        .status-resolved {
            background-color: #d1fae5;
            color: #065f46;
        }
        .content {
            padding: 30px 25px;
        }
        .greeting {
            font-size: 18px;
            color: #1f2937;
            margin-bottom: 20px;
        }
        .ticket-info {
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 25px;
        }
        .ticket-info-row {
            display: flex;
            margin-bottom: 10px;
        }
        .ticket-info-row:last-child {
            margin-bottom: 0;
        }
        .ticket-label {
            font-weight: 600;
            color: #6b7280;
            width: 100px;
            flex-shrink: 0;
        }
        .ticket-value {
            color: #1f2937;
        }
        .section-title {
            font-size: 14px;
            font-weight: 700;
            color: #9333ea;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
        }
        .message-box {
            background-color: #fafafa;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 25px;
        }
        .message-box p {
            margin: 0;
            white-space: pre-wrap;
            color: #374151;
        }
        .response-box {
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            border: 2px solid #86efac;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 25px;
        }
        .response-box .section-title {
            color: #166534;
            border-bottom-color: #86efac;
        }
        .response-box p {
            margin: 0;
            white-space: pre-wrap;
            color: #166534;
            font-size: 15px;
            line-height: 1.8;
        }
        .responder-info {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #86efac;
            font-size: 13px;
            color: #15803d;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .button {
            display: inline-block;
            padding: 14px 28px;
            background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
            color: white !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            margin: 5px;
        }
        .button-secondary {
            background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
        }
        .footer {
            background-color: #f9fafb;
            padding: 25px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
        }
        .footer p {
            margin: 5px 0;
        }
        .divider {
            height: 1px;
            background: linear-gradient(to right, transparent, #e5e7eb, transparent);
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>EVENTRA Support</h1>
            <p>Your support ticket has been updated</p>
            <span class="status-badge status-{{ $ticket->status }}">
                {{ $ticket->status === 'in_progress' ? 'In Progress' : ucfirst($ticket->status) }}
            </span>
        </div>

        <div class="content">
            <p class="greeting">Hello {{ $ticket->name }},</p>

            <p style="color: #4b5563; margin-bottom: 25px;">
                @if($ticket->status === 'resolved')
                    Great news! Your support ticket has been resolved. Please see the response below.
                @elseif($ticket->status === 'in_progress')
                    Your support ticket is now being worked on. Here's an update from our team.
                @else
                    There's an update on your support ticket. Please see the details below.
                @endif
            </p>

            <!-- Ticket Information -->
            <div class="ticket-info">
                <div class="ticket-info-row">
                    <span class="ticket-label">Ticket ID:</span>
                    <span class="ticket-value">#{{ $ticket->id }}</span>
                </div>
                <div class="ticket-info-row">
                    <span class="ticket-label">Subject:</span>
                    <span class="ticket-value">{{ $ticket->subject }}</span>
                </div>
                <div class="ticket-info-row">
                    <span class="ticket-label">Submitted:</span>
                    <span class="ticket-value">{{ $ticket->created_at->format('F j, Y \a\t g:i A') }}</span>
                </div>
                @if($ticket->category)
                <div class="ticket-info-row">
                    <span class="ticket-label">Category:</span>
                    <span class="ticket-value">{{ ucfirst(str_replace('_', ' ', $ticket->category)) }}</span>
                </div>
                @endif
            </div>

            <!-- Original Message -->
            <div class="section-title">Your Original Message</div>
            <div class="message-box">
                <p>{{ $ticket->message }}</p>
            </div>

            <!-- Admin Response -->
            @if($ticket->admin_response)
            <div class="response-box">
                <div class="section-title">Response from Support Team</div>
                <p>{{ $ticket->admin_response }}</p>
                @if($ticket->respondedBy)
                <div class="responder-info">
                    Responded by <strong>{{ $ticket->respondedBy->name }}</strong>
                    @if($ticket->responded_at)
                        on {{ $ticket->responded_at->format('F j, Y \a\t g:i A') }}
                    @endif
                </div>
                @endif
            </div>
            @endif

            <div class="divider"></div>

            <!-- Action Buttons -->
            <div class="button-container">
                <a href="{{ config('app.url') }}:8000/support-history" class="button">
                    View My Tickets
                </a>
                @if($ticket->status !== 'resolved')
                <a href="{{ config('app.url') }}:8000/contact-support" class="button button-secondary">
                    Submit New Ticket
                </a>
                @endif
            </div>

            @if($ticket->status === 'resolved')
            <p style="text-align: center; color: #6b7280; font-size: 14px;">
                If you still need assistance, feel free to submit a new support ticket.
            </p>
            @endif
        </div>

        <div class="footer">
            <p><strong>EVENTRA</strong> - Event Management System</p>
            <p>This is an automated message. Please do not reply directly to this email.</p>
            <p>For further assistance, visit our support page or submit a new ticket.</p>
            <p>&copy; {{ date('Y') }} EVENTRA. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
