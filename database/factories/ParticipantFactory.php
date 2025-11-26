<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Event;
use App\Models\User;

class ParticipantFactory extends Factory
{
    public function definition(): array
    {
        // Pick a random event
        $event = Event::inRandomOrder()->first();

        // Pick a random user
        $user = User::inRandomOrder()->first();

        // Determine if payment is required
        $requiresPayment = $event->fee > 0;

        $paymentProof = null;
        $status = 'PENDING';

        if ($requiresPayment) {
            // Randomly decide if member submitted payment proof
            $paymentSubmitted = $this->faker->boolean(80); // 80% chance submitted
            if ($paymentSubmitted) {
                $paymentProof = 'payments/proof_' . $this->faker->unique()->numberBetween(1, 1000) . '.jpg';
                // Randomly manager approved or rejected
                $status = $this->faker->randomElement(['APPROVED', 'REJECTED']);
            } else {
                $status = 'PENDING'; // payment not submitted yet
            }
        } else {
            // Free event → auto approved
            $status = 'APPROVED';
        }

        return [
            'user_id' => $user->id,
            'event_id' => $event->id,
            'status' => $status,
            'payment_proof_path' => $paymentProof,
            'hours_logged' => 0,
            'registration_date' => $this->faker->dateTimeBetween('-30 days', 'now'),
            'last_updated' => now(),
        ];
    }
}
