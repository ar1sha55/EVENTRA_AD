<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User;

class EventFactory extends Factory
{
    public function definition(): array
    {
        // English volunteering event names
        $eventNames = [
            'Food Donation Drive',
            'Community Clean-Up',
            'Tree Planting Camp',
            'Environmental Awareness Session',
            'Community Volunteer Workshop',
            'Fundraising for Orphanage',
            'Beach Clean-Up Project',
            'Flood Relief Activity',
            'Senior Citizen Support Program',
            'Education Volunteer Camp'
        ];

        // Corresponding English descriptions
        $eventDescriptions = [
            'This program aims to collect and distribute food to those in need.',
            'Join us to clean and beautify local neighborhoods and parks.',
            'Participants will plant trees to improve the environment and green spaces.',
            'This session raises awareness about the importance of environmental protection.',
            'A workshop to train volunteers on helping the local community effectively.',
            'Funds raised will support orphanages and underprivileged students.',
            'A project focused on cleaning beaches from trash and pollution.',
            'This activity provides assistance to flood-affected communities.',
            'A program supporting the well-being and activities of senior citizens.',
            'A camp where volunteers teach and mentor students in need.'
        ];

        // Faker for Malay location
        $malayFaker = \Faker\Factory::create('ms_MY');

        $start = $this->faker->dateTimeBetween('+1 days', '+30 days');
        $end = (clone $start)->modify('+'.rand(1, 5).' hours');

        return [
            'name' => $this->faker->randomElement($eventNames),
            'description' => $this->faker->randomElement($eventDescriptions),
            'start_date' => $start,
            'end_date' => $end,
            'location' => $malayFaker->city() . ', ' . $malayFaker->state(), // Malay location
            'user_id' => User::factory(), // event creator
            'capacity' => $this->faker->numberBetween(20, 200),
            'fee' => $this->faker->randomElement([0, 5, 10, 20]),
            'status' => $this->faker->randomElement(['draft', 'published']),
            'image_path' => null,
            'qr_code_path' => null,
        ];
    }
}
