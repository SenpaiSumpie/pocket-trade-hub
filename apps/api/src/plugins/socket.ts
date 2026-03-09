import fp from 'fastify-plugin';
import { Server } from 'socket.io';
import type { FastifyInstance } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    io: Server;
  }
}

export default fp(async (fastify: FastifyInstance) => {
  const io = new Server(fastify.server, {
    cors: { origin: true },
  });

  io.on('connection', (socket) => {
    const userId = socket.handshake.auth.userId as string | undefined;
    if (userId) {
      socket.join(`user:${userId}`);
    }
  });

  fastify.decorate('io', io);

  fastify.addHook('onClose', async () => {
    io.close();
  });
});
