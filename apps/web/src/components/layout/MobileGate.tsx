'use client';

export function MobileGate({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="hidden md:contents">{children}</div>
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 md:hidden">
        <h1 className="text-2xl font-bold text-gold">Pocket Trade Hub</h1>
        <p className="text-center text-text-muted px-6">
          For the best experience, download the Pocket Trade Hub app on your mobile device.
        </p>
      </div>
    </>
  );
}
