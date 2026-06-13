<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterStudentRequest;
use App\Services\StudentService;
use Illuminate\Http\Request;
use App\Models\Student;
use Illuminate\Support\Facades\DB;

class StudentController extends Controller
{
    public function __construct(private StudentService $students) {}

    public function register(RegisterStudentRequest $request)
    {
        try {
            $student = $this->students->register($request->validated());
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Registration Error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'حدث خطأ أثناء التسجيل. يرجى المحاولة لاحقاً.'], 500);
        }

        return response()->json([
            'message' => 'تم التسجيل بنجاح. سيتم إرسال بيانات الدخول (كلمة المرور) عبر واتساب إلى الرقم المختار. يرجى الاحتفاظ بها للاستعلام عن حالة الطلب.',
            'phone' => $student->user?->phone,
            'registered_at' => $student->created_at->format('Y-m-d h:i A'),
            'student_name' => "{$student->first_name} {$student->father_name} {$student->grandfather_name} {$student->family_name}",
        ], 201);
    }

    public function myStudent(Request $request)
    {
        $student = Student::where('user_id', $request->user()->id)->with(['parent', 'mother', 'contact'])->first();
        if (!$student) {
            return response()->json(['message' => 'لم يتم العثور على طالب مرتبط بهذا الحساب'], 404);
        }
        return response()->json($student);
    }

    /**
     * عرض بيانات طالب — مع فحص الملكية لمنع IDOR.
     * ولي الأمر يرى طالبه فقط؛ الأدمن يرى الجميع.
     */
    public function show(Request $request, $id)
    {
        $student = Student::with(['parent', 'mother', 'contact'])->findOrFail($id);

        if (! $this->canAccess($request->user(), $student)) {
            return response()->json(['message' => 'غير مصرّح لك بالوصول إلى هذا الطلب'], 403);
        }

        return response()->json($student);
    }

    /**
     * تعديل بيانات طالب — مع فحص الملكية. الحقول الحساسة (status, user_id, national_id, gender)
     * غير قابلة للتعديل من هذا المسار.
     */
    public function update(Request $request, $id)
    {
        $student = Student::with(['parent', 'mother', 'contact'])->findOrFail($id);

        if (! $this->canAccess($request->user(), $student)) {
            return response()->json(['message' => 'غير مصرّح لك بتعديل هذا الطلب'], 403);
        }

        $validated = $request->validate([
            'first_name' => 'sometimes|string|max:100',
            'father_name' => 'sometimes|string|max:100',
            'grandfather_name' => 'sometimes|string|max:100',
            'family_name' => 'sometimes|string|max:100',
            'student_code' => 'nullable|string|max:50',
            'nationality' => 'sometimes|in:egyptian,other',
            'religion' => 'sometimes|in:muslim,christian',
            'phone' => 'sometimes|string|size:11|starts_with:010,011,012,015|unique:students,phone,' . $student->id,
            'second_language' => 'sometimes|in:french,german,italian',
            'address_village' => 'sometimes|string|max:200',
            'address_center' => 'sometimes|string|max:200',
            'address_gov' => 'sometimes|string|max:100',
            'prep_total' => 'nullable|numeric',
            'prep_school' => 'nullable|string|max:200',
            'prep_seat_no' => 'nullable|string|max:50',
            'branch' => 'nullable|string|max:100',

            'parent' => 'sometimes|array',
            'parent.first_name' => 'sometimes|string|max:100',
            'parent.father_name' => 'sometimes|string|max:100',
            'parent.grandfather_name' => 'sometimes|string|max:100',
            'parent.family_name' => 'sometimes|string|max:100',
            'parent.job' => 'sometimes|string|max:100',
            'parent.phone' => 'sometimes|string|size:11|starts_with:010,011,012,015',

            'mother' => 'sometimes|array',
            'mother.first_name' => 'sometimes|string|max:100',
            'mother.father_name' => 'sometimes|string|max:100',
            'mother.grandfather_name' => 'sometimes|string|max:100',
            'mother.family_name' => 'sometimes|string|max:100',
            'mother.job' => 'sometimes|string|max:100',
            'mother.phone' => 'sometimes|string|size:11|starts_with:010,011,012,015',

            'contact' => 'sometimes|array',
            'contact.first_name' => 'sometimes|string|max:100',
            'contact.father_name' => 'sometimes|string|max:100',
            'contact.grandfather_name' => 'sometimes|string|max:100',
            'contact.family_name' => 'sometimes|string|max:100',
            'contact.relation' => 'sometimes|string|max:100',
            'contact.phone' => 'sometimes|string|size:11|starts_with:010,011,012,015',
        ]);

        try {
            DB::beginTransaction();

            $student->fill(collect($validated)->except(['parent', 'mother', 'contact'])->toArray());
            $student->save();

            if (!empty($validated['parent'])) {
                $student->parent()->update($validated['parent']);
            }
            if (!empty($validated['mother'])) {
                $student->mother()->update($validated['mother']);
            }
            if (!empty($validated['contact'])) {
                $student->contact()->update($validated['contact']);
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            \Illuminate\Support\Facades\Log::error('Student Update Error: ' . $e->getMessage());
            return response()->json(['message' => 'حدث خطأ أثناء تعديل البيانات. يرجى المحاولة لاحقاً.'], 500);
        }

        return response()->json([
            'message' => 'تم تحديث البيانات بنجاح',
            'student' => $student->fresh(['parent', 'mother', 'contact']),
        ]);
    }

    /**
     * يحدد إن كان المستخدم مخوّلاً للوصول لطالب معيّن: الأدمن أو مالك الطلب فقط.
     */
    private function canAccess($user, Student $student): bool
    {
        if (! $user) {
            return false;
        }
        return $user->role === 'admin' || $student->user_id === $user->id;
    }
}
