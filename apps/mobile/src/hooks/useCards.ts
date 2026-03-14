import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from './useApi';
import { useCardsStore } from '../stores/cards';
import type { Card, CardSet } from '@pocket-trade-hub/shared';

interface CardFilters {
  set?: string;
  rarity?: string;
  type?: string;
}

interface PaginatedCards {
  cards: Card[];
  total: number;
}

export function useSets() {
  const [sets, setSets] = useState<CardSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch<CardSet[]>('/sets', { skipAuth: true })
      .then((data) => {
        if (!cancelled) {
          setSets(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { sets, loading, error };
}

export function useCardsBySet(setId: string | null, limit = 50) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const offsetRef = useRef(0);
  const selectedLanguage = useCardsStore((s) => s.selectedLanguage);

  const fetchCards = useCallback(
    async (offset: number, append: boolean) => {
      if (!setId) return;
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('limit', String(limit));
        params.set('offset', String(offset));
        if (selectedLanguage) params.set('language', selectedLanguage);

        const data = await apiFetch<PaginatedCards>(
          `/sets/${setId}/cards?${params.toString()}`,
          { skipAuth: true },
        );
        setCards((prev) => (append ? [...prev, ...data.cards] : data.cards));
        setHasMore(offset + limit < data.total);
        offsetRef.current = offset + limit;
      } catch {
        // Silently handle errors for browsing
      } finally {
        setLoading(false);
      }
    },
    [setId, limit, selectedLanguage],
  );

  useEffect(() => {
    offsetRef.current = 0;
    setCards([]);
    fetchCards(0, false);
  }, [fetchCards]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchCards(offsetRef.current, true);
    }
  }, [loading, hasMore, fetchCards]);

  const refresh = useCallback(() => {
    offsetRef.current = 0;
    setCards([]);
    fetchCards(0, false);
  }, [fetchCards]);

  return { cards, loading, hasMore, loadMore, refresh };
}

export function useCardSearch(query: string, filters: CardFilters) {
  const [results, setResults] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const selectedLanguage = useCardsStore((s) => s.selectedLanguage);

  useEffect(() => {
    const hasFilters =
      filters.set || filters.rarity || filters.type;
    if (query.length < 2 && !hasFilters) {
      setResults([]);
      setTotal(0);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (query.length >= 2) params.set('q', query);
        if (filters.set) params.set('set', filters.set);
        if (filters.rarity) params.set('rarity', filters.rarity);
        if (filters.type) params.set('type', filters.type);
        if (selectedLanguage) params.set('language', selectedLanguage);
        params.set('limit', '50');
        params.set('offset', '0');

        const data = await apiFetch<PaginatedCards>(
          `/cards/search?${params.toString()}`,
          { skipAuth: true },
        );
        setResults(data.cards);
        setTotal(data.total);
      } catch {
        // Silently handle search errors
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, filters.set, filters.rarity, filters.type, selectedLanguage]);

  return { results, loading, total };
}
