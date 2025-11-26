<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        $faker = \Faker\Factory::create('ms_MY');

        $firstName = $faker->firstName();
        $lastName = $faker->lastName();
        $fullName = $firstName . ' ' . $lastName;

        // Ensure unique email using first name + random number
        $uniqueNumber = $faker->unique()->numberBetween(1000, 9999);

        return [
            'name' => $fullName,
            'email' => strtolower($firstName) . $uniqueNumber . '@graduate.utm.my',
            'secondary_email' => strtolower($firstName) . $faker->numberBetween(1000, 9999) . '@gmail.com',
            'matric_id' => $faker->unique()->numerify('A#######'),
            'phone_number' => $faker->phoneNumber(),
            'nationality' => $faker->randomElement([
                'malaysia','indonesia','singapore','japan','china','korea',
                'egypt','yemen','thailand','vietnam','saudi arabia','nigeria',
                'iraq','iran'
            ]),
            'gender' => $faker->randomElement(['male','female']),
            'faculty' => $faker->randomElement(['fke','fkm','fc','fab','fka','fs','fcee','fm','fssh']),
            'email_verified_at' => now(),
            'role' => $faker->randomElement(['member', 'manager']),
            'password' => static::$password ??= Hash::make('password'),
            'profile_picture' => null,
            'remember_token' => Str::random(10),

            // Two-factor disabled
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    public function withoutTwoFactor(): static
    {
        return $this->state(fn (array $attributes) => [
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ]);
    }
}
