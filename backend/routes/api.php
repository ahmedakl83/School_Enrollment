<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\AdminController;

Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/register', [StudentController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::get('/student/{id}', [StudentController::class, 'show']);
    Route::put('/student/{id}', [StudentController::class, 'update']);
    Route::get('/parent/student', [StudentController::class, 'myStudent']);

    // Admin routes
    Route::prefix('admin')->group(function () {
        Route::get('/students', [AdminController::class, 'index']);
        Route::put('/student/{id}/status', [AdminController::class, 'updateStatus']);
        Route::delete('/student/{id}', [AdminController::class, 'destroy']);
        Route::get('/export/excel', [AdminController::class, 'exportExcel']);
        Route::get('/export/pdf', [AdminController::class, 'exportPdf']);
        Route::put('/profile', [AdminController::class, 'updateProfile']);
    });
});
