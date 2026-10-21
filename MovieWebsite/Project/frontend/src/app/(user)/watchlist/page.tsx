'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useWatchlist } from '@/hooks/useWatchlist';
import MovieCard from '@/components/movie/MovieCard';
import MovieCardSkeleton from '@/components/movie/MovieCardSkeleton';
import { Button } from '@/components/ui/button';
import { Trash2, Film } from 'lucide-react';
import Link from 'next/link';
import { Movie } from '@/types';

export default function WatchlistPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const { watchlist, isLoading, removeFromWatchlist } = useWatchlist();

  useEffect(() => {
    const hasToken = typeof window !== 'undefined' && (isAuthenticated || !!localStorage.getItem('accessToken'));
    if (!hasToken) {
      router.push('/login?redirect=/watchlist');
    }
  }, [isAuthenticated, router]);

  if (isLoading || !watchlist) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 md:px-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-8">Tủ phim của bạn</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const movies = watchlist
    .map((item) => item.movie)
    .filter((movie): movie is Movie => !!movie);

  if (movies.length === 0) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 md:px-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-8">Tủ phim của bạn</h1>
        <div className="flex flex-col items-center justify-center text-center py-20 px-4 bg-netflix-card/30 rounded-xl border border-netflix-hover/50 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-netflix-hover flex items-center justify-center mb-4 text-netflix-text-secondary">
            <Film size={32} />
          </div>
          <p className="text-white text-lg font-semibold mb-1">Tủ phim của bạn đang trống</p>
          <p className="text-netflix-text-secondary text-sm mb-6 max-w-sm">
            Hãy khám phá các bộ phim hot và bấm &quot;Thêm vào tủ&quot; để lưu lại những bộ phim yêu thích của bạn!
          </p>
          <Link href="/movies">
            <Button className="bg-netflix-red hover:bg-netflix-red-hover text-white px-6">
              Khám phá phim ngay
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 md:px-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Tủ phim của bạn</h1>
        <span className="text-netflix-text-secondary text-sm">{movies.length} phim đã lưu</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {movies.map((movie) => (
          <div key={movie.id} className="relative group">
            <MovieCard movie={movie} />
            <button
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                  await removeFromWatchlist(movie.id);
                } catch (error) {
                  console.error('Lỗi khi xóa khỏi tủ phim:', error);
                  alert('Không thể xóa phim khỏi tủ. Vui lòng thử lại!');
                }
              }}
              className="absolute top-2 right-2 bg-black/70 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-20 shadow-md"
              title="Xóa khỏi tủ"
            >
              <Trash2 size={14} className="text-white" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
