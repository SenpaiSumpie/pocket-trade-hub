'use client';

import { useEffect } from 'react';
import { useCardStore } from '@/stores/cards';
import { CardFilters } from '@/components/cards/CardFilters';
import { CardGrid } from '@/components/cards/CardGrid';
import { CardDetailModal } from '@/components/cards/CardDetailModal';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { LayoutGrid } from 'lucide-react';

export default function CardsPage() {
  const { cards, loading, fetchCards, fetchSets } = useCardStore();

  useEffect(() => {
    fetchSets();
    fetchCards();
  }, [fetchSets, fetchCards]);

  return (
    <div>
      <h1 className="mb-6 text-[var(--font-size-heading)] font-bold text-[var(--color-on-surface)]">
        Cards
      </h1>

      <CardFilters />

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-64" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="No cards found"
          subtitle="Try adjusting your filters or search terms."
        />
      ) : (
        <>
          <CardGrid />
          <CardDetailModal mode="browse" />
        </>
      )}
    </div>
  );
}
