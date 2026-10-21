import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  withCredentials: true,
});

// Request interceptor để tự động gắn Bearer token và kiểm tra thời hạn session
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const authStore = useAuthStore.getState();
      // Nếu session 7 ngày đã hết hạn, tự động logout trước khi gửi request
      if (authStore.isSessionExpired && authStore.isSessionExpired()) {
        authStore.logout();
        return Promise.reject(new Error('Phiên đăng nhập đã hết hạn (7 ngày). Vui lòng đăng nhập lại.'));
      }
    }

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

        const { accessToken, refreshToken: newRefreshToken, sessionExpiresAt } = response.data.data;
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }
          if (sessionExpiresAt) {
            const maxAge = Math.max(0, Math.floor((sessionExpiresAt - Date.now()) / 1000));
            document.cookie = `accessToken=${accessToken}; path=/; max-age=${maxAge}; samesite=lax`;
          }
        }

        // Đồng bộ token và sessionExpiresAt vào Zustand store
        useAuthStore.setState((prev) => ({
          ...prev,
          accessToken,
          refreshToken: newRefreshToken || prev.refreshToken,
          sessionExpiresAt: sessionExpiresAt || prev.sessionExpiresAt,
        }));

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Nếu refresh thất bại (hoặc hết hạn 7 ngày), đăng xuất hoàn toàn
        if (typeof window !== 'undefined') {
          useAuthStore.getState().logout();

          // Chuyển hướng nếu đang ở route được bảo vệ
          const pathname = window.location.pathname;
          const isProtectedRoute =
            pathname.startsWith('/watchlist') ||
            pathname.startsWith('/profile') ||
            pathname.startsWith('/admin');

          if (isProtectedRoute) {
            window.location.href = `/login?redirect=${encodeURIComponent(pathname)}`;
          } else if (pathname !== '/' && !pathname.startsWith('/watch') && !pathname.startsWith('/movies')) {
            window.location.href = '/';
          }
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
