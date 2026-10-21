import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Movie, PaginatedResponse } from '@/types';

export function useMovies(params?: { page?: number; limit?: number; type?: string; search?: string }) {
  return useQuery({
    queryKey: ['movies', params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Movie>>('/movies', { params });
      const raw = response.data?.data as unknown;
      if (Array.isArray(raw)) {
        const limit = params?.limit || 20;
        return {
          items: raw as Movie[],
          total: raw.length,
          page: params?.page || 1,
          limit,
          totalPages: Math.ceil(raw.length / limit) || 1,
        };
      }
      return raw as PaginatedResponse<Movie>['data'];
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