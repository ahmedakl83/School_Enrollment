import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const ParentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStudent();
  }, []);

  const fetchStudent = async () => {
    try {
      const response = await api.get('/parent/student');
      setStudent(response.data);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError('لم يتم العثور على طلب التحاق مرتبط بهذا الحساب.');
      } else {
        setError('حدث خطأ أثناء جلب البيانات.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'accepted': return { text: 'مقبول', color: '#27ae60', message: 'تهانينا! تم قبول طلب التحاق الطالب.' };
      case 'rejected': return { text: 'مرفوض', color: '#e74c3c', message: 'نأسف، لم يتم قبول الطلب هذا العام.' };
      default: return { text: 'قيد المراجعة', color: '#f39c12', message: 'سيتم إعلامكم فور اتخاذ قرار من الإدارة المدرسية بشأن طلبكم.' };
    }
  };

  if (loading) {
    return <div className="text-center mt-4">جاري التحميل...</div>;
  }

  const statusInfo = student ? getStatusDisplay(student.status) : null;

  return (
    <div className="container mt-4">
      <div className="glass-panel text-center">
        <h2>لوحة تحكم ولي الأمر</h2>
        <p>مرحباً بك: {user?.name}</p>
        <p>رقم الهاتف: <span dir="ltr">{user?.phone}</span></p>

        {error ? (
          <div className="form-error mt-4">{error}</div>
        ) : (
          <>
            <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', color: '#333' }}>
              <h4>حالة طلب الالتحاق للطالب: {student.first_name} {student.father_name}</h4>
              <h3 style={{ color: statusInfo.color, marginTop: '15px' }}>{statusInfo.text}</h3>
              <p className="mt-2">{statusInfo.message}</p>
              <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <p><strong>الصف الدراسي:</strong> {student.grade === '1' ? 'الأول الثانوي' : 'الثاني الثانوي'}</p>
                <p><strong>الرقم القومي:</strong> {student.national_id}</p>
                <p><strong>تاريخ الطلب:</strong> <span dir="ltr">{new Date(student.created_at).toLocaleDateString('ar-EG')}</span></p>
              </div>
            </div>
          </>
        )}

        <button className="btn btn-primary mt-4" style={{ backgroundColor: '#e74c3c' }} onClick={handleLogout}>
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
};

export default ParentDashboard;
