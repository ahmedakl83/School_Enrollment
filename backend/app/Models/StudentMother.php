<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class StudentMother extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'first_name', 'father_name', 'grandfather_name', 'family_name', 'job', 'phone',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
