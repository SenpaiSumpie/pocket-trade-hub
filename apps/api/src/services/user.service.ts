import { eq } from 'drizzle-orm';
import { users } from '../db/schema';
import type { FastifyInstance } from 'fastify';
import type { UpdateProfileInput } from '@pocket-trade-hub/shared';

type Db = FastifyInstance['db'];

export async function getUserById(db: Db, id: string) {
  const [user] = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      avatarId: users.avatarId,
      friendCode: users.friendCode,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return user || null;
}

export async function getOwnProfile(db: Db, id: string) {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      avatarId: users.avatarId,
      friendCode: users.friendCode,
      emailVerified: users.emailVerified,
      uiLanguage: users.uiLanguage,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return user || null;
}

export async function updateProfile(
  db: Db,
  id: string,
  data: UpdateProfileInput
) {
  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.displayName !== undefined) {
    updateData.displayName = data.displayName;
  }
  if (data.avatarId !== undefined) {
    updateData.avatarId = data.avatarId;
  }
  if (data.friendCode !== undefined) {
    updateData.friendCode = data.friendCode;
  }
  if (data.uiLanguage !== undefined) {
    updateData.uiLanguage = data.uiLanguage;
  }

  const [updated] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      avatarId: users.avatarId,
      friendCode: users.friendCode,
      emailVerified: users.emailVerified,
      uiLanguage: users.uiLanguage,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    });

  return updated;
}
