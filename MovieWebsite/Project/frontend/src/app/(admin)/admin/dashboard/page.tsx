'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import StatsCard from '@/components/admin/StatsCard';
import { Film, Users, TrendingUp, BarChart3 } from 'lucide-react';
import { API_ENDPOINTS, QUERY_KEYS } from '@/lib/constants';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.ADMIN_STATS],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.ADMIN.STATS);
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-netflix-card rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Tổng phim" value={stats?.totalMovies || 0} icon={Film} color="text-blue-500" />
        <StatsCard label="Tổng user" value={stats?.totalUsers || 0} icon={Users} color="text-green-500" />
        <StatsCard label="User mới (7 ngày)" value={stats?.newUsersLast7Days || 0} icon={TrendingUp} color="text-yellow-500" />
        <StatsCard label="Phim mới (7 ngày)" value={stats?.newMoviesLast7Days || 0} icon={BarChart3} color="text-purple-500" />
      </div>
    </div>
  );
}
