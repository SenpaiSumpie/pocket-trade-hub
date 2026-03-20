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

describe('meta-scraper.service', () => {
  it.todo('parses Limitless TCG HTML into structured deck data');
  it.todo('extracts deck name, play count, usage %, win rate from table cells');
  it.todo('returns empty array when scrape fails');
  it.todo('returns empty array when HTML has no deck rows');
});
