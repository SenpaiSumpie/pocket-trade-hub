import type { FastifyInstance, FastifyReply } from 'fastify';
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
import { t, parseAcceptLanguage } from '../i18n';

function setAuthCookies(
  reply: FastifyReply,
  accessToken: string,
  refreshToken: string
) {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOpts = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ('none' as const) : ('lax' as const),
    path: '/',
  };

  reply
    .setCookie('accessToken', accessToken, { ...cookieOpts, maxAge: 15 * 60 })
    .setCookie('refreshToken', refreshToken, {
      ...cookieOpts,
      maxAge: 7 * 24 * 60 * 60,
    });
}

export default async function authRoutes(fastify: FastifyInstance) {
  // POST /auth/signup
  fastify.post('/auth/signup', async (request, reply) => {
    const lang = parseAcceptLanguage(request.headers['accept-language']);
    const parsed = signupSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: t('errors.validationFailed', lang), details: parsed.error.flatten() });
    }

    const { email, password } = parsed.data;

    // Check for duplicate email
    const existing = await findUserByEmail(fastify.db, email);
    if (existing) {
      return reply.code(409).send({ error: t('errors.emailAlreadyRegistered', lang) });
    }

    const user = await createUser(fastify.db, email, password);
    const tokens = await issueTokens(fastify, user.id);

    setAuthCookies(reply, tokens.accessToken, tokens.refreshToken);

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
    const lang = parseAcceptLanguage(request.headers['accept-language']);
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: t('errors.validationFailed', lang), details: parsed.error.flatten() });
    }

    const { email, password } = parsed.data;

    let user;
    try {
      user = await verifyCredentials(fastify.db, email, password);
    } catch {
      return reply.code(401).send({ error: t('errors.invalidCredentials', lang) });
    }

    const tokens = await issueTokens(fastify, user.id);

    setAuthCookies(reply, tokens.accessToken, tokens.refreshToken);

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
    const lang = parseAcceptLanguage(request.headers['accept-language']);
    const body = request.body as { refreshToken?: string } | undefined;
    const refreshToken = body?.refreshToken || request.cookies?.refreshToken;

    if (!refreshToken) {
      return reply.code(400).send({ error: t('errors.validationFailed', lang) });
    }

    try {
      const tokens = await refreshAccessToken(fastify, refreshToken);

      setAuthCookies(reply, tokens.accessToken, tokens.refreshToken);

      return reply.code(200).send(tokens);
    } catch {
      return reply.code(401).send({ error: t('errors.unauthorized', lang) });
    }
  });

  // POST /auth/logout
  fastify.post(
    '/auth/logout',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const body = request.body as { refreshToken?: string } | undefined;
      const refreshToken = body?.refreshToken || request.cookies?.refreshToken;

      if (refreshToken) {
        await revokeRefreshToken(fastify.db, refreshToken);
      }

      reply
        .clearCookie('accessToken', { path: '/' })
        .clearCookie('refreshToken', { path: '/' });

      return reply.code(200).send({ message: 'Logged out successfully' });
    }
  );

  // POST /auth/reset-request
  fastify.post('/auth/reset-request', async (request, reply) => {
    const lang = parseAcceptLanguage(request.headers['accept-language']);
    const parsed = resetRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: t('errors.validationFailed', lang), details: parsed.error.flatten() });
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
    const lang = parseAcceptLanguage(request.headers['accept-language']);
    const parsed = resetConfirmSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: t('errors.validationFailed', lang), details: parsed.error.flatten() });
    }

    const { token, newPassword } = parsed.data;

    try {
      await confirmPasswordReset(fastify.db, token, newPassword);
      return reply.code(200).send({ message: 'Password reset successfully' });
    } catch {
      return reply.code(400).send({ error: t('errors.unauthorized', lang) });
    }
  });
}
