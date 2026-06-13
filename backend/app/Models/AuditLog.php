<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class AuditLog extends Model
{
    protected $fillable = ['user_id', 'action', 'target_type', 'target_id', 'meta', 'ip'];

    protected function casts(): array
    {
        return ['meta' => 'array'];
    }

    /**
     * يسجّل عملية إدارية في سجل التدقيق.
     */
    public static function record(string $action, ?string $targetType = null, ?int $targetId = null, array $meta = []): void
    {
        $request = app(Request::class);

        static::create([
            'user_id' => $request->user()?->id,
            'action' => $action,
            'target_type' => $targetType,
            'target_id' => $targetId,
            'meta' => $meta ?: null,
            'ip' => $request->ip(),
        ]);
    }
}
