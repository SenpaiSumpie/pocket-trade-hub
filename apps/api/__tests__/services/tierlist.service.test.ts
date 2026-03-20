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

describe('tierlist.service', () => {
  it.todo('creates a new tier list with valid tiers');
  it.todo('rejects tier list with no decks in any tier');
  it.todo('returns paginated tier lists sorted by most_liked');
  it.todo('returns paginated tier lists sorted by newest');
  it.todo('includes userVoted boolean when userId provided');
  it.todo('allows owner to delete their tier list');
  it.todo('rejects deletion by non-owner');
  it.todo('toggles vote: adds vote if not voted, removes if already voted');
  it.todo('atomically updates upvoteCount on vote toggle');
  it.todo('generates official tier list from meta data with correct tier distribution');
});
