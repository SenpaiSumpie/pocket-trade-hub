import type { FastifyInstance } from 'fastify';
import { addToCollectionSchema, updateQuantitySchema, bulkCollectionSchema } from '@pocket-trade-hub/shared';
import {
  addToCollection,
  removeFromCollection,
  updateQuantity,
  bulkUpdateCollection,
  getCollectionProgress,
  getUserCollection,
} from '../services/collection.service';

export default async function collectionRoutes(fastify: FastifyInstance) {
  // POST /collection — add card to collection
  fastify.post(
    '/collection',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const parsed = addToCollectionSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Invalid request body', details: parsed.error.flatten() });
      }

      const userId = request.user.sub;
      const result = await addToCollection(fastify.db, userId, parsed.data.cardId, parsed.data.quantity);
      return reply.code(200).send(result);
    }
  );

  // GET /collection — list user's collection
  fastify.get(
    '/collection',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = request.user.sub;
      const { setId } = request.query as { setId?: string };
      const result = await getUserCollection(fastify.db, userId, setId);
      return reply.code(200).send(result);
    }
  );

  // PUT /collection/:cardId — update quantity
  fastify.put(
    '/collection/:cardId',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const parsed = updateQuantitySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Invalid request body', details: parsed.error.flatten() });
      }

      const userId = request.user.sub;
      const { cardId } = request.params as { cardId: string };
      const result = await updateQuantity(fastify.db, userId, cardId, parsed.data.quantity);
      return reply.code(200).send(result);
    }
  );

  // DELETE /collection/:cardId — remove card from collection
  fastify.delete(
    '/collection/:cardId',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = request.user.sub;
      const { cardId } = request.params as { cardId: string };
      await removeFromCollection(fastify.db, userId, cardId);
      return reply.code(200).send({ success: true });
    }
  );

  // POST /collection/bulk — bulk add/remove cards
  fastify.post(
    '/collection/bulk',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const parsed = bulkCollectionSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Invalid request body', details: parsed.error.flatten() });
      }

      const userId = request.user.sub;
      const result = await bulkUpdateCollection(
        fastify.db,
        userId,
        parsed.data.additions,
        parsed.data.removals,
      );
      return reply.code(200).send(result);
    }
  );

  // GET /collection/progress — per-set progress
  fastify.get(
    '/collection/progress',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = request.user.sub;
      const result = await getCollectionProgress(fastify.db, userId);
      return reply.code(200).send(result);
    }
  );
}
