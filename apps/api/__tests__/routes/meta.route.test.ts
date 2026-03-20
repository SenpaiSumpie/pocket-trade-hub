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

describe('GET /meta/decks', () => {
  it.todo('returns deck list for authenticated user');
  it.todo('returns limited data for free user (no matchups, no tournamentResults, top 3 cards only)');
  it.todo('returns full data for premium user');
  it.todo('returns 401 for unauthenticated request');
});

describe('GET /meta/decks/:id', () => {
  it.todo('returns single deck detail');
  it.todo('returns 404 for non-existent deck');
  it.todo('applies premium gating to detail fields');
});
