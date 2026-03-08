import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { registerPushToken } from '../services/notification.service';

const registerTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(['ios', 'android', 'web']),
});

export default async function notificationRoutes(fastify: FastifyInstance) {
  // POST /notifications/register-token — register a push token (auth required)
  fastify.post(
    '/notifications/register-token',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const parsed = registerTokenSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: 'Invalid body',
          details: parsed.error.flatten(),
        });
      }

      const userId = (request.user as any).id;
      const { token, platform } = parsed.data;

      await registerPushToken(fastify.db, userId, token, platform);

      return reply.code(200).send({ message: 'Token registered' });
    }
  );
}
