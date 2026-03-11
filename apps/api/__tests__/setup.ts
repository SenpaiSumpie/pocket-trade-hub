import 'dotenv/config';
import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql as rawSql } from 'drizzle-orm';
import * as schema from '../src/db/schema';
import authRoutes from '../src/routes/auth';
import userRoutes from '../src/routes/users';
import cardRoutes from '../src/routes/cards';
import adminRoutes from '../src/routes/admin';
import notificationRoutes from '../src/routes/notifications';
import collectionRoutes from '../src/routes/collection';
import wantedRoutes from '../src/routes/wanted';
import matchRoutes from '../src/routes/matches';
import proposalRoutes from '../src/routes/proposals';
import type { FastifyRequest, FastifyReply } from 'fastify';

let testSql: ReturnType<typeof postgres>;
let testDb: ReturnType<typeof drizzle<typeof schema>>;

const TEST_JWT_SECRET = 'test-secret-key-do-not-use-in-production';

export async function buildTestApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  // CORS
  await app.register(cors, { origin: true });

  // Database
  const connectionString =
    process.env.DATABASE_URL_TEST ||
    process.env.DATABASE_URL ||
    'postgres://postgres:postgres@localhost:5432/pocket_trade_hub_test';

  testSql = postgres(connectionString);
  testDb = drizzle(testSql, { schema });

  app.decorate('db', testDb);
  app.decorate('sql', testSql);

  // JWT
  await app.register(jwt, {
    secret: TEST_JWT_SECRET,
    sign: { expiresIn: '15m' },
  });

  app.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.code(401).send({ error: 'Unauthorized' });
      }
    }
  );

  // Routes
  await app.register(authRoutes);
  await app.register(userRoutes);
  await app.register(cardRoutes);
  await app.register(adminRoutes);
  await app.register(notificationRoutes);
  await app.register(collectionRoutes);
  await app.register(wantedRoutes);
  await app.register(matchRoutes);
  await app.register(proposalRoutes);

  // Health check
  app.get('/health', async () => ({ status: 'ok' }));

  return app;
}

export async function cleanDb() {
  if (!testDb) return;
  // Truncate all tables in reverse dependency order
  await testDb.execute(
    rawSql`TRUNCATE TABLE card_alert_events, card_analytics, notifications, trade_ratings, trade_proposals, trade_matches, user_collection_items, user_wanted_cards, push_tokens, cards, sets, password_reset_tokens, refresh_tokens, users CASCADE`
  );
}

export async function closeDb() {
  if (testSql) {
    await testSql.end();
  }
}

export { testDb, TEST_JWT_SECRET };
