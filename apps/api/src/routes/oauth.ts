import type { FastifyInstance } from 'fastify';
import { oauthLoginSchema, linkAccountSchema } from '@pocket-trade-hub/shared';
import {
  verifyGoogleToken,
  verifyAppleToken,
  findOrCreateOAuthUser,
  linkOAuthAccount,
} from '../services/oauth.service';
import { issueTokens } from '../services/auth.service';

export default async function oauthRoutes(fastify: FastifyInstance) {
  // POST /auth/oauth/google
  fastify.post('/auth/oauth/google', async (request, reply) => {
    const parsed = oauthLoginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    let payload: { sub: string; email: string; name?: string };
    try {
      payload = await verifyGoogleToken(parsed.data.idToken);
    } catch {
      return reply.code(401).send({ error: 'Invalid token' });
    }

    const result = await findOrCreateOAuthUser(
      fastify.db,
      'google',
      payload.sub,
      payload.email,
      payload.name
    );

    if (result.needsLinking) {
      return reply.code(200).send({
        needsLinking: true,
        email: result.email,
        provider: 'google',
      });
    }

    const tokens = await issueTokens(fastify, result.user!.id);
    return reply.code(200).send({
      ...tokens,
      user: result.user,
    });
  });

  // POST /auth/oauth/apple
  fastify.post('/auth/oauth/apple', async (request, reply) => {
    const parsed = oauthLoginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    let payload: { sub: string; email?: string };
    try {
      payload = await verifyAppleToken(parsed.data.idToken);
    } catch {
      return reply.code(401).send({ error: 'Invalid token' });
    }

    const result = await findOrCreateOAuthUser(
      fastify.db,
      'apple',
      payload.sub,
      payload.email
    );

    if (result.needsLinking) {
      return reply.code(200).send({
        needsLinking: true,
        email: result.email,
        provider: 'apple',
      });
    }

    const tokens = await issueTokens(fastify, result.user!.id);
    return reply.code(200).send({
      ...tokens,
      user: result.user,
    });
  });

  // POST /auth/link (requires authentication)
  fastify.post(
    '/auth/link',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const parsed = linkAccountSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
      }

      const { provider, idToken, password } = parsed.data;
      const userId = (request.user as { sub: string }).sub;

      // Verify the OAuth token to get provider user ID
      let providerUserId: string;
      let providerEmail: string | undefined;

      try {
        if (provider === 'google') {
          const payload = await verifyGoogleToken(idToken);
          providerUserId = payload.sub;
          providerEmail = payload.email;
        } else {
          const payload = await verifyAppleToken(idToken);
          providerUserId = payload.sub;
          providerEmail = payload.email;
        }
      } catch {
        return reply.code(401).send({ error: 'Invalid token' });
      }

      try {
        await linkOAuthAccount(
          fastify.db,
          userId,
          password,
          provider,
          providerUserId,
          providerEmail
        );
        return reply.code(200).send({ message: 'Account linked successfully' });
      } catch (err: any) {
        if (err.message === 'Invalid password') {
          return reply.code(401).send({ error: 'Invalid password' });
        }
        if (err.message === 'Provider already linked to this account') {
          return reply.code(409).send({ error: 'Provider already linked to this account' });
        }
        throw err;
      }
    }
  );
}
