import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  // Không cần withCredentials: true khi dùng Bearer Token (tránh lỗi CORS chéo domain trên iOS)
});

// Axios Interceptor for Bearer Token
api.interceptors.request.use((config) => {
  try {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        // Chuẩn hóa Header cho iOS Safari
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
  } catch (err) {
    console.error('LocalStorage access error:', err);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
