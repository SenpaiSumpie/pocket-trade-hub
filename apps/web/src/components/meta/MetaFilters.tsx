'use client';

import { useMetaStore } from '@/stores/meta';

const SORT_OPTIONS = [
  { value: 'winRate', label: 'Win Rate' },
  { value: 'usageRate', label: 'Usage Rate' },
  { value: 'name', label: 'Name' },
] as const;

export function MetaFilters() {
  const sort = useMetaStore((s) => s.sort);
  const setSort = useMetaStore((s) => s.setSort);

  return (
    <div className="mb-4 flex items-center gap-4">
      <label className="text-sm font-medium text-text-muted">Sort by</label>
      <select
        value={sort}
        onChange={(e) => setSort(e.target.value)}
        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-gold focus:outline-none"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
