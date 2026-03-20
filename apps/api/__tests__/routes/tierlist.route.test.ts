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

describe('GET /tierlists', () => {
  it.todo('returns paginated tier lists');
  it.todo('sorts by most_liked when requested');
  it.todo('sorts by newest when requested');
});

describe('POST /tierlists', () => {
  it.todo('creates tier list for authenticated user');
  it.todo('validates title is required');
  it.todo('validates at least one deck in tiers');
});

describe('DELETE /tierlists/:id', () => {
  it.todo('allows owner to delete');
  it.todo('returns 403 for non-owner');
  it.todo('returns 404 for non-existent tier list');
});

describe('POST /tierlists/:id/vote', () => {
  it.todo('adds vote for first-time voter');
  it.todo('removes vote for repeat voter');
  it.todo('returns updated upvoteCount and userVoted');
});
