import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Watchlist } from '@/types';
import { API_ENDPOINTS, QUERY_KEYS } from '@/lib/constants';

export function useWatchlist() {
  const queryClient = useQueryClient();

  const { data: watchlist, isLoading } = useQuery<Watchlist[]>({
    queryKey: [QUERY_KEYS.WATCHLIST],
    queryFn: async () => {
      const res = await api.get(`${API_ENDPOINTS.WATCHLIST}`);
      return res.data.data;
    },
  });

  const addToWatchlist = useMutation({
    mutationFn: (movieId: string) => api.post(`${API_ENDPOINTS.WATCHLIST}/${movieId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.WATCHLIST] }),
  });

  const removeFromWatchlist = useMutation({
    mutationFn: (movieId: string) => api.delete(`${API_ENDPOINTS.WATCHLIST}/${movieId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.WATCHLIST] }),
  });

  return {
    watchlist,
    isLoading,
    addToWatchlist: addToWatchlist.mutateAsync,
    removeFromWatchlist: removeFromWatchlist.mutateAsync,
  };
}
