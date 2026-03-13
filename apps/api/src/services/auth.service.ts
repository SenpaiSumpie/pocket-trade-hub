import bcrypt from 'bcrypt';
import { randomUUID, randomBytes, createHash } from 'crypto';
import { eq, and, isNull } from 'drizzle-orm';
import { users, refreshTokens, passwordResetTokens } from '../db/schema';
import type { FastifyInstance } from 'fastify';

const SALT_ROUNDS = 10;
const REFRESH_TOKEN_EXPIRY_DAYS = 30;
const RESET_TOKEN_EXPIRY_MINUTES = 30;

type Db = FastifyInstance['db'];

export async function createUser(db: Db, email: string, password: string) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const id = randomUUID();

  const [user] = await db
    .insert(users)
    .values({
      id,
      email: email.toLowerCase().trim(),
      passwordHash,
    })
    .returning({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      avatarId: users.avatarId,
      friendCode: users.friendCode,
      createdAt: users.createdAt,
    });

  return user;
}

export async function verifyCredentials(
  db: Db,
  email: string,
  password: string
) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1);

  if (!user) {
    throw new Error('Invalid credentials');
  }

  if (!user.passwordHash) {
    throw new Error('Invalid credentials');
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new Error('Invalid credentials');
  }

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarId: user.avatarId,
    friendCode: user.friendCode,
    createdAt: user.createdAt,
  };
}

export async function issueTokens(
  fastify: FastifyInstance,
  userId: string
) {
  const accessToken = fastify.jwt.sign(
    { sub: userId },
    { expiresIn: '15m' }
  );

  const refreshToken = fastify.jwt.sign(
    { sub: userId, type: 'refresh', jti: randomUUID() } as any,
    { expiresIn: '30d' }
  );

  // Store refresh token hash
  const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await fastify.db.insert(refreshTokens).values({
    id: randomUUID(),
    userId,
    tokenHash,
    expiresAt,
  });

  return { accessToken, refreshToken };
}

export async function refreshAccessToken(
  fastify: FastifyInstance,
  refreshToken: string
) {
  // Verify the JWT first
  let payload: { sub: string; type?: string };
  try {
    payload = fastify.jwt.verify<{ sub: string; type?: string }>(refreshToken);
  } catch {
    throw new Error('Invalid refresh token');
  }

  if (payload.type !== 'refresh') {
    throw new Error('Invalid refresh token');
  }

  // Find the token hash in the DB
  const tokenHash = createHash('sha256').update(refreshToken).digest('hex');

  const [storedToken] = await fastify.db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.tokenHash, tokenHash),
        isNull(refreshTokens.revokedAt)
      )
    )
    .limit(1);

  if (!storedToken) {
    throw new Error('Refresh token not found or revoked');
  }

  if (storedToken.expiresAt < new Date()) {
    throw new Error('Refresh token expired');
  }

  // Revoke old token (rotation)
  await fastify.db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.id, storedToken.id));

  // Issue new token pair
  return issueTokens(fastify, payload.sub);
}

export async function revokeRefreshToken(db: Db, refreshToken: string) {
  const tokenHash = createHash('sha256').update(refreshToken).digest('hex');

  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.tokenHash, tokenHash));
}

export async function requestPasswordReset(db: Db, email: string) {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1);

  if (!user) {
    // Return null but don't reveal that email doesn't exist
    return null;
  }

  // Generate random token
  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + RESET_TOKEN_EXPIRY_MINUTES);

  await db.insert(passwordResetTokens).values({
    id: randomUUID(),
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  return rawToken;
}

export async function confirmPasswordReset(
  db: Db,
  token: string,
  newPassword: string
) {
  const tokenHash = createHash('sha256').update(token).digest('hex');

  const [resetToken] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        isNull(passwordResetTokens.usedAt)
      )
    )
    .limit(1);

  if (!resetToken) {
    throw new Error('Invalid or already used reset token');
  }

  if (resetToken.expiresAt < new Date()) {
    throw new Error('Reset token expired');
  }

  // Update password
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, resetToken.userId));

  // Mark token as used
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, resetToken.id));
}

export async function findUserByEmail(db: Db, email: string) {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1);

  return user || null;
}
