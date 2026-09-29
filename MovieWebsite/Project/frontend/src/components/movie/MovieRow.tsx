'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { Movie } from '@/types';
import MovieCard from './MovieCard';
import Link from 'next/link';

interface MovieRowProps {
  title: string;
  movies: Movie[];
  viewAllHref?: string;
}

export default function MovieRow({ title, movies, viewAllHref }: MovieRowProps) {
  if (!movies || movies.length === 0) return null;

  return (
    <div className="mb-8 px-4 md:px-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white text-xl font-bold">{title}</h2>
        {viewAllHref && (
          <Link href={viewAllHref} className="text-netflix-green text-sm hover:underline">
            Xem tất cả {'>'}
          </Link>
        )}
      </div>
      
      <Swiper
        modules={[Navigation]}
        spaceBetween={8}
        slidesPerView="auto"
        navigation
        className="!px-0"
        breakpoints={{
          640: {
            slidesPerView: 3,
          },
          768: {
            slidesPerView: 4,
          },
          1024: {
            slidesPerView: 5,
          },
          1280: {
            slidesPerView: 6,
          },
        }}
      >
        {movies.map((movie) => (
          <SwiperSlide key={movie.id} className="!w-auto">
            <MovieCard movie={movie} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}