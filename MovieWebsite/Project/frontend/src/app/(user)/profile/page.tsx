'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Trash2, Clock, Film, Tv, PlayCircle, Eye, LogOut } from 'lucide-react';
import { WatchHistory } from '@/types';
import api from '@/lib/axios';

const formatTime = (secs: number) => {
  if (!secs || secs <= 0) return '00:00';
  const total = Math.floor(secs);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const { history, isLoading, deleteHistory } = useWatchHistory();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const hasToken =
      typeof window !== 'undefined' &&
      (isAuthenticated || !!localStorage.getItem('accessToken'));
    if (!hasToken) {
      router.push('/login?redirect=/profile');
    }
  }, [isAuthenticated, router]);

  if (!user) return null;

  // Deduplicate history by movie, keeping the most recently watched episode
  const movieHistoryMap = new Map<string, WatchHistory>();
  history?.forEach((item) => {
    const key = item.movieId || item.movie?.id || item.movie?.slug || item.id;
    if (!movieHistoryMap.has(key)) {
      movieHistoryMap.set(key, item);
    }
  });
  const moviesInProgress = Array.from(movieHistoryMap.values());

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setDeletingId(id);
      await deleteHistory(id);
    } catch (err) {
      console.error('Failed to delete history item', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleProfileLogout = async () => {
    try {
      await api.post('/auth/logout').catch(() => {});
    } finally {
      const { logout } = useAuthStore.getState();
      logout();
      if (typeof document !== 'undefined') {
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 md:px-12 bg-netflix-dark">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Profile Info */}
        <div className="bg-netflix-card/70 border border-white/10 rounded-xl p-6 md:p-8 backdrop-blur shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-red-600 to-rose-400 flex items-center justify-center text-white text-2xl font-bold shadow-md shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">{user.name}</h1>
                <p className="text-netflix-text-muted text-sm">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleProfileLogout}
              className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-red-400 bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 rounded-lg transition-colors cursor-pointer"
              title="Đăng xuất khỏi tài khoản"
            >
              <LogOut size={15} /> Đăng xuất
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10 text-sm">
            <div>
              <p className="text-netflix-text-muted text-xs uppercase tracking-wider mb-1">Email</p>
              <p className="text-white font-medium truncate">{user.email}</p>
            </div>
            <div>
              <p className="text-netflix-text-muted text-xs uppercase tracking-wider mb-1">Vai trò</p>
              <span className="inline-block px-2.5 py-0.5 rounded text-xs font-semibold bg-red-600/20 text-red-400 border border-red-500/30">
                {user.role}
              </span>
            </div>
            <div>
              <p className="text-netflix-text-muted text-xs uppercase tracking-wider mb-1">Phim đang xem dở</p>
              <p className="text-white font-medium">{moviesInProgress.length} phim</p>
            </div>
          </div>
        </div>

        {/* Watch History */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Eye className="text-netflix-red" size={24} />
              <h2 className="text-xl md:text-2xl font-bold text-white">Lịch sử xem phim</h2>
            </div>
            {moviesInProgress.length > 0 && (
              <span className="text-xs md:text-sm text-netflix-text-muted">
                {moviesInProgress.length} phim đang xem
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-44 bg-netflix-card/60 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !moviesInProgress || moviesInProgress.length === 0 ? (
            <div className="bg-netflix-card/40 border border-dashed border-white/10 rounded-xl p-10 text-center flex flex-col items-center justify-center">
              <PlayCircle className="text-netflix-text-muted mb-3" size={48} />
              <p className="text-white font-semibold text-base mb-1">Chưa có lịch sử xem</p>
              <p className="text-netflix-text-secondary text-sm max-w-md mb-6">
                Bạn chưa xem phim nào hoặc chưa có phim đang xem dở. Hãy bắt đầu thưởng thức các bộ phim hấp dẫn ngay bây giờ!
              </p>
              <Link
                href="/movies"
                className="bg-netflix-red hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-all text-sm inline-flex items-center gap-2 shadow-lg hover:shadow-red-900/40"
              >
                <Film size={16} /> Khám phá phim ngay
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {moviesInProgress.map((item) => {
                const movie = item.movie;
                const movieSlug = movie?.slug || '';
                const episodeSlug = item.episodeSlug;
                const resumeUrl = `/watch/${movieSlug}/${episodeSlug}?t=${item.progressSec}`;

                // Check if movie is a TV series or a single movie
                const isSeriesCategory = movie?.categories?.some(
                  (c: { category?: { slug?: string }; slug?: string }) => (c.category?.slug || c.slug) === 'phim-bo',
                );
                const isSeries =
                  isSeriesCategory ||
                  (movie?.totalEpisodes !== undefined &&
                    movie.totalEpisodes !== 1 &&
                    movie.totalEpisodes !== -1);

                // Episode label
                const episodeLabel = isSeries
                  ? item.episode?.name ||
                    (episodeSlug.startsWith('tap-')
                      ? `Tập ${episodeSlug.replace('tap-', '')}`
                      : episodeSlug)
                  : 'Bản Full';

                const imageUrl = movie?.thumbUrl || movie?.posterUrl || '';

                return (
                  <div
                    key={item.id}
                    className="group bg-netflix-card/70 border border-white/10 hover:border-netflix-red/50 rounded-xl overflow-hidden shadow-lg transition-all duration-300 flex flex-col hover:-translate-y-1 hover:shadow-red-950/20"
                  >
                    {/* Thumbnail banner with Play overlay & Progress bar */}
                    <Link href={resumeUrl} className="relative aspect-video w-full overflow-hidden bg-black/40 block">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={movie?.name || 'Phim'}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-500">
                          <Film size={36} />
                        </div>
                      )}

                      {/* Dark overlay & Play icon */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/60 transition-colors flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                          <Play size={20} className="fill-white translate-x-0.5" />
                        </div>
                      </div>

                      {/* Episode Badge top-left */}
                      <div className="absolute top-2.5 left-2.5 z-10">
                        {isSeries ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-600 text-white font-semibold text-xs shadow-md">
                            <Tv size={12} /> {episodeLabel}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-black/70 text-gray-200 border border-white/20 text-xs shadow-md">
                            <Film size={12} /> Phim lẻ
                          </span>
                        )}
                      </div>

                      {/* Progress Time Badge bottom-right */}
                      <div className="absolute bottom-2.5 right-2.5 z-10 bg-black/80 text-white text-xs px-2 py-0.5 rounded font-mono border border-white/10 flex items-center gap-1">
                        <Clock size={11} className="text-red-400" />
                        {item.progressSec > 0 ? formatTime(item.progressSec) : '00:00'}
                      </div>
                    </Link>

                    {/* Movie Info */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <Link href={resumeUrl} className="block group-hover:text-netflix-red transition-colors">
                          <h3 className="text-white font-semibold text-base line-clamp-1 mb-1" title={movie?.name}>
                            {movie?.name || 'Tên phim'}
                          </h3>
                        </Link>
                        {movie?.originalName && (
                          <p className="text-netflix-text-muted text-xs line-clamp-1 mb-2">
                            {movie.originalName}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-netflix-text-secondary mt-1">
                          {isSeries && (
                            <span className="text-red-400 font-medium">
                              Đang xem: <strong>{episodeLabel}</strong>
                            </span>
                          )}
                          {item.serverName && (
                            <span className="text-netflix-text-muted">
                              ({item.serverName})
                            </span>
                          )}
                        </div>
                        {item.watchedAt && (
                          <p className="text-netflix-text-muted text-[11px] mt-1.5">
                            Gần nhất: {formatDate(item.watchedAt)}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="pt-4 mt-3 border-t border-white/10 flex items-center justify-between gap-2">
                        <Link
                          href={resumeUrl}
                          className="flex-1 bg-red-600/90 hover:bg-red-600 text-white font-medium py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow"
                        >
                          <Play size={13} className="fill-white" />
                          <span>Xem tiếp {item.progressSec > 0 ? `(${formatTime(item.progressSec)})` : ''}</span>
                        </Link>
                        <button
                          onClick={(e) => handleDelete(e, item.id)}
                          disabled={deletingId === item.id}
                          title="Xóa khỏi lịch sử xem"
                          className="p-1.5 text-netflix-text-muted hover:text-red-400 hover:bg-red-600/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
