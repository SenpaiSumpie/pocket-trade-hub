import { useState, useCallback, useRef } from 'react';
import { apiFetch } from './useApi';

/**
 * Hook for submitting trade ratings.
 * Tracks which proposals have been rated locally to prevent duplicate UI prompts.
 */
export function useRating() {
  const [submitting, setSubmitting] = useState(false);
  const ratedSet = useRef(new Set<string>());

  const submitRating = useCallback(
    async (proposalId: string, stars: number): Promise<boolean> => {
      if (ratedSet.current.has(proposalId)) return false;
      setSubmitting(true);
      try {
        await apiFetch(`/proposals/${proposalId}/rate`, {
          method: 'POST',
          body: JSON.stringify({ stars }),
        });
        ratedSet.current.add(proposalId);
        return true;
      } catch {
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [],
  );

  const isRated = useCallback((proposalId: string): boolean => {
    return ratedSet.current.has(proposalId);
  }, []);

  return { submitRating, submitting, isRated };
}
