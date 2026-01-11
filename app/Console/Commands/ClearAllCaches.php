<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class ClearAllCaches extends Command
{
    protected $signature = 'cache:clear-all';
    protected $description = 'Clear all Laravel caches (config, route, view, cache)';

    public function handle()
    {
        $this->info('Clearing all caches...');
        $this->newLine();

        // Clear application cache
        $this->call('cache:clear');
        $this->info('✓ Application cache cleared');

        // Clear route cache
        $this->call('route:clear');
        $this->info('✓ Route cache cleared');

        // Clear config cache
        $this->call('config:clear');
        $this->info('✓ Config cache cleared');

        // Clear view cache
        $this->call('view:clear');
        $this->info('✓ View cache cleared');

        // Clear compiled classes
        $this->call('clear-compiled');
        $this->info('✓ Compiled classes cleared');

        // Optimize autoloader
        $this->info('Optimizing autoloader...');
        exec('composer dump-autoload -o 2>&1', $output, $returnCode);
        if ($returnCode === 0) {
            $this->info('✓ Autoloader optimized');
        }

        $this->newLine();
        $this->info('All caches cleared successfully! ✓');

        return 0;
    }
}
