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
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->enum('grade', ['1', '2']);
            $table->string('first_name', 100);
            $table->string('father_name', 100);
            $table->string('grandfather_name', 100);
            $table->string('family_name', 100);
            $table->string('national_id', 14)->unique();
            $table->enum('gender', ['male', 'female']);
            $table->string('student_code', 50)->nullable();
            $table->date('birthdate');
            $table->enum('nationality', ['egyptian', 'other']);
            $table->enum('religion', ['muslim', 'christian']);
            $table->string('phone', 11)->unique();
            $table->enum('second_language', ['french', 'german', 'italian']);
            $table->string('address_village', 200);
            $table->string('address_center', 200);
            $table->string('address_gov', 100);
            $table->decimal('prep_total', 5, 2)->nullable();
            $table->string('prep_school', 200)->nullable();
            $table->string('prep_seat_no', 50)->nullable();
            $table->string('branch', 100)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
