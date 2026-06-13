<?php

namespace Tests\Unit;

use App\Services\NationalIdService;
use Carbon\Carbon;
use PHPUnit\Framework\TestCase;

class NationalIdServiceTest extends TestCase
{
    public function test_valid_national_id_passes(): void
    {
        // 3 = مواليد القرن 21، تاريخ 2005-01-01
        $this->assertTrue(NationalIdService::isValid('30501010100013'));
    }

    public function test_invalid_length_fails(): void
    {
        $this->assertFalse(NationalIdService::isValid('12345'));
    }

    public function test_invalid_century_digit_fails(): void
    {
        // يجب أن تبدأ بـ 2 أو 3
        $this->assertFalse(NationalIdService::isValid('40501010100013'));
    }

    public function test_impossible_date_fails(): void
    {
        // الشهر 13 غير موجود (الخانات 4-5 = 13)
        $this->assertFalse(NationalIdService::isValid('30513010100013'));
    }

    public function test_extracts_birthdate_and_gender(): void
    {
        $this->assertSame('2005-01-01', NationalIdService::extractBirthdate('30501010100013'));
        // الخانة 13 = 1 (فردي) => ذكر
        $this->assertSame('male', NationalIdService::extractGender('30501010100013'));
        // خانة زوجية => أنثى
        $this->assertSame('female', NationalIdService::extractGender('30501010100024'));
    }

    public function test_age_uses_current_year_october_for_jan_to_sep(): void
    {
        // مايو 2026 => المرجع 1 أكتوبر 2026
        $age = NationalIdService::ageOnFirstOctober('2010-10-01', Carbon::create(2026, 5, 15));
        $this->assertSame(16, $age['years']);
    }

    public function test_age_uses_next_year_october_for_oct_to_dec(): void
    {
        // نوفمبر 2026 => المرجع 1 أكتوبر 2027 (وليس 2026)
        $age = NationalIdService::ageOnFirstOctober('2010-10-01', Carbon::create(2026, 11, 20));
        $this->assertSame(17, $age['years']);
    }
}
