import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { WatchHistory } from '@/types';
import { API_ENDPOINTS, QUERY_KEYS } from '@/lib/constants';
import { useAuthStore } from '@/store/authStore';

interface SaveProgressDto {
  movieId: string;
  episodeSlug: string;
  serverName: string;
  progressSec: number;
}

export function useWatchHistory() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const isAuth = typeof window !== 'undefined' && (isAuthenticated || !!localStorage.getItem('accessToken'));

  const { data: history, isLoading } = useQuery<WatchHistory[]>({
    queryKey: [QUERY_KEYS.HISTORY],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.HISTORY);
      const list = res.data?.data ?? res.data;
      return Array.isArray(list) ? list : [];
    },
    enabled: isAuth,
  });

  const saveProgress = useMutation({
    mutationFn: (dto: SaveProgressDto) => {
      if (!isAuth) return Promise.resolve(null);
      return api.post(API_ENDPOINTS.HISTORY, dto);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.HISTORY] }),
  });

  return {
    history,
    isLoading,
    saveProgress: saveProgress.mutateAsync,
  };
}
