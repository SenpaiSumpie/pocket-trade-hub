'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCollectionStore } from '@/stores/collection';
import { CollectionFilters } from '@/components/collection/CollectionFilters';
import { CollectionGrid } from '@/components/collection/CollectionGrid';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card } from '@/components/ui/Card';
import { Library } from 'lucide-react';

export default function CollectionPage() {
  const router = useRouter();
  const { items, loading, fetchCollection, fetchProgress, progress } =
    useCollectionStore();

  useEffect(() => {
    fetchCollection();
    fetchProgress();
  }, [fetchCollection, fetchProgress]);

  return (
    <div>
      <h1 className="mb-6 text-[var(--font-size-heading)] font-bold text-[var(--color-on-surface)]">
        My Collection
      </h1>

      {/* Set progress */}
      {progress.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-[var(--font-size-label)] font-semibold text-[var(--color-on-surface-muted)]">
            Set Progress
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {progress.map((p) => {
              const pct = p.total > 0 ? Math.round((p.owned / p.total) * 100) : 0;
              return (
                <Card key={p.setId} padding="sm" className="min-w-[160px] flex-shrink-0">
                  <div className="flex flex-col gap-1.5">
                    <span className="truncate text-sm font-medium text-[var(--color-on-surface)]">
                      {p.setName}
                    </span>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-background)]">
                      <div
                        className="h-full rounded-full bg-[var(--color-accent)] transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-[var(--color-on-surface-muted)]">
                      {p.owned}/{p.total} ({pct}%)
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <CollectionFilters />

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-64" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Library}
          title="Your collection is empty"
          subtitle="Browse the card database to start building your collection."
          ctaLabel="Browse Cards"
          onCta={() => router.push('/cards')}
        />
      ) : (
        <CollectionGrid />
      )}
    </div>
  );
}
