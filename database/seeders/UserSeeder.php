<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info("Seeding users...");

        // 1️⃣ Admin
        User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@graduate.utm.my',
            'secondary_email' => 'admin@gmail.com',
            'role' => 'admin',
        ]);

        // 2️⃣ Default Manager
        User::factory()->create([
            'name' => 'Manager User',
            'email' => 'manager@graduate.utm.my',
            'secondary_email' => 'manager@gmail.com',
            'role' => 'manager',
        ]);

        // 3️⃣ Specific users
        $specificUsers = [
            ['name' => 'Arisha',  'email' => 'arisha@graduate.utm.my',  'role' => 'manager'],
            ['name' => 'Nazmi',   'email' => 'nazmi@graduate.utm.my',   'role' => 'member'],
            ['name' => 'Alya',    'email' => 'alya@graduate.utm.my',    'role' => 'member'],
            ['name' => 'Jasmine', 'email' => 'jasmine@graduate.utm.my', 'role' => 'member'],
            ['name' => 'Mathan',  'email' => 'mathan@graduate.utm.my',  'role' => 'member'],
        ];

        foreach ($specificUsers as $user) {
            $user['secondary_email'] = strtolower(explode(' ', $user['name'])[0]) . '@gmail.com';
            User::factory()->create($user);
        }

        // 4️⃣ Additional random members if needed
        User::factory(5)->create(['role' => 'member']);

        $this->command->info("Users seeded successfully.");
    }
}
