import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="container mt-4">
      <div className="glass-panel text-center">
        <div className="logo-container">
          <img src="/logo.png" alt="شعار المساعي الثانوية العسكرية" />
        </div>
        
        <h2>محافظة المنوفية</h2>
        <h2>مديرية التربية والتعليم</h2>
        <h2>إدارة شبين الكوم التعليمية</h2>
        <h1 className="mt-4">مدرسة المساعي المشكورة الثانوية العسكرية بنين</h1>
        
        <div className="mt-4 mb-4">
          <p className="form-label" style={{ fontSize: '1.2rem', color: '#F0F4F8' }}>
            المحترم/ ولي الأمر.. أهلاً بكم في مدرستكم ونرجو من سيادتكم ملء البيانات التالية بدقة.
          </p>
        </div>

        <div className="grid-2 mt-4">
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/register/grade-1')}
          >
            التقدم للصف الأول الثانوي
          </button>
          
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/register/grade-2')}
          >
            التقدم للصف الثاني الثانوي
          </button>
        </div>
        
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button 
            className="btn" 
            style={{ background: 'transparent' }}
            onClick={() => navigate('/login')}
          >
            تسجيل الدخول (للإدارة وأولياء الأمور)
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
