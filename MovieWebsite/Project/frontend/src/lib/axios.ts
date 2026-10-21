import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  withCredentials: true,
});

// Request interceptor để tự động gắn Bearer token
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor để xử lý refresh token khi gặp 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // Gọi endpoint refresh token
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/refresh`,
          { refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }
        }

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Nếu refresh thất bại, xóa token
        if (typeof window !== 'undefined') {
          const hadToken = !!localStorage.getItem('accessToken') || !!localStorage.getItem('refreshToken');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');

          // Chỉ chuyển hướng đến /login nếu đang ở route được bảo vệ
          const pathname = window.location.pathname;
          const isProtectedRoute =
            pathname.startsWith('/watchlist') ||
            pathname.startsWith('/profile') ||
            pathname.startsWith('/admin');

          if (isProtectedRoute || (hadToken && !pathname.startsWith('/watch') && !pathname.startsWith('/movies') && pathname !== '/')) {
            window.location.href = `/login?redirect=${encodeURIComponent(pathname)}`;
          }
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
