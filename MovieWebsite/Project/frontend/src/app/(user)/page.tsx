'use client';

import { useMovies } from '@/hooks/useMovies';
import MovieBanner from '@/components/movie/MovieBanner';
import MovieRow from '@/components/movie/MovieRow';
import MovieCardSkeleton from '@/components/movie/MovieCardSkeleton';

export default function HomePage() {
  const { data: latestMovies, isLoading: isLoadingLatest } = useMovies({ page: 1, limit: 10 });
  const { data: seriesMovies, isLoading: isLoadingSeries } = useMovies({ page: 1, limit: 10, type: 'series' });
  const { data: singleMovies, isLoading: isLoadingSingle } = useMovies({ page: 1, limit: 10, type: 'single' });

  const heroMovie = latestMovies?.items?.[0];

  return (
    <div className="min-h-screen">
      {heroMovie && <MovieBanner movie={heroMovie} />}

      <div className="relative z-10 mt-2 sm:-mt-8 md:-mt-16">
        {isLoadingLatest ? (
          <div className="flex space-x-2 px-4 md:px-12 mb-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <MovieCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <MovieRow
            title="Phim mới cập nhật"
            movies={latestMovies?.items || []}
            viewAllHref="/movies"
          />
        )}

        {isLoadingSeries ? (
          <div className="flex space-x-2 px-4 md:px-12 mb-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <MovieCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <MovieRow
            title="Phim bộ đang chiếu"
            movies={seriesMovies?.items || []}
            viewAllHref="/movies?type=series"
          />
        )}

        {isLoadingSingle ? (
          <div className="flex space-x-2 px-4 md:px-12 mb-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <MovieCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <MovieRow
            title="Phim lẻ hot"
            movies={singleMovies?.items || []}
            viewAllHref="/movies?type=single"
          />
        )}
      </div>
    </div>
  );
}
