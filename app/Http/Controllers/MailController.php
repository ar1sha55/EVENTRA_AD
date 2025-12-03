<?php

namespace App\Http\Controllers;

use App\Mail\MemberEmail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class MailController extends Controller
{
    /**
     * Send email to a member
     */
    public function sendToMember(Request $request)
    {
        $validated = $request->validate([
            'recipient_email' => 'required|email',
            'recipient_name' => 'required|string|max:255',
            'subject' => 'required|string|max:255',
            'message' => 'required|string',
        ]);

        try {
            $senderName = Auth::user()->name ?? 'EVENTRA Manager';

            Mail::to($validated['recipient_email'])->send(
                new MemberEmail(
                    recipientName: $validated['recipient_name'],
                    emailSubject: $validated['subject'],
                    emailMessage: $validated['message'],
                    senderName: $senderName
                )
            );

            Log::info('Email sent successfully', [
                'from' => $senderName,
                'to' => $validated['recipient_email'],
                'subject' => $validated['subject'],
            ]);

            return back()->with('success', 'Email sent successfully to ' . $validated['recipient_name']);
        } catch (\Exception $e) {
            Log::error('Failed to send email: ' . $e->getMessage(), [
                'recipient' => $validated['recipient_email'],
                'error' => $e->getMessage(),
            ]);

            return back()->with('error', 'Failed to send email. Please try again later.');
        }
    }
}
