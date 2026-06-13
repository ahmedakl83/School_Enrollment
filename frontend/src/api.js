import axios from 'axios';

// عميل HTTP موحّد — العنوان يُقرأ من متغير البيئة VITE_API_URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001/api',
  headers: {
    Accept: 'application/json',
  },
});

// إرفاق التوكن المخزّن (إن وُجد) مع كل طلب
const stored = localStorage.getItem('token');
if (stored) {
  api.defaults.headers.common['Authorization'] = `Bearer ${stored}`;
}

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export default api;
