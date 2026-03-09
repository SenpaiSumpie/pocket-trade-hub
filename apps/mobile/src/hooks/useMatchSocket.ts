import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '../stores/auth';
import { useTradesStore } from '../stores/trades';
import { apiFetch } from './useApi';
import type { TradeMatch, TradeProposal } from '@pocket-trade-hub/shared';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface NewMatchEvent {
  partnerId: string;
  partnerName: string;
  topCardName: string;
  starRating: number;
  matchId: string;
}

interface ProposalEvent {
  proposal: TradeProposal;
  senderName?: string;
  partnerName?: string;
}

export function useMatchSocket() {
  const userId = useAuthStore((s) => s.user?.id);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) {
      // No user -- disconnect if connected
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io(API_URL, {
      auth: { userId },
      transports: ['polling', 'websocket'],
    });

    socketRef.current = socket;

    const refetchMatches = () => {
      const sort = useTradesStore.getState().sortBy;
      apiFetch<{ matches: TradeMatch[]; unseenCount: number }>(`/matches?sort=${sort}`)
        .then((result) => {
          useTradesStore.getState().setMatches(result.matches, result.unseenCount);
        })
        .catch(() => {});
    };

    const refetchProposals = () => {
      const dir = useTradesStore.getState().proposalDirection;
      apiFetch<{ proposals: TradeProposal[] }>(`/proposals?direction=${dir}`)
        .then((result) => {
          useTradesStore.getState().setProposals(result.proposals);
        })
        .catch(() => {});
    };

    // Match events
    socket.on('new-match', (data: NewMatchEvent & { match?: TradeMatch }) => {
      refetchMatches();

      Toast.show({
        type: 'matchNotification',
        text1: 'New match found!',
        text2: `${data.partnerName} has ${data.topCardName} you want.`,
        visibilityTime: 5000,
      });
    });

    // Silently refresh when matches change (removals, card count changes, etc.)
    socket.on('matches-updated', () => {
      refetchMatches();
    });

    // Proposal events
    socket.on('new-proposal', (data: ProposalEvent) => {
      refetchProposals();
      Toast.show({
        type: 'proposalNotification',
        text1: 'New trade proposal!',
        text2: `${data.senderName ?? 'A trader'} sent you a proposal.`,
        visibilityTime: 5000,
      });
    });

    socket.on('proposal-accepted', (data: ProposalEvent) => {
      useTradesStore.getState().updateProposal(data.proposal.id, { status: 'accepted' });
      Toast.show({
        type: 'proposalNotification',
        text1: 'Proposal accepted!',
        text2: `${data.partnerName ?? 'Your partner'} accepted your trade proposal.`,
        visibilityTime: 5000,
      });
    });

    socket.on('proposal-rejected', (data: ProposalEvent) => {
      useTradesStore.getState().updateProposal(data.proposal.id, { status: 'rejected' });
      Toast.show({
        type: 'proposalNotification',
        text1: 'Proposal rejected',
        text2: `${data.partnerName ?? 'Your partner'} declined your trade proposal.`,
        visibilityTime: 5000,
      });
    });

    socket.on('proposal-countered', (data: ProposalEvent) => {
      useTradesStore.getState().updateProposal(data.proposal.id, { status: 'countered' });
      refetchProposals();
      Toast.show({
        type: 'proposalNotification',
        text1: 'Counter-offer received!',
        text2: `${data.partnerName ?? 'Your partner'} sent a counter-offer.`,
        visibilityTime: 5000,
      });
    });

    socket.on('trade-completed', (data: ProposalEvent) => {
      useTradesStore.getState().updateProposal(data.proposal.id, { status: 'completed' });
      Toast.show({
        type: 'proposalNotification',
        text1: 'Trade completed!',
        text2: 'The trade has been marked as completed.',
        visibilityTime: 5000,
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId]);
}
