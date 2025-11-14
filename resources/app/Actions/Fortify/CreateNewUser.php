<?php

namespace App\Actions\Fortify;

use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            'name' => ['required', 'string', 'max:255'],
            'matric_id' => ['required', 'string', 'max:255', Rule::unique(User::class)],
            'phone_number' => ['required', 'string', 'max:255'],
            'nationality' => ['required', 'string', 'max:255'],
            'gender' => ['required', 'string', 'max:255'],
            'faculty' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique(User::class),
                'regex:/^.+@graduate\.utm\.my$/i',
            ],
            'password' => $this->passwordRules(),
        ])->validate();

        return User::create([
            'name' => $input['name'],
            'email' => $input['email'],
            'matric_id' => $input['matric_id'],
            'phone_number' => $input['phone_number'],
            'nationality' => $input['nationality'],
            'gender' => $input['gender'],
            'faculty' => $input['faculty'],
            'password' => $input['password'],
        ]);
    }
}
