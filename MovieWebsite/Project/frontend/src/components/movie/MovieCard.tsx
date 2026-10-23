'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Movie } from '@/types';
import { Eye, Play, Plus } from 'lucide-react';
import { formatViews } from '@/lib/utils';

interface MovieCardProps {
  movie: Movie;
}

export default function MovieCard({ movie }: MovieCardProps) {
  return (
    <motion.div
      className="relative w-full aspect-[2/3] rounded-md overflow-hidden cursor-pointer group shadow-md bg-netflix-card"
      whileHover={{ scale: 1.05, zIndex: 10 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <Link href={`/movies/${movie.slug}`} className="block w-full h-full relative">
        <Image
          src={movie.thumbUrl || movie.posterUrl || '/placeholder-movie.jpg'}
          alt={movie.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* View Count Top-Right Badge */}
        {typeof movie.views === 'number' && (
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] text-white/90 font-medium flex items-center gap-1 z-10 border border-white/10 shadow">
            <Eye size={10} className="text-netflix-red" />
            <span>{formatViews(movie.views)}</span>
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
          <h3 className="text-white text-xs sm:text-sm font-semibold line-clamp-2 mb-1">
            {movie.name}
          </h3>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-netflix-text-secondary mb-2.5">
            {movie.year && <span>{movie.year}</span>}
            {movie.quality && (
              <span className="bg-netflix-red px-1 rounded text-white text-[10px] font-medium">
                {movie.quality}
              </span>
            )}
            {movie.language && (
              <span className="truncate max-w-[80px]">{movie.language}</span>
            )}
            {typeof movie.views === 'number' && (
              <span className="flex items-center gap-0.5 text-zinc-300 ml-auto">
                <Eye size={10} />
                {formatViews(movie.views)}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className="bg-white text-black rounded-full p-1.5 flex items-center justify-center transition-transform group-hover:scale-110">
              <Play size={12} fill="black" />
            </span>
            <span className="border border-netflix-text-secondary text-white rounded-full p-1.5 flex items-center justify-center transition-colors hover:border-white">
              <Plus size={12} />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
