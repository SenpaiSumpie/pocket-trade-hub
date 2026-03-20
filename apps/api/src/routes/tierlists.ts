import type { FastifyInstance } from 'fastify';
import { createTierListSchema } from '@pocket-trade-hub/shared';
import {
  createTierList,
  getTierLists,
  getTierListById,
  deleteTierList,
  voteTierList,
} from '../services/tierlist.service';
import { parseAcceptLanguage, t } from '../i18n';

export default async function tierlistRoutes(fastify: FastifyInstance) {
  // GET /tierlists - paginated list
  fastify.get(
    '/tierlists',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = request.user.sub;
      const query = request.query as {
        sort?: string;
        page?: string;
        limit?: string;
      };

      const sort = query.sort === 'most_liked' ? 'most_liked' : 'newest';
      const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(query.limit || '20', 10) || 20));

      const result = await getTierLists(fastify.db, { sort, page, limit, userId });

      return reply.code(200).send(result);
    },
  );

  // GET /tierlists/:id - single tier list
  fastify.get(
    '/tierlists/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const lang = parseAcceptLanguage(request.headers['accept-language']);
      const userId = request.user.sub;
      const { id } = request.params as { id: string };

      const tierList = await getTierListById(fastify.db, id, userId);
      if (!tierList) {
        return reply.code(404).send({ error: t('errors.notFound', lang) });
      }

      return reply.code(200).send({ tierList });
    },
  );

  // POST /tierlists - create new tier list
  fastify.post(
    '/tierlists',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const lang = parseAcceptLanguage(request.headers['accept-language']);
      const userId = request.user.sub;

      const parsed = createTierListSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: t('errors.validationFailed', lang),
          details: parsed.error.flatten(),
        });
      }

      try {
        const tierList = await createTierList(fastify.db, userId, parsed.data);
        return reply.code(201).send({ tierList });
      } catch (err: any) {
        if (err.message === 'Tier list must contain at least one deck') {
          return reply.code(400).send({ error: err.message });
        }
        throw err;
      }
    },
  );

  // DELETE /tierlists/:id - delete own tier list
  fastify.delete(
    '/tierlists/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const lang = parseAcceptLanguage(request.headers['accept-language']);
      const userId = request.user.sub;
      const { id } = request.params as { id: string };

      const result = await deleteTierList(fastify.db, id, userId);

      if (result === 'not_found') {
        return reply.code(404).send({ error: t('errors.notFound', lang) });
      }
      if (result === 'forbidden') {
        return reply.code(403).send({ error: t('errors.unauthorized', lang) });
      }

      return reply.code(200).send({ deleted: true });
    },
  );

  // POST /tierlists/:id/vote - toggle vote
  fastify.post(
    '/tierlists/:id/vote',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const lang = parseAcceptLanguage(request.headers['accept-language']);
      const userId = request.user.sub;
      const { id } = request.params as { id: string };

      const result = await voteTierList(fastify.db, id, userId);
      if (!result) {
        return reply.code(404).send({ error: t('errors.notFound', lang) });
      }

      return reply.code(200).send(result);
    },
  );
}
