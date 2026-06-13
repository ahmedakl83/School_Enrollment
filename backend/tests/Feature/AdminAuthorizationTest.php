<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_admin_students(): void
    {
        $this->getJson('/api/admin/students')->assertStatus(401);
    }

    public function test_parent_is_forbidden_from_admin_routes(): void
    {
        $parent = User::create([
            'name' => 'ولي أمر', 'phone' => '01011112222', 'role' => 'parent',
            'password' => bcrypt('secret'),
        ]);
        Sanctum::actingAs($parent);

        $this->getJson('/api/admin/students')->assertStatus(403);
    }

    public function test_admin_can_access_admin_students(): void
    {
        $admin = User::create([
            'name' => 'مدير', 'phone' => '01000000000', 'role' => 'admin',
            'password' => bcrypt('secret'),
        ]);
        Sanctum::actingAs($admin);

        $this->getJson('/api/admin/students')->assertStatus(200);
    }
}
