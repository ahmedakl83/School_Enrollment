<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    /**
     * يرسل رسالة واتساب عبر المزوّد المُعدّ في config/services.php.
     * يدعم حالياً مزوّد UltraMsg (HTTP API). إن لم يُضبط مزوّد:
     *  - في بيئة local: يُسجّل المحتوى في اللوج لتسهيل الاختبار.
     *  - في الإنتاج: يُسجّل خطأً دون كشف المحتوى ويعيد false.
     *
     * @return bool نجاح الإرسال
     */
    public function send(string $phone, string $message): bool
    {
        $driver = config('services.whatsapp.driver', 'log');

        return match ($driver) {
            'ultramsg' => $this->sendViaUltraMsg($phone, $message),
            default => $this->sendViaLog($phone, $message),
        };
    }

    protected function sendViaUltraMsg(string $phone, string $message): bool
    {
        $instance = config('services.whatsapp.instance_id');
        $token = config('services.whatsapp.token');

        if (! $instance || ! $token) {
            Log::error('WhatsApp (ultramsg) غير مُعدّ بشكل صحيح: instance_id/token مفقود.');
            return false;
        }

        try {
            $response = Http::asForm()->post("https://api.ultramsg.com/{$instance}/messages/chat", [
                'token' => $token,
                'to' => $this->normalizePhone($phone),
                'body' => $message,
            ]);

            if ($response->successful()) {
                return true;
            }

            Log::error('WhatsApp (ultramsg) فشل الإرسال', ['status' => $response->status()]);
            return false;
        } catch (\Throwable $e) {
            Log::error('WhatsApp (ultramsg) استثناء: ' . $e->getMessage());
            return false;
        }
    }

    protected function sendViaLog(string $phone, string $message): bool
    {
        if (app()->environment('production')) {
            // لا نكشف محتوى الرسالة (كلمة المرور) في سجلات الإنتاج
            Log::warning("لم يُضبط مزوّد واتساب — تعذّر إرسال رسالة إلى {$phone}.");
            return false;
        }

        // بيئة التطوير فقط: نسجّل المحتوى لتسهيل الاختبار اليدوي
        Log::info("[DEV] رسالة واتساب إلى {$phone}:\n{$message}");
        return true;
    }

    /**
     * يحوّل الرقم المصري المحلي (01XXXXXXXXX) إلى الصيغة الدولية (201XXXXXXXXX).
     */
    protected function normalizePhone(string $phone): string
    {
        return preg_replace('/^0/', '20', $phone);
    }
}
