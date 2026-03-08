import fp from 'fastify-plugin';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema';
import type { FastifyInstance } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    db: ReturnType<typeof drizzle<typeof schema>>;
    sql: ReturnType<typeof postgres>;
  }
}

export default fp(async (fastify: FastifyInstance) => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const sql = postgres(connectionString);
  const db = drizzle(sql, { schema });

  fastify.decorate('db', db);
  fastify.decorate('sql', sql);

  fastify.addHook('onClose', async () => {
    await sql.end();
  });
});
