import { buildTestApp, cleanDb, closeDb, testDb } from './setup';
import type { FastifyInstance } from 'fastify';
import {
  createNotification,
  getNotifications,
  markRead,
  markAllRead,
  getUnreadCount,
} from '../src/services/notification.service';

let app: FastifyInstance;
let userId: string;

async function createUser(email: string, password = 'password123') {
  const res = await app.inject({
    method: 'POST',
    url: '/auth/signup',
    payload: { email, password, confirmPassword: password },
  });
  return JSON.parse(res.body);
}

beforeAll(async () => {
  app = await buildTestApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
  await closeDb();
});

beforeEach(async () => {
  await cleanDb();
  const user = await createUser('test@test.com');
  userId = user.user.id;
});

describe('createNotification', () => {
  it('inserts a notification row', async () => {
    const notif = await createNotification(app.db, {
      userId,
      type: 'system',
      title: 'Test',
      body: 'Test body',
    });

    expect(notif.id).toBeDefined();
    expect(notif.userId).toBe(userId);
    expect(notif.type).toBe('system');
    expect(notif.read).toBe(false);
  });
});

describe('getNotifications', () => {
  it('returns paginated notifications ordered by createdAt DESC', async () => {
    for (let i = 0; i < 5; i++) {
      await createNotification(app.db, {
        userId,
        type: 'system',
        title: `Notif ${i}`,
        body: `Body ${i}`,
      });
    }

    const result = await getNotifications(app.db, userId, { limit: 3 });
    expect(result.notifications.length).toBe(3);
    expect(result.hasMore).toBe(true);
  });

  it('returns hasMore=false when no more items', async () => {
    await createNotification(app.db, {
      userId,
      type: 'system',
      title: 'Single',
      body: 'Body',
    });

    const result = await getNotifications(app.db, userId, { limit: 20 });
    expect(result.notifications.length).toBe(1);
    expect(result.hasMore).toBe(false);
  });
});

describe('markRead', () => {
  it('marks a single notification as read', async () => {
    const notif = await createNotification(app.db, {
      userId,
      type: 'system',
      title: 'Test',
      body: 'Body',
    });

    const result = await markRead(app.db, notif.id, userId);
    expect(result).toBe(true);

    const { notifications: notifs } = await getNotifications(app.db, userId);
    expect(notifs[0].read).toBe(true);
  });

  it('returns false for non-existent notification', async () => {
    const result = await markRead(app.db, 'nonexistent', userId);
    expect(result).toBe(false);
  });
});

describe('markAllRead', () => {
  it('marks all unread notifications as read', async () => {
    await createNotification(app.db, {
      userId,
      type: 'system',
      title: 'Test 1',
      body: 'Body',
    });
    await createNotification(app.db, {
      userId,
      type: 'system',
      title: 'Test 2',
      body: 'Body',
    });

    const count = await markAllRead(app.db, userId);
    expect(count).toBe(2);

    const unread = await getUnreadCount(app.db, userId);
    expect(unread).toBe(0);
  });
});

describe('getUnreadCount', () => {
  it('returns count of unread notifications', async () => {
    await createNotification(app.db, {
      userId,
      type: 'system',
      title: 'Test 1',
      body: 'Body',
    });
    await createNotification(app.db, {
      userId,
      type: 'system',
      title: 'Test 2',
      body: 'Body',
    });

    const count = await getUnreadCount(app.db, userId);
    expect(count).toBe(2);
  });

  it('returns 0 when all read', async () => {
    const notif = await createNotification(app.db, {
      userId,
      type: 'system',
      title: 'Test',
      body: 'Body',
    });
    await markRead(app.db, notif.id, userId);

    const count = await getUnreadCount(app.db, userId);
    expect(count).toBe(0);
  });
});
