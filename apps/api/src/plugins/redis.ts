import fp from 'fastify-plugin';
import IORedis from 'ioredis';
import type { FastifyInstance } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    redis: IORedis;
  }
}

export default fp(async (fastify: FastifyInstance) => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  const redis = new IORedis(redisUrl, {
    maxRetriesPerRequest: null, // Required by BullMQ
  });

  fastify.decorate('redis', redis);

  fastify.addHook('onClose', async () => {
    await redis.quit();
  });
});
