import { pgTable, text, timestamp, varchar, integer, boolean, jsonb, pgEnum, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: varchar('display_name', { length: 30 }),
  avatarId: varchar('avatar_id', { length: 50 }),
  friendCode: varchar('friend_code', { length: 19 }),
  isAdmin: boolean('is_admin').default(false).notNull(),
  emailVerified: timestamp('email_verified'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const refreshTokens = pgTable('refresh_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  revokedAt: timestamp('revoked_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const rarityEnum = pgEnum('rarity', [
  'diamond1', 'diamond2', 'diamond3', 'diamond4',
  'star1', 'star2', 'star3', 'crown',
]);

export const sets = pgTable('sets', {
  id: text('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  series: varchar('series', { length: 10 }).notNull(),
  cardCount: integer('card_count').notNull(),
  releaseDate: varchar('release_date', { length: 10 }),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const cards = pgTable('cards', {
  id: text('id').primaryKey(),
  setId: text('set_id').notNull().references(() => sets.id),
  localId: varchar('local_id', { length: 10 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  rarity: rarityEnum('rarity'),
  type: varchar('type', { length: 30 }),
  category: varchar('category', { length: 30 }),
  hp: integer('hp'),
  stage: varchar('stage', { length: 20 }),
  imageUrl: text('image_url').notNull(),
  attacks: jsonb('attacks'),
  weakness: varchar('weakness', { length: 30 }),
  resistance: varchar('resistance', { length: 30 }),
  retreatCost: integer('retreat_cost'),
  illustrator: varchar('illustrator', { length: 100 }),
  cardNumber: varchar('card_number', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('cards_name_lower_idx').on(sql`lower(${table.name})`),
  index('cards_set_id_idx').on(table.setId),
  index('cards_rarity_idx').on(table.rarity),
  index('cards_type_idx').on(table.type),
]);

export const pushTokens = pgTable('push_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  token: text('token').notNull().unique(),
  platform: varchar('platform', { length: 10 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
