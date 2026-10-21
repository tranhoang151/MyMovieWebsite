'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import api from '@/lib/axios';
import { User, ApiResponse } from '@/types';

export default function CallbackPage() {
  const { login: setAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('accessToken');
        const refreshToken = urlParams.get('refreshToken');

        if (!accessToken || !refreshToken) {
          console.error('Missing tokens in callback URL');
          router.push('/login');
          return;
        }

        // Fetch user data using the access token
        const { data } = await api.get<ApiResponse<User>>('/users/me', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const user = data.data;

        // Store the tokens in auth state
        setAuth(user, accessToken, refreshToken);

        // Redirect to home page
        router.push('/');
      } catch (error) {
        console.error('Callback error:', error);
        router.push('/login');
      }
    };

    handleCallback();
  }, []);

  return null;
}