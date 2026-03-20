import type { FastifyInstance } from 'fastify';
import { computeSuggestions } from '../services/suggest.service';
import { isPremiumUser } from '../services/premium.service';
import { parseAcceptLanguage, t } from '../i18n';

export default async function suggestionRoutes(fastify: FastifyInstance) {
  // GET /suggestions - premium-gated AI trade suggestions
  fastify.get(
    '/suggestions',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const lang = parseAcceptLanguage(request.headers['accept-language']);
      const userId = request.user.sub;

      const premium = await isPremiumUser(fastify.db, userId);
      if (!premium) {
        return reply.code(200).send({ suggestions: [], isPremium: false });
      }

      // Check for refresh=true query param to invalidate cache
      const query = request.query as { refresh?: string };
      if (query.refresh === 'true') {
        await fastify.redis.del(`suggestions:${userId}`);
      }

      const result = await computeSuggestions(fastify.db, fastify.redis, userId);

      return reply.code(200).send(result);
    },
  );
}
