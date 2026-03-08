import type { FastifyInstance } from 'fastify';
import {
  signupSchema,
  loginSchema,
  resetRequestSchema,
  resetConfirmSchema,
} from '@pocket-trade-hub/shared';
import {
  createUser,
  verifyCredentials,
  issueTokens,
  refreshAccessToken,
  revokeRefreshToken,
  requestPasswordReset,
  confirmPasswordReset,
  findUserByEmail,
} from '../services/auth.service';
import { eq } from 'drizzle-orm';
import { users } from '../db/schema';

export default async function authRoutes(fastify: FastifyInstance) {
  // POST /auth/signup
  fastify.post('/auth/signup', async (request, reply) => {
    const parsed = signupSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    const { email, password } = parsed.data;

    // Check for duplicate email
    const existing = await findUserByEmail(fastify.db, email);
    if (existing) {
      return reply.code(409).send({ error: 'Email already registered' });
    }

    const user = await createUser(fastify.db, email, password);
    const tokens = await issueTokens(fastify, user.id);

    return reply.code(201).send({
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarId: user.avatarId,
        friendCode: user.friendCode,
        createdAt: user.createdAt,
      },
    });
  });

  // POST /auth/login
  fastify.post('/auth/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    const { email, password } = parsed.data;

    let user;
    try {
      user = await verifyCredentials(fastify.db, email, password);
    } catch {
      return reply.code(401).send({ error: 'Invalid email or password' });
    }

    const tokens = await issueTokens(fastify, user.id);

    return reply.code(200).send({
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarId: user.avatarId,
        friendCode: user.friendCode,
        createdAt: user.createdAt,
      },
    });
  });

  // POST /auth/refresh
  fastify.post('/auth/refresh', async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken?: string };

    if (!refreshToken) {
      return reply.code(400).send({ error: 'Refresh token is required' });
    }

    try {
      const tokens = await refreshAccessToken(fastify, refreshToken);
      return reply.code(200).send(tokens);
    } catch {
      return reply.code(401).send({ error: 'Invalid or expired refresh token' });
    }
  });

  // POST /auth/logout
  fastify.post(
    '/auth/logout',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { refreshToken } = request.body as { refreshToken?: string };

      if (refreshToken) {
        await revokeRefreshToken(fastify.db, refreshToken);
      }

      return reply.code(200).send({ message: 'Logged out successfully' });
    }
  );

  // POST /auth/reset-request
  fastify.post('/auth/reset-request', async (request, reply) => {
    const parsed = resetRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    const { email } = parsed.data;

    const resetToken = await requestPasswordReset(fastify.db, email);

    if (resetToken) {
      // In development, log the token (in production, send via email)
      console.log(`[DEV] Password reset token for ${email}: ${resetToken}`);
    }

    // Always return 200 to prevent email enumeration
    return reply.code(200).send({
      message: 'If that email exists, a reset link has been sent',
      // Include resetToken in response for development/testing
      ...(process.env.NODE_ENV !== 'production' && resetToken
        ? { resetToken }
        : {}),
    });
  });

  // POST /auth/reset-confirm
  fastify.post('/auth/reset-confirm', async (request, reply) => {
    const parsed = resetConfirmSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    const { token, newPassword } = parsed.data;

    try {
      await confirmPasswordReset(fastify.db, token, newPassword);
      return reply.code(200).send({ message: 'Password reset successfully' });
    } catch {
      return reply.code(400).send({ error: 'Invalid or expired reset token' });
    }
  });
}
