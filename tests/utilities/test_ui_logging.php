<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Test UI Action Logging ===\n\n";

// Get initial count
$initialCount = DB::table('activity_logs')->count();
echo "Initial count: {$initialCount}\n\n";

// Simulate creating a user (like the UI would)
echo "1. Simulating user creation through UI...\n";
try {
    $user = \App\Models\User::create([
        'name' => 'Test User ' . time(),
        'email' => 'test' . time() . '@test.com',
        'password' => bcrypt('password'),
        'role' => 'member',
        'matric_id' => 'TEST' . time(),
    ]);
    echo "   ✓ User created: {$user->name} (ID: {$user->id})\n";

    // Check if log was created
    $newCount = DB::table('activity_logs')->count();
    $diff = $newCount - $initialCount;
    echo "   Activity logs created: {$diff}\n";

    if ($diff > 0) {
        $log = DB::table('activity_logs')->latest('id')->first();
        echo "   Latest log: [{$log->id}] {$log->action} - {$log->description}\n";
    } else {
        echo "   ⚠ NO ACTIVITY LOG WAS CREATED! Observer not firing!\n";
    }

    // Clean up
    $user->delete();
    echo "   (Test user deleted)\n\n";

} catch (Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n\n";
}

// Final count
$finalCount = DB::table('activity_logs')->count();
echo "Final count: {$finalCount}\n";
echo "Total logs created during this test: " . ($finalCount - $initialCount) . "\n";
