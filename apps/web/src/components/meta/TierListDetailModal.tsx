'use client';

import { useTierListStore } from '@/stores/tierlists';
import { useAuthStore } from '@/stores/auth';
import { Modal } from '@/components/ui/Modal';

const TIER_CONFIG: Record<string, { label: string; color: string }> = {
  S: { label: 'S Tier', color: 'border-[var(--color-tier-s)] bg-[color-mix(in_srgb,var(--color-tier-s)_10%,transparent)] text-[var(--color-tier-s)]' },
  A: { label: 'A Tier', color: 'border-[var(--color-tier-a)] bg-[color-mix(in_srgb,var(--color-tier-a)_10%,transparent)] text-[var(--color-tier-a)]' },
  B: { label: 'B Tier', color: 'border-[var(--color-tier-b)] bg-[color-mix(in_srgb,var(--color-tier-b)_10%,transparent)] text-[var(--color-tier-b)]' },
  C: { label: 'C Tier', color: 'border-[var(--color-tier-c)] bg-[color-mix(in_srgb,var(--color-tier-c)_10%,transparent)] text-[var(--color-tier-c)]' },
  D: { label: 'D Tier', color: 'border-[var(--color-tier-d)] bg-[color-mix(in_srgb,var(--color-tier-d)_10%,transparent)] text-[var(--color-tier-d)]' },
};

export function TierListDetailModal() {
  const { selectedTierList, clearSelection, deleteTierList } = useTierListStore();
  const user = useAuthStore((s) => s.user);

  if (!selectedTierList) return null;

  const isOwner = user?.id === selectedTierList.userId;

  return (
    <Modal open={!!selectedTierList} onClose={clearSelection}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-text">{selectedTierList.title}</h2>
            {selectedTierList.description && (
              <p className="mt-1 text-sm text-text-muted">{selectedTierList.description}</p>
            )}
            <p className="mt-2 text-xs text-text-muted">
              {selectedTierList.isOfficial ? 'Official' : 'Community'} tier list
              {' - '}
              {new Date(selectedTierList.createdAt).toLocaleDateString()}
            </p>
          </div>
          {isOwner && (
            <button
              onClick={() => deleteTierList(selectedTierList.id)}
              className="rounded-lg border border-[var(--color-error)]/50 px-3 py-1.5 text-sm text-[var(--color-error)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)]"
            >
              Delete
            </button>
          )}
        </div>

        {/* Tiers */}
        <div className="space-y-3">
          {(['S', 'A', 'B', 'C', 'D'] as const).map((tier) => {
            const entries = selectedTierList.tiers[tier] ?? [];
            const config = TIER_CONFIG[tier];

            return (
              <div key={tier} className={`rounded-lg border p-3 ${config.color}`}>
                <h3 className="mb-2 text-sm font-bold">{config.label}</h3>
                {entries.length === 0 ? (
                  <p className="text-xs opacity-60">No decks</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {entries.map((entry) => (
                      <span
                        key={entry.deckId}
                        className="rounded-md bg-bg/50 px-2 py-1 text-sm text-text"
                      >
                        {entry.deckName}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
