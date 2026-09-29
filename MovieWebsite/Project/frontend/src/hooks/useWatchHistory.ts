import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { WatchHistory } from '@/types';
import { API_ENDPOINTS, QUERY_KEYS } from '@/lib/constants';

interface SaveProgressDto {
  movieId: string;
  episodeSlug: string;
  serverName: string;
  progressSec: number;
}

export function useWatchHistory() {
  const queryClient = useQueryClient();

  const { data: history, isLoading } = useQuery<WatchHistory[]>({
    queryKey: [QUERY_KEYS.HISTORY],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.HISTORY);
      return res.data.data;
    },
  });

  const saveProgress = useMutation({
    mutationFn: (dto: SaveProgressDto) => api.post(API_ENDPOINTS.HISTORY, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.HISTORY] }),
  });

  return {
    history,
    isLoading,
    saveProgress: saveProgress.mutateAsync,
  };
}
