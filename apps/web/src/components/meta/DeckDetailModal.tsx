'use client';

import { useMetaStore } from '@/stores/meta';
import { Modal } from '@/components/ui/Modal';

function RateBar({ label, value }: { label: string; value: number | null }) {
  const pct = value != null ? value / 100 : 0;
  const displayPct = Math.min(pct, 100);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-text-muted">{label}</span>
        <span className="font-medium text-text">
          {value != null ? `${(value / 100).toFixed(1)}%` : '--'}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-bg">
        <div
          className="h-full rounded-full bg-gold transition-all"
          style={{ width: `${displayPct}%` }}
        />
      </div>
    </div>
  );
}

export function DeckDetailModal() {
  const { selectedDeck, clearSelection } = useMetaStore();

  if (!selectedDeck) return null;

  const cards = Array.isArray(selectedDeck.cards) ? selectedDeck.cards : [];
  const tournamentResults = Array.isArray(selectedDeck.tournamentResults)
    ? selectedDeck.tournamentResults
    : [];

  return (
    <Modal open={!!selectedDeck} onClose={clearSelection}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-text">{selectedDeck.name}</h2>
          {selectedDeck.matchRecord && (
            <p className="mt-1 text-sm text-text-muted">
              Record: {selectedDeck.matchRecord}
            </p>
          )}
        </div>

        {/* Rate bars */}
        <div className="space-y-3">
          <RateBar label="Win Rate" value={selectedDeck.winRate} />
          <RateBar label="Usage Rate" value={selectedDeck.usageRate} />
        </div>

        {/* Play count */}
        {selectedDeck.playCount != null && (
          <p className="text-sm text-text-muted">
            Total plays: <span className="text-text">{selectedDeck.playCount.toLocaleString()}</span>
          </p>
        )}

        {/* Cards */}
        {cards.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold uppercase text-text-muted">Cards</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {cards.map((card: { name?: string; id?: string }, i: number) => (
                <div
                  key={card.id ?? i}
                  className="rounded-lg bg-bg px-3 py-2 text-sm text-text"
                >
                  {card.name ?? `Card ${i + 1}`}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tournament results */}
        {tournamentResults.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold uppercase text-text-muted">
              Tournament Results
            </h3>
            <ul className="space-y-2">
              {tournamentResults.map(
                (result: { name?: string; placement?: number; date?: string }, i: number) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-bg px-3 py-2 text-sm"
                  >
                    <span className="text-text">{result.name ?? `Tournament ${i + 1}`}</span>
                    <span className="text-text-muted">
                      {result.placement != null ? `#${result.placement}` : ''}
                      {result.date ? ` - ${result.date}` : ''}
                    </span>
                  </li>
                ),
              )}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}
