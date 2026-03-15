import { create } from 'zustand';
import type { TradeProposal } from '@pocket-trade-hub/shared';

type ProposalDirection = 'incoming' | 'outgoing' | 'all';
type ActiveSegment = 'posts' | 'proposals';

interface TradesState {
  // Proposals state
  proposals: TradeProposal[];
  proposalsLoading: boolean;
  proposalDirection: ProposalDirection;
  activeSegment: ActiveSegment;

  // Proposal actions
  setProposals: (proposals: TradeProposal[]) => void;
  addProposal: (proposal: TradeProposal) => void;
  updateProposal: (id: string, updates: Partial<TradeProposal>) => void;
  setProposalDirection: (dir: ProposalDirection) => void;
  setActiveSegment: (seg: ActiveSegment) => void;

  reset: () => void;
}

const initialState = {
  proposals: [] as TradeProposal[],
  proposalsLoading: false,
  proposalDirection: 'all' as ProposalDirection,
  activeSegment: 'posts' as ActiveSegment,
};

export const useTradesStore = create<TradesState>((set) => ({
  ...initialState,

  // Proposal actions
  setProposals: (proposals) => set({ proposals: Array.isArray(proposals) ? proposals.filter(Boolean) : [] }),

  addProposal: (proposal) => {
    if (!proposal) return;
    set((state) => ({
      proposals: [proposal, ...state.proposals],
    }));
  },

  updateProposal: (id, updates) =>
    set((state) => ({
      proposals: state.proposals.filter(Boolean).map((p) =>
        p.id === id ? { ...p, ...updates } : p,
      ),
    })),

  setProposalDirection: (dir) => set({ proposalDirection: dir }),

  setActiveSegment: (seg) => set({ activeSegment: seg }),

  reset: () => set(initialState),
}));
