'use client';

import { useMetaStore } from '@/stores/meta';
import { Skeleton } from '@/components/ui/Skeleton';
import type { DeckMeta } from '@pocket-trade-hub/shared/src/schemas/meta';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

function formatRate(basisPoints: number | null): string {
  if (basisPoints == null) return '--';
  return `${(basisPoints / 100).toFixed(1)}%`;
}

function TrendIcon({ winRate }: { winRate: number | null }) {
  if (winRate == null) return <Minus size={16} className="text-text-muted" />;
  if (winRate > 5000) return <TrendingUp size={16} className="text-[var(--color-success)]" />;
  if (winRate < 5000) return <TrendingDown size={16} className="text-[var(--color-error)]" />;
  return <Minus size={16} className="text-text-muted" />;
}

function RateCell({ value, positiveThreshold }: { value: number | null; positiveThreshold?: number }) {
  if (value == null) return <span className="text-text-muted">--</span>;
  const threshold = positiveThreshold ?? 5000;
  const color = value > threshold ? 'text-[var(--color-success)]' : value < threshold ? 'text-[var(--color-error)]' : 'text-text';
  return <span className={color}>{formatRate(value)}</span>;
}

function DeckRow({ deck, rank, onClick }: { deck: DeckMeta; rank: number; onClick: () => void }) {
  return (
    <tr
      onClick={onClick}
      className={`cursor-pointer transition-colors hover:bg-surface-hover ${
        rank % 2 === 0 ? 'bg-surface' : 'bg-bg'
      }`}
    >
      <td className="px-4 py-3 text-sm font-medium text-text-muted">{rank}</td>
      <td className="px-4 py-3 text-sm font-medium text-text">{deck.name}</td>
      <td className="px-4 py-3 text-sm">
        <RateCell value={deck.winRate} />
      </td>
      <td className="px-4 py-3 text-sm">
        <RateCell value={deck.usageRate} positiveThreshold={0} />
      </td>
      <td className="px-4 py-3 text-sm">
        <TrendIcon winRate={deck.winRate} />
      </td>
    </tr>
  );
}

function DeckCard({ deck, rank, onClick }: { deck: DeckMeta; rank: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-lg bg-surface p-4 text-left transition-colors hover:bg-surface-hover"
    >
      <span className="text-lg font-bold text-gold">#{rank}</span>
      <div className="flex-1">
        <p className="font-medium text-text">{deck.name}</p>
        <div className="mt-1 flex gap-4 text-xs">
          <span>
            WR: <RateCell value={deck.winRate} />
          </span>
          <span>
            UR: <RateCell value={deck.usageRate} positiveThreshold={0} />
          </span>
        </div>
      </div>
      <TrendIcon winRate={deck.winRate} />
    </button>
  );
}

export function DeckRankings() {
  const { decks, loading, total, page, limit, selectDeck, setPage } = useMetaStore();
  const totalPages = Math.ceil(total / limit);

  if (loading && decks.length === 0) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (decks.length === 0) {
    return (
      <p className="py-12 text-center text-text-muted">No deck meta data available yet.</p>
    );
  }

  return (
    <div>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-lg border border-border md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">
                Deck Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">
                Win Rate
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">
                Usage Rate
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">
                Trend
              </th>
            </tr>
          </thead>
          <tbody>
            {decks.map((deck, i) => (
              <DeckRow
                key={deck.id}
                deck={deck}
                rank={(page - 1) * limit + i + 1}
                onClick={() => selectDeck(deck)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile/tablet cards */}
      <div className="space-y-2 md:hidden">
        {decks.map((deck, i) => (
          <DeckCard
            key={deck.id}
            deck={deck}
            rank={(page - 1) * limit + i + 1}
            onClick={() => selectDeck(deck)}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-text transition-colors hover:bg-surface-hover disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-text-muted">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-text transition-colors hover:bg-surface-hover disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
