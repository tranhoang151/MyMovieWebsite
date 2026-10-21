'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Trash2, RefreshCw } from 'lucide-react';
import { Movie } from '@/types';
import { API_ENDPOINTS, QUERY_KEYS } from '@/lib/constants';

export default function AdminMoviesPage() {
  const queryClient = useQueryClient();
  const [searchSlug, setSearchSlug] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.ADMIN_MOVIES, page],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.MOVIES.LIST, { params: { page, limit: 20 } });
      const raw = res.data?.data;
      if (Array.isArray(raw)) {
        return { items: raw, total: raw.length, page: 1, limit: 20, totalPages: 1 };
      }
      return raw;
    },
  });

  const syncMutation = useMutation({
    mutationFn: (slug: string) => api.post('/admin/movies/import', { slug }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_MOVIES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MOVIES] });
      alert('Đồng bộ phim thành công!');
      setSearchSlug('');
    },
    onError: (error: unknown) => {
      console.error('Sync failed:', error);
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      alert(`Sync failed: ${err?.response?.data?.message ?? err?.message ?? 'Đồng bộ thất bại'}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (identifier: string) => api.delete(`${API_ENDPOINTS.MOVIES.DELETE}/${identifier}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_MOVIES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MOVIES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_STATS] });
      alert('Xóa phim thành công!');
    },
    onError: (error: unknown) => {
      console.error('Delete failed:', error);
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      alert(`Xóa phim thất bại: ${err?.response?.data?.message ?? err?.message ?? 'Lỗi không xác định'}`);
    },
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Quản lý phim</h1>

      <div className="flex gap-2 mb-6">
        <Input
          placeholder="Nhập slug phim để sync..."
          value={searchSlug}
          onChange={(e) => setSearchSlug(e.target.value)}
          className="bg-netflix-dark border-netflix-hover text-white max-w-md"
        />
        <Button onClick={() => { if (searchSlug) syncMutation.mutate(searchSlug); }}
          disabled={syncMutation.isPending}
          className="bg-netflix-red hover:bg-netflix-red-hover text-white">
          <RefreshCw size={16} className={`mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} /> Sync
        </Button>
      </div>

      <div className="bg-netflix-card rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-netflix-hover text-netflix-text-secondary">
            <tr>
              <th className="px-4 py-3">Tên phim</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Tập</th>
              <th className="px-4 py-3">Chất lượng</th>
              <th className="px-4 py-3">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-netflix-hover">
            {isLoading ? Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="px-4 py-3"><div className="h-4 bg-netflix-hover rounded w-3/4" /></td>
                <td className="px-4 py-3"><div className="h-4 bg-netflix-hover rounded w-1/2" /></td>
                <td className="px-4 py-3"><div className="h-4 bg-netflix-hover rounded w-8" /></td>
                <td className="px-4 py-3"><div className="h-4 bg-netflix-hover rounded w-8" /></td>
                <td className="px-4 py-3"><div className="h-4 bg-netflix-hover rounded w-16" /></td>
              </tr>
            )) : data?.items?.map((movie: Movie) => (
              <tr key={movie.id} className="hover:bg-netflix-hover">
                <td className="px-4 py-3 text-white">{movie.name}</td>
                <td className="px-4 py-3 text-netflix-text-secondary">{movie.slug}</td>
                <td className="px-4 py-3 text-netflix-text-secondary">{movie.totalEpisodes}</td>
                <td className="px-4 py-3 text-netflix-text-secondary">{movie.quality}</td>
                <td className="px-4 py-3">
                  <button onClick={() => { if (confirm(`Xóa phim "${movie.name}"?`)) deleteMutation.mutate(movie.slug || movie.id); }}
                    className="text-red-500 hover:text-red-400" title="Xóa phim"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-4 mt-6">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="border-netflix-hover text-white">Trước</Button>
          <span className="text-netflix-text-secondary text-sm flex items-center">Trang {page} / {data.totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === data.totalPages}
            className="border-netflix-hover text-white">Sau</Button>
        </div>
      )}
    </div>
  );
}