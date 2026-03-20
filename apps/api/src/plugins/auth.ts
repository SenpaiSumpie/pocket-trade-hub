import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; type?: string };
    user: { sub: string; type?: string };
  }
}

export default fp(async (fastify: FastifyInstance) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  fastify.register(jwt, {
    secret,
    sign: { expiresIn: '15m' },
  });

  fastify.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Try Bearer header first (mobile clients)
        await request.jwtVerify();
      } catch {
        // Fall back to cookie-based auth (web clients)
        const token = request.cookies?.accessToken;
        if (token) {
          try {
            const decoded = fastify.jwt.verify<{ sub: string; type?: string }>(token);
            request.user = decoded;
            return;
          } catch {
            // Cookie token invalid, fall through to 401
          }
        }
        reply.code(401).send({ error: 'Unauthorized' });
      }
    }
  );
});
