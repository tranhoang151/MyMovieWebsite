import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Watchlist } from '@/types';
import { API_ENDPOINTS, QUERY_KEYS } from '@/lib/constants';
import { useAuthStore } from '@/store/authStore';

export function useWatchlist() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const isAuth = typeof window !== 'undefined' && (isAuthenticated || !!localStorage.getItem('accessToken'));

  const { data: watchlist, isLoading } = useQuery<Watchlist[]>({
    queryKey: [QUERY_KEYS.WATCHLIST],
    queryFn: async () => {
      const res = await api.get(`${API_ENDPOINTS.WATCHLIST}`);
      const list = res.data?.data ?? res.data;
      return Array.isArray(list) ? list : [];
    },
    enabled: isAuth,
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
    isMutating: addToWatchlist.isPending || removeFromWatchlist.isPending,
  };
}
