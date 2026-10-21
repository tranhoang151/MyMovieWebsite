'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Movie } from '@/types';
import { Play, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MovieBannerProps {
  movie: Movie;
}

export default function MovieBanner({ movie }: MovieBannerProps) {
  if (!movie) return null;

  const firstEpSlug = movie.episodes?.[0]?.slug;
  const watchLink = firstEpSlug ? `/watch/${movie.slug}/${firstEpSlug}` : `/movies/${movie.slug}`;

  return (
    <div className="relative w-full h-[85vw] min-h-[440px] md:h-[56vw] md:min-h-[500px] max-h-[700px] mb-4 md:mb-8">
      <Image
        src={movie.posterUrl || movie.thumbUrl || '/placeholder-banner.jpg'}
        alt={movie.name}
        fill
        className="object-cover"
        priority
      />

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-netflix-dark via-netflix-dark/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-6 sm:bottom-8 md:bottom-12 left-0 p-4 md:p-12 max-w-2xl">
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-2 sm:mb-3 line-clamp-2">
          {movie.name}
        </h1>

        {/* Metadata Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-3 text-xs sm:text-sm text-netflix-text-secondary">
          {movie.quality && (
            <span className="bg-netflix-red px-1.5 py-0.5 rounded text-white text-[11px] font-semibold">
              {movie.quality}
            </span>
          )}
          {movie.language && <span>{movie.language}</span>}
          {movie.year && <span>• {movie.year}</span>}
        </div>

        <p className="text-netflix-text-secondary text-xs sm:text-sm md:text-base mb-4 sm:mb-6 line-clamp-2 sm:line-clamp-3">
          {movie.description}
        </p>

        <div className="flex items-center space-x-3 sm:space-x-4">
          <Link href={watchLink}>
            <Button className="bg-white text-black hover:bg-neutral-200 px-4 sm:px-6 py-1.5 sm:py-2 text-sm sm:text-base font-semibold shadow-md">
              <Play size={18} className="mr-1.5 sm:mr-2" fill="black" />
              Xem ngay
            </Button>
          </Link>
          <Link href={`/movies/${movie.slug}`}>
            <Button
              variant="secondary"
              className="bg-netflix-card/80 text-white hover:bg-netflix-hover px-4 sm:px-6 py-1.5 sm:py-2 text-sm sm:text-base font-semibold shadow-md"
            >
              <Info size={18} className="mr-1.5 sm:mr-2" />
              Chi tiết
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
