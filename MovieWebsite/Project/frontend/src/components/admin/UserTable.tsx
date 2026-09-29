'use client';

import { User } from '@/types';
import { Trash2, UserX, UserCheck } from 'lucide-react';
import DataTable from './DataTable';

interface UserTableProps {
  users: User[];
  isLoading?: boolean;
  onBlock: (userId: string) => void;
  onDelete: (userId: string) => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export default function UserTable({ users, isLoading, onBlock, onDelete, page, totalPages, onPageChange }: UserTableProps) {
  const columns = [
    {
      header: 'ID',
      accessor: 'id' as keyof User,
      className: 'text-netflix-text-secondary font-mono text-xs',
      headerClassName: 'text-netflix-text-secondary',
    },
    {
      header: 'Email',
      accessor: 'email' as keyof User,
    },
    {
      header: 'Tên',
      accessor: 'name' as keyof User,
    },
    {
      header: 'Vai trò',
      accessor: (row: User) => (
        <span className={`px-2 py-1 rounded text-xs ${row.role === 'ADMIN' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
          {row.role}
        </span>
      ),
    },
    {
      header: 'Trạng thái',
      accessor: (row: User) => (
        <span className={`px-2 py-1 rounded text-xs ${row.isActive ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
          {row.isActive ? 'Hoạt động' : 'Đã khóa'}
        </span>
      ),
    },
    {
      header: 'Hành động',
      accessor: (row: User) => (
        <div className="flex gap-2">
          <button
            onClick={() => onBlock(row.id)}
            className="text-yellow-500 hover:text-yellow-400"
            title={row.isActive ? 'Khóa' : 'Mở khóa'}
          >
            {row.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
          </button>
          <button
            onClick={() => confirm(`Xóa user "${row.name}"?`) && onDelete(row.id)}
            className="text-red-500 hover:text-red-400"
            title="Xóa"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      data={users}
      columns={columns}
      isLoading={isLoading}
      pagination={
        page && totalPages && onPageChange
          ? { page, totalPages, onChange: onPageChange }
          : undefined
      }
    />
  );
}
