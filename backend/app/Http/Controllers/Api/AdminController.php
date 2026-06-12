<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Student;

class AdminController extends Controller
{
    public function index()
    {
        $students = Student::with(['parent', 'mother', 'contact'])->orderBy('created_at', 'desc')->get();
        return response()->json($students);
    }

    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,accepted,rejected'
        ]);

        $student = Student::findOrFail($id);
        $student->update(['status' => $validated['status']]);

        return response()->json(['message' => 'تم تحديث حالة الطلب بنجاح', 'student' => $student]);
    }

    public function destroy($id)
    {
        $student = Student::findOrFail($id);
        $student->delete();

        return response()->json(['message' => 'تم حذف الطلب بنجاح']);
    }

    // Placeholders for export and profile updates
    public function exportExcel() {}
    public function exportPdf() {}
    public function updateProfile(Request $request) {}
}
