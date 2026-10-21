'use client';

import { Suspense, useState, useEffect } from 'react';
import { useMovies } from '@/hooks/useMovies';
import MovieGrid from '@/components/movie/MovieGrid';
import { Button } from '@/components/ui/button';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';

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

  const search = searchParams.get('search') || '';
  const type = searchParams.get('type') || '';
  const page = Number(searchParams.get('page')) || 1;

  const [inputVal, setInputVal] = useState(search);

  useEffect(() => {
    setInputVal(search);
  }, [search]);

  const { data, isLoading } = useMovies({
    page,
    limit: 24,
    type: type || undefined,
    search: search || undefined,
  });

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.push(`/movies?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/movies?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange('search', inputVal.trim());
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 md:px-12">
      {/* Title & Search bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {search ? `Kết quả tìm kiếm cho: "${search}"` : 'Danh sách phim'}
          </h1>
          {search && (
            <p className="text-netflix-text-secondary text-sm mt-1">
              Tìm thấy {data?.total ?? 0} phim phù hợp
            </p>
          )}
        </div>

        {/* Search input on page */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-netflix-text-secondary pointer-events-none" />
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Tìm kiếm phim..."
              className="w-full bg-netflix-card border border-netflix-hover rounded pl-9 pr-3 py-1.5 text-sm text-white placeholder:text-netflix-text-secondary focus:outline-none focus:border-white transition-colors"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            className="bg-netflix-red hover:bg-netflix-red-hover text-white shrink-0"
          >
            Tìm
          </Button>
          {search && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setInputVal('');
                handleFilterChange('search', '');
              }}
              className="border-netflix-hover text-netflix-text-secondary hover:text-white shrink-0"
              title="Xóa tìm kiếm"
            >
              <X size={16} className="mr-1" />
              Xóa
            </Button>
          )}
        </form>
      </div>

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
