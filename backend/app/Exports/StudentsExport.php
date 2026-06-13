<?php

namespace App\Exports;

use Illuminate\Support\Collection;

/**
 * مزوّد بيانات تصدير الطلاب (CSV) — بدون اعتماد على حزم خارجية لتوافق بيئة PHP 8.5.
 */
class StudentsExport
{
    public function __construct(private Collection $students) {}

    public function headings(): array
    {
        return [
            'كود الطالب', 'الاسم الرباعي', 'الرقم القومي', 'الصف', 'تاريخ الميلاد',
            'النوع', 'الجنسية', 'الديانة', 'اللغة الثانية', 'هاتف الطالب',
            'المحافظة', 'المركز/القسم', 'القرية/الشياخة',
            'المدرسة الإعدادية', 'مجموع الإعدادية', 'رقم الجلوس', 'الشعبة',
            'اسم ولي الأمر', 'وظيفته', 'هاتفه',
            'اسم الأم', 'وظيفتها', 'هاتفها',
            'جهة الاتصال', 'صلة القرابة', 'هاتفها',
            'تاريخ الطلب', 'الحالة',
        ];
    }

    public function rows(): array
    {
        return $this->students->map(fn ($s) => [
            $s->student_code,
            "{$s->first_name} {$s->father_name} {$s->grandfather_name} {$s->family_name}",
            $s->national_id,
            $s->grade === '1' ? 'الأول الثانوي' : 'الثاني الثانوي',
            (string) $s->birthdate?->format('Y-m-d'),
            $s->gender === 'male' ? 'ذكر' : 'أنثى',
            $s->nationality === 'egyptian' ? 'مصري' : 'غير مصري',
            $s->religion === 'muslim' ? 'مسلم' : 'مسيحي',
            self::languageLabel($s->second_language),
            $s->phone,
            $s->address_gov,
            $s->address_center,
            $s->address_village,
            $s->prep_school,
            $s->prep_total,
            $s->prep_seat_no,
            self::branchLabel($s->branch),
            trim("{$s->parent?->first_name} {$s->parent?->father_name} {$s->parent?->grandfather_name} {$s->parent?->family_name}"),
            $s->parent?->job,
            $s->parent?->phone,
            trim("{$s->mother?->first_name} {$s->mother?->father_name} {$s->mother?->grandfather_name} {$s->mother?->family_name}"),
            $s->mother?->job,
            $s->mother?->phone,
            trim("{$s->contact?->first_name} {$s->contact?->father_name} {$s->contact?->grandfather_name} {$s->contact?->family_name}"),
            $s->contact?->relation,
            $s->contact?->phone,
            (string) $s->created_at?->format('Y-m-d H:i'),
            self::statusLabel($s->status),
        ])->toArray();
    }

    public static function languageLabel(?string $v): string
    {
        return match ($v) {
            'french' => 'فرنسي',
            'german' => 'ألماني',
            'italian' => 'إيطالي',
            default => '',
        };
    }

    public static function branchLabel(?string $v): string
    {
        return match ($v) {
            'science_science' => 'علمي علوم',
            'science_math' => 'علمي رياضة',
            'arts' => 'أدبي',
            default => '',
        };
    }

    public static function statusLabel(?string $v): string
    {
        return match ($v) {
            'accepted' => 'مقبول',
            'rejected' => 'مرفوض',
            default => 'قيد المراجعة',
        };
    }
}
