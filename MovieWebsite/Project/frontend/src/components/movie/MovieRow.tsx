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
        <h2 className="text-white text-lg sm:text-xl font-bold">{title}</h2>
        {viewAllHref && (
          <Link href={viewAllHref} className="text-netflix-green text-xs sm:text-sm hover:underline">
            Xem tất cả &gt;
          </Link>
        )}
      </div>

      <Swiper
        modules={[Navigation]}
        spaceBetween={12}
        slidesPerView={2.2}
        navigation
        className="!px-0 overflow-visible"
        breakpoints={{
          480: {
            slidesPerView: 2.5,
            spaceBetween: 12,
          },
          640: {
            slidesPerView: 3.2,
            spaceBetween: 14,
          },
          768: {
            slidesPerView: 4,
            spaceBetween: 16,
          },
          1024: {
            slidesPerView: 5,
            spaceBetween: 16,
          },
          1280: {
            slidesPerView: 6,
            spaceBetween: 16,
          },
        }}
      >
        {movies.map((movie) => (
          <SwiperSlide key={movie.id}>
            <MovieCard movie={movie} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
