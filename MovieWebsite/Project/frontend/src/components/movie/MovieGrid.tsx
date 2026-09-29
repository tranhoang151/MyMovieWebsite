import { Movie } from '@/types';
import MovieCard from './MovieCard';
import MovieCardSkeleton from './MovieCardSkeleton';

interface MovieGridProps {
  movies: Movie[];
  isLoading?: boolean;
  skeletonCount?: number;
  columns?: string;
}

export default function MovieGrid({ movies, isLoading = false, skeletonCount = 12, columns = 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6' }: MovieGridProps) {
  if (isLoading) {
    return (
      <div className={`grid ${columns} gap-4`}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <MovieCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!movies || movies.length === 0) {
    return <p className="text-netflix-text-secondary text-center py-12 col-span-full">Không có phim nào.</p>;
  }

  return (
    <div className={`grid ${columns} gap-4`}>
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  );
}
