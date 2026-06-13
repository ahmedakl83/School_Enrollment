<?php

namespace App\Services;

use App\Jobs\SendWhatsAppMessage;
use App\Models\Student;
use App\Models\User;
use App\Notifications\NewEnrollmentNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

class StudentService
{
    /**
     * ينشئ طالباً جديداً مع ذويه وحساب ولي الأمر، ويرسل بيانات الدخول عبر واتساب.
     *
     * @param  array  $data  البيانات المُتحقَّق منها من RegisterStudentRequest
     * @return Student
     */
    public function register(array $data): Student
    {
        return DB::transaction(function () use ($data) {
            $student = Student::create([
                'grade' => $data['grade'],
                'first_name' => $data['first_name'],
                'father_name' => $data['father_name'],
                'grandfather_name' => $data['grandfather_name'],
                'family_name' => $data['family_name'],
                'national_id' => $data['national_id'],
                'gender' => NationalIdService::extractGender($data['national_id']),
                'student_code' => $data['student_code'] ?? null,
                'birthdate' => NationalIdService::extractBirthdate($data['national_id']),
                'nationality' => $data['nationality'],
                'religion' => $data['religion'],
                'phone' => $data['phone'],
                'second_language' => $data['second_language'],
                'address_village' => $data['address_village'],
                'address_center' => $data['address_center'],
                'address_gov' => $data['address_gov'],
                'prep_total' => $data['prep_total'] ?? null,
                'prep_school' => $data['prep_school'] ?? null,
                'prep_seat_no' => $data['prep_seat_no'] ?? null,
                'branch' => $data['branch'] ?? null,
                'consent' => (bool) ($data['consent'] ?? false),
            ]);

            $student->parent()->create([
                'first_name' => $data['parent_first_name'],
                'father_name' => $data['parent_father_name'],
                'grandfather_name' => $data['parent_grandfather_name'],
                'family_name' => $data['parent_family_name'],
                'job' => $data['parent_job'],
                'phone' => $data['parent_phone'],
            ]);

            $student->mother()->create([
                'first_name' => $data['mother_first_name'],
                'father_name' => $data['mother_father_name'],
                'grandfather_name' => $data['mother_grandfather_name'],
                'family_name' => $data['mother_family_name'],
                'job' => $data['mother_job'],
                'phone' => $data['mother_phone'],
            ]);

            $student->contact()->create([
                'first_name' => $data['contact_first_name'],
                'father_name' => $data['contact_father_name'],
                'grandfather_name' => $data['contact_grandfather_name'],
                'family_name' => $data['contact_family_name'],
                'relation' => $data['contact_relation'],
                'phone' => $data['contact_phone'],
            ]);

            $this->attachParentAccount($student, $data['main_contact_phone'], $data);

            // إشعار الإدارة
            $admins = User::where('role', 'admin')->get();
            Notification::send($admins, new NewEnrollmentNotification($student));

            return $student;
        });
    }

    /**
     * ينشئ أو يجد حساب ولي الأمر ويرسل بيانات الدخول عبر واتساب.
     * إن كان الرقم مسجّلاً مسبقاً نعيد تعيين كلمة المرور حتى يصل ولي الأمر دائماً ببيانات صالحة.
     */
    protected function attachParentAccount(Student $student, string $phone, array $data): void
    {
        $password = $this->generatePassword();

        $user = User::where('phone', $phone)->first();

        if ($user) {
            $user->password = Hash::make($password);
            $user->save();
        } else {
            $user = User::create([
                'name' => $data['father_name'] . ' ' . $data['grandfather_name'],
                'phone' => $phone,
                'password' => Hash::make($password),
                'role' => 'parent',
            ]);
        }

        // user_id ليس ضمن fillable عمداً (حماية من Mass Assignment)
        $student->user_id = $user->id;
        $student->save();

        $message = "مدرسة المساعي المشكورة الثانوية العسكرية بنين\n"
            . "تم استلام طلب التحاق الطالب: {$data['first_name']} {$data['father_name']}\n"
            . "بيانات الدخول للاستعلام عن حالة الطلب:\n"
            . "رقم الهاتف: {$phone}\n"
            . "كلمة المرور: {$password}";

        SendWhatsAppMessage::dispatch($phone, $message);
    }

    protected function generatePassword(): string
    {
        // كلمة مرور قوية: حروف كبيرة/صغيرة + أرقام + رمز
        return Str::upper(Str::random(2)) . Str::lower(Str::random(4)) . random_int(100, 999) . '@';
    }
}
