'use client';

import { useMovie } from '@/hooks/useMovies';
import { useParams } from 'next/navigation';
import EpisodeList from '@/components/movie/EpisodeList';
import MovieDetail from '@/components/movie/MovieDetail';
import { useWatchlist } from '@/hooks/useWatchlist';

export default function MovieDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: movie, isLoading } = useMovie(slug);
  const { watchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const isInWatchlist = !!watchlist?.some((item) => item.movieId === movie?.id);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 md:px-12">
        <div className="animate-pulse space-y-6">
          <div className="h-96 bg-netflix-card rounded-lg" />
          <div className="h-8 bg-netflix-card rounded w-1/3" />
          <div className="h-4 bg-netflix-card rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <p>Không tìm thấy phim.</p>
      </div>
    );
  }

  const handleWatchlistToggle = async () => {
    if (isInWatchlist) {
      await removeFromWatchlist(movie.id);
    } else {
      await addToWatchlist(movie.id);
    }
  };

  return (
    <div className="min-h-screen">
      <MovieDetail
        movie={movie}
        onAddToWatchlist={handleWatchlistToggle}
        isInWatchlist={isInWatchlist}
      />

      {/* Episodes */}
      {movie.episodes && movie.episodes.length > 0 && (
        <div className="mt-12 px-4 md:px-12 max-w-7xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-4">Danh sách tập</h2>
          <EpisodeList
            episodes={movie.episodes}
            movieSlug={movie.slug}
          />
        </div>
      )}
    </div>
  );
}
