'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/store/authStore';
import { Search, User, LogOut, ListVideo, LayoutDashboard } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-500 ${
        scrolled ? 'bg-netflix-dark' : 'bg-transparent'
      }`}
    >
      <div className="flex items-center justify-between px-4 md:px-12 h-[68px]">
        {/* Logo */}
        <Link href="/" className="text-netflix-red text-2xl md:text-3xl font-bold">
          CINESTREAM
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center space-x-6 text-netflix-text-secondary text-sm">
          <Link href="/" className="hover:text-white transition-colors">
            Trang chủ
          </Link>
          <Link href="/movies?type=series" className="hover:text-white transition-colors">
            TV Shows
          </Link>
          <Link href="/movies?type=single" className="hover:text-white transition-colors">
            Phim lẻ
          </Link>
          <Link href="/movies?type=series" className="hover:text-white transition-colors">
            Phim bộ
          </Link>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-4">
          <button className="text-white hover:text-netflix-text-secondary transition-colors">
            <Search size={20} />
          </button>
          
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 text-white hover:text-netflix-text-secondary transition-colors"
              >
                {user?.avatar ? (
                  <Image src={user.avatar} alt={user.name} width={32} height={32} className="w-8 h-8 rounded" />
                ) : (
                  <User size={20} />
                )}
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-netflix-card border border-netflix-hover rounded shadow-lg py-2">
                  <div className="px-4 py-2 text-sm text-netflix-text-secondary border-b border-netflix-hover">
                    {user?.name}
                  </div>
                  <Link
                    href="/profile"
                    className="flex items-center px-4 py-2 text-sm text-white hover:bg-netflix-hover"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User size={16} className="mr-2" />
                    Profile
                  </Link>
                  <Link
                    href="/watchlist"
                    className="flex items-center px-4 py-2 text-sm text-white hover:bg-netflix-hover"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <ListVideo size={16} className="mr-2" />
                    Tủ phim
                  </Link>
                  {user?.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      className="flex items-center px-4 py-2 text-sm text-white hover:bg-netflix-hover"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <LayoutDashboard size={16} className="mr-2" />
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-netflix-hover"
                  >
                    <LogOut size={16} className="mr-2" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-netflix-red text-white px-4 py-1.5 rounded text-sm hover:bg-netflix-red-hover transition-colors"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}