import type { FastifyInstance } from 'fastify';
import { getDeckMeta, getDeckDetail, getScrapedAt } from '../services/meta.service';
import { isPremiumUser } from '../services/premium.service';
import { parseAcceptLanguage, t } from '../i18n';

export default async function metaRoutes(fastify: FastifyInstance) {
  // GET /meta/decks - deck meta rankings
  fastify.get(
    '/meta/decks',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = request.user.sub;
      const premium = await isPremiumUser(fastify.db, userId);

      const decks = await getDeckMeta(fastify.db, premium);
      const scrapedAt = await getScrapedAt(fastify.db);

      return reply.code(200).send({
        decks,
        isPremium: premium,
        scrapedAt,
      });
    },
  );

  // GET /meta/decks/:id - single deck detail
  fastify.get(
    '/meta/decks/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const lang = parseAcceptLanguage(request.headers['accept-language']);
      const userId = request.user.sub;
      const { id } = request.params as { id: string };
      const premium = await isPremiumUser(fastify.db, userId);

      const deck = await getDeckDetail(fastify.db, id, premium);
      if (!deck) {
        return reply.code(404).send({ error: t('errors.notFound', lang) });
      }

      return reply.code(200).send({ deck, isPremium: premium });
    },
  );
}
