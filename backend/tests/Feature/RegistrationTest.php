<?php

namespace Tests\Feature;

use App\Models\Student;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use App\Jobs\SendWhatsAppMessage;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'grade' => '1',
            'first_name' => 'ا', 'father_name' => 'ب', 'grandfather_name' => 'ج', 'family_name' => 'د',
            'national_id' => '30501010100013',
            'nationality' => 'egyptian', 'religion' => 'muslim',
            'phone' => '01099887766', 'second_language' => 'french',
            'address_village' => 'ق', 'address_center' => 'م', 'address_gov' => 'المنوفية',
            'prep_total' => '250', 'prep_school' => 'اع', 'prep_seat_no' => '1',
            'parent_first_name' => 'أ', 'parent_father_name' => 'ب', 'parent_grandfather_name' => 'ج',
            'parent_family_name' => 'د', 'parent_job' => 'م', 'parent_phone' => '01099887766',
            'mother_first_name' => 'م', 'mother_father_name' => 'ب', 'mother_grandfather_name' => 'ج',
            'mother_family_name' => 'د', 'mother_job' => 'ر', 'mother_phone' => '01112345678',
            'contact_first_name' => 'ت', 'contact_father_name' => 'ب', 'contact_grandfather_name' => 'ج',
            'contact_family_name' => 'د', 'contact_relation' => 'عم', 'contact_phone' => '01212345678',
            'main_contact_phone' => '01099887766',
            'consent' => true,
        ], $overrides);
    }

    public function test_valid_registration_succeeds_and_does_not_leak_password(): void
    {
        Queue::fake();

        $res = $this->postJson('/api/register', $this->payload());

        $res->assertStatus(201);
        $this->assertArrayNotHasKey('password', $res->json());

        // الرقم القومي مخزّن مشفّراً (ليس نصاً صريحاً) لكن البصمة موجودة
        $this->assertDatabaseMissing('students', ['national_id' => '30501010100013']);
        $this->assertDatabaseHas('students', [
            'national_id_hash' => Student::hashNationalId('30501010100013'),
            'gender' => 'male',
        ]);
        // التأكد أن القيمة المخزّنة فعلاً مشفّرة وليست نصاً صريحاً
        $raw = DB::table('students')->value('national_id');
        $this->assertNotSame('30501010100013', $raw);
        // لكن النموذج يفك التشفير عند القراءة
        $this->assertSame('30501010100013', Student::first()->national_id);

        Queue::assertPushed(SendWhatsAppMessage::class);
    }

    public function test_registration_requires_consent(): void
    {
        $this->postJson('/api/register', $this->payload(['consent' => false]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('consent');
    }

    public function test_duplicate_national_id_is_rejected(): void
    {
        Queue::fake();
        $this->postJson('/api/register', $this->payload())->assertStatus(201);

        $this->postJson('/api/register', $this->payload(['phone' => '01055554444', 'parent_phone' => '01055554444', 'main_contact_phone' => '01055554444']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('national_id');
    }

    public function test_invalid_national_id_date_is_rejected(): void
    {
        $this->postJson('/api/register', $this->payload(['national_id' => '30513010100013']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('national_id');
    }
}
