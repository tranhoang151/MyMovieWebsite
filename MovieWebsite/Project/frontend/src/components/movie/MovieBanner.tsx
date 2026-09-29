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

  return (
    <div className="relative w-full h-[56vw] min-h-[400px] max-h-[700px] mb-8">
      <Image
        src={movie.posterUrl || movie.thumbUrl || '/placeholder-banner.jpg'}
        alt={movie.name}
        fill
        className="object-cover"
        priority
      />
      
      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-netflix-dark via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 p-4 md:p-12 max-w-2xl">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 line-clamp-2">
          {movie.name}
        </h1>
        
        <p className="text-netflix-text-secondary text-sm md:text-base mb-6 line-clamp-3">
          {movie.description}
        </p>

        <div className="flex items-center space-x-4">
          <Link href={`/watch/${movie.slug}/1`}>
            <Button className="bg-white text-black hover:bg-netflix-text-secondary px-6 py-2 text-lg font-semibold">
              <Play size={20} className="mr-2" fill="black" />
              Xem ngay
            </Button>
          </Link>
          <Link href={`/movies/${movie.slug}`}>
            <Button variant="secondary" className="bg-netflix-text-secondary/50 text-white hover:bg-netflix-text-secondary/70 px-6 py-2 text-lg font-semibold">
              <Info size={20} className="mr-2" />
              Thêm thông tin
            </Button>
          </Link>
        </div>

        <div className="flex items-center space-x-2 mt-4 text-sm text-netflix-text-secondary">
          {movie.quality && <span className="bg-netflix-red px-2 py-0.5 rounded text-white text-xs">{movie.quality}</span>}
          {movie.language && <span>{movie.language}</span>}
          {movie.year && <span>{movie.year}</span>}
        </div>
      </div>
    </div>
  );
}