import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { User, ApiResponse } from '@/types';
import { API_ENDPOINTS, QUERY_KEYS, ROUTES } from '@/lib/constants';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  sessionExpiresAt?: number;
}

export function useAuth() {
  const { user, accessToken, isAuthenticated, login: setAuth, logout: clearAuth, updateUser } = useAuthStore();
  const router = useRouter();

  const loginMutation = useMutation({
    mutationKey: [QUERY_KEYS.USER, 'login'],
    mutationFn: (credentials: LoginCredentials) => api.post<ApiResponse<AuthResponse>>(API_ENDPOINTS.AUTH.LOGIN, credentials),
    onSuccess: (response) => {
      const { user, accessToken, refreshToken, sessionExpiresAt } = response.data.data;
      setAuth(user, accessToken, refreshToken, sessionExpiresAt);
      const redirect = new URLSearchParams(window.location.search).get('redirect') || '/';
      router.push(redirect);
    },
  });

  const registerMutation = useMutation({
    mutationKey: [QUERY_KEYS.USER, 'register'],
    mutationFn: (data: RegisterData) => api.post(API_ENDPOINTS.AUTH.REGISTER, data),
    onSuccess: () => router.push(ROUTES.LOGIN),
  });

  const logoutMutation = useMutation({
    mutationKey: [QUERY_KEYS.USER, 'logout'],
    mutationFn: () => api.post(API_ENDPOINTS.AUTH.LOGOUT),
    onSuccess: () => {
      clearAuth();
      // Remove accessToken cookie
      document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      if (typeof window !== 'undefined') {
        window.location.href = ROUTES.HOME;
      } else {
        router.push(ROUTES.HOME);
      }
    },
    onError: () => {
      clearAuth();
      document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      if (typeof window !== 'undefined') {
        window.location.href = ROUTES.HOME;
      } else {
        router.push(ROUTES.HOME);
      }
    },
  });

  return {
    user,
    accessToken,
    isAuthenticated,
    login: loginMutation.mutateAsync,
    loginLoading: loginMutation.isPending,
    register: registerMutation.mutateAsync,
    registerLoading: registerMutation.isPending,
    logout: logoutMutation.mutateAsync,
    logoutLoading: logoutMutation.isPending,
    updateUser,
  };
}
