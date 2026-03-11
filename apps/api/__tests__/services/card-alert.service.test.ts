import { buildTestApp, cleanDb, closeDb, testDb } from '../setup';
import { users, sets, cards, userWantedCards, cardAlertEvents, notifications } from '../../src/db/schema';
import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import { eq, and } from 'drizzle-orm';
import {
  checkCardAlerts,
  processCardAlertBatch,
} from '../../src/services/card-alert.service';

let app: FastifyInstance;

async function createTestUser(overrides: Record<string, any> = {}) {
  const userId = randomUUID();
  const passwordHash = await bcrypt.hash('password123', 10);
  await testDb.insert(users).values({
    id: userId,
    email: `user-${userId.slice(0, 8)}@test.com`,
    passwordHash,
    isAdmin: false,
    ...overrides,
  });
  return userId;
}

async function seedCardSet() {
  const setId = 'CA1';
  await testDb.insert(sets).values({
    id: setId,
    name: 'Card Alert Test Set',
    series: 'CA',
    cardCount: 2,
    releaseDate: '2024-01-01',
    imageUrl: 'https://example.com/set.png',
  });

  const cardData = [
    { id: 'CA1-001', localId: '001', name: 'Charizard', rarity: 'star2' as const, imageUrl: 'https://example.com/charizard.png' },
    { id: 'CA1-002', localId: '002', name: 'Pikachu', rarity: 'diamond1' as const, imageUrl: 'https://example.com/pikachu.png' },
  ];

  for (const card of cardData) {
    await testDb.insert(cards).values({
      ...card,
      setId,
      type: 'fire',
      category: 'pokemon',
      hp: 100,
      stage: 'Basic',
      attacks: null,
      weakness: null,
      resistance: null,
      retreatCost: null,
      illustrator: 'Test',
      cardNumber: card.localId,
    });
  }

  return cardData;
}

async function addToWanted(userId: string, cardId: string) {
  await testDb.insert(userWantedCards).values({
    id: randomUUID(),
    userId,
    cardId,
    priority: 'medium',
  });
}

beforeAll(async () => {
  app = await buildTestApp();
  await app.ready();
});

afterAll(async () => {
  await closeDb();
  await app.close();
});

beforeEach(async () => {
  await cleanDb();
});

describe('checkCardAlerts', () => {
  it('creates alert events for premium users who want the added card', async () => {
    await seedCardSet();
    const premiumUser = await createTestUser({ isPremium: true });
    const adder = await createTestUser();

    // Premium user wants Charizard
    await addToWanted(premiumUser, 'CA1-001');

    // Adder adds Charizard to their collection
    await checkCardAlerts(testDb, adder, 'CA1-001');

    const events = await testDb
      .select()
      .from(cardAlertEvents)
      .where(eq(cardAlertEvents.premiumUserId, premiumUser));

    expect(events).toHaveLength(1);
    expect(events[0].cardId).toBe('CA1-001');
    expect(events[0].addedByUserId).toBe(adder);
    expect(events[0].processed).toBe(false);
  });

  it('excludes the adder from alerts (does not alert yourself)', async () => {
    await seedCardSet();
    // User is premium and wants Charizard, but is also the one adding it
    const premiumAdder = await createTestUser({ isPremium: true });
    await addToWanted(premiumAdder, 'CA1-001');

    await checkCardAlerts(testDb, premiumAdder, 'CA1-001');

    const events = await testDb
      .select()
      .from(cardAlertEvents)
      .where(eq(cardAlertEvents.premiumUserId, premiumAdder));

    expect(events).toHaveLength(0);
  });

  it('does not create alerts for non-premium users', async () => {
    await seedCardSet();
    const freeUser = await createTestUser({ isPremium: false });
    const adder = await createTestUser();

    await addToWanted(freeUser, 'CA1-001');
    await checkCardAlerts(testDb, adder, 'CA1-001');

    const events = await testDb.select().from(cardAlertEvents);
    expect(events).toHaveLength(0);
  });
});

describe('processCardAlertBatch', () => {
  it('groups pending events by user, creates notification, marks processed', async () => {
    await seedCardSet();
    const premiumUser = await createTestUser({ isPremium: true });
    const adderA = await createTestUser();
    const adderB = await createTestUser();

    await addToWanted(premiumUser, 'CA1-001');
    await addToWanted(premiumUser, 'CA1-002');

    // Two different adders trigger alerts
    await checkCardAlerts(testDb, adderA, 'CA1-001');
    await checkCardAlerts(testDb, adderB, 'CA1-002');

    // Process batch
    await processCardAlertBatch(testDb);

    // Check events are marked processed
    const events = await testDb.select().from(cardAlertEvents);
    expect(events.every(e => e.processed)).toBe(true);

    // Check notification was created
    const notifs = await testDb
      .select()
      .from(notifications)
      .where(eq(notifications.userId, premiumUser));

    expect(notifs).toHaveLength(1);
    expect(notifs[0].type).toBe('card_alert');
    expect(notifs[0].body).toContain('2'); // 2 cards
  });
});
