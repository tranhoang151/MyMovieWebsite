import Image from 'next/image';
import Link from 'next/link';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Movie } from '@/types';

interface MovieDetailProps {
  movie: Movie;
  onAddToWatchlist?: () => void;
  isInWatchlist?: boolean;
}

export default function MovieDetail({ movie, onAddToWatchlist, isInWatchlist }: MovieDetailProps) {
  const firstEpisodeSlug = movie.episodes?.[0]?.slug;

  return (
    <>
      <div className="relative h-[50vh] min-h-[400px]">
        <Image
          src={movie.posterUrl || movie.thumbUrl || '/placeholder-banner.jpg'}
          alt={movie.name}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-netflix-dark via-netflix-dark/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-netflix-dark via-transparent to-transparent" />
      </div>

      <div className="px-4 md:px-12 -mt-32 relative z-10 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold text-white mb-2">{movie.name}</h1>
      {movie.originalName && <p className="text-netflix-text-secondary italic mb-4">{movie.originalName}</p>}

      <div className="flex items-center gap-3 text-sm text-netflix-text-secondary mb-6">
        {movie.year && <span>{movie.year}</span>}
        {movie.quality && <span className="bg-netflix-red px-2 py-0.5 rounded text-white text-xs">{movie.quality}</span>}
        {movie.language && <span>{movie.language}</span>}
        {movie.time && <span>{movie.time}</span>}
      </div>

      <p className="text-netflix-text-secondary mb-8 leading-relaxed line-clamp-3">{movie.description}</p>

      <div className="flex gap-3 mb-8">
        {firstEpisodeSlug && (
          <Link href={`/watch/${movie.slug}/${firstEpisodeSlug}`}>
            <Button className="bg-netflix-red hover:bg-netflix-red-hover text-white">
              <Play size={18} className="mr-2" /> Xem ngay
            </Button>
          </Link>
        )}
        {onAddToWatchlist && (
          <Button
            variant="outline"
            onClick={onAddToWatchlist}
            className={`border-netflix-hover ${isInWatchlist ? 'text-netflix-red' : 'text-white'} hover:bg-netflix-hover`}
          >
            {isInWatchlist ? 'Đã trong tủ' : '+ Tủ phim'}
          </Button>
        )}
      </div>

      {/* Metadata grid */}
      <div className="bg-netflix-card p-6 rounded-lg space-y-3">
        <InfoRow label="Trạng thái" value={movie.currentEpisode || movie.status} />
        <InfoRow label="Tập phim" value={`${movie.totalEpisodes} tập`} />
        <InfoRow label="Chất lượng" value={movie.quality} />
        <InfoRow label="Ngôn ngữ" value={movie.language} />
        <InfoRow label="Năm" value={movie.year} />
        {movie.director && <InfoRow label="Đạo diễn" value={movie.director} />}
        {movie.casts && <InfoRow label="Diễn viên" value={movie.casts} />}
      </div>
      </div>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex">
      <span className="text-netflix-text-muted w-24 text-sm">{label}:</span>
      <span className="text-white text-sm">{value}</span>
    </div>
  );
}
