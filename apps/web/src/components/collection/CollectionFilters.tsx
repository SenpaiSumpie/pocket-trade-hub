'use client';

import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { useCollectionStore } from '@/stores/collection';
import { useCardStore } from '@/stores/cards';

export function CollectionFilters() {
  const { items, filter, setFilter } = useCollectionStore();
  const sets = useCardStore((s) => s.sets);
  const fetchSets = useCardStore((s) => s.fetchSets);
  const [search, setSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    fetchSets();
  }, [fetchSets]);

  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setFilter('query', search);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, setFilter]);

  const totalOwned = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="mb-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">
          <span className="font-semibold text-gold">{totalOwned}</span> cards
          owned
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
        />
        <Input
          placeholder="Search your collection..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Set filter */}
      <select
        value={filter.setId}
        onChange={(e) => setFilter('setId', e.target.value)}
        className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-gold/50"
      >
        <option value="">All Sets</option>
        {sets.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}
