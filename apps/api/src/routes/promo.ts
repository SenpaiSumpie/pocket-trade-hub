import type { FastifyInstance } from 'fastify';
import { redeemCodeSchema, createPromoCodeSchema } from '@pocket-trade-hub/shared';
import { requireAdmin } from '../middleware/admin';
import {
  createCode,
  listCodes,
  deactivateCode,
  redeemCode,
} from '../services/promo.service';
import { t, parseAcceptLanguage } from '../i18n';

export default async function promoRoutes(fastify: FastifyInstance) {
  // POST /promo/redeem - authenticated user redeems a promo code
  fastify.post(
    '/promo/redeem',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const lang = parseAcceptLanguage(request.headers['accept-language']);
      const parsed = redeemCodeSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: t('errors.validationFailed', lang),
          details: parsed.error.flatten(),
        });
      }

      try {
        const userId = request.user.sub;
        const result = await redeemCode(fastify.db, userId, parsed.data.code);

        return reply.code(200).send({
          premiumDays: result.premiumDays,
          newExpiresAt: result.newExpiresAt.toISOString(),
        });
      } catch (err: any) {
        const message = err.message || 'Failed to redeem code';
        if (message.includes('already redeemed')) {
          return reply.code(409).send({ error: t('errors.codeAlreadyRedeemed', lang) });
        }
        if (message.includes('expired')) {
          return reply.code(400).send({ error: t('errors.promoCodeExpired', lang) });
        }
        return reply.code(400).send({ error: t('errors.invalidPromoCode', lang) });
      }
    },
  );

  // POST /admin/promo - admin creates a promo code
  fastify.post(
    '/admin/promo',
    { preHandler: [fastify.authenticate, requireAdmin] },
    async (request, reply) => {
      const lang = parseAcceptLanguage(request.headers['accept-language']);
      const parsed = createPromoCodeSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: t('errors.validationFailed', lang),
          details: parsed.error.flatten(),
        });
      }

      try {
        const created = await createCode(fastify.db, parsed.data);
        return reply.code(201).send(created);
      } catch (err: any) {
        if (err.message?.includes('unique') || err.code === '23505') {
          return reply.code(409).send({ error: 'A promo code with this code already exists' });
        }
        throw err;
      }
    },
  );

  // GET /admin/promo - admin lists all promo codes
  fastify.get(
    '/admin/promo',
    { preHandler: [fastify.authenticate, requireAdmin] },
    async (request, reply) => {
      const codes = await listCodes(fastify.db);
      return reply.code(200).send(codes);
    },
  );

  // PATCH /admin/promo/:id/deactivate - admin deactivates a promo code
  fastify.patch(
    '/admin/promo/:id/deactivate',
    { preHandler: [fastify.authenticate, requireAdmin] },
    async (request, reply) => {
      const lang = parseAcceptLanguage(request.headers['accept-language']);
      const { id } = request.params as { id: string };
      const updated = await deactivateCode(fastify.db, id);

      if (!updated) {
        return reply.code(404).send({ error: t('errors.notFound', lang) });
      }

      return reply.code(200).send(updated);
    },
  );
}
