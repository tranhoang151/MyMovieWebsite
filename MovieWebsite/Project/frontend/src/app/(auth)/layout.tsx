export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center"
      style={{
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(\'/login-bg.jpg\')',
      }}>
      <div className="w-full max-w-md mx-4">
        {children}
      </div>
    </div>
  );
}
