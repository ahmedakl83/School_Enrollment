<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('student_parents', function (Blueprint $table) {
            $table->dropColumn('name');
            $table->string('first_name', 100)->after('student_id');
            $table->string('father_name', 100)->after('first_name');
            $table->string('grandfather_name', 100)->after('father_name');
            $table->string('family_name', 100)->after('grandfather_name');
        });

        Schema::table('student_mothers', function (Blueprint $table) {
            $table->dropColumn('name');
            $table->string('first_name', 100)->after('student_id');
            $table->string('father_name', 100)->after('first_name');
            $table->string('grandfather_name', 100)->after('father_name');
            $table->string('family_name', 100)->after('grandfather_name');
        });

        Schema::table('student_contacts', function (Blueprint $table) {
            $table->dropColumn('name');
            $table->string('first_name', 100)->after('student_id');
            $table->string('father_name', 100)->after('first_name');
            $table->string('grandfather_name', 100)->after('father_name');
            $table->string('family_name', 100)->after('grandfather_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_parents', function (Blueprint $table) {
            $table->dropColumn(['first_name', 'father_name', 'grandfather_name', 'family_name']);
            $table->string('name', 200)->after('student_id');
        });

        Schema::table('student_mothers', function (Blueprint $table) {
            $table->dropColumn(['first_name', 'father_name', 'grandfather_name', 'family_name']);
            $table->string('name', 200)->after('student_id');
        });

        Schema::table('student_contacts', function (Blueprint $table) {
            $table->dropColumn(['first_name', 'father_name', 'grandfather_name', 'family_name']);
            $table->string('name', 200)->after('student_id');
        });
    }
};
