<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventDocumentation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class EventDocumentationController extends Controller
{
    /**
     * Store documentation for an event
     */
    public function store(Request $request, Event $event)
    {
        $validated = $request->validate([
            'type' => 'required|in:photo,document,summary',
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'file' => 'nullable|file|max:10240', // 10MB max
            'sort_order' => 'nullable|integer',
        ]);

        try {
            $filePath = null;

            // Handle file upload if present
            if ($request->hasFile('file')) {
                $file = $request->file('file');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $filePath = $file->storeAs('event_documentation', $fileName, 'public');
            }

            $documentation = EventDocumentation::create([
                'event_id' => $event->id,
                'type' => $validated['type'],
                'file_path' => $filePath,
                'title' => $validated['title'] ?? null,
                'description' => $validated['description'] ?? null,
                'sort_order' => $validated['sort_order'] ?? 0,
                'uploaded_by' => Auth::id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Documentation uploaded successfully',
                'documentation' => $documentation->load('uploader'),
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error uploading documentation: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload documentation',
            ], 500);
        }
    }

    /**
     * Get all documentation for an event
     */
    public function index(Event $event)
    {
        try {
            $documentation = $event->documentation()
                ->with('uploader:id,name,email')
                ->orderBy('sort_order')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'documentation' => $documentation,
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching documentation: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch documentation',
            ], 500);
        }
    }

    /**
     * Update documentation
     */
    public function update(Request $request, Event $event, EventDocumentation $documentation)
    {
        // Ensure documentation belongs to event
        if ($documentation->event_id !== $event->id) {
            return response()->json([
                'success' => false,
                'message' => 'Documentation does not belong to this event',
            ], 403);
        }

        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'sort_order' => 'nullable|integer',
        ]);

        try {
            $documentation->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Documentation updated successfully',
                'documentation' => $documentation->load('uploader'),
            ]);

        } catch (\Exception $e) {
            Log::error('Error updating documentation: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update documentation',
            ], 500);
        }
    }

    /**
     * Delete documentation
     */
    public function destroy(Event $event, EventDocumentation $documentation)
    {
        // Ensure documentation belongs to event
        if ($documentation->event_id !== $event->id) {
            return response()->json([
                'success' => false,
                'message' => 'Documentation does not belong to this event',
            ], 403);
        }

        try {
            // Delete file from storage if exists
            if ($documentation->file_path) {
                Storage::disk('public')->delete($documentation->file_path);
            }

            $documentation->delete();

            return response()->json([
                'success' => true,
                'message' => 'Documentation deleted successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Error deleting documentation: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete documentation',
            ], 500);
        }
    }
}
