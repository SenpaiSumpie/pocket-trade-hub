import type { FastifyInstance } from 'fastify';
import { createProposalSchema, createRatingSchema } from '@pocket-trade-hub/shared';
import {
  createProposal,
  acceptProposal,
  rejectProposal,
  completeProposal,
  getProposals,
  getProposalThread,
} from '../services/proposal.service';
import { rateTradePartner } from '../services/rating.service';
import { tradeProposals } from '../db/schema';
import { eq } from 'drizzle-orm';
import { t, parseAcceptLanguage } from '../i18n';

export default async function proposalRoutes(fastify: FastifyInstance) {
  // POST /proposals - create a new trade proposal
  fastify.post(
    '/proposals',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const lang = parseAcceptLanguage(request.headers['accept-language']);
      const parsed = createProposalSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: t('errors.validationFailed', lang),
          details: parsed.error.flatten(),
        });
      }

      const userId = request.user.sub;
      const io = (fastify as any).io || null;

      const body = request.body as any;
      const receiverId = body.receiverId;
      if (!receiverId) {
        return reply.code(400).send({ error: t('errors.validationFailed', lang) });
      }

      try {
        const proposal = await createProposal(fastify.db, io, {
          senderId: userId,
          receiverId,
          matchId: parsed.data.matchId,
          postId: parsed.data.postId,
          senderGives: parsed.data.senderGives,
          senderGets: parsed.data.senderGets,
          fairnessScore: parsed.data.fairnessScore,
          parentId: parsed.data.parentId,
        });

        return reply.code(201).send({ proposal });
      } catch (err: any) {
        const status = err.statusCode || 500;
        return reply.code(status).send({ error: err.message });
      }
    },
  );

  // GET /proposals - list proposals
  fastify.get(
    '/proposals',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = request.user.sub;
      const query = request.query as {
        direction?: string;
        status?: string;
        limit?: string;
        offset?: string;
      };

      const result = await getProposals(fastify.db, userId, {
        direction: (query.direction as any) || 'all',
        status: query.status || 'all',
        limit: query.limit ? parseInt(query.limit, 10) : 20,
        offset: query.offset ? parseInt(query.offset, 10) : 0,
      });

      return reply.code(200).send(result);
    },
  );

  // GET /proposals/:id - get proposal thread
  fastify.get(
    '/proposals/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const lang = parseAcceptLanguage(request.headers['accept-language']);
      const { id } = request.params as { id: string };
      const thread = await getProposalThread(fastify.db, id);

      if (thread.length === 0) {
        return reply.code(404).send({ error: t('errors.proposalNotFound', lang) });
      }

      return reply.code(200).send({ thread });
    },
  );

  // PUT /proposals/:id/accept
  fastify.put(
    '/proposals/:id/accept',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user.sub;
      const io = (fastify as any).io || null;

      try {
        const proposal = await acceptProposal(fastify.db, io, id, userId);
        return reply.code(200).send({ proposal });
      } catch (err: any) {
        const status = err.statusCode || 500;
        return reply.code(status).send({ error: err.message });
      }
    },
  );

  // PUT /proposals/:id/reject
  fastify.put(
    '/proposals/:id/reject',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user.sub;
      const io = (fastify as any).io || null;

      try {
        const proposal = await rejectProposal(fastify.db, io, id, userId);
        return reply.code(200).send({ proposal });
      } catch (err: any) {
        const status = err.statusCode || 500;
        return reply.code(status).send({ error: err.message });
      }
    },
  );

  // POST /proposals/:id/counter - create a counter-offer
  fastify.post(
    '/proposals/:id/counter',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const lang = parseAcceptLanguage(request.headers['accept-language']);
      const { id: parentId } = request.params as { id: string };
      const parsed = createProposalSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: t('errors.validationFailed', lang),
          details: parsed.error.flatten(),
        });
      }

      const userId = request.user.sub;
      const io = (fastify as any).io || null;
      const body = request.body as any;
      const receiverId = body.receiverId;

      if (!receiverId) {
        return reply.code(400).send({ error: t('errors.validationFailed', lang) });
      }

      try {
        const proposal = await createProposal(fastify.db, io, {
          senderId: userId,
          receiverId,
          matchId: parsed.data.matchId,
          postId: parsed.data.postId,
          senderGives: parsed.data.senderGives,
          senderGets: parsed.data.senderGets,
          fairnessScore: parsed.data.fairnessScore,
          parentId,
        });

        return reply.code(201).send({ proposal });
      } catch (err: any) {
        const status = err.statusCode || 500;
        return reply.code(status).send({ error: err.message });
      }
    },
  );

  // PUT /proposals/:id/complete
  fastify.put(
    '/proposals/:id/complete',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user.sub;
      const io = (fastify as any).io || null;

      try {
        const proposal = await completeProposal(fastify.db, io, id, userId);
        return reply.code(200).send({ proposal });
      } catch (err: any) {
        const status = err.statusCode || 500;
        return reply.code(status).send({ error: err.message });
      }
    },
  );

  // POST /proposals/:id/rate - rate a trade partner
  fastify.post(
    '/proposals/:id/rate',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const lang = parseAcceptLanguage(request.headers['accept-language']);
      const { id: proposalId } = request.params as { id: string };
      const parsed = createRatingSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: t('errors.validationFailed', lang),
          details: parsed.error.flatten(),
        });
      }

      const userId = request.user.sub;

      // Determine ratedId from proposal
      const [proposal] = await fastify.db
        .select()
        .from(tradeProposals)
        .where(eq(tradeProposals.id, proposalId))
        .limit(1);

      if (!proposal) {
        return reply.code(404).send({ error: t('errors.proposalNotFound', lang) });
      }

      const ratedId =
        proposal.senderId === userId
          ? proposal.receiverId
          : proposal.senderId;

      try {
        const rating = await rateTradePartner(fastify.db, {
          proposalId,
          raterId: userId,
          ratedId,
          stars: parsed.data.stars,
        });

        if (rating === null) {
          return reply.code(200).send({ message: 'Already rated' });
        }

        return reply.code(201).send(rating);
      } catch (err: any) {
        const status = err.statusCode || 500;
        return reply.code(status).send({ error: err.message });
      }
    },
  );
}
