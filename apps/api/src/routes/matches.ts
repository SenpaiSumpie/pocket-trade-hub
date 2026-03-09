import type { FastifyInstance } from 'fastify';
import { matchSortSchema } from '@pocket-trade-hub/shared';
import {
  getMatchesForUser,
  recomputeMatchesForUser,
  markMatchSeen,
} from '../services/match.service';

export default async function matchRoutes(fastify: FastifyInstance) {
  // GET /matches - list user's matches
  fastify.get(
    '/matches',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = request.user.sub;
      const { sort } = request.query as { sort?: string };

      const parsed = matchSortSchema.safeParse(sort);
      const sortValue = parsed.success ? parsed.data : 'priority';

      const result = await getMatchesForUser(fastify.db, userId, sortValue);
      return reply.code(200).send(result);
    }
  );

  // POST /matches/refresh - trigger immediate recompute
  fastify.post(
    '/matches/refresh',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = request.user.sub;

      // Pass io if available (may not be in test environment)
      const io = (fastify as any).io || null;
      const result = await recomputeMatchesForUser(fastify.db, io, userId);

      return reply.code(200).send({
        refreshed: true,
        matchCount: result.matchCount,
      });
    }
  );

  // PUT /matches/:id/seen - mark match as seen
  fastify.put(
    '/matches/:id/seen',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = request.user.sub;
      const { id } = request.params as { id: string };

      const updated = await markMatchSeen(fastify.db, userId, id);
      if (!updated) {
        return reply.code(404).send({ error: 'Match not found' });
      }

      return reply.code(200).send({ success: true });
    }
  );
}
