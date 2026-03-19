import type { FastifyInstance } from 'fastify';
import { updateProfileSchema } from '@pocket-trade-hub/shared';
import {
  getUserById,
  getOwnProfile,
  updateProfile,
} from '../services/user.service';
import { getUserReputation } from '../services/rating.service';
import { t, parseAcceptLanguage } from '../i18n';

export default async function userRoutes(fastify: FastifyInstance) {
  // GET /users/me - Must be registered BEFORE /users/:id to avoid matching "me" as :id
  fastify.get(
    '/users/me',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const lang = parseAcceptLanguage(request.headers['accept-language']);
      const userId = request.user.sub;
      const profile = await getOwnProfile(fastify.db, userId);

      if (!profile) {
        return reply.code(404).send({ error: t('errors.userNotFound', lang) });
      }

      return reply.code(200).send(profile);
    }
  );

  // PATCH /users/me
  fastify.patch(
    '/users/me',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const lang = parseAcceptLanguage(request.headers['accept-language']);
      const userId = request.user.sub;

      const parsed = updateProfileSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ error: t('errors.validationFailed', lang), details: parsed.error.flatten() });
      }

      const updated = await updateProfile(fastify.db, userId, parsed.data);

      if (!updated) {
        return reply.code(404).send({ error: t('errors.userNotFound', lang) });
      }

      return reply.code(200).send(updated);
    }
  );

  // GET /users/:id - Public profile with reputation
  fastify.get('/users/:id', async (request, reply) => {
    const lang = parseAcceptLanguage(request.headers['accept-language']);
    const { id } = request.params as { id: string };
    const user = await getUserById(fastify.db, id);

    if (!user) {
      return reply.code(404).send({ error: t('errors.userNotFound', lang) });
    }

    const reputation = await getUserReputation(fastify.db, id);

    return reply.code(200).send({
      ...user,
      avgRating: reputation.avgRating,
      tradeCount: reputation.tradeCount,
    });
  });
}
