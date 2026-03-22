'use client';

import { useTierListStore } from '@/stores/tierlists';
import { Skeleton } from '@/components/ui/Skeleton';
import type { TierList } from '@pocket-trade-hub/shared/src/schemas/tierlist';

const TIER_COLORS: Record<string, string> = {
  S: 'bg-[color-mix(in_srgb,var(--color-tier-s)_20%,transparent)] text-[var(--color-tier-s)]',
  A: 'bg-[color-mix(in_srgb,var(--color-tier-a)_20%,transparent)] text-[var(--color-tier-a)]',
  B: 'bg-[color-mix(in_srgb,var(--color-tier-b)_20%,transparent)] text-[var(--color-tier-b)]',
  C: 'bg-[color-mix(in_srgb,var(--color-tier-c)_20%,transparent)] text-[var(--color-tier-c)]',
  D: 'bg-[color-mix(in_srgb,var(--color-tier-d)_20%,transparent)] text-[var(--color-tier-d)]',
};

function TierPreview({ tierList }: { tierList: TierList }) {
  const tiers = tierList.tiers;
  return (
    <div className="flex gap-1">
      {(['S', 'A', 'B', 'C', 'D'] as const).map((tier) => {
        const count = tiers[tier]?.length ?? 0;
        if (count === 0) return null;
        return (
          <span
            key={tier}
            className={`rounded px-1.5 py-0.5 text-xs font-semibold ${TIER_COLORS[tier]}`}
          >
            {tier}:{count}
          </span>
        );
      })}
    </div>
  );
}

function TierListCard({ tierList, onClick }: { tierList: TierList; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full flex-col gap-2 rounded-lg border border-border bg-surface p-4 text-left transition-colors hover:bg-surface-hover"
    >
      <h3 className="font-semibold text-text">{tierList.title}</h3>
      {tierList.description && (
        <p className="line-clamp-2 text-sm text-text-muted">{tierList.description}</p>
      )}
      <TierPreview tierList={tierList} />
      <div className="mt-auto flex items-center justify-between text-xs text-text-muted">
        <span>{tierList.isOfficial ? 'Official' : 'Community'}</span>
        <span>{new Date(tierList.createdAt).toLocaleDateString()}</span>
      </div>
    </button>
  );
}

export function TierListBrowser() {
  const { tierLists, loading, total, page, limit, sort, selectTierList, toggleCreator, setSort, setPage } =
    useTierListStore();
  const totalPages = Math.ceil(total / limit);

  if (loading && tierLists.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Actions */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-text-muted">Sort</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-gold focus:outline-none"
          >
            <option value="newest">Newest</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
        <button
          onClick={toggleCreator}
          className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-bg transition-colors hover:bg-gold/90"
        >
          Create Tier List
        </button>
      </div>

      {/* Grid */}
      {tierLists.length === 0 ? (
        <p className="py-12 text-center text-text-muted">No tier lists found.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tierLists.map((tl) => (
            <TierListCard
              key={tl.id}
              tierList={tl}
              onClick={() => selectTierList(tl)}
            />
          ))}
        </div>
      )}

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
