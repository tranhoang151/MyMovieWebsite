'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import api from '@/lib/axios';

export default function CallbackPage() {
  const { login: setAuth } = useAuthStore();
  const router = useRouter();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const legacyAccessToken = urlParams.get('accessToken');
        const legacyRefreshToken = urlParams.get('refreshToken');

        // Clean URL query string immediately so sensitive codes/tokens don't linger in browser history
        if (typeof window !== 'undefined' && window.history.replaceState) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        // 1. Preferred secure flow: Exchange ephemeral authorization code
        if (code) {
          const res = await api.post('/auth/oauth-exchange', { code });
          const authData = res.data?.data || res.data;
          const { user, accessToken, refreshToken, sessionExpiresAt } = authData;

          if (user && accessToken && refreshToken) {
            setAuth(user, accessToken, refreshToken, sessionExpiresAt);
            router.push('/');
            return;
          }
        }

        // 2. Legacy fallback
        if (legacyAccessToken && legacyRefreshToken) {
          const { data } = await api.get('/users/me', {
            headers: {
              Authorization: `Bearer ${legacyAccessToken}`,
            },
          });
          const user = data.data || data;
          setAuth(user, legacyAccessToken, legacyRefreshToken);
          router.push('/');
          return;
        }

        console.error('Missing authorization code in callback URL');
        router.push('/login');
      } catch (error) {
        console.error('Callback error:', error);
        router.push('/login');
      }
    };

    handleCallback();
  }, [router, setAuth]);

  return (
    <div className="min-h-screen bg-netflix-dark flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-netflix-red" />
    </div>
  );
}
