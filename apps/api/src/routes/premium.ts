import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { users } from '../db/schema';
import { handleWebhookEvent, isPremiumUser } from '../services/premium.service';
import { getAnalytics, getTradePower } from '../services/analytics.service';
import { t, parseAcceptLanguage } from '../i18n';

export default async function premiumRoutes(fastify: FastifyInstance) {
  // POST /webhooks/revenuecat - RevenueCat webhook handler
  // No auth middleware -- authenticated via shared secret header
  fastify.post('/webhooks/revenuecat', async (request, reply) => {
    const lang = parseAcceptLanguage(request.headers['accept-language']);
    const authHeader = request.headers.authorization;
    const expectedSecret = process.env.REVENUECAT_WEBHOOK_SECRET || 'test-webhook-secret';

    if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
      return reply.code(401).send({ error: t('errors.unauthorized', lang) });
    }

    const body = request.body as any;
    const event = body.event || body;

    await handleWebhookEvent(fastify.db, {
      type: event.type,
      app_user_id: event.app_user_id,
      expiration_at_ms: event.expiration_at_ms || null,
    });

    return reply.code(200).send({ ok: true });
  });

  // Premium routes with /premium prefix
  fastify.register(
    async (f) => {
      // GET /premium/status - authenticated user's subscription status
      f.get(
        '/status',
        { preHandler: [fastify.authenticate] },
        async (request, reply) => {
          const lang = parseAcceptLanguage(request.headers['accept-language']);
          const userId = request.user.sub;

          const [user] = await fastify.db
            .select({
              isPremium: users.isPremium,
              premiumExpiresAt: users.premiumExpiresAt,
            })
            .from(users)
            .where(eq(users.id, userId));

          if (!user) {
            return reply.code(404).send({ error: t('errors.userNotFound', lang) });
          }

          return reply.code(200).send({
            isPremium: user.isPremium,
            premiumExpiresAt: user.premiumExpiresAt?.toISOString() || null,
          });
        }
      );

      // GET /premium/analytics - premium-gated analytics endpoint
      f.get(
        '/analytics',
        { preHandler: [fastify.authenticate] },
        async (request, reply) => {
          const lang = parseAcceptLanguage(request.headers['accept-language']);
          const userId = request.user.sub;

          // Premium gate
          const premium = await isPremiumUser(fastify.db, userId);
          if (!premium) {
            return reply.code(403).send({ error: t('errors.unauthorized', lang) });
          }

          const analytics = await getAnalytics(fastify.db);
          const tradePower = await getTradePower(fastify.db, userId);

          return reply.code(200).send({
            ...analytics,
            tradePower,
          });
        }
      );

      // POST /premium/sync - fallback sync endpoint
      f.post(
        '/sync',
        { preHandler: [fastify.authenticate] },
        async (request, reply) => {
          const lang = parseAcceptLanguage(request.headers['accept-language']);
          const userId = request.user.sub;

          // TODO: In production, call RevenueCat REST API to verify subscription status
          const [user] = await fastify.db
            .select({
              isPremium: users.isPremium,
              premiumExpiresAt: users.premiumExpiresAt,
            })
            .from(users)
            .where(eq(users.id, userId));

          if (!user) {
            return reply.code(404).send({ error: t('errors.userNotFound', lang) });
          }

          return reply.code(200).send({
            isPremium: user.isPremium,
            premiumExpiresAt: user.premiumExpiresAt?.toISOString() || null,
          });
        }
      );
    },
    { prefix: '/premium' }
  );
}
