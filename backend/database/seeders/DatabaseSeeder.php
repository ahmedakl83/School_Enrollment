<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::create([
            'name' => 'مدير النظام',
            'phone' => '01006898681',
            'role' => 'admin',
            'password' => \Illuminate\Support\Facades\Hash::make('Essam Soliman#20@'),
        ]);
    }
}
