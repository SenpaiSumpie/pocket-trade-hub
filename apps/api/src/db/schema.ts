import { pgTable, text, timestamp, varchar, integer, boolean, jsonb, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Supported card languages (TCGdex available: en, de, es, fr, it, pt; future: ja, ko, zh)
export const supportedLanguages = ['en', 'de', 'es', 'fr', 'it', 'ja', 'ko', 'pt', 'zh'] as const;
export type CardLanguage = typeof supportedLanguages[number];

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash'),
  displayName: varchar('display_name', { length: 30 }),
  avatarId: varchar('avatar_id', { length: 50 }),
  friendCode: varchar('friend_code', { length: 19 }),
  isAdmin: boolean('is_admin').default(false).notNull(),
  isPremium: boolean('is_premium').default(false).notNull(),
  premiumExpiresAt: timestamp('premium_expires_at'),
  revenuecatId: varchar('revenuecat_id', { length: 100 }),
  preferredCardLanguage: varchar('preferred_card_language', { length: 5 }).default('en'),
  uiLanguage: varchar('ui_language', { length: 5 }).default('en'),
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

export const oauthAccounts = pgTable('oauth_accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  provider: varchar('provider', { length: 20 }).notNull(),
  providerUserId: text('provider_user_id').notNull(),
  email: varchar('email', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('oauth_accounts_provider_user_idx').on(table.provider, table.providerUserId),
  index('oauth_accounts_user_id_idx').on(table.userId),
]);

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

export const cardTranslations = pgTable('card_translations', {
  id: text('id').primaryKey(),
  cardId: text('card_id')
    .notNull()
    .references(() => cards.id),
  language: varchar('language', { length: 5 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  imageUrl: text('image_url').notNull(),
  attacks: jsonb('attacks'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('card_translations_card_lang_idx').on(table.cardId, table.language),
  index('card_translations_language_idx').on(table.language),
  index('card_translations_name_lower_idx').on(sql`lower(${table.name})`),
]);

export const priorityEnum = pgEnum('priority', ['high', 'medium', 'low']);

export const userCollectionItems = pgTable('user_collection_items', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  cardId: text('card_id')
    .notNull()
    .references(() => cards.id),
  language: varchar('language', { length: 5 }).notNull().default('en'),
  quantity: integer('quantity').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('user_collection_items_user_card_lang_idx').on(table.userId, table.cardId, table.language),
  index('user_collection_items_user_id_idx').on(table.userId),
  index('user_collection_items_card_id_idx').on(table.cardId),
]);

export const userWantedCards = pgTable('user_wanted_cards', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  cardId: text('card_id')
    .notNull()
    .references(() => cards.id),
  language: varchar('language', { length: 5 }).notNull().default('en'),
  priority: priorityEnum('priority').default('medium').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('user_wanted_cards_user_card_lang_idx').on(table.userId, table.cardId, table.language),
  index('user_wanted_cards_user_id_idx').on(table.userId),
  index('user_wanted_cards_card_id_idx').on(table.cardId),
]);

export const tradeMatches = pgTable('trade_matches', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  partnerId: text('partner_id')
    .notNull()
    .references(() => users.id),
  userGives: jsonb('user_gives').notNull(),
  userGets: jsonb('user_gets').notNull(),
  score: integer('score').notNull(),
  starRating: integer('star_rating').notNull(),
  cardCount: integer('card_count').notNull(),
  seen: boolean('seen').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('trade_matches_user_partner_idx').on(table.userId, table.partnerId),
  index('trade_matches_user_id_idx').on(table.userId),
  index('trade_matches_user_seen_idx').on(table.userId, table.seen),
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

export const proposalStatusEnum = pgEnum('proposal_status', [
  'pending',
  'accepted',
  'rejected',
  'countered',
  'completed',
  'cancelled',
]);

export const tradeProposals = pgTable('trade_proposals', {
  id: text('id').primaryKey(),
  matchId: text('match_id'),
  postId: text('post_id'),
  senderId: text('sender_id')
    .notNull()
    .references(() => users.id),
  receiverId: text('receiver_id')
    .notNull()
    .references(() => users.id),
  parentId: text('parent_id'),
  status: proposalStatusEnum('status').default('pending').notNull(),
  senderGives: jsonb('sender_gives').notNull(),
  senderGets: jsonb('sender_gets').notNull(),
  fairnessScore: integer('fairness_score').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('trade_proposals_sender_id_idx').on(table.senderId),
  index('trade_proposals_receiver_id_idx').on(table.receiverId),
  index('trade_proposals_match_id_idx').on(table.matchId),
  index('trade_proposals_post_id_idx').on(table.postId),
  index('trade_proposals_status_idx').on(table.status),
  index('trade_proposals_parent_id_idx').on(table.parentId),
]);

export const tradeRatings = pgTable('trade_ratings', {
  id: text('id').primaryKey(),
  proposalId: text('proposal_id')
    .notNull()
    .references(() => tradeProposals.id),
  raterId: text('rater_id')
    .notNull()
    .references(() => users.id),
  ratedId: text('rated_id')
    .notNull()
    .references(() => users.id),
  stars: integer('stars').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('trade_ratings_proposal_rater_idx').on(table.proposalId, table.raterId),
]);

export const cardAnalytics = pgTable('card_analytics', {
  id: text('id').primaryKey(),
  cardId: text('card_id')
    .notNull()
    .references(() => cards.id),
  metric: varchar('metric', { length: 30 }).notNull(),
  value: integer('value').notNull(),
  rank: integer('rank').notNull(),
  computedAt: timestamp('computed_at').defaultNow().notNull(),
}, (table) => [
  index('card_analytics_metric_rank_idx').on(table.metric, table.rank),
  uniqueIndex('card_analytics_card_metric_idx').on(table.cardId, table.metric),
]);

export const cardAlertEvents = pgTable('card_alert_events', {
  id: text('id').primaryKey(),
  premiumUserId: text('premium_user_id')
    .notNull()
    .references(() => users.id),
  cardId: text('card_id')
    .notNull()
    .references(() => cards.id),
  addedByUserId: text('added_by_user_id')
    .notNull()
    .references(() => users.id),
  processed: boolean('processed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('card_alert_events_user_processed_idx').on(table.premiumUserId, table.processed),
]);

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  type: varchar('type', { length: 30 }).notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  data: jsonb('data'),
  read: boolean('read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('notifications_user_read_idx').on(table.userId, table.read),
  index('notifications_user_created_idx').on(table.userId, table.createdAt),
]);

export const promoCodes = pgTable('promo_codes', {
  id: text('id').primaryKey(),
  code: varchar('code', { length: 30 }).notNull(),
  description: text('description'),
  premiumDays: integer('premium_days').notNull(),
  maxRedemptions: integer('max_redemptions'),
  currentRedemptions: integer('current_redemptions').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('promo_codes_code_idx').on(table.code),
]);

export const promoRedemptions = pgTable('promo_redemptions', {
  id: text('id').primaryKey(),
  promoCodeId: text('promo_code_id')
    .notNull()
    .references(() => promoCodes.id),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  premiumDaysGranted: integer('premium_days_granted').notNull(),
  redeemedAt: timestamp('redeemed_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('promo_redemptions_user_code_idx').on(table.userId, table.promoCodeId),
  index('promo_redemptions_user_id_idx').on(table.userId),
]);

export const postTypeEnum = pgEnum('post_type', ['offering', 'seeking']);
export const postStatusEnum = pgEnum('post_status', ['active', 'closed', 'auto_closed']);

export const tradePosts = pgTable('trade_posts', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  type: postTypeEnum('type').notNull(),
  status: postStatusEnum('status').default('active').notNull(),
  cards: jsonb('cards').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('trade_posts_user_id_idx').on(table.userId),
  index('trade_posts_type_status_idx').on(table.type, table.status),
  index('trade_posts_created_at_idx').on(table.createdAt),
  index('trade_posts_cards_gin_idx').using('gin', sql`${table.cards} jsonb_path_ops`),
]);

export const deckMeta = pgTable('deck_meta', {
  id: text('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  winRate: integer('win_rate'),
  usageRate: integer('usage_rate'),
  playCount: integer('play_count'),
  matchRecord: varchar('match_record', { length: 50 }),
  cards: jsonb('cards'),
  matchups: jsonb('matchups'),
  tournamentResults: jsonb('tournament_results'),
  scrapedAt: timestamp('scraped_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('deck_meta_win_rate_idx').on(table.winRate),
  index('deck_meta_usage_rate_idx').on(table.usageRate),
]);

export const tradeSuggestions = pgTable('trade_suggestions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  giveCardId: text('give_card_id')
    .notNull()
    .references(() => cards.id),
  getCardId: text('get_card_id')
    .notNull()
    .references(() => cards.id),
  score: integer('score').notNull(),
  reasoning: text('reasoning').notNull(),
  computedAt: timestamp('computed_at').defaultNow().notNull(),
}, (table) => [
  index('trade_suggestions_user_idx').on(table.userId),
]);

export const tierLists = pgTable('tier_lists', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  title: varchar('title', { length: 100 }).notNull(),
  description: text('description'),
  tiers: jsonb('tiers').notNull(),
  isOfficial: boolean('is_official').default(false).notNull(),
  upvoteCount: integer('upvote_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('tier_lists_user_id_idx').on(table.userId),
  index('tier_lists_official_idx').on(table.isOfficial),
  index('tier_lists_upvote_idx').on(table.upvoteCount),
]);

export const tierListVotes = pgTable('tier_list_votes', {
  id: text('id').primaryKey(),
  tierListId: text('tier_list_id')
    .notNull()
    .references(() => tierLists.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('tier_list_votes_list_user_idx').on(table.tierListId, table.userId),
]);
