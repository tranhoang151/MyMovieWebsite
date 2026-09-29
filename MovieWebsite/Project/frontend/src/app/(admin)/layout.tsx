import AdminSidebar from '@/components/layout/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-netflix-dark text-white flex">
      <AdminSidebar />
      <main className="flex-grow p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}