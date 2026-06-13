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
        $phone = env('ADMIN_PHONE', '01006898681');
        $password = env('ADMIN_PASSWORD');

        if (empty($password)) {
            // لا تزرع حساب أدمن بكلمة مرور افتراضية. يجب ضبط ADMIN_PASSWORD في .env
            $this->command?->warn('تم تخطّي زرع حساب الأدمن: اضبط ADMIN_PASSWORD في .env ثم أعد التشغيل.');
            return;
        }

        User::updateOrCreate(
            ['phone' => $phone],
            [
                'name' => 'مدير النظام',
                'role' => 'admin',
                'password' => \Illuminate\Support\Facades\Hash::make($password),
                'must_change_password' => true,
            ]
        );
    }
}
