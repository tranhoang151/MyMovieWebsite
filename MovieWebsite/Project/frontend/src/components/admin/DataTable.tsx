import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  skeletonRows?: number;
  pagination?: {
    page: number;
    totalPages: number;
    onChange: (page: number) => void;
  };
}

export default function DataTable<T extends { id: string | number }>({
  data,
  columns,
  isLoading = false,
  skeletonRows = 5,
  pagination,
}: DataTableProps<T>) {
  const renderCell = (row: T, col: Column<T>, colIndex: number) => {
    const value = typeof col.accessor === 'function'
      ? col.accessor(row)
      : (row[col.accessor] as ReactNode);
    return <td key={colIndex} className={`px-4 py-3 ${col.className || ''}`}>{value}</td>;
  };

  return (
    <div className="bg-netflix-card rounded-lg overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-netflix-hover text-netflix-text-secondary">
          <tr>
            {columns.map((col, i) => (
              <th key={i} className={`px-4 py-3 ${col.headerClassName || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-netflix-hover">
          {isLoading ? (
            Array.from({ length: skeletonRows }).map((_row, skeletonIndex) => (
              <tr key={skeletonIndex} className="animate-pulse">
                {columns.map((_col, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-4 bg-netflix-hover rounded w-3/4" />
                  </td>
                ))}
              </tr>
            ))
          ) : (
            data?.map((row) => (
              <tr key={row.id} className="hover:bg-netflix-hover">
                {columns.map((col, colIndex) => renderCell(row, col, colIndex))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-4 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === 1}
            onClick={() => pagination.onChange(pagination.page - 1)}
            className="border-netflix-hover text-white"
          >
            Trước
          </Button>
          <span className="text-netflix-text-secondary text-sm flex items-center">
            Trang {pagination.page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === pagination.totalPages}
            onClick={() => pagination.onChange(pagination.page + 1)}
            className="border-netflix-hover text-white"
          >
            Sau
          </Button>
        </div>
      )}
    </div>
  );
}
