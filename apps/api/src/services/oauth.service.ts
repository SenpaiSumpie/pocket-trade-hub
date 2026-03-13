import { OAuth2Client } from 'google-auth-library';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { randomUUID } from 'crypto';
import { eq, and } from 'drizzle-orm';
import { users, oauthAccounts } from '../db/schema';
import type { FastifyInstance } from 'fastify';

type Db = FastifyInstance['db'];

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const APPLE_BUNDLE_ID = process.env.APPLE_BUNDLE_ID || '';
const APPLE_JWKS_URL = 'https://appleid.apple.com/auth/keys';

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
const appleJWKS = createRemoteJWKSet(new URL(APPLE_JWKS_URL));

export async function verifyGoogleToken(
  idToken: string
): Promise<{ sub: string; email: string; name?: string }> {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload || !payload.sub || !payload.email) {
    throw new Error('Invalid Google token payload');
  }
  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
  };
}

export async function verifyAppleToken(
  identityToken: string
): Promise<{ sub: string; email?: string }> {
  const { payload } = await jwtVerify(identityToken, appleJWKS, {
    issuer: 'https://appleid.apple.com',
    audience: APPLE_BUNDLE_ID,
  });
  if (!payload.sub) {
    throw new Error('Invalid Apple token payload');
  }
  return {
    sub: payload.sub as string,
    email: payload.email as string | undefined,
  };
}

export async function findOrCreateOAuthUser(
  db: Db,
  provider: string,
  providerUserId: string,
  email?: string,
  name?: string
): Promise<{
  user?: { id: string; email: string; displayName: string | null; avatarId: string | null; friendCode: string | null; createdAt: Date };
  needsLinking?: boolean;
  email?: string;
  provider?: string;
  isNew?: boolean;
}> {
  // Check if OAuth account already exists
  const [existingOAuth] = await db
    .select()
    .from(oauthAccounts)
    .where(
      and(
        eq(oauthAccounts.provider, provider),
        eq(oauthAccounts.providerUserId, providerUserId)
      )
    )
    .limit(1);

  if (existingOAuth) {
    // Return existing user
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        avatarId: users.avatarId,
        friendCode: users.friendCode,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, existingOAuth.userId))
      .limit(1);

    return { user, isNew: false };
  }

  // Check if email matches an existing user
  if (email) {
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (existingUser) {
      // Check if this provider is already linked to this user
      const [existingLink] = await db
        .select()
        .from(oauthAccounts)
        .where(
          and(
            eq(oauthAccounts.userId, existingUser.id),
            eq(oauthAccounts.provider, provider)
          )
        )
        .limit(1);

      if (!existingLink) {
        return { needsLinking: true, email, provider };
      }
    }
  }

  // Create new user with null passwordHash
  const userId = randomUUID();
  const [newUser] = await db
    .insert(users)
    .values({
      id: userId,
      email: email ? email.toLowerCase().trim() : `${provider}-${providerUserId}@oauth.local`,
      passwordHash: null,
      displayName: name || null,
    })
    .returning({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      avatarId: users.avatarId,
      friendCode: users.friendCode,
      createdAt: users.createdAt,
    });

  // Create OAuth account link
  await db.insert(oauthAccounts).values({
    id: randomUUID(),
    userId,
    provider,
    providerUserId,
    email: email || null,
  });

  return { user: newUser, isNew: true };
}

export async function linkOAuthAccount(
  db: Db,
  userId: string,
  password: string,
  provider: string,
  providerUserId: string,
  providerEmail?: string
): Promise<void> {
  const bcrypt = await import('bcrypt');

  // Load user and verify password
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user || !user.passwordHash) {
    throw new Error('Invalid password');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new Error('Invalid password');
  }

  // Check if provider already linked
  const [existingLink] = await db
    .select()
    .from(oauthAccounts)
    .where(
      and(
        eq(oauthAccounts.userId, userId),
        eq(oauthAccounts.provider, provider)
      )
    )
    .limit(1);

  if (existingLink) {
    throw new Error('Provider already linked to this account');
  }

  // Create OAuth link
  await db.insert(oauthAccounts).values({
    id: randomUUID(),
    userId,
    provider,
    providerUserId,
    email: providerEmail || null,
  });
}
