<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Message from {{ $senderName }}</title>
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
        .greeting {
            font-size: 16px;
            margin-bottom: 20px;
            color: #1f2937;
        }
        .message {
            font-size: 16px;
            margin: 20px 0;
            line-height: 1.8;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .sender-info {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
        }
        .footer {
            background-color: #f9fafb;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>EVENTRA</h1>
        </div>

        <div class="content">
            <div class="greeting">
                <strong>Hello {{ $recipientName }},</strong>
            </div>

            <div class="message">{{ $emailMessage }}</div>

            <div class="sender-info">
                <p><strong>Sent by:</strong> {{ $senderName }}</p>
                <p><strong>From:</strong> EVENTRA Event Management System</p>
            </div>
        </div>

        <div class="footer">
            <p>This email was sent via EVENTRA Event Management System.</p>
            <p>&copy; {{ date('Y') }} EVENTRA. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
