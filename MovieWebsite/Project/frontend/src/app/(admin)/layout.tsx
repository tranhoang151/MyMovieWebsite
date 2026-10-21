'use client';

import { useState } from 'react';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-netflix-dark text-white flex flex-col md:flex-row">
      {/* Mobile Admin Top Bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-netflix-card border-b border-netflix-hover sticky top-0 z-40">
        <Link href="/admin" className="text-netflix-red text-xl font-bold tracking-wider">
          ADMIN
        </Link>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-white hover:text-netflix-text-secondary p-1 rounded focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar (Desktop sticky & Mobile Drawer) */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform md:relative md:translate-x-0 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:block shrink-0`}
      >
        <AdminSidebar onNavigate={() => setIsSidebarOpen(false)} />
      </div>

      {/* Backdrop overlay for mobile drawer */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-grow p-4 sm:p-6 md:p-8 overflow-x-hidden min-w-0">
        {children}
      </main>
    </div>
  );
}
