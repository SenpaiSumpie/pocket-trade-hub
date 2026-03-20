'use client';

import { useEffect } from 'react';
import { useMetaStore } from '@/stores/meta';
import { MetaFilters } from '@/components/meta/MetaFilters';
import { DeckRankings } from '@/components/meta/DeckRankings';
import { DeckDetailModal } from '@/components/meta/DeckDetailModal';

export default function MetaPage() {
  const { fetchDecks, fetchSnapshot, snapshot } = useMetaStore();

  useEffect(() => {
    fetchDecks();
    fetchSnapshot();
  }, [fetchDecks, fetchSnapshot]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-text">Deck Meta</h1>

      {/* Snapshot summary */}
      {snapshot && (
        <div className="mb-6 rounded-lg border border-border bg-surface p-4">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <p className="text-xs font-semibold uppercase text-text-muted">Total Decks</p>
              <p className="text-lg font-bold text-text">{snapshot.totalDecks}</p>
            </div>
            {snapshot.topDecks.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase text-text-muted">Top Decks</p>
                <p className="text-sm text-gold">{snapshot.topDecks.slice(0, 3).join(', ')}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold uppercase text-text-muted">Last Updated</p>
              <p className="text-sm text-text-muted">
                {new Date(snapshot.lastUpdated).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      <MetaFilters />
      <DeckRankings />
      <DeckDetailModal />
    </div>
  );
}
