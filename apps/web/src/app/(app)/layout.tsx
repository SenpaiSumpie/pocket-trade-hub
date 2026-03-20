'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileGate } from '@/components/layout/MobileGate';
import { Skeleton } from '@/components/ui/Skeleton';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isHydrated, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-8 w-48 rounded-lg" />
      </div>
    );
  }

  return (
    <MobileGate>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </MobileGate>
  );
}
