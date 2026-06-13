<?php

namespace App\Services;

use Carbon\Carbon;

class NationalIdService
{
    /**
     * يتحقق من صحة بنية الرقم القومي المصري (14 خانة، قرن صحيح، تاريخ ميلاد موجود فعلاً).
     */
    public static function isValid(?string $nid): bool
    {
        if (! $nid || ! preg_match('/^[23]\d{13}$/', $nid)) {
            return false;
        }

        $month = (int) substr($nid, 3, 2);
        $day = (int) substr($nid, 5, 2);
        $year = (int) self::extractYear($nid);

        return checkdate($month, $day, $year);
    }

    /**
     * يستخلص السنة الكاملة من الرقم القومي (الخانة 1 تحدد القرن).
     */
    public static function extractYear(string $nid): string
    {
        $century = $nid[0] === '2' ? '19' : '20';

        return $century . substr($nid, 1, 2);
    }

    /**
     * يعيد تاريخ الميلاد بصيغة Y-m-d.
     */
    public static function extractBirthdate(string $nid): string
    {
        $year = self::extractYear($nid);
        $month = substr($nid, 3, 2);
        $day = substr($nid, 5, 2);

        return "$year-$month-$day";
    }

    /**
     * يستخلص النوع من الخانة 13 (فردي = ذكر، زوجي = أنثى).
     */
    public static function extractGender(string $nid): string
    {
        return ((int) $nid[12]) % 2 === 0 ? 'female' : 'male';
    }

    /**
     * يحسب العمر في 1 أكتوبر ديناميكياً.
     * يناير–سبتمبر: 1 أكتوبر من السنة الحالية. أكتوبر–ديسمبر: 1 أكتوبر من السنة القادمة.
     *
     * @return array{years:int, months:int, days:int}
     */
    public static function ageOnFirstOctober(string $birthdate, ?Carbon $now = null): array
    {
        $now ??= Carbon::now();
        $referenceYear = $now->month >= 10 ? $now->year + 1 : $now->year;
        $oct1 = Carbon::create($referenceYear, 10, 1);
        $bd = Carbon::parse($birthdate);

        $diff = $bd->diff($oct1);

        return [
            'years' => $diff->y,
            'months' => $diff->m,
            'days' => $diff->d,
        ];
    }
}
