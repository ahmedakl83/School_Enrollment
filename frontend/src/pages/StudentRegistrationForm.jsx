import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import api from '../api';

// حقل نصّي موحّد — يضيف الربط بالـ label وعلامة الإلزام وحالة الخطأ (مُعرّف خارج المكوّن لتفادي فقد التركيز)
const TextField = ({ label, name, required = true, rules = {}, ...rest }) => {
  const { register, formState: { errors } } = useFormContext();
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={name}>
        {label}{required && <span className="req">*</span>}
      </label>
      <input
        id={name}
        className={`form-control ${errors[name] ? 'is-invalid' : ''}`}
        {...register(name, { ...(required ? { required: 'مطلوب' } : {}), ...rules })}
        {...rest}
      />
      {errors[name] && <span className="form-error">{errors[name].message}</span>}
    </div>
  );
};

const SelectField = ({ label, name, required = true, children }) => {
  const { register, formState: { errors } } = useFormContext();
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={name}>
        {label}{required && <span className="req">*</span>}
      </label>
      <select
        id={name}
        className={`form-control ${errors[name] ? 'is-invalid' : ''}`}
        {...register(name, required ? { required: 'مطلوب' } : {})}
      >
        <option value="">اختر...</option>
        {children}
      </select>
      {errors[name] && <span className="form-error">{errors[name].message}</span>}
    </div>
  );
};

const PHONE_PATTERN = { value: /^01[0125][0-9]{8}$/, message: 'رقم هاتف مصري غير صحيح (11 رقم يبدأ بـ 01)' };
const NID_PATTERN = { value: /^[23]\d{13}$/, message: 'رقم قومي غير صحيح' };

const STEP_LABELS = ['بيانات الطالب', 'الأب', 'الأم', 'جهة بديلة', 'المراجعة'];

