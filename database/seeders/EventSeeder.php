<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Event;
use App\Models\User;

class EventSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info("Seeding events...");

        $users = User::all();

        Event::factory(10)->make()->each(function ($event) use ($users) {
            $event->user_id = $users->random()->id; // Random creator
            $event->save();
        });

        $this->command->info("Events seeded successfully.");
    }
}
