<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ManageMembersController extends Controller
{
    /**
     * Display all members for management
     */
    public function index()
    {
        // Get all users with role 'member' (automatically includes newly registered users)
        $members = User::where('role', 'member')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($member) {
                return [
                    'id' => $member->id,
                    'name' => $member->name,
                    'email' => $member->email,
                    'secondary_email' => $member->secondary_email,
                    'matric_id' => $member->matric_id,
                    'phone_number' => $member->phone_number,
                    'nationality' => $member->nationality,
                    'gender' => $member->gender,
                    'faculty' => $member->faculty,
                    'profile_picture' => $member->profile_picture,
                    'created_at' => $member->created_at,
                    'email_verified_at' => $member->email_verified_at,
                ];
            });

        return Inertia::render('Manager/ManageMembers', [
            'members' => $members,
        ]);
    }

    /**
     * Store a new member
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique(User::class),
                'regex:/^.+@graduate\.utm\.my$/i',
            ],
            'secondary_email' => [
                'nullable',
                'string',
                'email',
                'max:255',
                Rule::unique(User::class, 'secondary_email'),
            ],
            'matric_id' => ['required', 'string', 'max:255', Rule::unique(User::class)],
            'phone_number' => ['nullable', 'string', 'max:20'],
            'nationality' => ['nullable', 'in:malaysia,indonesia,singapore,japan,china,korea,egypt,yemen,thailand,vietnam,saudi arabia,nigeria,iraq,iran'],
            'gender' => ['nullable', 'in:male,female'],
            'faculty' => ['nullable', 'in:fke,fkm,fc,fab,fka,fs,fcee,fm,fssh'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        // Set default password if not provided
        $validated['password'] = Hash::make($validated['password']);
        $validated['role'] = 'member'; // Always create as member

        User::create($validated);

        return back()->with('success', 'Member added successfully!');
    }

    /**
     * Update an existing member
     */
    public function update(Request $request, User $member)
    {
        // Ensure we're only updating members, not managers or admins
        if ($member->role !== 'member') {
            return back()->with('error', 'You can only update member accounts.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($member->id),
                'regex:/^.+@graduate\.utm\.my$/i',
            ],
            'secondary_email' => [
                'nullable',
                'string',
                'email',
                'max:255',
                Rule::unique(User::class, 'secondary_email')->ignore($member->id),
            ],
            'matric_id' => ['required', 'string', 'max:255', Rule::unique(User::class)->ignore($member->id)],
            'phone_number' => ['nullable', 'string', 'max:20'],
            'nationality' => ['nullable', 'in:malaysia,indonesia,singapore,japan,china,korea,egypt,yemen,thailand,vietnam,saudi arabia,nigeria,iraq,iran'],
            'gender' => ['nullable', 'in:male,female'],
            'faculty' => ['nullable', 'in:fke,fkm,fc,fab,fka,fs,fcee,fm,fssh'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
        ]);

        // Only update password if provided
        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $member->update($validated);

        return back()->with('success', 'Member updated successfully!');
    }

    /**
     * Delete a member
     */
    public function destroy(User $member)
    {
        // Ensure we're only deleting members, not managers or admins
        if ($member->role !== 'member') {
            return back()->with('error', 'You can only delete member accounts.');
        }

        // Delete profile picture if exists
        if ($member->profile_picture && Storage::disk('public')->exists($member->profile_picture)) {
            Storage::disk('public')->delete($member->profile_picture);
        }

        // Delete all participant records (this will cascade delete payment proofs)
        foreach ($member->participants as $participant) {
            if ($participant->payment_proof_path && Storage::disk('public')->exists($participant->payment_proof_path)) {
                Storage::disk('public')->delete($participant->payment_proof_path);
            }
        }

        $member->delete();

        return back()->with('success', 'Member deleted successfully!');
    }

    /**
     * Get a specific member's details
     */
    public function show(User $member)
    {
        // Ensure we're only viewing members
        if ($member->role !== 'member') {
            return back()->with('error', 'Member not found.');
        }

        return response()->json([
            'id' => $member->id,
            'name' => $member->name,
            'email' => $member->email,
            'secondary_email' => $member->secondary_email,
            'matric_id' => $member->matric_id,
            'phone_number' => $member->phone_number,
            'nationality' => $member->nationality,
            'gender' => $member->gender,
            'faculty' => $member->faculty,
            'profile_picture' => $member->profile_picture,
            'created_at' => $member->created_at,
            'email_verified_at' => $member->email_verified_at,
        ]);
    }
}