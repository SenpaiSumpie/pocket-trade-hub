import { useCallback } from 'react';
import { apiFetch } from './useApi';
import { useTradesStore } from '../stores/trades';
import type { TradeProposal, CreateProposalInput } from '@pocket-trade-hub/shared';

interface ProposalsResponse {
  proposals: TradeProposal[];
}

interface ProposalThreadResponse {
  thread: TradeProposal[];
}

export function useProposals() {
  const proposals = useTradesStore((s) => s.proposals);
  const loading = useTradesStore((s) => s.proposalsLoading);
  const direction = useTradesStore((s) => s.proposalDirection);

  const fetchProposals = useCallback(
    async (dir?: 'incoming' | 'outgoing' | 'all', status?: string) => {
      const store = useTradesStore.getState();
      const currentDir = dir ?? store.proposalDirection;
      store.setProposals([]); // clear while loading
      useTradesStore.setState({ proposalsLoading: true });
      try {
        let path = `/proposals?direction=${currentDir}`;
        if (status) path += `&status=${status}`;
        const data = await apiFetch<ProposalsResponse>(path);
        store.setProposals(data.proposals);
      } catch {
        // Silently fail -- user may not have proposals yet
      } finally {
        useTradesStore.setState({ proposalsLoading: false });
      }
    },
    [],
  );

  const createProposal = useCallback(
    async (input: CreateProposalInput): Promise<TradeProposal | null> => {
      try {
        const result = await apiFetch<{ proposal: TradeProposal }>('/proposals', {
          method: 'POST',
          body: JSON.stringify(input),
        });
        useTradesStore.getState().addProposal(result.proposal);
        return result.proposal;
      } catch (err) {
        throw err;
      }
    },
    [],
  );

  const acceptProposal = useCallback(async (id: string) => {
    // Optimistic update
    useTradesStore.getState().updateProposal(id, { status: 'accepted' });
    try {
      const result = await apiFetch<{ proposal: TradeProposal }>(
        `/proposals/${id}/accept`,
        { method: 'PUT' },
      );
      useTradesStore.getState().updateProposal(id, result.proposal);
    } catch {
      // Revert on error
      useTradesStore.getState().updateProposal(id, { status: 'pending' });
      throw new Error('Failed to accept proposal');
    }
  }, []);

  const rejectProposal = useCallback(async (id: string) => {
    useTradesStore.getState().updateProposal(id, { status: 'rejected' });
    try {
      const result = await apiFetch<{ proposal: TradeProposal }>(
        `/proposals/${id}/reject`,
        { method: 'PUT' },
      );
      useTradesStore.getState().updateProposal(id, result.proposal);
    } catch {
      useTradesStore.getState().updateProposal(id, { status: 'pending' });
      throw new Error('Failed to reject proposal');
    }
  }, []);

  const counterProposal = useCallback(
    async (id: string, input: CreateProposalInput): Promise<TradeProposal | null> => {
      try {
        const result = await apiFetch<{ proposal: TradeProposal }>(
          `/proposals/${id}/counter`,
          {
            method: 'POST',
            body: JSON.stringify(input),
          },
        );
        // Refetch to get updated list with counter
        await fetchProposals();
        return result.proposal;
      } catch (err) {
        throw err;
      }
    },
    [fetchProposals],
  );

  const completeProposal = useCallback(async (id: string) => {
    useTradesStore.getState().updateProposal(id, { status: 'completed' });
    try {
      const result = await apiFetch<{ proposal: TradeProposal }>(
        `/proposals/${id}/complete`,
        { method: 'PUT' },
      );
      useTradesStore.getState().updateProposal(id, result.proposal);
    } catch {
      useTradesStore.getState().updateProposal(id, { status: 'accepted' });
      throw new Error('Failed to complete proposal');
    }
  }, []);

  const getProposalThread = useCallback(
    async (id: string): Promise<TradeProposal[]> => {
      try {
        const data = await apiFetch<ProposalThreadResponse>(
          `/proposals/${id}/thread`,
        );
        return data.thread;
      } catch {
        return [];
      }
    },
    [],
  );

  return {
    proposals,
    loading,
    direction,
    fetchProposals,
    createProposal,
    acceptProposal,
    rejectProposal,
    counterProposal,
    completeProposal,
    getProposalThread,
  };
}
