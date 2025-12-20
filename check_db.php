<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Database Connection Info ===\n\n";

// Check database configuration
$connection = config('database.default');
$database = config("database.connections.{$connection}.database");
$host = config("database.connections.{$connection}.host");

echo "Connection: {$connection}\n";
echo "Host: {$host}\n";
echo "Database: {$database}\n\n";

// Count records
echo "=== Activity Logs Count ===\n";
$count = DB::table('activity_logs')->count();
echo "Total records in activity_logs: {$count}\n\n";

// Show last 5 records
echo "=== Last 5 Records ===\n";
$logs = DB::table('activity_logs')->orderBy('id', 'desc')->limit(5)->get();
foreach ($logs as $log) {
    echo "[{$log->id}] {$log->action} - {$log->description}\n";
}

echo "\n=== Latest ID ===\n";
$latest = DB::table('activity_logs')->max('id');
echo "Highest ID in database: {$latest}\n";
