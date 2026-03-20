'use client';

import { create } from 'zustand';
import { apiFetch } from '@/lib/api';
import type {
  TradeProposal,
  ProposalCard,
} from '@pocket-trade-hub/shared/src/schemas/proposal';

type ProposalTab = 'received' | 'sent';

interface ProposalsState {
  sent: TradeProposal[];
  received: TradeProposal[];
  selectedProposal: TradeProposal | null;
  loading: boolean;
  activeTab: ProposalTab;

  fetchProposals: () => Promise<void>;
  acceptProposal: (id: string) => Promise<void>;
  rejectProposal: (id: string) => Promise<void>;
  counterProposal: (
    id: string,
    offeredCards: ProposalCard[],
    requestedCards: ProposalCard[],
    message?: string,
  ) => Promise<void>;
  createProposal: (
    postId: string,
    receiverId: string,
    offeredCards: ProposalCard[],
    requestedCards: ProposalCard[],
    fairnessScore: number,
    message?: string,
  ) => Promise<void>;
  selectProposal: (proposal: TradeProposal | null) => void;
  setActiveTab: (tab: ProposalTab) => void;
}

export const useProposalStore = create<ProposalsState>((set, get) => ({
  sent: [],
  received: [],
  selectedProposal: null,
  loading: false,
  activeTab: 'received',

  fetchProposals: async () => {
    set({ loading: true });
    try {
      const data = await apiFetch<{
        sent: TradeProposal[];
        received: TradeProposal[];
      }>('/proposals');
      set({ sent: data.sent, received: data.received, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  acceptProposal: async (id) => {
    try {
      await apiFetch(`/proposals/${id}/accept`, { method: 'PUT' });
      get().fetchProposals();
    } catch {
      // ignore
    }
  },

  rejectProposal: async (id) => {
    try {
      await apiFetch(`/proposals/${id}/reject`, { method: 'PUT' });
      get().fetchProposals();
    } catch {
      // ignore
    }
  },

  counterProposal: async (id, offeredCards, requestedCards, message) => {
    try {
      await apiFetch(`/proposals/${id}/counter`, {
        method: 'POST',
        body: JSON.stringify({
          offeredCards,
          requestedCards,
          ...(message ? { message } : {}),
        }),
      });
      get().fetchProposals();
    } catch {
      // ignore
    }
  },

  createProposal: async (postId, receiverId, offeredCards, requestedCards, fairnessScore, message) => {
    await apiFetch('/proposals', {
      method: 'POST',
      body: JSON.stringify({
        postId,
        receiverId,
        senderGives: offeredCards,
        senderGets: requestedCards,
        fairnessScore,
        ...(message ? { message } : {}),
      }),
    });
    get().fetchProposals();
  },

  selectProposal: (proposal) => set({ selectedProposal: proposal }),

  setActiveTab: (tab) => set({ activeTab: tab }),
}));
