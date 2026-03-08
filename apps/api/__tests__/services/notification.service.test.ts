import { registerPushToken, sendNewSetNotification } from '../../src/services/notification.service';
import { testDb, TEST_JWT_SECRET, cleanDb, closeDb, buildTestApp } from '../setup';
import { users, pushTokens } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';

// Mock expo-server-sdk
jest.mock('expo-server-sdk', () => {
  const mockSendPushNotificationsAsync = jest.fn().mockResolvedValue([
    { status: 'ok', id: 'receipt-1' },
  ]);
  const mockChunkPushNotifications = jest.fn((messages: any[]) => [messages]);

  return {
    Expo: jest.fn().mockImplementation(() => ({
      sendPushNotificationsAsync: mockSendPushNotificationsAsync,
      chunkPushNotifications: mockChunkPushNotifications,
    })),
    __mockSend: mockSendPushNotificationsAsync,
    __mockChunk: mockChunkPushNotifications,
  };
});

// Access mocks
const { __mockSend, __mockChunk } = jest.requireMock('expo-server-sdk');
const { Expo } = jest.requireMock('expo-server-sdk');

// Make isExpoPushToken a static method on the mock
Expo.isExpoPushToken = jest.fn((token: string) => token.startsWith('ExponentPushToken['));

let app: FastifyInstance;

const TEST_USER_ID = 'test-user-notif-1';
const TEST_USER_ID_2 = 'test-user-notif-2';

beforeAll(async () => {
  app = await buildTestApp();
});

afterAll(async () => {
  await app.close();
  await closeDb();
});

beforeEach(async () => {
  await cleanDb();
  jest.clearAllMocks();

  // Create test users
  const bcrypt = require('bcrypt');
  const hash = await bcrypt.hash('password123', 10);
  await testDb.insert(users).values([
    { id: TEST_USER_ID, email: 'notif1@test.com', passwordHash: hash },
    { id: TEST_USER_ID_2, email: 'notif2@test.com', passwordHash: hash },
  ]);
});

describe('registerPushToken', () => {
  it('should register a new push token for a user', async () => {
    const result = await registerPushToken(
      testDb,
      TEST_USER_ID,
      'ExponentPushToken[abc123]',
      'ios'
    );

    expect(result.userId).toBe(TEST_USER_ID);
    expect(result.token).toBe('ExponentPushToken[abc123]');
    expect(result.platform).toBe('ios');

    // Verify in DB
    const tokens = await testDb
      .select()
      .from(pushTokens)
      .where(eq(pushTokens.userId, TEST_USER_ID));
    expect(tokens).toHaveLength(1);
    expect(tokens[0].token).toBe('ExponentPushToken[abc123]');
  });

  it('should upsert token when same user registers again', async () => {
    // Register first token
    await registerPushToken(testDb, TEST_USER_ID, 'ExponentPushToken[old]', 'ios');

    // Register second token (should replace)
    await registerPushToken(testDb, TEST_USER_ID, 'ExponentPushToken[new]', 'android');

    const tokens = await testDb
      .select()
      .from(pushTokens)
      .where(eq(pushTokens.userId, TEST_USER_ID));
    expect(tokens).toHaveLength(1);
    expect(tokens[0].token).toBe('ExponentPushToken[new]');
    expect(tokens[0].platform).toBe('android');
  });

  it('should handle different users with different tokens', async () => {
    await registerPushToken(testDb, TEST_USER_ID, 'ExponentPushToken[user1]', 'ios');
    await registerPushToken(testDb, TEST_USER_ID_2, 'ExponentPushToken[user2]', 'android');

    const allTokens = await testDb.select().from(pushTokens);
    expect(allTokens).toHaveLength(2);
  });
});

describe('sendNewSetNotification', () => {
  it('should send notification to all registered tokens', async () => {
    // Register tokens
    await registerPushToken(testDb, TEST_USER_ID, 'ExponentPushToken[abc]', 'ios');
    await registerPushToken(testDb, TEST_USER_ID_2, 'ExponentPushToken[def]', 'android');

    __mockSend.mockResolvedValueOnce([
      { status: 'ok', id: 'r1' },
      { status: 'ok', id: 'r2' },
    ]);

    const result = await sendNewSetNotification(testDb, 'Genetic Apex', 286);

    expect(result.sent).toBe(2);
    expect(result.failed).toBe(0);

    // Verify message format
    const sentMessages = __mockChunk.mock.calls[0][0];
    expect(sentMessages[0]).toMatchObject({
      title: 'New Set Available!',
      body: 'Genetic Apex -- 286 new cards added',
      sound: 'default',
    });
  });

  it('should handle empty token list (no-op)', async () => {
    const result = await sendNewSetNotification(testDb, 'Test Set', 10);

    expect(result.sent).toBe(0);
    expect(result.failed).toBe(0);
    expect(__mockSend).not.toHaveBeenCalled();
  });

  it('should remove stale tokens on DeviceNotRegistered error', async () => {
    await registerPushToken(testDb, TEST_USER_ID, 'ExponentPushToken[stale]', 'ios');

    __mockSend.mockResolvedValueOnce([
      {
        status: 'error',
        message: 'Device not registered',
        details: { error: 'DeviceNotRegistered' },
      },
    ]);

    const result = await sendNewSetNotification(testDb, 'Test Set', 10);

    expect(result.failed).toBe(1);

    // Verify stale token was removed
    const tokens = await testDb.select().from(pushTokens);
    expect(tokens).toHaveLength(0);
  });

  it('should skip invalid (non-Expo) tokens', async () => {
    // Insert a non-Expo token directly
    await testDb.insert(pushTokens).values({
      id: 'pt_invalid',
      userId: TEST_USER_ID,
      token: 'not-a-valid-expo-token',
      platform: 'ios',
    });

    const result = await sendNewSetNotification(testDb, 'Test Set', 10);

    expect(result.sent).toBe(0);
    expect(__mockSend).not.toHaveBeenCalled();
  });
});
