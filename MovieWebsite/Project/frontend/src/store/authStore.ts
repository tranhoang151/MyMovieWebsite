import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  avatar?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  sessionExpiresAt: number | null;
  isAuthenticated: boolean;
  
  login: (user: User, accessToken: string, refreshToken: string, sessionExpiresAt?: number) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  checkSession: () => boolean;
  isSessionExpired: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      sessionExpiresAt: null,
      isAuthenticated: false,

      login: (user, accessToken, refreshToken, sessionExpiresAt) => {
        // Mặc định 7 ngày nếu không được truyền từ backend
        const expiresAt = sessionExpiresAt || (Date.now() + 7 * 24 * 60 * 60 * 1000);
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          const maxAge = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
          document.cookie = `accessToken=${accessToken}; path=/; max-age=${maxAge}; samesite=lax`;
        }
        set({
          user,
          accessToken,
          refreshToken,
          sessionExpiresAt: expiresAt,
          isAuthenticated: true,
        });
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          sessionExpiresAt: null,
          isAuthenticated: false,
        });
      },

      updateUser: (user) => set({ user }),

      isSessionExpired: () => {
        const { sessionExpiresAt, isAuthenticated } = get();
        if (!isAuthenticated) return false;
        if (!sessionExpiresAt) return false;
        return Date.now() > sessionExpiresAt;
      },

      checkSession: () => {
        const { sessionExpiresAt, isAuthenticated, logout } = get();
        if (isAuthenticated && sessionExpiresAt && Date.now() > sessionExpiresAt) {
          logout();
          return false;
        }
        return isAuthenticated;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        sessionExpiresAt: state.sessionExpiresAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (state.isAuthenticated && state.sessionExpiresAt && Date.now() > state.sessionExpiresAt) {
            state.logout();
          }
        }
      },
    }
  )
);
