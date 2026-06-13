<?php

namespace App\Rules;

use App\Services\NationalIdService;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class ValidNationalId implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! NationalIdService::isValid($value)) {
            $fail('الرقم القومي غير صحيح. يجب أن يتكوّن من 14 رقماً ويبدأ بـ 2 أو 3 ويحتوي على تاريخ ميلاد صحيح.');
        }
    }
}
