import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import { users } from '../db/schema';

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const userId = (request.user as { sub: string }).sub;
  const db = (request.server as any).db;

  const result = await db
    .select({ isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!result[0]?.isAdmin) {
    return reply.code(403).send({ error: 'Admin access required' });
  }
}
