<?php

namespace App\Http\Controllers\Api;

use App\Exports\StudentsExport;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\AuditLog;
use App\Models\Student;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminController extends Controller
{
    /**
     * يبني استعلام الطلاب مع تطبيق الفلاتر المرسلة (يُستخدم في العرض والتصدير).
     */
    private function buildQuery(Request $request)
    {
        $query = Student::with(['parent', 'mother', 'contact']);

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('father_name', 'like', "%{$search}%")
                  ->orWhere('grandfather_name', 'like', "%{$search}%")
                  ->orWhere('family_name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
                // الرقم القومي مشفّر — نبحث بالبصمة عند إدخال رقم كامل (14 خانة)
                if (preg_match('/^\d{14}$/', $search)) {
                    $q->orWhere('national_id_hash', Student::hashNationalId($search));
                }
            });
        }

        foreach (['grade', 'status', 'second_language', 'branch', 'nationality', 'religion'] as $field) {
            if (($value = $request->query($field)) !== null && $value !== '' && $value !== 'all') {
                $query->where($field, $value);
            }
        }

        if ($gov = $request->query('address_gov')) {
            $query->where('address_gov', 'like', "%{$gov}%");
        }

        if ($from = $request->query('date_from')) {
            $query->whereDate('created_at', '>=', $from);
        }
        if ($to = $request->query('date_to')) {
            $query->whereDate('created_at', '<=', $to);
        }

        return $query->orderBy('created_at', 'desc');
    }

    public function index(Request $request)
    {
        $perPage = min((int) $request->query('per_page', 20), 100);

        return response()->json($this->buildQuery($request)->paginate($perPage));
    }

    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,accepted,rejected'
        ]);

        $student = Student::findOrFail($id);
        $old = $student->status;
        // status ليس ضمن fillable عمداً (حماية من Mass Assignment) — نُسنده مباشرةً
        $student->status = $validated['status'];
        $student->save();

        AuditLog::record('student.status', Student::class, $student->id, ['from' => $old, 'to' => $student->status]);

        return response()->json(['message' => 'تم تحديث حالة الطلب بنجاح', 'student' => $student]);
    }

    public function destroy($id)
    {
        $student = Student::findOrFail($id);
        AuditLog::record('student.delete', Student::class, $student->id, [
            'national_id_last4' => substr((string) $student->national_id, -4),
        ]);
        $student->delete();

        return response()->json(['message' => 'تم حذف الطلب بنجاح']);
    }

    /**
     * تصدير CSV (متوافق مع Excel، يدعم العربية عبر UTF-8 BOM).
     * نستخدم CSV بدل xlsx لتوافق بيئة PHP 8.5 التي لا تدعمها حزم phpspreadsheet حالياً.
     */
    public function exportExcel(Request $request): StreamedResponse
    {
        $export = new StudentsExport($this->buildQuery($request)->get());
        $filename = 'students_' . now()->format('Ymd_His') . '.csv';

        return response()->streamDownload(function () use ($export) {
            $handle = fopen('php://output', 'w');
            // BOM ليتعرّف Excel على ترميز UTF-8 ويعرض العربية بشكل صحيح
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));
            fputcsv($handle, $export->headings());
            foreach ($export->rows() as $row) {
                fputcsv($handle, $row);
            }
            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function exportPdf(Request $request)
    {
        $students = $this->buildQuery($request)->get();

        $pdf = Pdf::loadView('exports.students', compact('students'))
            ->setPaper('a4', 'landscape');

        return $pdf->download('students_' . now()->format('Ymd_His') . '.pdf');
    }

    /**
     * تعديل بيانات حساب الأدمن (رقم الهاتف وكلمة المرور).
     * عند تغيير كلمة المرور تُبطَل كل التوكنات السابقة.
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'phone' => ['sometimes', 'string', 'size:11', 'starts_with:010,011,012,015', Rule::unique('users', 'phone')->ignore($user->id)],
            'current_password' => 'required_with:password|string',
            'password' => 'sometimes|string|min:8|confirmed',
        ]);

        if (isset($validated['name'])) {
            $user->name = $validated['name'];
        }
        if (isset($validated['phone'])) {
            $user->phone = $validated['phone'];
        }

        if (! empty($validated['password'])) {
            if (! Hash::check($validated['current_password'], $user->password)) {
                return response()->json(['message' => 'كلمة المرور الحالية غير صحيحة'], 422);
            }
            $user->password = Hash::make($validated['password']);
            $user->must_change_password = false;
            $user->save();
            // إبطال كل التوكنات لإجبار إعادة الدخول
            $user->tokens()->delete();

            AuditLog::record('profile.password', \App\Models\User::class, $user->id);

            return response()->json(['message' => 'تم تحديث البيانات. يرجى تسجيل الدخول من جديد.', 'reauth' => true]);
        }

        $user->save();

        AuditLog::record('profile.update', \App\Models\User::class, $user->id, ['fields' => array_keys($validated)]);

        return response()->json(['message' => 'تم تحديث بيانات الحساب بنجاح', 'user' => $user]);
    }
}
