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
    <div className="relative w-full h-[65vw] min-h-[380px] max-h-[700px] mb-8">
      <Image
        src={movie.posterUrl || movie.thumbUrl || '/placeholder-banner.jpg'}
        alt={movie.name}
        fill
        className="object-cover"
        priority
      />

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-netflix-dark via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 p-4 md:p-12 max-w-2xl">
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-2 sm:mb-4 line-clamp-2">
          {movie.name}
        </h1>

        <p className="text-netflix-text-secondary text-xs sm:text-sm md:text-base mb-4 sm:mb-6 line-clamp-2 sm:line-clamp-3">
          {movie.description}
        </p>

        <div className="flex items-center space-x-3 sm:space-x-4">
          <Link href={watchLink}>
            <Button className="bg-white text-black hover:bg-neutral-200 px-4 sm:px-6 py-1.5 sm:py-2 text-sm sm:text-base font-semibold">
              <Play size={18} className="mr-1.5 sm:mr-2" fill="black" />
              Xem ngay
            </Button>
          </Link>
          <Link href={`/movies/${movie.slug}`}>
            <Button
              variant="secondary"
              className="bg-netflix-card/80 text-white hover:bg-netflix-hover px-4 sm:px-6 py-1.5 sm:py-2 text-sm sm:text-base font-semibold"
            >
              <Info size={18} className="mr-1.5 sm:mr-2" />
              Chi tiết
            </Button>
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-4 text-xs sm:text-sm text-netflix-text-secondary">
          {movie.quality && (
            <span className="bg-netflix-red px-2 py-0.5 rounded text-white text-xs font-semibold">
              {movie.quality}
            </span>
          )}
          {movie.language && <span>{movie.language}</span>}
          {movie.year && <span>• {movie.year}</span>}
        </div>
      </div>
    </div>
  );
}
