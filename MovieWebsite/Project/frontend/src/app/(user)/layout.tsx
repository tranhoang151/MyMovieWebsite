import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-netflix-dark text-white flex flex-col">
      <Navbar />
      <main className="flex-grow pt-[68px]">
        {children}
      </main>
      <Footer />
    </div>
  );
}