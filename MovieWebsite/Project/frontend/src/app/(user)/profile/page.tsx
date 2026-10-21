'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import Link from 'next/link';
import { Play } from 'lucide-react';

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const { history, isLoading } = useWatchHistory();

  useEffect(() => {
    const hasToken = typeof window !== 'undefined' && (isAuthenticated || !!localStorage.getItem('accessToken'));
    if (!hasToken) {
      router.push('/login?redirect=/profile');
    }
  }, [isAuthenticated, router]);

  if (!user) return null;

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 md:px-12">
      <div className="max-w-4xl mx-auto">
        {/* Profile Info */}
        <div className="bg-netflix-card rounded-lg p-6 mb-8">
          <h1 className="text-2xl font-bold text-white mb-4">Hồ sơ của bạn</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-netflix-text-muted">Họ tên</p>
              <p className="text-white">{user.name}</p>
            </div>
            <div>
              <p className="text-netflix-text-muted">Email</p>
              <p className="text-white">{user.email}</p>
            </div>
            <div>
              <p className="text-netflix-text-muted">Vai trò</p>
              <p className="text-white">{user.role}</p>
            </div>
          </div>
        </div>

        {/* Watch History */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Lịch sử xem</h2>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-netflix-card rounded animate-pulse" />
              ))}
            </div>
          ) : !history || history.length === 0 ? (
            <p className="text-netflix-text-secondary">Bạn chưa xem phim nào.</p>
          ) : (
            <div className="space-y-2">
              {history.map((item) => (
                <Link
                  key={item.id}
                  href={`/watch/${item.movie?.slug}/${item.episodeSlug}`}
                  className="flex items-center justify-between p-3 bg-netflix-card rounded hover:bg-netflix-hover transition-colors"
                >
                  <div>
                    <p className="text-white text-sm font-medium">{item.movie?.name}</p>
                    <p className="text-netflix-text-secondary text-xs">
                      Tập {item.episodeSlug} — {item.serverName}
                    </p>
                  </div>
                  <Play size={16} className="text-netflix-text-secondary" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
