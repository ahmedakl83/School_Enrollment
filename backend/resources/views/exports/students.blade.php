<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="utf-8">
    <style>
        * { font-family: DejaVu Sans, sans-serif; }
        body { direction: rtl; font-size: 10px; }
        h2, h4 { text-align: center; margin: 2px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #444; padding: 4px; text-align: right; }
        th { background: #102A43; color: #fff; }
        .header { text-align: center; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h2>مدرسة المساعي المشكورة الثانوية العسكرية بنين</h2>
        <h4>إدارة شبين الكوم التعليمية — محافظة المنوفية</h4>
        <h4>تقرير طلبات الالتحاق ({{ $students->count() }} طلب)</h4>
    </div>
    <table>
        <thead>
            <tr>
                <th>م</th>
                <th>الاسم الرباعي</th>
                <th>الرقم القومي</th>
                <th>الصف</th>
                <th>النوع</th>
                <th>الديانة</th>
                <th>الهاتف</th>
                <th>المحافظة</th>
                <th>الحالة</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($students as $i => $s)
                <tr>
                    <td>{{ $i + 1 }}</td>
                    <td>{{ $s->first_name }} {{ $s->father_name }} {{ $s->grandfather_name }} {{ $s->family_name }}</td>
                    <td>{{ $s->national_id }}</td>
                    <td>{{ $s->grade === '1' ? 'الأول' : 'الثاني' }}</td>
                    <td>{{ $s->gender === 'male' ? 'ذكر' : 'أنثى' }}</td>
                    <td>{{ $s->religion === 'muslim' ? 'مسلم' : 'مسيحي' }}</td>
                    <td>{{ $s->phone }}</td>
                    <td>{{ $s->address_gov }}</td>
                    <td>
                        @if ($s->status === 'accepted') مقبول
                        @elseif ($s->status === 'rejected') مرفوض
                        @else قيد المراجعة @endif
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
