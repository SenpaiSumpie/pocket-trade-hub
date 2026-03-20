'use client';

import { useEffect } from 'react';
import { useCardStore } from '@/stores/cards';
import { CardFilters } from '@/components/cards/CardFilters';
import { CardGrid } from '@/components/cards/CardGrid';
import { CardDetailModal } from '@/components/cards/CardDetailModal';

export default function CardsPage() {
  const { fetchCards, fetchSets } = useCardStore();

  useEffect(() => {
    fetchSets();
    fetchCards();
  }, [fetchSets, fetchCards]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-text">Cards</h1>
      <CardFilters />
      <CardGrid />
      <CardDetailModal mode="browse" />
    </div>
  );
}
