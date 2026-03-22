'use client';

import { useState, useCallback } from 'react';
import { useTierListStore } from '@/stores/tierlists';
import { useMetaStore } from '@/stores/meta';
import type { TierEntry, Tiers } from '@pocket-trade-hub/shared/src/schemas/tierlist';
import { Modal } from '@/components/ui/Modal';
import { Search, X } from 'lucide-react';

const TIER_NAMES = ['S', 'A', 'B', 'C', 'D'] as const;
type TierName = (typeof TIER_NAMES)[number];

const TIER_STYLES: Record<TierName, string> = {
  S: 'border-[var(--color-tier-s)] bg-[color-mix(in_srgb,var(--color-tier-s)_10%,transparent)]',
  A: 'border-[var(--color-tier-a)] bg-[color-mix(in_srgb,var(--color-tier-a)_10%,transparent)]',
  B: 'border-[var(--color-tier-b)] bg-[color-mix(in_srgb,var(--color-tier-b)_10%,transparent)]',
  C: 'border-[var(--color-tier-c)] bg-[color-mix(in_srgb,var(--color-tier-c)_10%,transparent)]',
  D: 'border-[var(--color-tier-d)] bg-[color-mix(in_srgb,var(--color-tier-d)_10%,transparent)]',
};

const EMPTY_TIERS: Tiers = { S: [], A: [], B: [], C: [], D: [] };

export function TierListCreator() {
  const { showCreator, toggleCreator, createTierList } = useTierListStore();
  const decks = useMetaStore((s) => s.decks);
  const fetchDecks = useMetaStore((s) => s.fetchDecks);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tiers, setTiers] = useState<Tiers>({ ...EMPTY_TIERS, S: [], A: [], B: [], C: [], D: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTier, setActiveTier] = useState<TierName | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch decks on first open if empty
  const handleOpen = useCallback(() => {
    if (decks.length === 0) {
      fetchDecks();
    }
  }, [decks.length, fetchDecks]);

  // All deck IDs currently assigned
  const assignedIds = new Set(
    TIER_NAMES.flatMap((t) => tiers[t].map((e) => e.deckId)),
  );

  const filteredDecks = decks.filter(
    (d) =>
      !assignedIds.has(d.id) &&
      d.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const addDeckToTier = (tier: TierName, deckId: string, deckName: string) => {
    setTiers((prev) => ({
      ...prev,
      [tier]: [...prev[tier], { deckId, deckName }],
    }));
    setActiveTier(null);
    setSearchQuery('');
  };

  const removeDeckFromTier = (tier: TierName, deckId: string) => {
    setTiers((prev) => ({
      ...prev,
      [tier]: prev[tier].filter((e: TierEntry) => e.deckId !== deckId),
    }));
  };

  const moveDeck = (fromTier: TierName, toTier: TierName, entry: TierEntry) => {
    setTiers((prev) => ({
      ...prev,
      [fromTier]: prev[fromTier].filter((e: TierEntry) => e.deckId !== entry.deckId),
      [toTier]: [...prev[toTier], entry],
    }));
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await createTierList({
        title: title.trim(),
        description: description.trim() || undefined,
        tiers,
      });
      setTitle('');
      setDescription('');
      setTiers({ ...EMPTY_TIERS, S: [], A: [], B: [], C: [], D: [] });
    } finally {
      setSubmitting(false);
    }
  };

  if (!showCreator) return null;

  // Trigger deck fetch on render
  if (decks.length === 0) {
    handleOpen();
  }

  return (
    <Modal open={showCreator} onClose={toggleCreator}>
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-text">Create Tier List</h2>

        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tier list name"
          maxLength={100}
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-text placeholder:text-text-muted focus:border-gold focus:outline-none"
        />

        {/* Description */}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          maxLength={500}
          rows={2}
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-text placeholder:text-text-muted focus:border-gold focus:outline-none"
        />

        {/* Tier rows */}
        <div className="space-y-2">
          {TIER_NAMES.map((tier) => (
            <div key={tier} className={`rounded-lg border p-3 ${TIER_STYLES[tier]}`}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-bold text-text">{tier} Tier</span>
                <button
                  onClick={() => setActiveTier(activeTier === tier ? null : tier)}
                  className="rounded px-2 py-1 text-xs text-text-muted transition-colors hover:bg-bg/50"
                >
                  + Add Deck
                </button>
              </div>

              {/* Deck search dropdown */}
              {activeTier === tier && (
                <div className="mb-2 space-y-1">
                  <div className="relative">
                    <Search size={14} className="absolute left-2 top-2 text-text-muted" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search decks..."
                      className="w-full rounded border border-border bg-bg py-1.5 pl-7 pr-3 text-sm text-text placeholder:text-text-muted focus:border-gold focus:outline-none"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-32 overflow-auto rounded border border-border bg-bg">
                    {filteredDecks.length === 0 ? (
                      <p className="p-2 text-xs text-text-muted">No decks available</p>
                    ) : (
                      filteredDecks.slice(0, 10).map((deck) => (
                        <button
                          key={deck.id}
                          onClick={() => addDeckToTier(tier, deck.id, deck.name)}
                          className="block w-full px-3 py-1.5 text-left text-sm text-text transition-colors hover:bg-surface-hover"
                        >
                          {deck.name}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Assigned decks */}
              <div className="flex flex-wrap gap-1.5">
                {tiers[tier].map((entry: TierEntry) => (
                  <span
                    key={entry.deckId}
                    className="group inline-flex items-center gap-1 rounded-md bg-bg/50 px-2 py-1 text-sm text-text"
                  >
                    {entry.deckName}
                    {/* Move buttons */}
                    {TIER_NAMES.filter((t) => t !== tier).map((t) => (
                      <button
                        key={t}
                        onClick={() => moveDeck(tier, t, entry)}
                        className="hidden text-xs text-text-muted hover:text-gold group-hover:inline"
                        title={`Move to ${t}`}
                      >
                        {t}
                      </button>
                    ))}
                    <button
                      onClick={() => removeDeckFromTier(tier, entry.deckId)}
                      className="hidden text-text-muted hover:text-[var(--color-error)] group-hover:inline"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                {tiers[tier].length === 0 && (
                  <span className="text-xs text-text-muted opacity-60">No decks assigned</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            onClick={toggleCreator}
            className="rounded-lg border border-border px-4 py-2 text-sm text-text-muted transition-colors hover:bg-surface-hover"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || submitting}
            className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-bg transition-colors hover:bg-gold/90 disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
