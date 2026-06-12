<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class StudentController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'grade' => 'required|in:1,2',
            'first_name' => 'required|string|max:100',
            'father_name' => 'required|string|max:100',
            'grandfather_name' => 'required|string|max:100',
            'family_name' => 'required|string|max:100',
            'national_id' => 'required|string|size:14|unique:students,national_id',
            'student_code' => 'nullable|string|max:50',
            'nationality' => 'required|in:egyptian,other',
            'religion' => 'required|in:muslim,christian',
            'phone' => 'required|string|size:11|unique:students,phone|starts_with:010,011,012,015',
            'second_language' => 'required|in:french,german,italian',
            'address_village' => 'required|string|max:200',
            'address_center' => 'required|string|max:200',
            'address_gov' => 'required|string|max:100',
            
            // Grade 1 only
            'prep_total' => 'required_if:grade,1|nullable|numeric',
            'prep_school' => 'required_if:grade,1|nullable|string|max:200',
            'prep_seat_no' => 'required_if:grade,1|nullable|string|max:50',
            
            // Grade 2 only
            'branch' => 'required_if:grade,2|nullable|string|max:100',

            // Parent Data
            'parent_first_name' => 'required|string|max:100',
            'parent_father_name' => 'required|string|max:100',
            'parent_grandfather_name' => 'required|string|max:100',
            'parent_family_name' => 'required|string|max:100',
            'parent_job' => 'required|string|max:100',
            'parent_phone' => 'required|string|size:11|starts_with:010,011,012,015',

            // Mother Data
            'mother_first_name' => 'required|string|max:100',
            'mother_father_name' => 'required|string|max:100',
            'mother_grandfather_name' => 'required|string|max:100',
            'mother_family_name' => 'required|string|max:100',
            'mother_job' => 'required|string|max:100',
            'mother_phone' => 'required|string|size:11|starts_with:010,011,012,015',

            // Contact Data
            'contact_first_name' => 'required|string|max:100',
            'contact_father_name' => 'required|string|max:100',
            'contact_grandfather_name' => 'required|string|max:100',
            'contact_family_name' => 'required|string|max:100',
            'contact_relation' => 'required|string|max:100',
            'contact_phone' => 'required|string|size:11|starts_with:010,011,012,015',

            // Auth Data
            'main_contact_phone' => 'required|string|size:11',
        ]);

        try {
            DB::beginTransaction();

            // Extract logic from national_id
            $century = substr($validated['national_id'], 0, 1) == '2' ? '19' : '20';
            $year = $century . substr($validated['national_id'], 1, 2);
            $month = substr($validated['national_id'], 3, 2);
            $day = substr($validated['national_id'], 5, 2);
            $birthdate = "$year-$month-$day";

            $genderDigit = substr($validated['national_id'], 12, 1);
            $gender = ($genderDigit % 2 == 0) ? 'female' : 'male';

            $student = Student::create([
                'grade' => $validated['grade'],
                'first_name' => $validated['first_name'],
                'father_name' => $validated['father_name'],
                'grandfather_name' => $validated['grandfather_name'],
                'family_name' => $validated['family_name'],
                'national_id' => $validated['national_id'],
                'gender' => $gender,
                'student_code' => $validated['student_code'] ?? null,
                'birthdate' => $birthdate,
                'nationality' => $validated['nationality'],
                'religion' => $validated['religion'],
                'phone' => $validated['phone'],
                'second_language' => $validated['second_language'],
                'address_village' => $validated['address_village'],
                'address_center' => $validated['address_center'],
                'address_gov' => $validated['address_gov'],
                'prep_total' => $validated['prep_total'] ?? null,
                'prep_school' => $validated['prep_school'] ?? null,
                'prep_seat_no' => $validated['prep_seat_no'] ?? null,
                'branch' => $validated['branch'] ?? null,
            ]);

            $student->parent()->create([
                'first_name' => $validated['parent_first_name'],
                'father_name' => $validated['parent_father_name'],
                'grandfather_name' => $validated['parent_grandfather_name'],
                'family_name' => $validated['parent_family_name'],
                'job' => $validated['parent_job'],
                'phone' => $validated['parent_phone'],
            ]);

            $student->mother()->create([
                'first_name' => $validated['mother_first_name'],
                'father_name' => $validated['mother_father_name'],
                'grandfather_name' => $validated['mother_grandfather_name'],
                'family_name' => $validated['mother_family_name'],
                'job' => $validated['mother_job'],
                'phone' => $validated['mother_phone'],
            ]);

            $student->contact()->create([
                'first_name' => $validated['contact_first_name'],
                'father_name' => $validated['contact_father_name'],
                'grandfather_name' => $validated['contact_grandfather_name'],
                'family_name' => $validated['contact_family_name'],
                'relation' => $validated['contact_relation'],
                'phone' => $validated['contact_phone'],
            ]);

            // User creation
            $password = Str::random(10) . '@A1'; // Generate strong password
            
            $user = User::firstOrCreate(
                ['phone' => $validated['main_contact_phone']],
                [
                    'name' => $validated['father_name'] . ' ' . $validated['grandfather_name'],
                    'password' => Hash::make($password),
                    'role' => 'parent',
                ]
            );

            $student->update(['user_id' => $user->id]);

            // Notify Admins
            $admins = User::where('role', 'admin')->get();
            \Illuminate\Support\Facades\Notification::send($admins, new \App\Notifications\NewEnrollmentNotification($student));

            // Send WhatsApp message to User
            // \App\Services\WhatsAppService::sendMessage($validated['main_contact_phone'], $message);

            DB::commit();

            return response()->json([
                'message' => 'تم التسجيل بنجاح. يرجى الاحتفاظ ببيانات الدخول للاستعلام عن حالة الطلب.',
                'phone' => $validated['main_contact_phone'],
                'password' => $password,
                'registered_at' => now()->format('Y-m-d h:i A'),
                'student_name' => $validated['first_name'] . ' ' . $validated['father_name'] . ' ' . $validated['grandfather_name'] . ' ' . $validated['family_name'],
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            \Illuminate\Support\Facades\Log::error('Registration Error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'حدث خطأ أثناء التسجيل', 'error' => $e->getMessage()], 500);
        }
    }

    public function myStudent(Request $request)
    {
        $student = Student::where('user_id', $request->user()->id)->with(['parent', 'mother', 'contact'])->first();
        if (!$student) {
            return response()->json(['message' => 'لم يتم العثور على طالب مرتبط بهذا الحساب'], 404);
        }
        return response()->json($student);
    }
}
