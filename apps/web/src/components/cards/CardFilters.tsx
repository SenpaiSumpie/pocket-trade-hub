'use client';

import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useCardStore } from '@/stores/cards';
import { rarityValues, cardLanguageValues } from '@pocket-trade-hub/shared/src/schemas/card';

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

const RARITY_LABELS: Record<string, string> = {
  diamond1: '1 Diamond',
  diamond2: '2 Diamond',
  diamond3: '3 Diamond',
  diamond4: '4 Diamond',
  star1: '1 Star',
  star2: '2 Star',
  star3: '3 Star',
  crown: 'Crown',
};

export function CardFilters() {
  const { sets, setId, rarity, language, setFilter, fetchSets } = useCardStore();
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
      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
        />
        <Input
          placeholder="Search cards by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        {/* Set dropdown */}
        <select
          value={setId}
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

        {/* Language dropdown */}
        <select
          value={language}
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

      {/* Rarity chips */}
      <div className="flex flex-wrap gap-2">
        {rarityValues.map((r) => (
          <Button
            key={r}
            variant={rarity === r ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilter('rarity', rarity === r ? '' : r)}
          >
            {RARITY_LABELS[r] ?? r}
          </Button>
        ))}
      </div>
    </div>
  );
}
