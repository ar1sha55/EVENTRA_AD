<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $notification->title }}</title>
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
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            padding: 30px 20px;
        }
        .notification-type {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 20px;
        }
        .type-event_upcoming { background-color: #fef3c7; color: #92400e; }
        .type-event_new { background-color: #dbeafe; color: #1e40af; }
        .type-registration_approved { background-color: #d1fae5; color: #065f46; }
        .type-registration_rejected { background-color: #fee2e2; color: #991b1b; }
        .type-ranking_update { background-color: #fce7f3; color: #831843; }
        .type-registration_pending { background-color: #fed7aa; color: #92400e; }
        .type-new_registration { background-color: #e0e7ff; color: #3730a3; }
        .type-profile_incomplete { background-color: #fef9c3; color: #854d0e; }
        .message {
            font-size: 16px;
            margin: 20px 0;
            line-height: 1.8;
        }
        .event-info {
            background-color: #f9fafb;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .event-info p {
            margin: 5px 0;
            font-size: 14px;
        }
        .event-info strong {
            color: #667eea;
        }
        .footer {
            background-color: #f9fafb;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
        }
        .button:hover {
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>EVENTRA</h1>
        </div>

        <div class="content">
            <span class="notification-type type-{{ $notification->type }}">
                {{ str_replace('_', ' ', $notification->type) }}
            </span>

            <h2 style="margin: 10px 0 20px 0; color: #1f2937;">{{ $notification->title }}</h2>

            <div class="message">
                {{ $notification->message }}
            </div>

            @if(isset($notification->data['event_name']))
            <div class="event-info">
                <p><strong>Event:</strong> {{ $notification->data['event_name'] }}</p>
                @if(isset($notification->data['start_date']))
                <p><strong>Date:</strong> {{ \Carbon\Carbon::parse($notification->data['start_date'])->format('F j, Y \a\t g:i A') }}</p>
                @endif
            </div>
            @endif

            @if(isset($notification->data['event_id']))
            <a href="{{ config('app.url') }}/events/{{ $notification->data['event_id'] }}" class="button">
                View Event Details
            </a>
            @endif
        </div>

        <div class="footer">
            <p>This is an automated notification from EVENTRA Event Management System.</p>
            <p>Please do not reply to this email.</p>
            <p>&copy; {{ date('Y') }} EVENTRA. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
