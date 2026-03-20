'use client';

import { useEffect } from 'react';
import { useCollectionStore } from '@/stores/collection';
import { CollectionFilters } from '@/components/collection/CollectionFilters';
import { CollectionGrid } from '@/components/collection/CollectionGrid';

export default function CollectionPage() {
  const { fetchCollection, fetchProgress, progress } = useCollectionStore();

  useEffect(() => {
    fetchCollection();
    fetchProgress();
  }, [fetchCollection, fetchProgress]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-text">My Collection</h1>

      {/* Set progress */}
      {progress.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-text-muted">
            Set Progress
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {progress.map((p) => {
              const pct = p.total > 0 ? Math.round((p.owned / p.total) * 100) : 0;
              return (
                <div
                  key={p.setId}
                  className="flex min-w-[160px] flex-shrink-0 flex-col gap-1.5 rounded-lg border border-border bg-surface p-3"
                >
                  <span className="truncate text-sm font-medium text-text">
                    {p.setName}
                  </span>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-bg">
                    <div
                      className="h-full rounded-full bg-gold transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-text-muted">
                    {p.owned}/{p.total} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <CollectionFilters />
      <CollectionGrid />
    </div>
  );
}
