<?php

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertStatus(200);
});

test('new users can register', function () {
    $response = $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@graduate.utm.my',
        'matric_id' => 'A12345678',
        'phone_number' => '0123456789',
        'nationality' => 'malaysia',
        'gender' => 'male',
        'faculty' => 'fc',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));
});