// استخلاص البيانات من الرقم القومي المصري + حساب السن في 1 أكتوبر
const getDerivedData = (nid) => {
  if (!nid || nid.length !== 14) return null;
  const century = nid[0] === '2' ? '19' : '20';
  const year = century + nid.substring(1, 3);
  const month = nid.substring(3, 5);
  const day = nid.substring(5, 7);
  const birthdate = `${year}-${month}-${day}`;

  const genderDigit = parseInt(nid[12], 10);
  const gender = genderDigit % 2 === 0 ? 'أنثى' : 'ذكر';

  const bd = new Date(birthdate);
  if (isNaN(bd.getTime())) return null; // تاريخ غير صالح

  // يناير–سبتمبر = أكتوبر السنة الحالية، أكتوبر–ديسمبر = أكتوبر السنة القادمة
  const now = new Date();
  const refYear = now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();
  const oct1 = new Date(`${refYear}-10-01`);

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

/**
 * نموذج تسجيل موحّد للصف الأول والثاني. يُمرَّر grade (1 أو 2).
 * الفرق الوحيد: الصف الأول يطلب بيانات الإعدادية، والثاني يطلب الشعبة.
 */
const StudentRegistrationForm = ({ grade }) => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const STORAGE_KEY = `reg_draft_grade_${grade}`;

  const methods = useForm({
    mode: 'onTouched',
    defaultValues: JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'),
  });
  const { register, handleSubmit, formState: { errors }, watch, trigger, getValues } = methods;

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successData, setSuccessData] = useState(null);

  const gradeLabel = grade === 1 ? 'الأول الثانوي' : 'الثاني الثانوي';
  const nationalId = watch('national_id');
  const derived = getDerivedData(nationalId);

  // حفظ المسودّة تلقائياً حتى لا تضيع البيانات عند تحديث الصفحة
  useEffect(() => {
    const sub = watch((value) => localStorage.setItem(STORAGE_KEY, JSON.stringify(value)));
    return () => sub.unsubscribe();
  }, [watch, STORAGE_KEY]);

  // العودة لأعلى الصفحة عند تغيير الخطوة
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const nextStep = async () => {
    let fieldsToValidate = [];
    if (step === 1) {
      fieldsToValidate = ['first_name', 'father_name', 'grandfather_name', 'family_name', 'national_id', 'nationality', 'religion', 'phone', 'second_language', 'address_village', 'address_center', 'address_gov'];
      fieldsToValidate = grade === 1
        ? [...fieldsToValidate, 'prep_total', 'prep_school', 'prep_seat_no']
        : [...fieldsToValidate, 'branch'];
    } else if (step === 2) {
      fieldsToValidate = ['parent_first_name', 'parent_father_name', 'parent_grandfather_name', 'parent_family_name', 'parent_job', 'parent_phone'];
    } else if (step === 3) {
      fieldsToValidate = ['mother_first_name', 'mother_father_name', 'mother_grandfather_name', 'mother_family_name', 'mother_job', 'mother_phone'];
    } else if (step === 4) {
      fieldsToValidate = ['contact_first_name', 'contact_father_name', 'contact_grandfather_name', 'contact_family_name', 'contact_relation', 'contact_phone'];
    }

    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid) {
      setStep((prev) => prev + 1);
    } else {
      // التمرير إلى أول حقل به خطأ لمساعدة المستخدم
      setTimeout(() => {
        document.querySelector('.form-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    }
  };

  const prevStep = () => setStep((prev) => prev - 1);

  const onSubmit = async (data) => {
    setLoading(true);
    setServerError('');
    try {
      const payload = { ...data, grade };
      const response = await api.post('/register', payload);
      localStorage.removeItem(STORAGE_KEY); // مسح المسودّة بعد نجاح التسجيل
      setSuccessData(response.data);
    } catch (err) {
      setServerError(err.response?.data?.message || 'حدث خطأ غير متوقع');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

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
الصف الدراسي: ${gradeLabel}

بيانات الدخول للنظام:
رقم الهاتف: ${successData.phone}
سيتم إرسال كلمة المرور عبر واتساب إلى هذا الرقم.
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
              <div><strong>الصف الدراسي:</strong> {gradeLabel}</div>
              <div style={{ marginTop: '10px' }}><strong>رقم الهاتف (للدخول):</strong> <span dir="ltr">{successData.phone}</span></div>
              <div style={{ marginTop: '10px', color: '#1a7a3a', fontWeight: 'bold' }}>📲 سيتم إرسال كلمة المرور عبر واتساب إلى الرقم المختار.</div>
            </div>
          </div>

          <div className="text-center no-print" style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={handlePrint}>طباعة الإيصال</button>
            <button className="btn" style={{ backgroundColor: '#34495e', color: 'white' }} onClick={handleDownloadTxt}>تنزيل كملف نصي</button>
            <button className="btn" onClick={() => navigate('/')}>العودة للرئيسية</button>
          </div>
        </div>
      </div>
    );
  }

  // خيارات الرقم الرئيسي — تُعرض فقط الأرقام التي أُدخلت فعلاً
  const phoneOptions = [
    { label: 'الطالب', value: getValues('phone') },
    { label: 'الأب', value: getValues('parent_phone') },
    { label: 'الأم', value: getValues('mother_phone') },
    { label: 'البديل', value: getValues('contact_phone') },
  ].filter((o) => o.value);

  return (
    <div className="container mt-4">
      <div className="glass-panel">
        <h2 className="text-center mb-4">نموذج التسجيل - {gradeLabel}</h2>

        {serverError && <div className="form-error text-center mb-4">{serverError}</div>}

        <div className="progress-container">
          {[1, 2, 3, 4, 5].map((num) => (
            <div key={num} className={`progress-step ${step >= num ? 'active' : ''} ${step > num ? 'completed' : ''}`}>
              {step > num ? '✓' : num}
              <span className="progress-step-label">{STEP_LABELS[num - 1]}</span>
            </div>
          ))}
        </div>

        <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {step === 1 && (
            <div>
              <h3>البيانات الشخصية للطالب</h3>
              <div className="grid-2">
                <TextField label="الاسم الأول" name="first_name" autoComplete="off" />
                <TextField label="اسم الوالد" name="father_name" autoComplete="off" />
                <TextField label="اسم الجد" name="grandfather_name" autoComplete="off" />
                <TextField label="اللقب" name="family_name" autoComplete="off" />
                <TextField
                  label="الرقم القومي (14 رقم)" name="national_id"
                  inputMode="numeric" dir="ltr" maxLength={14} rules={{ pattern: NID_PATTERN }}
                />
                <TextField label="كود الطالب" name="student_code" required={false} inputMode="numeric" dir="ltr" />
              </div>

              {/* رسالة مساعدة حول البيانات المستخلصة من الرقم القومي */}
              {nationalId && nationalId.length === 14 && derived ? (
                <div className="derived-box">
                  ✅ تم استخلاص البيانات تلقائياً من الرقم القومي:
                  <span className="chip">تاريخ الميلاد: {derived.birthdate}</span>
                  <span className="chip">النوع: {derived.gender}</span>
                  <span className="chip">السن: {derived.ageYears} سنة و{derived.ageMonths} شهر و{derived.ageDays} يوم</span>
                </div>
              ) : (
                <div className="derived-box hint">
                  ℹ️ أدخل الرقم القومي المكوّن من 14 رقم ليتم استخلاص تاريخ الميلاد والنوع والسن في 1 أكتوبر تلقائياً.
                </div>
              )}

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">تاريخ الميلاد (مستخلص تلقائياً)</label>
                  <input className="form-control" value={derived?.birthdate || ''} readOnly disabled dir="ltr" />
                </div>
                <div className="form-group">
                  <label className="form-label">النوع (مستخلص تلقائياً)</label>
                  <input className="form-control" value={derived?.gender || ''} readOnly disabled />
                </div>
                <div className="form-group">
                  <label className="form-label">السن في 1 أكتوبر</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input className="form-control" value={derived ? `${derived.ageYears} سنة` : ''} readOnly disabled placeholder="سنة" />
                    <input className="form-control" value={derived ? `${derived.ageMonths} شهر` : ''} readOnly disabled placeholder="شهر" />
                    <input className="form-control" value={derived ? `${derived.ageDays} يوم` : ''} readOnly disabled placeholder="يوم" />
                  </div>
                </div>
                <TextField
                  label="رقم تليفون الطالب" name="phone"
                  type="tel" inputMode="numeric" dir="ltr" maxLength={11} placeholder="01xxxxxxxxx"
                  rules={{ pattern: PHONE_PATTERN }}
                />
                <SelectField label="الجنسية" name="nationality">
                  <option value="egyptian">مصري</option>
                  <option value="other">غير مصري</option>
                </SelectField>
                <SelectField label="الديانة" name="religion">
                  <option value="muslim">مسلم</option>
                  <option value="christian">مسيحي</option>
                </SelectField>
                <SelectField label="اللغة الثانية" name="second_language">
                  <option value="french">فرنسي</option>
                  <option value="german">ألماني</option>
                  <option value="italian">إيطالي</option>
                </SelectField>
              </div>

              <h4 className="mt-4 mb-2" style={{ color: 'var(--accent)' }}>العنوان بالتفصيل</h4>
              <div className="grid-2">
                <TextField label="الشياخة / القرية" name="address_village" autoComplete="off" />
                <TextField label="القسم / المركز" name="address_center" autoComplete="off" />
                <TextField label="المحافظة" name="address_gov" autoComplete="off" />
              </div>

              {grade === 1 ? (
                <>
                  <h4 className="mt-4 mb-2" style={{ color: 'var(--accent)' }}>بيانات الإعدادية</h4>
                  <div className="grid-2">
                    <TextField label="مجموع الإعدادية" name="prep_total" type="number" step="0.5" inputMode="decimal" dir="ltr" />
                    <TextField label="اسم مدرسة الإعدادية" name="prep_school" autoComplete="off" />
                    <TextField label="رقم الجلوس" name="prep_seat_no" inputMode="numeric" dir="ltr" />
                  </div>
                </>
              ) : (
                <>
                  <h4 className="mt-4 mb-2" style={{ color: 'var(--accent)' }}>الشعبة / التخصص</h4>
                  <div className="grid-2">
                    <SelectField label="الشعبة المرغوبة" name="branch">
                      <option value="science_science">علمي علوم</option>
                      <option value="science_math">علمي رياضة</option>
                      <option value="arts">أدبي</option>
                    </SelectField>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <h3>بيانات الأب / ولي الأمر</h3>
              <div className="grid-2">
                <TextField label="الاسم الأول" name="parent_first_name" autoComplete="off" />
                <TextField label="اسم الوالد" name="parent_father_name" autoComplete="off" />
                <TextField label="اسم الجد" name="parent_grandfather_name" autoComplete="off" />
                <TextField label="اللقب" name="parent_family_name" autoComplete="off" />
                <TextField label="المهنة" name="parent_job" autoComplete="off" />
                <TextField
                  label="رقم التليفون" name="parent_phone"
                  type="tel" inputMode="numeric" dir="ltr" maxLength={11} placeholder="01xxxxxxxxx"
                  rules={{ pattern: PHONE_PATTERN }}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3>بيانات الأم</h3>
              <div className="grid-2">
                <TextField label="الاسم الأول" name="mother_first_name" autoComplete="off" />
                <TextField label="اسم الوالد" name="mother_father_name" autoComplete="off" />
                <TextField label="اسم الجد" name="mother_grandfather_name" autoComplete="off" />
                <TextField label="اللقب" name="mother_family_name" autoComplete="off" />
                <TextField label="المهنة" name="mother_job" autoComplete="off" />
                <TextField
                  label="رقم التليفون" name="mother_phone"
                  type="tel" inputMode="numeric" dir="ltr" maxLength={11} placeholder="01xxxxxxxxx"
                  rules={{ pattern: PHONE_PATTERN }}
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h3>بيانات شخص تواصل بديل</h3>
              <div className="grid-2">
                <TextField label="الاسم الأول" name="contact_first_name" autoComplete="off" />
                <TextField label="اسم الوالد" name="contact_father_name" autoComplete="off" />
                <TextField label="اسم الجد" name="contact_grandfather_name" autoComplete="off" />
                <TextField label="اللقب" name="contact_family_name" autoComplete="off" />
                <TextField label="صلته بالطالب" name="contact_relation" autoComplete="off" />
                <TextField
                  label="رقم التليفون" name="contact_phone"
                  type="tel" inputMode="numeric" dir="ltr" maxLength={11} placeholder="01xxxxxxxxx"
                  rules={{ pattern: PHONE_PATTERN }}
                />
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h3>مراجعة البيانات والتأكيد</h3>
              <p>يرجى مراجعة البيانات التالية قبل الإرسال. للتعديل استخدم زر «السابق».</p>

              <div className="review-grid">
                <div className="review-item"><span className="k">اسم الطالب</span><span className="v">{[getValues('first_name'), getValues('father_name'), getValues('grandfather_name'), getValues('family_name')].filter(Boolean).join(' ')}</span></div>
                <div className="review-item"><span className="k">الرقم القومي</span><span className="v" dir="ltr">{getValues('national_id')}</span></div>
                <div className="review-item"><span className="k">تاريخ الميلاد</span><span className="v" dir="ltr">{derived?.birthdate || '—'}</span></div>
                <div className="review-item"><span className="k">النوع</span><span className="v">{derived?.gender || '—'}</span></div>
                <div className="review-item"><span className="k">هاتف الطالب</span><span className="v" dir="ltr">{getValues('phone')}</span></div>
                <div className="review-item"><span className="k">هاتف الأب</span><span className="v" dir="ltr">{getValues('parent_phone')}</span></div>
                <div className="review-item"><span className="k">هاتف الأم</span><span className="v" dir="ltr">{getValues('mother_phone')}</span></div>
                {grade === 1
                  ? <div className="review-item"><span className="k">مجموع الإعدادية</span><span className="v">{getValues('prep_total')}</span></div>
                  : <div className="review-item"><span className="k">الشعبة</span><span className="v">{getValues('branch')}</span></div>}
              </div>

              <h4 className="mt-4 mb-2" style={{ color: 'var(--accent)' }}>اختيار رقم التواصل الرئيسي</h4>
              <p>الرقم الذي سيُستخدم في الدخول للنظام (يجب أن يكون عليه واتساب).</p>

              <div className="form-group mt-2">
                <label className="form-label" htmlFor="main_contact_phone">الرقم الرئيسي<span className="req">*</span></label>
                <select id="main_contact_phone" className={`form-control ${errors.main_contact_phone ? 'is-invalid' : ''}`} {...register('main_contact_phone', { required: 'مطلوب' })}>
                  <option value="">اختر...</option>
                  {phoneOptions.map((o) => (
                    <option key={o.label} value={o.value}>{o.label}: {o.value}</option>
                  ))}
                </select>
                {errors.main_contact_phone && <span className="form-error">{errors.main_contact_phone.message}</span>}
              </div>

              <div className="form-group mt-3" style={{ textAlign: 'right' }}>
                <label style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', cursor: 'pointer' }}>
                  <input type="checkbox" {...register('whatsapp_confirmed', { required: 'يجب تأكيد توفّر واتساب على الرقم' })} />
                  <span>أؤكد أن خدمة واتساب متوفرة على الرقم المختار لاستلام بيانات الدخول.</span>
                </label>
                {errors.whatsapp_confirmed && <span className="form-error">{errors.whatsapp_confirmed.message}</span>}
              </div>

              <div className="form-group mt-2" style={{ textAlign: 'right' }}>
                <label style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', cursor: 'pointer' }}>
                  <input type="checkbox" {...register('consent', { required: 'يجب الموافقة قبل الإرسال' })} />
                  <span>أقرّ بصحة البيانات المُدخلة وأوافق على معالجتها لغرض التسجيل بالمدرسة.</span>
                </label>
                {errors.consent && <span className="form-error">{errors.consent.message}</span>}
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
        </FormProvider>
      </div>
    </div>
  );
};

export default StudentRegistrationForm;
