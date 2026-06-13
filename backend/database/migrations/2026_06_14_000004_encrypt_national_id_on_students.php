<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // إلغاء قيد التفرد على الرقم القومي (سيُخزَّن مشفّراً، ويُمنع التكرار عبر hash)
        Schema::table('students', function (Blueprint $table) {
            $table->dropUnique(['national_id']);
        });

        // توسيع العمود ليتسع للنص المشفّر + عمود بصمة (hash) للبحث ومنع التكرار
        Schema::table('students', function (Blueprint $table) {
            $table->text('national_id')->change();
            $table->string('national_id_hash', 64)->nullable()->after('national_id');
        });

        Schema::table('students', function (Blueprint $table) {
            $table->unique('national_id_hash');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropUnique(['national_id_hash']);
            $table->dropColumn('national_id_hash');
        });

        Schema::table('students', function (Blueprint $table) {
            $table->string('national_id', 14)->change();
            $table->unique('national_id');
        });
    }
};
