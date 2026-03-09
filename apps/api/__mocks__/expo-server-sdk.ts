export class Expo {
  static isExpoPushToken(_token: string): boolean {
    return true;
  }

  chunkPushNotifications(messages: any[]): any[][] {
    return [messages];
  }

  async sendPushNotificationsAsync(_messages: any[]): Promise<any[]> {
    return _messages.map(() => ({ status: 'ok' }));
  }
}

export type ExpoPushMessage = {
  to: string;
  sound?: string;
  title?: string;
  body?: string;
};

export type ExpoPushTicket = {
  status: 'ok' | 'error';
  details?: { error?: string };
};
