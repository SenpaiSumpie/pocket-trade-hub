import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '../stores/auth';
import { useTradesStore } from '../stores/trades';
import type { TradeMatch } from '@pocket-trade-hub/shared';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface NewMatchEvent {
  partnerId: string;
  partnerName: string;
  topCardName: string;
  starRating: number;
  matchId: string;
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
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('new-match', (data: NewMatchEvent & { match?: TradeMatch }) => {
      // If full match data is provided, add to store
      if (data.match) {
        useTradesStore.getState().addMatch(data.match);
      }

      Toast.show({
        type: 'matchNotification',
        text1: 'New match found!',
        text2: `${data.partnerName} has ${data.topCardName} you want.`,
        visibilityTime: 5000,
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId]);
}
