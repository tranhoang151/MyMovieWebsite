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
      return res.data.data;
    },
  });

  const syncMutation = useMutation({
    mutationFn: (slug: string) => api.post(`${API_ENDPOINTS.MOVIES.SYNC}/${slug}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_MOVIES] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`${API_ENDPOINTS.MOVIES.DELETE}/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_MOVIES] }),
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
                  <button onClick={() => { if (confirm(`Xóa phim "${movie.name}"?`)) deleteMutation.mutate(movie.id); }}
                    className="text-red-500 hover:text-red-400"><Trash2 size={16} /></button>
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
