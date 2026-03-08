import type { FastifyInstance } from 'fastify';
import { cardImportSchema } from '@pocket-trade-hub/shared';
import { importCardSet } from '../services/card.service';
import { requireAdmin } from '../middleware/admin';

export default async function adminRoutes(fastify: FastifyInstance) {
  // POST /admin/cards/import — import a new card set (admin only)
  fastify.post(
    '/admin/cards/import',
    { preHandler: [fastify.authenticate, requireAdmin] },
    async (request, reply) => {
      const parsed = cardImportSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: 'Invalid import data',
          details: parsed.error.flatten(),
        });
      }

      try {
        const result = await importCardSet(fastify.db, parsed.data);
        return reply.code(201).send({
          message: `Imported ${result.cardCount} cards for ${result.setName}`,
          setId: result.setId,
          cardCount: result.cardCount,
        });
      } catch (err: any) {
        if (err.message?.includes('already exists')) {
          return reply.code(409).send({ error: err.message });
        }
        throw err;
      }
    }
  );
}
