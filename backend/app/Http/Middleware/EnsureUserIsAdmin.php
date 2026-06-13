<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    /**
     * يتأكد أن المستخدم الحالي مدير نظام (admin) قبل السماح بالمتابعة.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || $user->role !== 'admin') {
            return response()->json(['message' => 'غير مصرّح لك بالوصول إلى هذه الصفحة'], 403);
        }

        return $next($request);
    }
}
