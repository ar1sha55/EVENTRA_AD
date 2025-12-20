<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(to right, #9333ea, #f97316);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .content {
            background: #f9fafb;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
        }
        .ticket-info {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #9333ea;
        }
        .label {
            font-weight: bold;
            color: #6b7280;
            margin-bottom: 5px;
        }
        .value {
            color: #111827;
            margin-bottom: 15px;
        }
        .message-box {
            background: white;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 style="margin: 0;">New Support Ticket</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Eventra Support System</p>
    </div>

    <div class="content">
        <div class="ticket-info">
            <div class="label">Ticket ID:</div>
            <div class="value">#{{ $ticket->id }}</div>

            <div class="label">From:</div>
            <div class="value">{{ $ticket->name }} ({{ $ticket->email }})</div>

            <div class="label">Subject:</div>
            <div class="value">{{ $ticket->subject }}</div>

            <div class="label">Submitted:</div>
            <div class="value">{{ $ticket->created_at->format('F j, Y \a\t g:i A') }}</div>
        </div>

        <div class="label">Message:</div>
        <div class="message-box">
            <p style="margin: 0; white-space: pre-wrap;">{{ $ticket->message }}</p>
        </div>
    </div>

    <div class="footer">
        <p>This is an automated message from Eventra Support System.</p>
        <p>To manage this ticket, log in to the admin dashboard.</p>
    </div>
</body>
</html>
