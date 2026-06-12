<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    protected $guarded = [];

    public function parent()
    {
        return $this->hasOne(StudentParent::class);
    }

    public function mother()
    {
        return $this->hasOne(StudentMother::class);
    }

    public function contact()
    {
        return $this->hasOne(StudentContact::class);
    }
}
