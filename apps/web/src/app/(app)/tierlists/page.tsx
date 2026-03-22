'use client';

import { useEffect } from 'react';
import { useTierListStore } from '@/stores/tierlists';
import { TierListBrowser } from '@/components/meta/TierListBrowser';
import { TierListDetailModal } from '@/components/meta/TierListDetailModal';
import { TierListCreator } from '@/components/meta/TierListCreator';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { List } from 'lucide-react';

export default function TierListsPage() {
  const fetchTierLists = useTierListStore((s) => s.fetchTierLists);
  const loading = useTierListStore((s) => s.loading);
  const tierLists = useTierListStore((s) => s.tierLists);
  const toggleCreator = useTierListStore((s) => s.toggleCreator);

  useEffect(() => {
    fetchTierLists();
  }, [fetchTierLists]);

  return (
    <div>
      <h1 className="mb-6 text-[var(--font-size-heading)] font-bold text-[var(--color-on-surface)]">Tier Lists</h1>

      {/* Skeleton state */}
      {loading && tierLists.length === 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-40 w-full" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && tierLists.length === 0 && (
        <EmptyState
          icon={List}
          title="No tier lists yet"
          subtitle="Create the first tier list for this format."
          ctaLabel="Create Tier List"
          onCta={toggleCreator}
        />
      )}

      {/* Content */}
      {tierLists.length > 0 && <TierListBrowser />}
      <TierListDetailModal />
      <TierListCreator />
    </div>
  );
}
