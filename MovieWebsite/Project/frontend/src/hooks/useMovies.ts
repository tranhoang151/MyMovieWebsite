import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Movie, PaginatedResponse } from '@/types';

export function useMovies(params?: { page?: number; limit?: number; type?: string }) {
  return useQuery({
    queryKey: ['movies', params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Movie>>('/movies', { params });
      return response.data.data;
    },
  });
}

export function useMovie(slug: string) {
  return useQuery({
    queryKey: ['movie', slug],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: Movie }>(`/movies/${slug}`);
      return response.data.data;
    },
    enabled: !!slug,
  });
}