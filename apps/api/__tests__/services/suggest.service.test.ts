import { buildTestApp, cleanDb, closeDb, testDb } from '../setup';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;

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

describe('suggest.service', () => {
  it.todo('computes suggestions from user wanted list and collection');
  it.todo('returns empty suggestions when user has < 3 collection items');
  it.todo('caches suggestions in Redis with 1-hour TTL');
  it.todo('returns cached suggestions on subsequent calls');
  it.todo('invalidates cache when refresh=true');
  it.todo('limits suggestions to top 5 by score');
  it.todo('generates template reasoning text from data signals');
  it.todo('hydrates card details (name, rarity, imageUrl) for give and get cards');
});
