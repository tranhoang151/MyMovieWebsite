'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/store/authStore';
import { Search, User, LogOut, ListVideo, LayoutDashboard, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        if (!searchQuery.trim()) {
          setIsSearchOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      router.push(`/movies?search=${encodeURIComponent(query)}`);
    }
  };

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
        <div className="flex items-center space-x-3 md:space-x-4">
          <div ref={searchContainerRef} className="relative flex items-center">
            {isSearchOpen ? (
              <form
                onSubmit={handleSearchSubmit}
                className="flex items-center bg-black/80 border border-netflix-hover rounded-full px-2.5 sm:px-3 py-1 transition-all w-36 xs:w-48 sm:w-60 md:w-64 shadow-md"
              >
                <button
                  type="submit"
                  className="text-netflix-text-secondary hover:text-white mr-1.5 flex-shrink-0"
                  title="Tìm kiếm"
                >
                  <Search size={16} />
                </button>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setIsSearchOpen(false);
                    }
                  }}
                  placeholder="Tìm kiếm phim..."
                  className="bg-transparent text-white text-xs sm:text-sm focus:outline-none w-full placeholder:text-netflix-text-secondary"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (searchQuery) {
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    } else {
                      setIsSearchOpen(false);
                    }
                  }}
                  className="text-netflix-text-secondary hover:text-white ml-1 flex-shrink-0"
                  title={searchQuery ? 'Xóa nội dung' : 'Đóng tìm kiếm'}
                >
                  <X size={15} />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="text-white hover:text-netflix-text-secondary transition-colors p-1"
                title="Tìm kiếm phim"
              >
                <Search size={20} />
              </button>
            )}
          </div>
          
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
