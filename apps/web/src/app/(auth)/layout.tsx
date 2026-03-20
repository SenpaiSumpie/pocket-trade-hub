export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="w-full max-w-md px-4">
        <h1 className="mb-8 text-center text-3xl font-bold text-gold">
          Pocket Trade Hub
        </h1>
        {children}
      </div>
    </div>
  );
}
