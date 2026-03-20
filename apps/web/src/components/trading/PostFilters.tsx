'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { usePostStore } from '@/stores/posts';
import { useCardStore } from '@/stores/cards';
import { cardLanguageValues, rarityValues } from '@pocket-trade-hub/shared/src/schemas/card';

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  de: 'German',
  es: 'Spanish',
  fr: 'French',
  it: 'Italian',
  ja: 'Japanese',
  ko: 'Korean',
  pt: 'Portuguese',
  zh: 'Chinese',
};

const TYPE_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Offering', value: 'offering' },
  { label: 'Seeking', value: 'seeking' },
] as const;

export function PostFilters() {
  const { filters, setFilter, toggleCreateModal } = usePostStore();
  const { sets, fetchSets } = useCardStore();
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

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Type toggle */}
        <div className="flex rounded-lg border border-border">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter('type', opt.value)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors first:rounded-l-lg last:rounded-r-lg ${
                filters.type === opt.value
                  ? 'bg-gold text-bg'
                  : 'text-text-muted hover:bg-surface-hover hover:text-text'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <Input
            placeholder="Search trade posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Create Post button */}
        <Button onClick={toggleCreateModal}>
          <Plus size={16} />
          Create Post
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        {/* Set dropdown */}
        <select
          value={filters.setId}
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

        {/* Rarity dropdown */}
        <select
          value={filters.rarity}
          onChange={(e) => setFilter('rarity', e.target.value)}
          className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-gold/50"
        >
          <option value="">All Rarities</option>
          {rarityValues.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        {/* Language dropdown */}
        <select
          value={filters.language}
          onChange={(e) => setFilter('language', e.target.value)}
          className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-gold/50"
        >
          <option value="">All Languages</option>
          {cardLanguageValues.map((lang) => (
            <option key={lang} value={lang}>
              {LANGUAGE_LABELS[lang] ?? lang}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
