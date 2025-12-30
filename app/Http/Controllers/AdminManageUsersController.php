<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AdminManageUsersController extends Controller
{
    /**
     * Display all users for management
     */
    public function index(Request $request)
    {
        // Load all users for client-side filtering (instant and responsive like ManageEvents)
        $users = User::orderBy('created_at', 'desc')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'secondary_email' => $user->secondary_email,
                    'matric_id' => $user->matric_id,
                    'phone_number' => $user->phone_number,
                    'nationality' => $user->nationality,
                    'gender' => $user->gender,
                    'faculty' => $user->faculty,
                    'role' => $user->role,
                    'profile_picture' => $user->profile_picture,
                    'email_verified_at' => $user->email_verified_at,
                    'created_at' => $user->created_at->toISOString(),
                ];
            });

        return Inertia::render('Admin/ManageUsers', [
            'users' => $users,
        ]);
    }

    /**
     * Store a new user
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
            'role' => ['required', 'in:admin,manager,member'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'profile_picture' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif', 'max:2048'],
        ]);

        if ($request->hasFile('profile_picture')) {
            $path = $request->file('profile_picture')->store('profile_pictures', 'public');
            $validated['profile_picture'] = $path;
        }

        $validated['password'] = Hash::make($validated['password']);
        $validated['email_verified_at'] = now(); // Auto-verify emails created by admins

        $user = User::create($validated);

        // Log activity
        ActivityLog::logActivity(
            'user.created',
            "Created new user: {$user->name} with role {$user->role}",
            'User',
            $user->id,
            null,
            ['name' => $user->name, 'email' => $user->email, 'role' => $user->role]
        );

        return back()->with('success', 'User added successfully!');
    }

    /**
     * Update an existing user
     */
    public function update(Request $request, User $user)
    {
        // Store old values for activity log
        $oldValues = [
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
        ];

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($user->id),
                'regex:/^.+@graduate\.utm\.my$/i',
            ],
            'secondary_email' => [
                'nullable',
                'string',
                'email',
                'max:255',
                Rule::unique(User::class, 'secondary_email')->ignore($user->id),
            ],
            'matric_id' => ['required', 'string', 'max:255', Rule::unique(User::class)->ignore($user->id)],
            'phone_number' => ['nullable', 'string', 'max:20'],
            'nationality' => ['nullable', 'in:malaysia,indonesia,singapore,japan,china,korea,egypt,yemen,thailand,vietnam,saudi arabia,nigeria,iraq,iran'],
            'gender' => ['nullable', 'in:male,female'],
            'faculty' => ['nullable', 'in:fke,fkm,fc,fab,fka,fs,fcee,fm,fssh'],
            'role' => ['required', 'in:admin,manager,member'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'profile_picture' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif', 'max:2048'],
        ]);

        if ($request->hasFile('profile_picture')) {
            // Delete old picture if it exists
            if ($user->profile_picture) {
                Storage::disk('public')->delete($user->profile_picture);
            }
            $path = $request->file('profile_picture')->store('profile_pictures', 'public');
            $validated['profile_picture'] = $path;
        }

        // Only update password if provided
        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        // Log activity
        $newValues = [
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
        ];

        ActivityLog::logActivity(
            'user.updated',
            "Updated user: {$user->name}",
            'User',
            $user->id,
            $oldValues,
            $newValues
        );

        return back()->with('success', 'User updated successfully!');
    }

    /**
     * Delete a user
     */
    public function destroy(User $user)
    {
        // Prevent deleting yourself
        if ($user->id === auth()->id()) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        $userName = $user->name;
        $userRole = $user->role;

        // Delete profile picture if exists
        if ($user->profile_picture && Storage::disk('public')->exists($user->profile_picture)) {
            Storage::disk('public')->delete($user->profile_picture);
        }

        // Delete all participant records (this will cascade delete payment proofs)
        foreach ($user->participants as $participant) {
            if ($participant->payment_proof_path && Storage::disk('public')->exists($participant->payment_proof_path)) {
                Storage::disk('public')->delete($participant->payment_proof_path);
            }
        }

        $user->delete();

        // Log activity
        ActivityLog::logActivity(
            'user.deleted',
            "Deleted user: {$userName} (role: {$userRole})",
            'User',
            $user->id,
            ['name' => $userName, 'role' => $userRole],
            null
        );

        return back()->with('success', 'User deleted successfully!');
    }

    /**
     * Get a specific user's details
     */
    public function show(User $user)
    {
        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'secondary_email' => $user->secondary_email,
            'matric_id' => $user->matric_id,
            'phone_number' => $user->phone_number,
            'nationality' => $user->nationality,
            'gender' => $user->gender,
            'faculty' => $user->faculty,
            'role' => $user->role,
            'profile_picture' => $user->profile_picture,
            'email_verified_at' => $user->email_verified_at,
            'created_at' => $user->created_at,
        ]);
    }

    /**
     * Get user statistics
     */
    public function statistics()
    {
        $stats = [
            'total' => User::count(),
            'admins' => User::where('role', 'admin')->count(),
            'managers' => User::where('role', 'manager')->count(),
            'members' => User::where('role', 'member')->count(),
            'verified' => User::whereNotNull('email_verified_at')->count(),
            'unverified' => User::whereNull('email_verified_at')->count(),
        ];

        return response()->json($stats);
    }
}
