import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  registerPushToken,
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
} from '../services/notification.service';

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
    },
  );

  // GET /notifications — list notifications for current user
  fastify.get(
    '/notifications',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = request.user.sub;
      const query = request.query as { limit?: string; cursor?: string };

      const result = await getNotifications(fastify.db, userId, {
        limit: query.limit ? parseInt(query.limit, 10) : 20,
        cursor: query.cursor,
      });

      return reply.code(200).send(result);
    },
  );

  // GET /notifications/unread-count — get unread notification count
  fastify.get(
    '/notifications/unread-count',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = request.user.sub;
      const count = await getUnreadCount(fastify.db, userId);
      return reply.code(200).send({ count });
    },
  );

  // PUT /notifications/:id/read — mark single notification as read
  fastify.put(
    '/notifications/:id/read',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = request.user.sub;
      const { id } = request.params as { id: string };

      const updated = await markRead(fastify.db, id, userId);
      if (!updated) {
        return reply.code(404).send({ error: 'Notification not found' });
      }

      return reply.code(200).send({ success: true });
    },
  );

  // PUT /notifications/read-all — mark all notifications as read
  fastify.put(
    '/notifications/read-all',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = request.user.sub;
      const count = await markAllRead(fastify.db, userId);
      return reply.code(200).send({ updated: count });
    },
  );
}
