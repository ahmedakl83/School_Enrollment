<?php

namespace App\Http\Requests;

use App\Models\Student;
use App\Rules\ValidNationalId;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegisterStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $phoneRule = ['required', 'string', 'size:11', 'starts_with:010,011,012,015'];

        return [
            'grade' => 'required|in:1,2',
            'first_name' => 'required|string|max:100',
            'father_name' => 'required|string|max:100',
            'grandfather_name' => 'required|string|max:100',
            'family_name' => 'required|string|max:100',
            'national_id' => ['required', 'string', 'size:14', new ValidNationalId, function ($attribute, $value, $fail) {
                // التفرد عبر البصمة لأن القيمة مخزّنة مشفّرة
                if (Student::where('national_id_hash', Student::hashNationalId($value))->exists()) {
                    $fail('تم تسجيل هذا الطالب مسبقاً (الرقم القومي مستخدم).');
                }
            }],
            'student_code' => 'nullable|string|max:50',
            'nationality' => 'required|in:egyptian,other',
            'religion' => 'required|in:muslim,christian',
            'phone' => array_merge($phoneRule, ['unique:students,phone']),
            'second_language' => 'required|in:french,german,italian',
            'address_village' => 'required|string|max:200',
            'address_center' => 'required|string|max:200',
            'address_gov' => 'required|string|max:100',

            // الصف الأول فقط
            'prep_total' => 'required_if:grade,1|nullable|numeric|min:0|max:300',
            'prep_school' => 'required_if:grade,1|nullable|string|max:200',
            'prep_seat_no' => 'required_if:grade,1|nullable|string|max:50',

            // الصف الثاني فقط
            'branch' => 'required_if:grade,2|nullable|in:science_science,science_math,arts',

            // بيانات الأب
            'parent_first_name' => 'required|string|max:100',
            'parent_father_name' => 'required|string|max:100',
            'parent_grandfather_name' => 'required|string|max:100',
            'parent_family_name' => 'required|string|max:100',
            'parent_job' => 'required|string|max:100',
            'parent_phone' => $phoneRule,

            // بيانات الأم
            'mother_first_name' => 'required|string|max:100',
            'mother_father_name' => 'required|string|max:100',
            'mother_grandfather_name' => 'required|string|max:100',
            'mother_family_name' => 'required|string|max:100',
            'mother_job' => 'required|string|max:100',
            'mother_phone' => $phoneRule,

            // بيانات شخص التواصل البديل
            'contact_first_name' => 'required|string|max:100',
            'contact_father_name' => 'required|string|max:100',
            'contact_grandfather_name' => 'required|string|max:100',
            'contact_family_name' => 'required|string|max:100',
            'contact_relation' => 'required|string|max:100',
            'contact_phone' => $phoneRule,

            // رقم التواصل الرئيسي — يجب أن يكون أحد الأرقام المُدخلة فعلاً
            'main_contact_phone' => ['required', 'string', 'size:11', Rule::in(array_filter([
                $this->input('phone'),
                $this->input('parent_phone'),
                $this->input('mother_phone'),
                $this->input('contact_phone'),
            ]))],

            // موافقة ولي الأمر على معالجة البيانات (إلزامية)
            'consent' => 'accepted',
        ];
    }

    public function messages(): array
    {
        return [
            'national_id.unique' => 'تم تسجيل هذا الطالب مسبقاً (الرقم القومي مستخدم).',
            'phone.unique' => 'رقم هاتف الطالب مستخدم لطالب آخر بالفعل.',
            'main_contact_phone.in' => 'رقم التواصل الرئيسي يجب أن يكون أحد الأرقام التي أدخلتها.',
            'consent.accepted' => 'يجب الموافقة على إقرار صحة البيانات ومعالجتها قبل الإرسال.',
            'required' => 'هذا الحقل مطلوب.',
            'starts_with' => 'رقم الهاتف يجب أن يبدأ بـ 010 أو 011 أو 012 أو 015.',
            'size' => 'عدد الخانات غير صحيح.',
        ];
    }
}
