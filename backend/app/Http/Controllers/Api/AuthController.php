<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'phone' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        if (Auth::attempt($credentials)) {
            /** @var \App\Models\User $user */
            $user = Auth::user();
            
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'message' => 'تم تسجيل الدخول بنجاح',
                'user' => $user,
                'token' => $token,
                'role' => $user->role
            ]);
        }

        return response()->json([
            'message' => 'بيانات الدخول غير صحيحة'
        ], 401);
    }
    
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        
        return response()->json([
            'message' => 'تم تسجيل الخروج بنجاح'
        ]);
    }
}
