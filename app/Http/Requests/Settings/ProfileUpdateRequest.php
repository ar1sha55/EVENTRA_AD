<?php

namespace App\Http\Requests\Settings;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $user = $this->user();
        $isAdmin = $user && $user->role === 'admin';

        return [
            'name' => ['required', 'string', 'max:255'],

            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($this->user()->id),
            ],

            'secondary_email' => [
                'nullable',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class, 'secondary_email')->ignore($this->user()->id),
            ],

            'phone_number' => ['nullable', 'string', 'max:20'],

            'profile_picture' => ['nullable', 'image', 'mimes:jpeg,jpg,png,gif', 'max:2048'],

            // Only admin can update these fields
            'matric_id' => $isAdmin ? ['nullable', 'string', 'max:255', Rule::unique(User::class)->ignore($this->user()->id)] : ['sometimes'],
            'faculty' => $isAdmin ? ['nullable', 'in:fke,fkm,fc,fab,fka,fs,fcee,fm,fssh'] : ['sometimes'],
        ];
    }
}
