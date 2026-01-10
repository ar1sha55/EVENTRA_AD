<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== ActivityLog Diagnostic Test ===\n\n";

// Test 1: Check if table exists
echo "1. Checking if activity_logs table exists...\n";
try {
    $count = DB::table('activity_logs')->count();
    echo "   ✓ Table exists! Current record count: {$count}\n\n";
} catch (Exception $e) {
    echo "   ✗ Table doesn't exist or error: " . $e->getMessage() . "\n\n";
    exit(1);
}

// Test 2: Direct DB insert
echo "2. Testing direct DB insert...\n";
try {
    DB::table('activity_logs')->insert([
        'user_id' => 1,
        'action' => 'test.direct_insert',
        'description' => 'Direct DB insert test',
        'created_at' => now(),
    ]);
    echo "   ✓ Direct insert successful!\n\n";
} catch (Exception $e) {
    echo "   ✗ Direct insert failed: " . $e->getMessage() . "\n\n";
}

// Test 3: Model insert with create()
echo "3. Testing ActivityLog::create()...\n";
try {
    $log = \App\Models\ActivityLog::create([
        'user_id' => 1,
        'action' => 'test.model_create',
        'description' => 'Model create test',
    ]);
    echo "   ✓ Model create successful! ID: {$log->id}\n\n";
} catch (Exception $e) {
    echo "   ✗ Model create failed: " . $e->getMessage() . "\n";
    echo "   Stack trace:\n" . $e->getTraceAsString() . "\n\n";
}

// Test 4: logActivity() method
echo "4. Testing ActivityLog::logActivity()...\n";
try {
    Auth::loginUsingId(1);
    $log = \App\Models\ActivityLog::logActivity(
        'test.log_activity',
        'logActivity method test'
    );
    if ($log) {
        echo "   ✓ logActivity successful! ID: {$log->id}\n\n";
    } else {
        echo "   ✗ logActivity returned null (check laravel.log for errors)\n\n";
    }
} catch (Exception $e) {
    echo "   ✗ logActivity failed: " . $e->getMessage() . "\n\n";
}

// Test 5: Show all records
echo "5. All activity_logs records:\n";
$logs = DB::table('activity_logs')->get();
foreach ($logs as $log) {
    echo "   - [{$log->id}] {$log->action}: {$log->description}\n";
}
echo "\nTotal records: " . count($logs) . "\n";
