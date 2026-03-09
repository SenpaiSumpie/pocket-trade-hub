import type { FastifyInstance } from 'fastify';
import { addToWantedSchema, updateWantedSchema } from '@pocket-trade-hub/shared';
import {
  addToWanted,
  removeFromWanted,
  updatePriority,
  getUserWanted,
} from '../services/wanted.service';

export default async function wantedRoutes(fastify: FastifyInstance) {
  // POST /wanted — add card to wanted list
  fastify.post(
    '/wanted',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const parsed = addToWantedSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Invalid request body', details: parsed.error.flatten() });
      }

      const userId = request.user.sub;
      const result = await addToWanted(fastify.db, userId, parsed.data.cardId, parsed.data.priority);
      return reply.code(200).send(result);
    }
  );

  // GET /wanted — list user's wanted cards
  fastify.get(
    '/wanted',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = request.user.sub;
      const { setId } = request.query as { setId?: string };
      const result = await getUserWanted(fastify.db, userId, setId);
      return reply.code(200).send(result);
    }
  );

  // PUT /wanted/:cardId — update priority
  fastify.put(
    '/wanted/:cardId',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const parsed = updateWantedSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Invalid request body', details: parsed.error.flatten() });
      }

      const userId = request.user.sub;
      const { cardId } = request.params as { cardId: string };
      const result = await updatePriority(fastify.db, userId, cardId, parsed.data.priority);
      return reply.code(200).send(result);
    }
  );

  // DELETE /wanted/:cardId — remove card from wanted list
  fastify.delete(
    '/wanted/:cardId',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = request.user.sub;
      const { cardId } = request.params as { cardId: string };
      await removeFromWanted(fastify.db, userId, cardId);
      return reply.code(200).send({ success: true });
    }
  );
}
