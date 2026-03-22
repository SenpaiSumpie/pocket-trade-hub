'use client';

import { useEffect } from 'react';
import { useMetaStore } from '@/stores/meta';
import { MetaFilters } from '@/components/meta/MetaFilters';
import { DeckRankings } from '@/components/meta/DeckRankings';
import { DeckDetailModal } from '@/components/meta/DeckDetailModal';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card } from '@/components/ui/Card';
import { BarChart3 } from 'lucide-react';

export default function MetaPage() {
  const { fetchDecks, fetchSnapshot, snapshot, loading, decks } = useMetaStore();

  useEffect(() => {
    fetchDecks();
    fetchSnapshot();
  }, [fetchDecks, fetchSnapshot]);

  return (
    <div>
      <h1 className="mb-6 text-[var(--font-size-heading)] font-bold text-[var(--color-on-surface)]">Deck Meta</h1>

      {/* Skeleton state */}
      {loading && decks.length === 0 && (
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-24 w-full" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && decks.length === 0 && (
        <EmptyState
          icon={BarChart3}
          title="No meta data available"
          subtitle="Check back later as the community builds the meta."
        />
      )}

      {/* Snapshot summary */}
      {snapshot && decks.length > 0 && (
        <Card className="mb-6" elevation="none">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <p className="text-[var(--font-size-label)] font-semibold uppercase text-[var(--color-on-surface-muted)]">Total Decks</p>
              <p className="text-[var(--font-size-subheading)] font-bold text-[var(--color-on-surface)]">{snapshot.totalDecks}</p>
            </div>
            {snapshot.topDecks.length > 0 && (
              <div>
                <p className="text-[var(--font-size-label)] font-semibold uppercase text-[var(--color-on-surface-muted)]">Top Decks</p>
                <p className="text-[var(--font-size-label)] text-[var(--color-accent)]">{snapshot.topDecks.slice(0, 3).join(', ')}</p>
              </div>
            )}
            <div>
              <p className="text-[var(--font-size-label)] font-semibold uppercase text-[var(--color-on-surface-muted)]">Last Updated</p>
              <p className="text-[var(--font-size-label)] text-[var(--color-on-surface-muted)]">
                {new Date(snapshot.lastUpdated).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Card>
      )}

      {decks.length > 0 && (
        <>
          <MetaFilters />
          <DeckRankings />
        </>
      )}
      <DeckDetailModal />
    </div>
  );
}
