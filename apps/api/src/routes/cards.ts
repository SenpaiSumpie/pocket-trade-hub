import type { FastifyInstance } from 'fastify';
import { cardSearchSchema } from '@pocket-trade-hub/shared';
import { z } from 'zod';
import {
  searchCards,
  getCardById,
  getCardsBySet,
  getAllSets,
  getCardTranslations,
} from '../services/card.service';
import { cardLanguageValues } from '@pocket-trade-hub/shared';

const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

export default async function cardRoutes(fastify: FastifyInstance) {
  // GET /sets — all sets
  fastify.get('/sets', async (request, reply) => {
    const result = await getAllSets(fastify.db);
    return reply.send(result);
  });

  // GET /sets/:id/cards — paginated cards for a set
  fastify.get('/sets/:id/cards', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = paginationSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid pagination params', details: parsed.error.flatten() });
    }
    const { limit, offset } = parsed.data;
    const result = await getCardsBySet(fastify.db, id, limit, offset);
    return reply.send(result);
  });

  // GET /cards/search — search cards with filters
  fastify.get('/cards/search', async (request, reply) => {
    const parsed = cardSearchSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid search params', details: parsed.error.flatten() });
    }
    const result = await searchCards(fastify.db, parsed.data);
    return reply.send(result);
  });

  // GET /cards/:id/translations — get all translations for a card
  fastify.get('/cards/:id/translations', async (request, reply) => {
    const { id } = request.params as { id: string };
    const translations = await getCardTranslations(fastify.db, id);
    return reply.send({ translations });
  });

  // GET /cards/:id — single card (optional language query param)
  fastify.get('/cards/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { language } = request.query as { language?: string };

    // Validate language if provided
    if (language && !(cardLanguageValues as readonly string[]).includes(language)) {
      return reply.code(400).send({ error: 'Invalid language parameter' });
    }

    const card = await getCardById(fastify.db, id, language);
    if (!card) {
      return reply.code(404).send({ error: 'Card not found' });
    }
    return reply.send(card);
  });
}
