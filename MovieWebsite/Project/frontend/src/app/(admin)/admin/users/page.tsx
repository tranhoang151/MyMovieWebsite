'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import UserTable from '@/components/admin/UserTable';
import { useState } from 'react';
import { API_ENDPOINTS, QUERY_KEYS } from '@/lib/constants';

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.ADMIN_USERS, page],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.USERS.LIST, { params: { page, limit: 20 } });
      return res.data.data;
    },
  });

  const blockMutation = useMutation({
    mutationFn: (userId: string) => api.patch(`${API_ENDPOINTS.USERS.BLOCK}/${userId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_USERS] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => api.delete(`${API_ENDPOINTS.USERS.DELETE}/${userId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_USERS] }),
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Quản lý người dùng</h1>

      <UserTable
        users={data?.items || []}
        isLoading={isLoading}
        onBlock={blockMutation.mutate}
        onDelete={deleteMutation.mutate}
        page={page}
        totalPages={data?.totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
