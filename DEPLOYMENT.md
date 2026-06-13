# دليل النشر — نظام التسجيل الإلكتروني لمدرسة المساعي المشكورة الثانوية العسكرية

## المتطلبات
- PHP 8.3+ مع إضافات: `pdo_mysql`, `mbstring`, `openssl`, `ctype`, `json`, `dom`
- MySQL 8+
- Node.js 18+ (لبناء الواجهة)
- Nginx + php-fpm
- Composer 2

> ملاحظة بيئة: هذا المستودع طُوِّر واختُبر على PHP 8.5 + إصدار Laravel حديث. تصدير Excel من الخادم
> يستخدم CSV (بترميز UTF-8 BOM) بدل xlsx لأن `phpspreadsheet` لا يدعم PHP 8.5 بعد. للحصول على xlsx
> أصلي من الخادم، استخدم PHP 8.3/8.4 وثبّت `maatwebsite/excel`. (الواجهة تُصدّر xlsx محلياً عبر ExcelJS.)

---

## 1) الخادم (Backend — Laravel)

```bash
cd backend
composer install --no-dev --optimize-autoloader
cp .env.example .env
php artisan key:generate
```

عدّل `.env` لقيم الإنتاج:
```
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain
LOG_LEVEL=warning
LOG_CHANNEL=daily

DB_CONNECTION=mysql
DB_DATABASE=school_enrollment
DB_USERNAME=...
DB_PASSWORD=...

FRONTEND_URL=https://your-domain          # لضبط CORS
SANCTUM_TOKEN_EXPIRATION=120

# حساب الأدمن الأولي (يُزرع مرة واحدة، ثم يُجبر تغيير كلمة المرور عند أول دخول)
ADMIN_PHONE=01006898681
ADMIN_PASSWORD="ضع_كلمة_مرور_قوية"        # ضعها بين تنصيص إن احتوت على # أو مسافات

# واتساب لإرسال بيانات الدخول
WHATSAPP_DRIVER=ultramsg
WHATSAPP_INSTANCE_ID=...
WHATSAPP_TOKEN=...

QUEUE_CONNECTION=database
```

ثم:
```bash
php artisan migrate --force
php artisan db:seed --force          # ينشئ حساب الأدمن إن ضُبط ADMIN_PASSWORD
php artisan config:cache && php artisan route:cache && php artisan view:cache
```

### طابور الرسائل (لإرسال واتساب)
شغّل عاملاً دائماً تحت Supervisor:
```ini
[program:school-queue]
command=php /path/to/backend/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
user=www-data
numprocs=1
```

---

## 2) الواجهة (Frontend — React/Vite)

```bash
cd frontend
cp .env.example .env
# اضبط VITE_API_URL=https://your-domain/api
npm ci
npm run build        # ينتج مجلد dist/
```

قدّم `dist/` عبر Nginx، ووجّه `/api` إلى php-fpm على نفس النطاق (يُلغي الحاجة لـ CORS):

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain;
    ssl_certificate     /etc/letsencrypt/live/your-domain/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain/privkey.pem;
    add_header Strict-Transport-Security "max-age=31536000" always;

    root /path/to/frontend/dist;
    index index.html;

    location / { try_files $uri $uri/ /index.html; }

    location /api {
        root /path/to/backend/public;
        try_files $uri /index.php?$query_string;
    }
    location ~ \.php$ {
        root /path/to/backend/public;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
}
```

---

## 3) النسخ الاحتياطي والمراقبة
- نسخ احتياطي يومي مشفّر لقاعدة البيانات خارج الخادم (مثل `spatie/laravel-backup` أو `mysqldump` مجدول) مع اختبار الاستعادة دورياً.
- مراقبة `https://your-domain/up` (Laravel health check).
- تتبّع الأخطاء عبر Sentry (اختياري) + مراجعة `storage/logs` دورياً.
- سجل التدقيق (جدول `audit_logs`) يحفظ عمليات الأدمن الحساسة (حذف/تغيير حالة/تعديل الحساب).

## 4) قائمة تحقق أمنية قبل الإطلاق
- [ ] `APP_DEBUG=false` و `APP_ENV=production`.
- [ ] HTTPS مفعّل (شهادة سارية) و HSTS.
- [ ] كلمة مرور أدمن قوية، وتغييرها عند أول دخول (`must_change_password`).
- [ ] `FRONTEND_URL` مضبوط لنطاق الإنتاج فقط.
- [ ] طابور `queue:work` يعمل (وإلا لن تُرسل رسائل واتساب).
- [ ] نسخ احتياطي مُجدول ومُختبَر.
- [ ] لا توجد ملفات اختبار في الخادم.
