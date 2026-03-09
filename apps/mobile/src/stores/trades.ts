import { create } from 'zustand';
import type { TradeMatch, MatchSort, TradeProposal } from '@pocket-trade-hub/shared';

type ProposalDirection = 'incoming' | 'outgoing' | 'all';
type ActiveSegment = 'matches' | 'proposals';

interface TradesState {
  // Matches state
  matches: TradeMatch[];
  unseenCount: number;
  sortBy: MatchSort;
  isLoading: boolean;
  lastRefreshed: number | null;

  // Proposals state
  proposals: TradeProposal[];
  proposalsLoading: boolean;
  proposalDirection: ProposalDirection;
  activeSegment: ActiveSegment;

  // Match actions
  setMatches: (matches: TradeMatch[], unseenCount: number) => void;
  addMatch: (match: TradeMatch) => void;
  clearUnseen: () => void;
  setSortBy: (sort: MatchSort) => void;
  setLoading: (loading: boolean) => void;
  markSeen: (matchId: string) => void;

  // Proposal actions
  setProposals: (proposals: TradeProposal[]) => void;
  addProposal: (proposal: TradeProposal) => void;
  updateProposal: (id: string, updates: Partial<TradeProposal>) => void;
  setProposalDirection: (dir: ProposalDirection) => void;
  setActiveSegment: (seg: ActiveSegment) => void;

  reset: () => void;
}

const initialState = {
  matches: [] as TradeMatch[],
  unseenCount: 0,
  sortBy: 'priority' as MatchSort,
  isLoading: false,
  lastRefreshed: null as number | null,
  proposals: [] as TradeProposal[],
  proposalsLoading: false,
  proposalDirection: 'all' as ProposalDirection,
  activeSegment: 'matches' as ActiveSegment,
};

export const useTradesStore = create<TradesState>((set) => ({
  ...initialState,

  // Match actions
  setMatches: (matches, unseenCount) =>
    set({ matches, unseenCount, lastRefreshed: Date.now() }),

  addMatch: (match) =>
    set((state) => ({
      matches: [match, ...state.matches],
      unseenCount: state.unseenCount + 1,
    })),

  clearUnseen: () => set({ unseenCount: 0 }),

  setSortBy: (sort) => set({ sortBy: sort }),

  setLoading: (loading) => set({ isLoading: loading }),

  markSeen: (matchId) =>
    set((state) => {
      const match = state.matches.find((m) => m.id === matchId);
      if (!match || match.seen) return state;
      return {
        matches: state.matches.map((m) =>
          m.id === matchId ? { ...m, seen: true } : m,
        ),
        unseenCount: Math.max(0, state.unseenCount - 1),
      };
    }),

  // Proposal actions
  setProposals: (proposals) => set({ proposals }),

  addProposal: (proposal) =>
    set((state) => ({
      proposals: [proposal, ...state.proposals],
    })),

  updateProposal: (id, updates) =>
    set((state) => ({
      proposals: state.proposals.map((p) =>
        p.id === id ? { ...p, ...updates } : p,
      ),
    })),

  setProposalDirection: (dir) => set({ proposalDirection: dir }),

  setActiveSegment: (seg) => set({ activeSegment: seg }),

  reset: () => set(initialState),
}));
