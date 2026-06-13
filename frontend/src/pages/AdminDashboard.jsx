import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// خريطة عرض الشعبة (مفاتيح ثابتة ↔ تسمية عربية)
const BRANCH_LABELS = {
  science_science: 'علمي علوم',
  science_math: 'علمي رياضة',
  arts: 'أدبي',
};
const branchLabel = (v) => BRANCH_LABELS[v] || '';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [govFilter, setGovFilter] = useState('');
  const [langFilter, setLangFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [nationalityFilter, setNationalityFilter] = useState('all');
  const [religionFilter, setReligionFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modal State
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      // مدرسة واحدة: نجلب كل الطلبات (per_page كبير) ونفلتر/نُصدّر في الواجهة
      const response = await api.get('/admin/students', { params: { per_page: 1000 } });
      // الاستجابة مُقسّمة صفحات: البيانات في data.data
      setStudents(response.data.data ?? response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const updateStatus = async (id, status) => {
    if (!window.confirm(`هل أنت متأكد من تحويل حالة الطلب إلى "${status === 'accepted' ? 'مقبول' : 'مرفوض'}"؟`)) return;
    try {
      await api.put(`/admin/student/${id}/status`, { status });
      fetchStudents(); // refresh
      if (selectedStudent && selectedStudent.id === id) {
        setSelectedStudent({ ...selectedStudent, status });
      }
    } catch {
      alert('حدث خطأ أثناء تغيير الحالة');
    }
  };

  const deleteStudent = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الطلب نهائياً؟')) return;
    try {
      await api.delete(`/admin/student/${id}`);
      fetchStudents(); // refresh
      if (selectedStudent && selectedStudent.id === id) {
        setSelectedStudent(null);
      }
    } catch {
      alert('حدث خطأ أثناء الحذف');
    }
  };

  const exportWithExcelJS = async (data, sheetName, fileName) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName, {
      views: [{ rightToLeft: true }] // Ensure RTL layout in Excel!
    });

    if (data.length > 0) {
      // Add Headers
      const headers = Object.keys(data[0]);
      worksheet.columns = headers.map(header => ({
        header: header,
        key: header,
        width: 25
      }));

      // Add Rows
      data.forEach(item => {
        worksheet.addRow(item);
      });

      // Style Header Row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, size: 12 };
      headerRow.alignment = { horizontal: 'center' };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);
  };

  // Export to Excel (Short)
  const exportToExcelShort = () => {
    const data = filteredStudents.map(s => ({
      'الاسم الرباعي': `${s.first_name} ${s.father_name} ${s.grandfather_name} ${s.family_name}`,
      'الرقم القومي': s.national_id,
      'الصف الدراسي': s.grade === '1' ? 'الأول الثانوي' : 'الثاني الثانوي',
      'الديانة': s.religion === 'muslim' ? 'مسلم' : 'مسيحي',
      'النوع': s.gender === 'male' ? 'ذكر' : 'أنثى',
      'رقم الهاتف': s.phone,
      'تاريخ الطلب': new Date(s.created_at).toLocaleDateString('ar-EG'),
      'الحالة': s.status === 'accepted' ? 'مقبول' : s.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة',
    }));
    exportWithExcelJS(data, "طلبات مختصرة", "طلبات_الالتحاق_مختصر.xlsx");
  };

  // Export to Excel (Full)
  const exportToExcelFull = () => {
    const data = filteredStudents.map(s => ({
      'كود الطالب': s.student_code || '',
      'الاسم الأول': s.first_name,
      'اسم الأب': s.father_name,
      'اسم الجد': s.grandfather_name,
      'اللقب / العائلة': s.family_name,
      'الرقم القومي': s.national_id,
      'الصف الدراسي': s.grade === '1' ? 'الأول الثانوي' : 'الثاني الثانوي',
      'تاريخ الميلاد': s.birthdate,
      'النوع': s.gender === 'male' ? 'ذكر' : 'أنثى',
      'الجنسية': s.nationality === 'egyptian' ? 'مصري' : 'أخرى',
      'الديانة': s.religion === 'muslim' ? 'مسلم' : 'مسيحي',
      'اللغة الثانية': s.second_language === 'french' ? 'فرنسي' : s.second_language === 'german' ? 'ألماني' : 'إيطالي',
      'رقم هاتف الطالب': s.phone,
      'المحافظة': s.address_gov,
      'المركز / القسم': s.address_center,
      'القرية / الشياخة': s.address_village,
      'المدرسة الإعدادية': s.prep_school || '',
      'مجموع الإعدادية': s.prep_total || '',
      'رقم جلوس الإعدادية': s.prep_seat_no || '',
      'الشعبة المرجوة': branchLabel(s.branch),
      'اسم ولي الأمر': `${s.parent?.first_name || ''} ${s.parent?.father_name || ''} ${s.parent?.grandfather_name || ''} ${s.parent?.family_name || ''}`.trim(),
      'وظيفة ولي الأمر': s.parent?.job || '',
      'رقم هاتف ولي الأمر': s.parent?.phone || '',
      'اسم الأم': `${s.mother?.first_name || ''} ${s.mother?.father_name || ''} ${s.mother?.grandfather_name || ''} ${s.mother?.family_name || ''}`.trim(),
      'وظيفة الأم': s.mother?.job || '',
      'رقم هاتف الأم': s.mother?.phone || '',
      'اسم جهة الاتصال': `${s.contact?.first_name || ''} ${s.contact?.father_name || ''} ${s.contact?.grandfather_name || ''} ${s.contact?.family_name || ''}`.trim(),
      'صلة القرابة': s.contact?.relation || '',
      'رقم هاتف جهة الاتصال': s.contact?.phone || '',
      'تاريخ الطلب': new Date(s.created_at).toLocaleString('ar-EG'),
      'حالة الطلب': s.status === 'accepted' ? 'مقبول' : s.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة',
    }));
    exportWithExcelJS(data, "طلبات شاملة", "طلبات_الالتحاق_شامل.xlsx");
  };

  // Export to PDF
  const exportToPDF = () => {
    window.print();
  };

  const pendingCount = students.filter(s => s.status === 'pending').length;
  const grade1Count = students.filter(s => s.grade === '1').length;
  const grade2Count = students.filter(s => s.grade === '2').length;

  // Filter Logic
  const filteredStudents = students.filter(s => {
    const fullName = `${s.first_name} ${s.father_name} ${s.grandfather_name} ${s.family_name}`;
    const matchesSearch = fullName.includes(searchQuery) || (s.national_id || '').includes(searchQuery) || (s.phone || '').includes(searchQuery);
    const matchesGrade = gradeFilter === 'all' || s.grade === gradeFilter;
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchesGov = !govFilter || (s.address_gov || '').includes(govFilter);
    const matchesLang = langFilter === 'all' || s.second_language === langFilter;
    const matchesBranch = branchFilter === 'all' || s.branch === branchFilter;
    const matchesNationality = nationalityFilter === 'all' || s.nationality === nationalityFilter;
    const matchesReligion = religionFilter === 'all' || s.religion === religionFilter;
    const created = s.created_at ? s.created_at.substring(0, 10) : '';
    const matchesFrom = !dateFrom || created >= dateFrom;
    const matchesTo = !dateTo || created <= dateTo;
    return matchesSearch && matchesGrade && matchesStatus && matchesGov && matchesLang
      && matchesBranch && matchesNationality && matchesReligion && matchesFrom && matchesTo;
  });

  const resetFilters = () => {
    setSearchQuery(''); setGradeFilter('all'); setStatusFilter('all'); setGovFilter('');
    setLangFilter('all'); setBranchFilter('all'); setNationalityFilter('all');
    setReligionFilter('all'); setDateFrom(''); setDateTo('');
  };

  if (loading) return <div className="text-center mt-4">جاري التحميل...</div>;

  return (
    <div className="container mt-4" style={{ maxWidth: '100%', padding: '0 20px' }}>
      <div className="glass-panel text-center">
        <h2 className="no-print">لوحة تحكم الإدارة</h2>
        <p className="no-print">مرحباً بك: {user?.name}</p>
        
        <div className="grid-3 mt-4 no-print" style={{ gap: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          <div style={{ padding: '20px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
            <h3>إجمالي الطلبات</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{students.length}</p>
          </div>
          <div style={{ padding: '20px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
            <h3>قيد المراجعة</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f39c12' }}>{pendingCount}</p>
          </div>
          <div style={{ padding: '20px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
            <h3>الصف الأول / الثاني</h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{grade1Count} / {grade2Count}</p>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="mt-4 no-print" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.1)', padding: '15px', borderRadius: '8px' }}>
          <div style={{ display: 'flex', gap: '10px', flex: '1', minWidth: '300px' }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="بحث بالاسم أو الرقم القومي..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select className="form-control" value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
              <option value="all">كل الصفوف</option>
              <option value="1">الصف الأول</option>
              <option value="2">الصف الثاني</option>
            </select>
            <select className="form-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">كل الحالات</option>
              <option value="pending">قيد المراجعة</option>
              <option value="accepted">مقبول</option>
              <option value="rejected">مرفوض</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button className="btn" style={{ backgroundColor: '#27ae60', color: '#fff' }} onClick={exportToExcelShort}>تصدير مختصر (Excel)</button>
            <button className="btn" style={{ backgroundColor: '#8e44ad', color: '#fff' }} onClick={exportToExcelFull}>تصدير شامل (Excel)</button>
            <button className="btn" style={{ backgroundColor: '#34495e', color: '#fff' }} onClick={exportToPDF}>طباعة / PDF</button>
          </div>

          {/* فلاتر متقدمة */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', width: '100%' }}>
            <input type="text" className="form-control" placeholder="المحافظة..." style={{ flex: '1', minWidth: '140px' }}
              value={govFilter} onChange={(e) => setGovFilter(e.target.value)} />
            <select className="form-control" style={{ flex: '1', minWidth: '140px' }} value={langFilter} onChange={(e) => setLangFilter(e.target.value)}>
              <option value="all">كل اللغات الثانية</option>
              <option value="french">فرنسي</option>
              <option value="german">ألماني</option>
              <option value="italian">إيطالي</option>
            </select>
            <select className="form-control" style={{ flex: '1', minWidth: '140px' }} value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
              <option value="all">كل الشعب</option>
              <option value="science_science">علمي علوم</option>
              <option value="science_math">علمي رياضة</option>
              <option value="arts">أدبي</option>
            </select>
            <select className="form-control" style={{ flex: '1', minWidth: '120px' }} value={nationalityFilter} onChange={(e) => setNationalityFilter(e.target.value)}>
              <option value="all">كل الجنسيات</option>
              <option value="egyptian">مصري</option>
              <option value="other">غير مصري</option>
            </select>
            <select className="form-control" style={{ flex: '1', minWidth: '120px' }} value={religionFilter} onChange={(e) => setReligionFilter(e.target.value)}>
              <option value="all">كل الديانات</option>
              <option value="muslim">مسلم</option>
              <option value="christian">مسيحي</option>
            </select>
            <input type="date" className="form-control" style={{ flex: '1', minWidth: '130px' }} title="من تاريخ"
              value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <input type="date" className="form-control" style={{ flex: '1', minWidth: '130px' }} title="إلى تاريخ"
              value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            <button className="btn" style={{ backgroundColor: '#7f8c8d', color: '#fff' }} onClick={resetFilters}>مسح الفلاتر</button>
          </div>
        </div>

        <h3 className="mt-4 text-right print-header" style={{ borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
          قائمة الطلبات المتقدمة {filteredStudents.length !== students.length && `(تصفية: ${filteredStudents.length} طالب)`}
        </h3>
        
        <div style={{ overflowX: 'auto', marginTop: '20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', color: 'var(--text-main)' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--surface)' }}>
                <th style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>الاسم الرباعي</th>
                <th style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>الصف</th>
                <th style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>الرقم القومي</th>
                <th style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>تاريخ الطلب</th>
                <th style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>الحالة</th>
                <th className="no-print" style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center" style={{ padding: '20px' }}>لا توجد طلبات مطابقة للبحث.</td>
                </tr>
              ) : (
                filteredStudents.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px' }}>{s.first_name} {s.father_name} {s.grandfather_name} {s.family_name}</td>
                    <td style={{ padding: '10px' }}>{s.grade === '1' ? 'الأول' : 'الثاني'}</td>
                    <td style={{ padding: '10px' }}>{s.national_id}</td>
                    <td style={{ padding: '10px' }} dir="ltr">{new Date(s.created_at).toLocaleDateString('ar-EG')}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{
                        padding: '4px 8px', 
                        borderRadius: '4px',
                        backgroundColor: s.status === 'accepted' ? '#27ae60' : s.status === 'rejected' ? '#e74c3c' : '#f39c12',
                        color: '#fff',
                        fontSize: '0.9rem'
                      }}>
                        {s.status === 'accepted' ? 'مقبول' : s.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                      </span>
                    </td>
                    <td className="no-print" style={{ padding: '10px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      <button className="btn" style={{ padding: '5px 10px', fontSize: '0.8rem', backgroundColor: '#3498db' }} onClick={() => setSelectedStudent(s)}>تفاصيل</button>
                      <button className="btn" style={{ padding: '5px 10px', fontSize: '0.8rem', backgroundColor: '#27ae60' }} onClick={() => updateStatus(s.id, 'accepted')} disabled={s.status === 'accepted'}>قبول</button>
                      <button className="btn" style={{ padding: '5px 10px', fontSize: '0.8rem', backgroundColor: '#e74c3c' }} onClick={() => updateStatus(s.id, 'rejected')} disabled={s.status === 'rejected'}>رفض</button>
                      <button className="btn" style={{ padding: '5px 10px', fontSize: '0.8rem', backgroundColor: '#c0392b' }} onClick={() => deleteStudent(s.id)}>حذف</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 no-print" style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <button className="btn btn-primary" style={{ backgroundColor: '#e74c3c' }} onClick={handleLogout}>
            تسجيل الخروج
          </button>
        </div>
      </div>

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="no-print" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--background)', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto',
            borderRadius: '12px', padding: '30px', color: 'var(--text-main)', textAlign: 'right', border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: 'var(--primary)' }}>السجل الشامل للطالب</h2>
              <button className="btn" style={{ backgroundColor: '#e74c3c', color: '#fff', padding: '5px 15px' }} onClick={() => setSelectedStudent(null)}>إغلاق</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              
              <div style={{ backgroundColor: 'var(--surface)', padding: '15px', borderRadius: '8px' }}>
                <h4 style={{ color: '#f39c12', marginBottom: '15px' }}>البيانات الأساسية</h4>
                <p><strong>الاسم الرباعي:</strong> {selectedStudent.first_name} {selectedStudent.father_name} {selectedStudent.grandfather_name} {selectedStudent.family_name}</p>
                <p><strong>الصف:</strong> {selectedStudent.grade === '1' ? 'الأول الثانوي' : 'الثاني الثانوي'}</p>
                <p><strong>الرقم القومي:</strong> {selectedStudent.national_id}</p>
                <p><strong>تاريخ الميلاد:</strong> <span dir="ltr">{selectedStudent.birthdate}</span></p>
                <p><strong>الديانة:</strong> {selectedStudent.religion === 'muslim' ? 'مسلم' : 'مسيحي'}</p>
                <p><strong>الجنسية:</strong> {selectedStudent.nationality === 'egyptian' ? 'مصري' : 'أخرى'}</p>
                <p><strong>النوع:</strong> {selectedStudent.gender === 'male' ? 'ذكر' : 'أنثى'}</p>
                <p><strong>رقم الهاتف:</strong> {selectedStudent.phone}</p>
                {selectedStudent.student_code && <p><strong>كود الطالب:</strong> {selectedStudent.student_code}</p>}
                <p><strong>اللغة الثانية:</strong> {selectedStudent.second_language === 'french' ? 'فرنسي' : selectedStudent.second_language === 'german' ? 'ألماني' : 'إيطالي'}</p>
              </div>

              <div style={{ backgroundColor: 'var(--surface)', padding: '15px', borderRadius: '8px' }}>
                <h4 style={{ color: '#f39c12', marginBottom: '15px' }}>العنوان والبيانات الدراسية</h4>
                <p><strong>العنوان:</strong> {selectedStudent.address_gov} - {selectedStudent.address_center} - {selectedStudent.address_village}</p>
                
                {selectedStudent.grade === '1' && (
                  <>
                    <hr style={{ borderColor: 'var(--border-color)', margin: '15px 0' }} />
                    <p><strong>المدرسة الإعدادية:</strong> {selectedStudent.prep_school}</p>
                    <p><strong>المجموع:</strong> {selectedStudent.prep_total}</p>
                    <p><strong>رقم الجلوس:</strong> {selectedStudent.prep_seat_no}</p>
                  </>
                )}

                {selectedStudent.grade === '2' && (
                  <>
                    <hr style={{ borderColor: 'var(--border-color)', margin: '15px 0' }} />
                    <p><strong>الشعبة المرجوة:</strong> {branchLabel(selectedStudent.branch)}</p>
                  </>
                )}
              </div>

              <div style={{ backgroundColor: 'var(--surface)', padding: '15px', borderRadius: '8px' }}>
                <h4 style={{ color: '#f39c12', marginBottom: '15px' }}>بيانات ولي الأمر (الأب)</h4>
                <p><strong>الاسم:</strong> {selectedStudent.parent?.first_name} {selectedStudent.parent?.father_name} {selectedStudent.parent?.grandfather_name} {selectedStudent.parent?.family_name}</p>
                <p><strong>الوظيفة:</strong> {selectedStudent.parent?.job}</p>
                <p><strong>رقم الهاتف:</strong> {selectedStudent.parent?.phone}</p>
              </div>

              <div style={{ backgroundColor: 'var(--surface)', padding: '15px', borderRadius: '8px' }}>
                <h4 style={{ color: '#f39c12', marginBottom: '15px' }}>بيانات الأم</h4>
                <p><strong>الاسم:</strong> {selectedStudent.mother?.first_name} {selectedStudent.mother?.father_name} {selectedStudent.mother?.grandfather_name} {selectedStudent.mother?.family_name}</p>
                <p><strong>الوظيفة:</strong> {selectedStudent.mother?.job}</p>
                <p><strong>رقم الهاتف:</strong> {selectedStudent.mother?.phone}</p>
              </div>

              <div style={{ backgroundColor: 'var(--surface)', padding: '15px', borderRadius: '8px', gridColumn: '1 / -1' }}>
                <h4 style={{ color: '#f39c12', marginBottom: '15px' }}>بيانات شخص للطوارئ</h4>
                <p><strong>الاسم:</strong> {selectedStudent.contact?.first_name} {selectedStudent.contact?.father_name} {selectedStudent.contact?.grandfather_name} {selectedStudent.contact?.family_name}</p>
                <p><strong>صلة القرابة:</strong> {selectedStudent.contact?.relation}</p>
                <p><strong>رقم الهاتف:</strong> {selectedStudent.contact?.phone}</p>
              </div>

            </div>

            <div style={{ marginTop: '30px', borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button className="btn" style={{ backgroundColor: '#27ae60', color: '#fff', minWidth: '150px' }} onClick={() => updateStatus(selectedStudent.id, 'accepted')} disabled={selectedStudent.status === 'accepted'}>
                قبول الطلب
              </button>
              <button className="btn" style={{ backgroundColor: '#e74c3c', color: '#fff', minWidth: '150px' }} onClick={() => updateStatus(selectedStudent.id, 'rejected')} disabled={selectedStudent.status === 'rejected'}>
                رفض الطلب
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
