import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '../stores/auth';
import { useTradesStore } from '../stores/trades';
import { usePostsStore } from '../stores/posts';
import { useNotificationStore } from '../stores/notifications';
import { apiFetch } from './useApi';
import type { TradeProposal, TradePost, Notification } from '@pocket-trade-hub/shared';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface PostMatchEvent {
  postId: string;
  matchedPostIds: string[];
}

interface PostClosedEvent {
  postId: string;
}

interface ProposalEvent {
  proposalId: string;
  senderId?: string;
  responderId?: string;
  matchId?: string;
  postId?: string;
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

    const refetchProposals = () => {
      const dir = useTradesStore.getState().proposalDirection;
      apiFetch<{ proposals: TradeProposal[] }>(`/proposals?direction=${dir}`)
        .then((result) => {
          useTradesStore.getState().setProposals(result.proposals);
        })
        .catch(() => {});
    };

    const refetchMyPosts = () => {
      apiFetch<{ posts: TradePost[] }>('/posts/mine')
        .then((result) => {
          usePostsStore.getState().setMyPosts(result.posts);
        })
        .catch(() => {});
    };

    // Post events
    socket.on('post-match', (data: PostMatchEvent) => {
      refetchMyPosts();

      Toast.show({
        type: 'info',
        text1: 'New match for your post!',
        text2: 'Someone has a complementary post. Check the Market tab!',
        visibilityTime: 5000,
      });
    });

    socket.on('post-closed', (data: PostClosedEvent) => {
      // Update post status in stores
      usePostsStore.getState().updatePostStatus(data.postId, 'auto_closed');

      Toast.show({
        type: 'info',
        text1: 'Post auto-closed',
        text2: 'A post was auto-closed because the card was traded.',
        visibilityTime: 5000,
      });
    });

    // Proposal events
    socket.on('new-proposal', (data: ProposalEvent) => {
      refetchProposals();
      Toast.show({
        type: 'info',
        text1: 'New trade proposal!',
        text2: `${data.senderName ?? 'A trader'} sent you a proposal.`,
        visibilityTime: 5000,
      });
    });

    socket.on('proposal-accepted', (data: ProposalEvent) => {
      useTradesStore.getState().updateProposal(data.proposalId, { status: 'accepted' });
      refetchProposals();
      Toast.show({
        type: 'info',
        text1: 'Proposal accepted!',
        text2: 'Your trade proposal was accepted.',
        visibilityTime: 5000,
      });
    });

    socket.on('proposal-rejected', (data: ProposalEvent) => {
      useTradesStore.getState().updateProposal(data.proposalId, { status: 'rejected' });
      refetchProposals();
      Toast.show({
        type: 'info',
        text1: 'Proposal rejected',
        text2: 'Your trade proposal was declined.',
        visibilityTime: 5000,
      });
    });

    socket.on('proposal-countered', (data: ProposalEvent) => {
      useTradesStore.getState().updateProposal(data.proposalId, { status: 'countered' });
      refetchProposals();
      Toast.show({
        type: 'info',
        text1: 'Counter-offer received!',
        text2: 'Your partner sent a counter-offer.',
        visibilityTime: 5000,
      });
    });

    socket.on('trade-completed', (data: ProposalEvent) => {
      useTradesStore.getState().updateProposal(data.proposalId, { status: 'completed' });
      refetchProposals();
      // Also refresh my posts since trade completion may auto-close posts
      refetchMyPosts();
      Toast.show({
        type: 'info',
        text1: 'Trade completed!',
        text2: 'The trade has been marked as completed.',
        visibilityTime: 5000,
      });
    });

    socket.on('proposal-cancelled', (data: ProposalEvent) => {
      useTradesStore.getState().updateProposal(data.proposalId, { status: 'cancelled' });
      refetchProposals();
      Toast.show({
        type: 'info',
        text1: 'Proposal cancelled',
        text2: 'A proposal was cancelled because cards are no longer available.',
        visibilityTime: 5000,
      });
    });

    // Real-time notification badge updates
    socket.on('notification-new', (data: Notification) => {
      useNotificationStore.getState().addNotification(data);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId]);
}
