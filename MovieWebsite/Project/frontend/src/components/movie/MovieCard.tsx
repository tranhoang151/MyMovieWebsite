'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Movie } from '@/types';
import { Play, Plus } from 'lucide-react';

interface MovieCardProps {
  movie: Movie;
}

export default function MovieCard({ movie }: MovieCardProps) {
  return (
    <motion.div
      className="relative w-[200px] aspect-[2/3] rounded overflow-hidden cursor-pointer group"
      whileHover={{ scale: 1.08, zIndex: 10 }}
      transition={{ duration: 0.3 }}
    >
      <Link href={`/movies/${movie.slug}`}>
        <Image
          src={movie.thumbUrl || movie.posterUrl || '/placeholder-movie.jpg'}
          alt={movie.name}
          fill
          className="object-cover"
        />
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
          <h3 className="text-white text-sm font-semibold line-clamp-2 mb-1">
            {movie.name}
          </h3>
          <div className="flex items-center space-x-2 text-xs text-netflix-text-secondary mb-2">
            {movie.year && <span>{movie.year}</span>}
            {movie.quality && <span className="bg-netflix-red px-1 rounded text-white">{movie.quality}</span>}
            {movie.language && <span>{movie.language}</span>}
          </div>
          <div className="flex items-center space-x-2">
            <button className="bg-white text-black rounded-full p-1.5 hover:bg-netflix-text-secondary transition-colors">
              <Play size={14} fill="black" />
            </button>
            <button className="border border-netflix-text-secondary text-white rounded-full p-1.5 hover:border-white transition-colors">
              <Plus size={14} />
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}