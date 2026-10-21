'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Film, Users, LogOut } from 'lucide-react';

interface AdminSidebarProps {
  onNavigate?: () => void;
}

export default function AdminSidebar({ onNavigate }: AdminSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/admin/movies', label: 'Quản lý phim', icon: Film },
    { href: '/admin/users', label: 'Quản lý user', icon: Users },
  ];

  return (
    <aside className="w-64 bg-netflix-card h-full min-h-screen p-4 border-r border-netflix-hover flex flex-col justify-between shadow-lg">
      <div>
        <div className="mb-8 px-2 pt-2">
          <Link
            href="/admin"
            onClick={onNavigate}
            className="text-netflix-red text-2xl font-bold tracking-wider"
          >
            ADMIN
          </Link>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href || pathname === '/admin/dashboard'
              : pathname?.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`flex items-center space-x-3 px-4 py-3 rounded transition-colors ${
                  isActive
                    ? 'bg-netflix-red text-white font-medium shadow-md'
                    : 'text-netflix-text-secondary hover:bg-netflix-hover hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-netflix-hover">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center space-x-3 px-4 py-3 rounded text-netflix-text-secondary hover:bg-netflix-hover hover:text-white transition-colors"
        >
          <LogOut size={20} />
          <span>Quay lại trang chủ</span>
        </Link>
      </div>
    </aside>
  );
}
