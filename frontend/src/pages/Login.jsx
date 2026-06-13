import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        phone,
        password
      });

      const { user, token, role } = response.data;
      login(user, token);

      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/parent/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'فشل تسجيل الدخول. تأكد من صحة البيانات.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4" style={{ maxWidth: '500px', margin: '0 auto' }}>
      <div className="glass-panel text-center">
        <img src="/logo.png" alt="شعار المدرسة" style={{ width: '100px', marginBottom: '20px' }} />
        <h2>تسجيل الدخول</h2>
        <p>مدرسة المساعي المشكورة الثانوية العسكرية بنين</p>

        {error && <div className="form-error mb-3">{error}</div>}

        <form onSubmit={handleSubmit} style={{ textAlign: 'right' }}>
          <div className="form-group">
            <label className="form-label">رقم الهاتف</label>
            <input 
              type="text" 
              className="form-control" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required 
              dir="ltr"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">كلمة المرور</label>
            <input 
              type="password" 
              className="form-control" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              dir="ltr"
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }} disabled={loading}>
            {loading ? 'جاري الدخول...' : 'دخول'}
          </button>
        </form>
        
        <div style={{ marginTop: '20px' }}>
          <button className="btn" onClick={() => navigate('/')}>
            العودة للرئيسية
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
