'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { usePathname, useRouter } from 'next/navigation';

export default function SessionWatcher() {
  const { isAuthenticated, sessionExpiresAt, checkSession } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const verify = () => {
      const isValid = checkSession();
      if (!isValid && isAuthenticated) {
        // Session 7 ngày đã hết hạn và đã được tự động logout bởi checkSession()
        const isProtectedRoute =
          pathname.startsWith('/watchlist') ||
          pathname.startsWith('/profile') ||
          pathname.startsWith('/admin');

        if (isProtectedRoute) {
          router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        }
      }
    };

    // Kiểm tra ngay khi khởi chạy / đổi trang
    verify();

    // Kiểm tra khi người dùng quay lại tab trình duyệt
    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        verify();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    // Kiểm tra định kỳ mỗi 30 giây
    const interval = setInterval(verify, 30000);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      clearInterval(interval);
    };
  }, [isAuthenticated, sessionExpiresAt, pathname, router, checkSession]);

  return null;
}
