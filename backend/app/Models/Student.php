<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'grade', 'first_name', 'father_name', 'grandfather_name', 'family_name',
        'national_id', 'gender', 'student_code', 'birthdate', 'nationality',
        'religion', 'phone', 'second_language', 'address_village', 'address_center',
        'address_gov', 'prep_total', 'prep_school', 'prep_seat_no', 'branch', 'consent',
    ];

    protected function casts(): array
    {
        return [
            'birthdate' => 'date',
            'prep_total' => 'decimal:2',
            'consent' => 'boolean',
            'national_id' => 'encrypted', // مُشفّر في قاعدة البيانات
        ];
    }

    /**
     * بصمة (sha256) للرقم القومي تُستخدم لمنع التكرار والبحث بالمطابقة التامة
     * دون كشف القيمة المشفّرة.
     */
    public static function hashNationalId(string $nid): string
    {
        return hash('sha256', $nid);
    }

    protected static function booted(): void
    {
        // تحديث بصمة الرقم القومي تلقائياً عند أي تغيير
        static::saving(function (Student $student) {
            if ($student->isDirty('national_id') && $student->national_id) {
                $student->national_id_hash = self::hashNationalId($student->national_id);
            }
        });

        // حذف متسلسل (soft) للسجلات المرتبطة عند حذف الطالب
        static::deleting(function (Student $student) {
            if (! $student->isForceDeleting()) {
                $student->parent()->delete();
                $student->mother()->delete();
                $student->contact()->delete();
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function parent()
    {
        return $this->hasOne(StudentParent::class);
    }

    public function mother()
    {
        return $this->hasOne(StudentMother::class);
    }

    public function contact()
    {
        return $this->hasOne(StudentContact::class);
    }
}
