'use client';

import { useState, Suspense } from 'react';
import { useMovies } from '@/hooks/useMovies';
import MovieGrid from '@/components/movie/MovieGrid';
import { Button } from '@/components/ui/button';
import { useSearchParams, useRouter } from 'next/navigation';

export default function MoviesPage() {
  return (
    <Suspense>
      <MoviesPageInner />
    </Suspense>
  );
}

function MoviesPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [type, setType] = useState(searchParams.get('type') || '');

  const { data, isLoading } = useMovies({ page, limit: 24, type: type || undefined });

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.push(`/movies?${params.toString()}`);

    if (key === 'type') setType(value);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/movies?${params.toString()}`);
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 md:px-12">
      <h1 className="text-3xl font-bold text-white mb-8">Danh sách phim</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div className="flex items-center space-x-2">
          <span className="text-netflix-text-secondary text-sm">Định dạng:</span>
          <Button
            variant={type === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange('type', '')}
            className={type === '' ? 'bg-netflix-red hover:bg-netflix-red-hover' : 'border-netflix-hover text-netflix-text-secondary hover:text-white'}
          >
            Tất cả
          </Button>
          <Button
            variant={type === 'series' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange('type', 'series')}
            className={type === 'series' ? 'bg-netflix-red hover:bg-netflix-red-hover' : 'border-netflix-hover text-netflix-text-secondary hover:text-white'}
          >
            Phim bộ
          </Button>
          <Button
            variant={type === 'single' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange('type', 'single')}
            className={type === 'single' ? 'bg-netflix-red hover:bg-netflix-red-hover' : 'border-netflix-hover text-netflix-text-secondary hover:text-white'}
          >
            Phim lẻ
          </Button>
        </div>
      </div>

      <MovieGrid movies={data?.items || []} isLoading={isLoading} skeletonCount={24} />

      {data && data.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 mt-12">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => handlePageChange(page - 1)}
            className="border-netflix-hover text-netflix-text-secondary hover:text-white"
          >
            Trước
          </Button>
          <span className="text-netflix-text-secondary text-sm">
            Trang {page} / {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === data.totalPages}
            onClick={() => handlePageChange(page + 1)}
            className="border-netflix-hover text-netflix-text-secondary hover:text-white"
          >
            Sau
          </Button>
        </div>
      )}
    </div>
  );
}
