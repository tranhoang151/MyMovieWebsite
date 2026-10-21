export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center bg-netflix-dark"
      style={{
        backgroundImage: 'radial-gradient(circle at center, rgba(30,30,30,0.8) 0%, rgba(10,10,10,0.95) 100%)',
      }}>
      <div className="w-full max-w-md mx-4">
        {children}
      </div>
    </div>
  );
}
