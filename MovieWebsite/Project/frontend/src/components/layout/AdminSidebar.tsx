import Link from 'next/link';
import { LayoutDashboard, Film, Users, Settings, LogOut } from 'lucide-react';

export default function AdminSidebar() {
  return (
    <aside className="w-64 bg-netflix-card min-h-screen p-4 border-r border-netflix-hover">
      <div className="mb-8">
        <Link href="/admin" className="text-netflix-red text-2xl font-bold">
          ADMIN
        </Link>
      </div>
      <nav className="space-y-2">
        <Link
          href="/admin"
          className="flex items-center space-x-3 px-4 py-3 rounded text-white hover:bg-netflix-hover transition-colors"
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </Link>
        <Link
          href="/admin/movies"
          className="flex items-center space-x-3 px-4 py-3 rounded text-netflix-text-secondary hover:bg-netflix-hover hover:text-white transition-colors"
        >
          <Film size={20} />
          <span>Quản lý phim</span>
        </Link>
        <Link
          href="/admin/users"
          className="flex items-center space-x-3 px-4 py-3 rounded text-netflix-text-secondary hover:bg-netflix-hover hover:text-white transition-colors"
        >
          <Users size={20} />
          <span>Quản lý user</span>
        </Link>
        <Link
          href="/admin/settings"
          className="flex items-center space-x-3 px-4 py-3 rounded text-netflix-text-secondary hover:bg-netflix-hover hover:text-white transition-colors"
        >
          <Settings size={20} />
          <span>Cài đặt</span>
        </Link>
        <Link
          href="/"
          className="flex items-center space-x-3 px-4 py-3 rounded text-netflix-text-secondary hover:bg-netflix-hover hover:text-white transition-colors mt-8"
        >
          <LogOut size={20} />
          <span>Quay lại trang chủ</span>
        </Link>
      </nav>
    </aside>
  );
}