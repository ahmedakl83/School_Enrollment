import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';

const RegisterGrade2 = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, watch, trigger } = useForm();
  
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successData, setSuccessData] = useState(null);

  const nationalId = watch('national_id');

  const getDerivedData = (nid) => {
    if (!nid || nid.length !== 14) return null;
    const century = nid[0] === '2' ? '19' : '20';
    const year = century + nid.substring(1, 3);
    const month = nid.substring(3, 5);
    const day = nid.substring(5, 7);
    const birthdate = `${year}-${month}-${day}`;
    
    const genderDigit = parseInt(nid[12], 10);
    const gender = genderDigit % 2 === 0 ? 'أنثى' : 'ذكر';
    
    const currentYear = new Date().getFullYear();
    const oct1 = new Date(`${currentYear}-10-01`);
    const bd = new Date(birthdate);
    
    let years = oct1.getFullYear() - bd.getFullYear();
    let months = oct1.getMonth() - bd.getMonth();
    let days = oct1.getDate() - bd.getDate();

    if (days < 0) {
      months--;
      const prevMonth = new Date(oct1.getFullYear(), oct1.getMonth(), 0).getDate();
      days += prevMonth;
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    return { birthdate, gender, ageYears: years, ageMonths: months, ageDays: days };
  };

  const derived = getDerivedData(nationalId);

  const nextStep = async () => {
    let fieldsToValidate = [];
    if (step === 1) {
      fieldsToValidate = ['first_name', 'father_name', 'grandfather_name', 'family_name', 'national_id', 'nationality', 'religion', 'phone', 'second_language', 'address_village', 'address_center', 'address_gov', 'branch'];
    } else if (step === 2) {
      fieldsToValidate = ['parent_first_name', 'parent_father_name', 'parent_grandfather_name', 'parent_family_name', 'parent_job', 'parent_phone'];
    } else if (step === 3) {
      fieldsToValidate = ['mother_first_name', 'mother_father_name', 'mother_grandfather_name', 'mother_family_name', 'mother_job', 'mother_phone'];
    } else if (step === 4) {
      fieldsToValidate = ['contact_first_name', 'contact_father_name', 'contact_grandfather_name', 'contact_family_name', 'contact_relation', 'contact_phone'];
    }

    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid) {
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setServerError('');
    try {
      const payload = { ...data, grade: 2 };
      const response = await axios.post('http://localhost:8001/api/register', payload);
      setSuccessData(response.data);
    } catch (err) {
      setServerError(err.response?.data?.message || 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadTxt = () => {
    const text = `
محافظة المنوفية
مديرية التربية والتعليم
إدارة شبين الكوم التعليمية
مدرسة المساعي المشكورة الثانوية العسكرية بنين

تم تسجيل طلب الالتحاق بنجاح!
------------------------------------------------
اسم الطالب: ${successData.student_name}
تاريخ ووقت التسجيل: ${successData.registered_at}
الصف الدراسي: الثاني الثانوي

بيانات الدخول للنظام (يرجى الاحتفاظ بها):
رقم الهاتف: ${successData.phone}
كلمة المرور: ${successData.password}
    `.trim();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `بيانات_تسجيل_${successData.student_name}.txt`;
    link.click();
  };

  if (successData) {
    return (
      <div className="container mt-4">
        <div className="glass-panel" id="printable-receipt" style={{ padding: '40px', maxWidth: '700px', margin: '0 auto', backgroundColor: '#fff', color: '#000' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ccc', paddingBottom: '20px', marginBottom: '20px' }}>
            <div style={{ textAlign: 'right', fontWeight: 'bold' }}>
              <p style={{ margin: 0 }}>محافظة المنوفية</p>
              <p style={{ margin: 0 }}>مديرية التربية والتعليم</p>
              <p style={{ margin: 0 }}>إدارة شبين الكوم التعليمية</p>
              <p style={{ margin: 0 }}>مدرسة المساعي المشكورة الثانوية العسكرية بنين</p>
            </div>
            <div>
              <img src="/logo.png" alt="شعار المدرسة" style={{ width: '80px', height: 'auto' }} />
            </div>
          </div>

          <div className="text-center mb-4">
            <h2 style={{ color: '#27ae60', margin: '0 0 10px' }}>تم تسجيل طلب الالتحاق بنجاح!</h2>
            <p style={{ margin: 0 }}>تاريخ ووقت التسجيل: <span dir="ltr">{successData.registered_at}</span></p>
          </div>

          <div style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '30px' }}>
            <h4 style={{ margin: '0 0 15px', color: '#333', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>بيانات الطالب والدخول</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '1.1rem' }}>
              <div><strong>اسم الطالب:</strong> {successData.student_name}</div>
              <div><strong>الصف الدراسي:</strong> الثاني الثانوي</div>
              <div style={{ marginTop: '10px' }}><strong>رقم الهاتف (للدخول):</strong> <span dir="ltr">{successData.phone}</span></div>
              <div><strong>كلمة المرور:</strong> <span style={{ fontFamily: 'monospace', fontSize: '1.2rem', backgroundColor: '#eee', padding: '2px 8px', borderRadius: '4px' }} dir="ltr">{successData.password}</span></div>
            </div>
          </div>

          <div className="text-center no-print" style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={handlePrint}>
              طباعة الإيصال
            </button>
            <button className="btn" style={{ backgroundColor: '#34495e', color: 'white' }} onClick={handleDownloadTxt}>
              تنزيل كملف نصي
            </button>
            <button className="btn" onClick={() => navigate('/')}>
              العودة للرئيسية
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="glass-panel">
        <h2 className="text-center mb-4">نموذج التسجيل - الصف الثاني الثانوي</h2>
        
        {serverError && <div className="form-error text-center mb-4">{serverError}</div>}

        <div className="progress-container">
          {[1, 2, 3, 4, 5].map((num) => (
            <div key={num} className={`progress-step ${step >= num ? 'active' : ''} ${step > num ? 'completed' : ''}`}>
              {num}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          
          {step === 1 && (
            <div>
              <h3>البيانات الشخصية للطالب</h3>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">الاسم الأول</label>
                  <input className="form-control" {...register('first_name', { required: 'مطلوب' })} />
                  {errors.first_name && <span className="form-error">{errors.first_name.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">اسم الوالد</label>
                  <input className="form-control" {...register('father_name', { required: 'مطلوب' })} />
                  {errors.father_name && <span className="form-error">{errors.father_name.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">اسم الجد</label>
                  <input className="form-control" {...register('grandfather_name', { required: 'مطلوب' })} />
                  {errors.grandfather_name && <span className="form-error">{errors.grandfather_name.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">اللقب</label>
                  <input className="form-control" {...register('family_name', { required: 'مطلوب' })} />
                  {errors.family_name && <span className="form-error">{errors.family_name.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">الرقم القومي (14 رقم)</label>
                  <input className="form-control" maxLength="14" {...register('national_id', { required: 'مطلوب', pattern: { value: /^[23]\d{13}$/, message: 'رقم قومي غير صحيح' } })} />
                  {errors.national_id && <span className="form-error">{errors.national_id.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">كود الطالب</label>
                  <input className="form-control" {...register('student_code')} />
                </div>
                <div className="form-group">
                  <label className="form-label">تاريخ الميلاد</label>
                  <input className="form-control" value={derived?.birthdate || ''} readOnly disabled />
                </div>
                <div className="form-group">
                  <label className="form-label">النوع</label>
                  <input className="form-control" value={derived?.gender || ''} readOnly disabled />
                </div>
                <div className="form-group">
                  <label className="form-label">السن في 1 أكتوبر</label>
                  <div style={{display: 'flex', gap: '10px'}}>
                    <input className="form-control" value={derived ? `${derived.ageYears} سنة` : ''} readOnly disabled placeholder="سنة" />
                    <input className="form-control" value={derived ? `${derived.ageMonths} شهر` : ''} readOnly disabled placeholder="شهر" />
                    <input className="form-control" value={derived ? `${derived.ageDays} يوم` : ''} readOnly disabled placeholder="يوم" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">رقم تليفون الطالب</label>
                  <input className="form-control" {...register('phone', { required: 'مطلوب', pattern: { value: /^01[0125][0-9]{8}$/, message: 'رقم غير صحيح' } })} />
                  {errors.phone && <span className="form-error">{errors.phone.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">الجنسية</label>
                  <select className="form-control" {...register('nationality', { required: 'مطلوب' })}>
                    <option value="">اختر...</option>
                    <option value="egyptian">مصري</option>
                    <option value="other">غير مصري</option>
                  </select>
                  {errors.nationality && <span className="form-error">{errors.nationality.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">الديانة</label>
                  <select className="form-control" {...register('religion', { required: 'مطلوب' })}>
                    <option value="">اختر...</option>
                    <option value="muslim">مسلم</option>
                    <option value="christian">مسيحي</option>
                  </select>
                  {errors.religion && <span className="form-error">{errors.religion.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">اللغة الثانية</label>
                  <select className="form-control" {...register('second_language', { required: 'مطلوب' })}>
                    <option value="">اختر...</option>
                    <option value="french">فرنسي</option>
                    <option value="german">ألماني</option>
                    <option value="italian">إيطالي</option>
                  </select>
                  {errors.second_language && <span className="form-error">{errors.second_language.message}</span>}
                </div>
              </div>

              <h4 className="mt-4 mb-2" style={{color: 'var(--accent)'}}>العنوان بالتفصيل</h4>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">الشياخة / القرية</label>
                  <input className="form-control" {...register('address_village', { required: 'مطلوب' })} />
                </div>
                <div className="form-group">
                  <label className="form-label">القسم / المركز</label>
                  <input className="form-control" {...register('address_center', { required: 'مطلوب' })} />
                </div>
                <div className="form-group">
                  <label className="form-label">المحافظة</label>
                  <input className="form-control" {...register('address_gov', { required: 'مطلوب' })} />
                </div>
              </div>

              <h4 className="mt-4 mb-2" style={{color: 'var(--accent)'}}>بيانات إضافية</h4>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">الشعبة / التخصص</label>
                  <select className="form-control" {...register('branch', { required: 'مطلوب' })}>
                    <option value="">اختر...</option>
                    <option value="علمي علوم">علمي علوم</option>
                    <option value="علمي رياضة">علمي رياضة</option>
                    <option value="أدبي">أدبي</option>
                  </select>
                  {errors.branch && <span className="form-error">{errors.branch.message}</span>}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3>بيانات الأب / ولي الأمر</h3>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">الاسم الأول</label>
                  <input className="form-control" {...register('parent_first_name', { required: 'مطلوب' })} />
                  {errors.parent_first_name && <span className="form-error">{errors.parent_first_name.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">اسم الوالد</label>
                  <input className="form-control" {...register('parent_father_name', { required: 'مطلوب' })} />
                  {errors.parent_father_name && <span className="form-error">{errors.parent_father_name.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">اسم الجد</label>
                  <input className="form-control" {...register('parent_grandfather_name', { required: 'مطلوب' })} />
                  {errors.parent_grandfather_name && <span className="form-error">{errors.parent_grandfather_name.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">اللقب</label>
                  <input className="form-control" {...register('parent_family_name', { required: 'مطلوب' })} />
                  {errors.parent_family_name && <span className="form-error">{errors.parent_family_name.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">المهنة</label>
                  <input className="form-control" {...register('parent_job', { required: 'مطلوب' })} />
                </div>
                <div className="form-group">
                  <label className="form-label">رقم التليفون</label>
                  <input className="form-control" {...register('parent_phone', { required: 'مطلوب', pattern: { value: /^01[0125][0-9]{8}$/, message: 'رقم غير صحيح' } })} />
                  {errors.parent_phone && <span className="form-error">{errors.parent_phone.message}</span>}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3>بيانات الأم</h3>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">الاسم الأول</label>
                  <input className="form-control" {...register('mother_first_name', { required: 'مطلوب' })} />
                  {errors.mother_first_name && <span className="form-error">{errors.mother_first_name.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">اسم الوالد</label>
                  <input className="form-control" {...register('mother_father_name', { required: 'مطلوب' })} />
                  {errors.mother_father_name && <span className="form-error">{errors.mother_father_name.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">اسم الجد</label>
                  <input className="form-control" {...register('mother_grandfather_name', { required: 'مطلوب' })} />
                  {errors.mother_grandfather_name && <span className="form-error">{errors.mother_grandfather_name.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">اللقب</label>
                  <input className="form-control" {...register('mother_family_name', { required: 'مطلوب' })} />
                  {errors.mother_family_name && <span className="form-error">{errors.mother_family_name.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">المهنة</label>
                  <input className="form-control" {...register('mother_job', { required: 'مطلوب' })} />
                </div>
                <div className="form-group">
                  <label className="form-label">رقم التليفون</label>
                  <input className="form-control" {...register('mother_phone', { required: 'مطلوب', pattern: { value: /^01[0125][0-9]{8}$/, message: 'رقم غير صحيح' } })} />
                  {errors.mother_phone && <span className="form-error">{errors.mother_phone.message}</span>}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h3>بيانات شخص تواصل بديل</h3>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">الاسم الأول</label>
                  <input className="form-control" {...register('contact_first_name', { required: 'مطلوب' })} />
                  {errors.contact_first_name && <span className="form-error">{errors.contact_first_name.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">اسم الوالد</label>
                  <input className="form-control" {...register('contact_father_name', { required: 'مطلوب' })} />
                  {errors.contact_father_name && <span className="form-error">{errors.contact_father_name.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">اسم الجد</label>
                  <input className="form-control" {...register('contact_grandfather_name', { required: 'مطلوب' })} />
                  {errors.contact_grandfather_name && <span className="form-error">{errors.contact_grandfather_name.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">اللقب</label>
                  <input className="form-control" {...register('contact_family_name', { required: 'مطلوب' })} />
                  {errors.contact_family_name && <span className="form-error">{errors.contact_family_name.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">صلته بالطالب</label>
                  <input className="form-control" {...register('contact_relation', { required: 'مطلوب' })} />
                </div>
                <div className="form-group">
                  <label className="form-label">رقم التليفون</label>
                  <input className="form-control" {...register('contact_phone', { required: 'مطلوب', pattern: { value: /^01[0125][0-9]{8}$/, message: 'رقم غير صحيح' } })} />
                  {errors.contact_phone && <span className="form-error">{errors.contact_phone.message}</span>}
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h3>تأكيد البيانات واختيار رقم التواصل الرئيسي</h3>
              <p>يرجى اختيار الرقم الذي سيستخدم في الدخول للنظام (يفضل أن يكون عليه واتساب).</p>
              
              <div className="form-group mt-4">
                <label className="form-label">الرقم الرئيسي</label>
                <select className="form-control" {...register('main_contact_phone', { required: 'مطلوب' })}>
                  <option value="">اختر...</option>
                  <option value={watch('phone')}>الطالب: {watch('phone')}</option>
                  <option value={watch('parent_phone')}>الأب: {watch('parent_phone')}</option>
                  <option value={watch('mother_phone')}>الأم: {watch('mother_phone')}</option>
                  <option value={watch('contact_phone')}>البديل: {watch('contact_phone')}</option>
                </select>
                {errors.main_contact_phone && <span className="form-error">{errors.main_contact_phone.message}</span>}
              </div>
            </div>
          )}

          <div className="flex justify-between mt-4">
            {step > 1 ? (
              <button type="button" className="btn" onClick={prevStep}>السابق</button>
            ) : <div></div>}
            
            {step < 5 ? (
              <button type="button" className="btn btn-primary" onClick={nextStep}>التالي</button>
            ) : (
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'جاري التسجيل...' : 'تأكيد وحفظ'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterGrade2;
