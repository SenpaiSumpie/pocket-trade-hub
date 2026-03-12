# Architecture Research: v2.0 Feature Integration

**Domain:** Pokemon TCG Pocket trading platform -- v2.0 feature integration with existing architecture
**Researched:** 2026-03-11
**Confidence:** MEDIUM-HIGH

## System Overview: v2.0 Expanded Architecture

```
                          CLIENTS
 ┌──────────────────┐  ┌──────────────────┐
 │  apps/mobile      │  │  apps/web (NEW)  │
 │  Expo RN (iOS/    │  │  Next.js App     │
 │  Android)         │  │  Router          │
 └────────┬─────────┘  └────────┬─────────┘
          │                     │
          │  ┌──────────────────┘
          │  │
          v  v
 ┌────────────────────────────────────────────────────────────────┐
 │                     packages/shared                            │
 │  Zod schemas, types, constants, i18n translation keys         │
 ├────────────────────────────────────────────────────────────────┤
 │                     packages/ui  (NEW - optional)              │
 │  Shared presentational React components via react-native-web  │
 └────────────────────────┬───────────────────────────────────────┘
                          │
                          v
 ┌────────────────────────────────────────────────────────────────┐
 │                     apps/api (Fastify 5)                       │
 ├──────────┬──────────┬──────────┬──────────┬───────────────────┤
 │ Auth     │ Posts    │ Cards    │ Geo      │ AI/ML Gateway     │
 │ (JWT +   │ (NEW)   │ (multi-  │ (NEW -   │ (NEW - calls      │
 │  OAuth)  │         │  lang)   │  PostGIS)│  external LLM)    │
 ├──────────┴──────────┴──────────┴──────────┴───────────────────┤
 │                     Services Layer                             │
 │  post.service  scan.service  suggest.service  geo.service     │
 │  deck-meta.service  luck.service  tier.service                │
 ├────────────────────────────────────────────────────────────────┤
 │                     BullMQ Workers                             │
 │  match-worker  analytics-worker  card-alert-worker            │
 │  suggestion-worker (NEW)  meta-scrape-worker (NEW)            │
 ├──────────┬──────────┬──────────────────────────────────────────┤
 │ PostgreSQL          │ Redis              │ External APIs       │
 │ + PostGIS ext       │ (cache, queues,    │ TCGdex (multi-lang) │
 │ + Drizzle ORM       │  feature flags)    │ OpenAI / Anthropic  │
 │                     │                    │ Google Cloud Vision  │
 │                     │                    │ Limitless TCG        │
 └─────────────────────┴────────────────────┴─────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | New vs Modified |
|-----------|----------------|-----------------|
| `apps/web` | Next.js web companion -- browse posts, manage collection, view deck meta (SSR) | **NEW** |
| `packages/ui` | Optional shared presentational React components between mobile and web | **NEW** |
| `packages/shared` | Zod schemas, i18n translation keys, shared types, constants | **MODIFIED** -- add post schemas, i18n keys |
| Auth plugin (`plugins/auth.ts`) | JWT + OAuth (Google/Apple) login flows | **MODIFIED** -- add OAuth provider handling |
| Post service | CRUD for Offering/Seeking trade posts, complementary post matching | **NEW** |
| Scan service | Receives card image, runs hash comparison, Cloud Vision fallback | **NEW** |
| Suggest service | AI-powered trade suggestions via external LLM API | **NEW** |
| Geo service | PostGIS queries for nearby traders | **NEW** |
| Deck meta service | Imports competitive deck data from Limitless TCG | **NEW** |
| Match service (`services/match.service.ts`) | Existing automatic matching -- kept as "Smart Suggestions" | **UNCHANGED** -- secondary to posts |
| Proposal service (`services/proposal.service.ts`) | Existing proposal workflow | **MODIFIED** -- accept `postId` alongside `matchId` |

---

## 1. Post-Based Trading Model (Replacing Automatic Matching)

### Architecture Decision

The v1.0 architecture uses `match.service.ts` with `computeTwoWayMatches()` to find bidirectional inventory overlaps stored in `tradeMatches`. This works but is passive -- users wait for matches.

The v2.0 model adds explicit Offering/Seeking posts where users declare trades they want to make. **Keep the existing matching engine** as a background "Smart Suggestions" premium feature. The post-based model becomes the primary trading flow.

### New Database Tables

```typescript
// In db/schema.ts -- NEW table
export const postTypeEnum = pgEnum('post_type', ['offering', 'seeking']);

export const tradePosts = pgTable('trade_posts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  type: postTypeEnum('type').notNull(),         // 'offering' | 'seeking'
  cardId: text('card_id').notNull().references(() => cards.id),
  cardLanguage: varchar('card_language', { length: 5 }).default('en'),
  description: text('description'),              // optional note
  isActive: boolean('is_active').default(true).notNull(),
  expiresAt: timestamp('expires_at'),            // auto-expire
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('trade_posts_card_type_active_idx').on(table.cardId, table.type),
  index('trade_posts_user_id_idx').on(table.userId),
  index('trade_posts_type_created_idx').on(table.type, table.createdAt),
  index('trade_posts_language_idx').on(table.cardLanguage),
]);
```

### Changes to Existing Tables and Schemas

The `tradeProposals` table already has `matchId` as nullable (`text('match_id')`). Add a `postId` column:

```typescript
// Modify tradeProposals in schema.ts:
postId: text('post_id').references(() => tradePosts.id),
// Proposals can now originate from a post (postId) OR a match (matchId) or neither
```

The shared `createProposalSchema` in `packages/shared/src/schemas/proposal.ts` currently requires `matchId: z.string()`. Change to:

```typescript
export const createProposalSchema = z.object({
  matchId: z.string().optional(),    // was required
  postId: z.string().optional(),     // NEW
  receiverId: z.string(),
  senderGives: z.array(proposalCardSchema).min(1),
  senderGets: z.array(proposalCardSchema).min(1),
  fairnessScore: z.number(),
  parentId: z.string().optional(),
}).refine(data => data.matchId || data.postId, {
  message: 'Either matchId or postId is required',
});
```

### Data Flow: Post-Based Trading

```
User creates Offering/Seeking post
    |
    v
POST /api/posts  -->  post.service.createPost()
    |                     |
    |                     v
    |                 Insert into trade_posts
    |                     |
    |                     v
    |                 BullMQ: notify-matching-posts job
    |                 (find complementary posts: offering <-> seeking same card)
    |                     |
    |                     v
    |                 Push + Socket.IO notification to complementary post owners
    |
    v
Other user browses matching posts or gets notified
    |
    v
POST /api/proposals  -->  proposal.service.createProposal()
    |                      (existing flow, now with postId instead of matchId)
    v
Existing accept/reject/counter/complete/rate workflow (UNCHANGED)
```

### Impact on Existing Code

| File | Change | Scope |
|------|--------|-------|
| `db/schema.ts` | Add `tradePosts` table, add `postId` to `tradeProposals` | Medium |
| `routes/proposals.ts` | Accept `postId` as alternative to `matchId` | Small |
| `services/proposal.service.ts` | Allow proposal creation from post context | Small |
| `services/match.service.ts` | **No changes** -- runs as "Smart Suggestions" | None |
| `packages/shared/schemas/proposal.ts` | Make `matchId` optional, add `postId` | Small |
| `packages/shared/schemas/post.ts` | **New file** -- post Zod schemas | New |
| `routes/posts.ts` | **New file** -- CRUD + feed endpoints | New |
| `services/post.service.ts` | **New file** -- post logic, complementary post finder | New |
| `jobs/post-notify-worker.ts` | **New file** -- find + notify matching posts | New |

---

## 2. Web App Companion

### Architecture Decision

Add `apps/web` as a **Next.js App Router** application in the existing Turborepo monorepo. This is the standard pattern for Turborepo + Expo + Next.js projects.

**Do not use Expo for web.** The mobile app uses native-only features (expo-secure-store, expo-notifications push tokens, camera) that complicate Expo web builds. Next.js gives SSR for public pages (deck meta, tier lists -- good for SEO), a conventional web UX, and clean separation.

### Monorepo Structure Changes

```
pocket-trade-hub/
├── apps/
│   ├── api/          # Fastify backend (UNCHANGED)
│   ├── mobile/       # Expo React Native (UNCHANGED)
│   └── web/          # NEW: Next.js 15+ App Router
│       ├── app/
│       │   ├── (auth)/           # Login, signup, OAuth callbacks
│       │   ├── (dashboard)/      # Authenticated pages
│       │   │   ├── posts/        # Browse + create trade posts
│       │   │   ├── collection/   # Manage collection + wanted
│       │   │   ├── proposals/    # View + respond to proposals
│       │   │   └── profile/      # Profile management
│       │   ├── meta/             # PUBLIC: Deck meta pages (SSR for SEO)
│       │   ├── tier-lists/       # PUBLIC: Tier list pages (SSR)
│       │   └── layout.tsx
│       ├── src/
│       │   ├── components/       # Web-specific layout + UI
│       │   ├── hooks/            # API hooks (similar patterns to mobile)
│       │   └── lib/              # Auth helpers, API client
│       ├── next.config.ts
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── shared/       # Zod schemas, types (BOTH apps consume)
│   └── ui/           # NEW (optional): shared presentational components
```

### What Gets Shared vs. What Does Not

| Layer | Shared? | Mechanism |
|-------|---------|-----------|
| Zod schemas + TypeScript types | **Yes** | `packages/shared` -- already exists, both apps import |
| API endpoint contracts | **Yes** | Same Fastify backend serves both clients |
| i18n translation JSON files | **Yes** | `packages/shared/src/i18n/locales/` |
| UI components | **Selectively** | Card display, rarity badge, fairness indicator via `packages/ui` with React Native primitives + react-native-web. Complex mobile-native UI stays in `apps/mobile` |
| Zustand stores | **No** | Similar patterns but different storage backends (SecureStore vs cookies), different auth flows |
| Routing | **No** | Expo Router vs Next.js App Router -- fundamentally different paradigms |
| Auth flow | **No** | Mobile uses SecureStore + JWT; web uses httpOnly cookies or localStorage |

### Web App Feature Scope

The web app is a **companion**, not a replacement for mobile.

**Include:**
- Browse and create trade posts
- Manage collection and wanted list
- View and respond to trade proposals
- Profile management
- Deck meta and tier lists (public SSR pages)
- Luck calculator

**Exclude (mobile-only):**
- Card scanning (camera access is mobile UX)
- Push notifications (use email or web notifications later)
- Local trade finder (GPS is mobile UX)
- Premium purchase via RevenueCat (RevenueCat is mobile IAP only; web billing would need Stripe or similar -- defer to later)

### Turborepo Configuration

Add `apps/web` to `pnpm-workspace.yaml`. The existing `turbo.json` task definitions (`build`, `dev`, `test`) apply automatically. Next.js and Expo `dev` tasks can run in parallel.

---

## 3. Card Scanning

### Architecture Decision

Use **server-side image processing** with a perceptual hash matching approach and Cloud Vision fallback.

For Pokemon TCG Pocket, card scanning is **screenshot recognition** (users screenshot their in-game collection), not physical card scanning. Screenshots have consistent formatting (same resolution, same card frame positions), which makes server-side hash matching highly effective.

### Approach: Perceptual Hash + Cloud Vision Fallback

```
User takes screenshot or picks image from gallery
    |
    v
expo-image-picker --> POST /api/scan/card (multipart form data)
    |
    v
scan.service.ts:
    1. Receive image, validate size/format
    2. Preprocess with sharp (crop card region, normalize size)
    3. Compute perceptual hash (pHash) of card art region
    4. Compare against pre-computed card image hashes in DB
    5. If match confidence > 85% --> return cardId immediately
    6. If low confidence --> send to Google Cloud Vision API
       (text recognition: card name + set number)
       --> Match extracted text against cards table
    |
    v
Return: { cardId, cardName, confidence, imageUrl }
    |
    v
User confirms --> Client calls existing POST /api/collection or POST /api/posts
```

### Why Server-Side, Not On-Device

| Factor | Server-side | On-device |
|--------|-------------|-----------|
| App size | No impact | +50-200MB for TensorFlow.js/ONNX runtime |
| Expo compatibility | No native modules needed | Requires Expo dev client (no Expo Go) |
| Model updates | Deploy server, instant update | App Store review cycle |
| Accuracy | Controlled environment | Device-dependent performance |
| Batch scanning | Natural (queue multiple) | Memory constrained |
| Offline | Does not work offline | Works offline |

Offline scanning is unnecessary -- users need internet to trade anyway.

### New Components

| Component | Purpose |
|-----------|---------|
| `routes/scan.ts` | Upload endpoint with rate limiting (20/min per user) |
| `services/scan.service.ts` | Image preprocessing (sharp), hash comparison, Cloud Vision fallback |
| `db/schema.ts` -- `cardImageHashes` table | Pre-computed perceptual hashes for all card images |
| `jobs/hash-import-worker.ts` | Pre-compute hashes when new card sets are imported via admin |

### Schema for Image Hashes

```typescript
export const cardImageHashes = pgTable('card_image_hashes', {
  id: text('id').primaryKey(),
  cardId: text('card_id').notNull().references(() => cards.id),
  hashType: varchar('hash_type', { length: 10 }).notNull(), // 'phash', 'dhash', 'ahash'
  hashValue: varchar('hash_value', { length: 64 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('card_image_hashes_type_value_idx').on(table.hashType, table.hashValue),
  uniqueIndex('card_image_hashes_card_type_idx').on(table.cardId, table.hashType),
]);
```

### Cost Estimate

Google Cloud Vision: ~$1.50 per 1000 images. With 90% hash-match success rate, only 10% hit Cloud Vision. At 10K active users, 20 scans/month each = 200K total scans, ~20K Vision API calls = ~$30/month.

---

## 4. AI-Powered Trade Suggestions

### Architecture Decision

Use **external LLM API calls** (OpenAI GPT-4o-mini or Anthropic Claude Haiku) with structured data prompting. Do not train custom models -- the project lacks sufficient trade history data, and LLM prompting with structured output provides better reasoning quality and faster iteration.

### How It Works

```
User opens app / taps "Get Suggestions" (premium feature)
    |
    v
GET /api/suggestions --> suggest.service.ts:
    1. Check Redis cache (key: suggest:{userId}, TTL: 1 hour)
    2. If cached, return immediately
    3. If not cached:
       a. Fetch user's collection, wanted list, active posts
       b. Fetch recent completed trades for market value signals
       c. Fetch card analytics (most wanted, least available)
       d. Build structured prompt with context:
          "Given user has [cards], wants [cards], current market:
           [trending cards], [most wanted cards].
           Suggest 3-5 optimal trades with reasoning."
       e. Call LLM API with JSON mode / structured output
       f. Parse + validate response against real card IDs + active posts
       g. Cache in Redis, return results
    |
    v
Return: [{ trade: { give: Card[], get: Card[] }, reasoning: string, confidence: number }]
```

### Why External LLM, Not Custom ML

- **No training data**: v1.0 has minimal trade history to train on
- **Reasoning quality**: LLMs produce explanations users can read ("Crown rarity Mewtwo is trending up -- good time to trade for it")
- **Iteration speed**: Change the prompt, not retrain a model
- **Cost at scale**: Premium-only feature. ~$0.01/suggestion with GPT-4o-mini. 1000 premium users x 5 suggestions/day = ~$50/month

### New Components

| Component | Purpose |
|-----------|---------|
| `services/suggest.service.ts` | Prompt construction, LLM API call, response validation |
| `routes/suggestions.ts` | GET endpoint with premium gate |
| `jobs/suggestion-worker.ts` | Pre-compute suggestions on app open (BullMQ job) |
| Redis cache key `suggest:{userId}` | Cache suggestions per user, TTL 1 hour |

---

## 5. Local Trade Finder (Nearby Traders)

### Architecture Decision

Use **PostGIS** extension on the existing PostgreSQL database. Drizzle ORM has documented support for PostGIS `geometry` columns with `point` type, GiST indexes, and spatial queries. This is the most natural approach -- no additional infrastructure needed.

### Schema Changes

```typescript
// In db/schema.ts -- modify users table:
import { geometry } from 'drizzle-orm/pg-core';

// Add to users table definition:
location: geometry('location', { type: 'point', mode: 'xy', srid: 4326 }),
locationUpdatedAt: timestamp('location_updated_at'),

// Add GiST spatial index:
index('users_location_idx').using('gist', table.location)
```

### Migration

```sql
-- Custom migration (drizzle-kit generate --custom)
CREATE EXTENSION IF NOT EXISTS postgis;
ALTER TABLE users ADD COLUMN location GEOMETRY(Point, 4326);
ALTER TABLE users ADD COLUMN location_updated_at TIMESTAMP;
CREATE INDEX users_location_idx ON users USING GIST(location);
```

### Query Pattern

```typescript
// geo.service.ts
export async function findNearbyTraders(
  db: Db,
  userId: string,
  lat: number,
  lng: number,
  radiusKm: number = 25
) {
  const point = sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`;

  return db
    .select({
      id: users.id,
      displayName: users.displayName,
      avatarId: users.avatarId,
      friendCode: users.friendCode,
      // Distance in km (cast to geography for meter-based distance)
      distance: sql<number>`ST_Distance(
        ${users.location}::geography,
        ${point}::geography
      ) / 1000`,
    })
    .from(users)
    .where(
      and(
        sql`ST_DWithin(
          ${users.location}::geography,
          ${point}::geography,
          ${radiusKm * 1000}
        )`,
        sql`${users.id} != ${userId}`,
        sql`${users.location} IS NOT NULL`
      )
    )
    .orderBy(sql`${users.location} <-> ${point}`)
    .limit(50);
}
```

PostGIS KNN queries with GiST indexes are extremely fast -- benchmarks show sub-millisecond response times even against billions of rows. This is not a scaling concern.

### Privacy Design

- **Approximate only**: Round coordinates to ~1km precision before storage (`Math.round(lat * 100) / 100`)
- **Opt-in**: Location column is nullable. Users must explicitly enable location sharing
- **Display relative**: Show "~5 km away", never show exact coordinates to other users
- **Clear on demand**: `DELETE /api/users/me/location` sets column to NULL
- **Rate limit updates**: Accept location updates max once per hour per user

### New Components

| Component | Purpose |
|-----------|---------|
| `services/geo.service.ts` | `findNearbyTraders()`, `updateUserLocation()` |
| `routes/geo.ts` | `PUT /api/users/me/location`, `GET /api/traders/nearby` |
| Mobile: `useLocation` hook | Uses `expo-location`, sends to API on app open |
| PostGIS migration | Enable extension, add column + index |

---

## 6. Multi-Language Card Database

### Architecture Decision

TCGdex already provides card data in **9 languages** for TCG Pocket via language-prefixed API endpoints (`/v2/en/...`, `/v2/ja/...`, `/v2/fr/...`, etc.). The question is how to store this locally.

Use a **`cardTranslations` table** to hold per-language names and image URLs. The base `cards` table retains language-agnostic data (rarity, HP, type, attacks, etc. -- these don't change per language). This avoids duplicating the entire cards table 9 times.

### Schema Changes

```typescript
// NEW table in db/schema.ts
export const cardTranslations = pgTable('card_translations', {
  id: text('id').primaryKey(),
  cardId: text('card_id').notNull().references(() => cards.id),
  language: varchar('language', { length: 5 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  imageUrl: text('image_url').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('card_translations_card_lang_idx').on(table.cardId, table.language),
  index('card_translations_name_lower_idx').on(sql`lower(${table.name})`),
]);

// MODIFY user_collection_items: add language per collected card
// (users may have the same card in different languages)
export const userCollectionItems = pgTable('user_collection_items', {
  // ... existing fields ...
  cardLanguage: varchar('card_language', { length: 5 }).default('en'),
  // Update unique index to include language:
}, (table) => [
  uniqueIndex('user_collection_items_user_card_lang_idx')
    .on(table.userId, table.cardId, table.cardLanguage),
  // ... existing indexes ...
]);
```

### Supported Languages (TCGdex for TCG Pocket)

en, ja, fr, de, es, it, pt, ko, zh-tw -- 9 total.

### Card Import Changes

The existing `seed-cards.ts` and `importCardSet()` in `card.service.ts` fetch from TCGdex English. Modify to:

1. Import base card data (English default, language-agnostic fields) -- existing flow
2. For each supported language, fetch `https://api.tcgdex.net/v2/{lang}/sets/{setId}` and populate `cardTranslations`
3. Add `language` query parameter to card search/browse endpoints
4. Card display components join with `cardTranslations` based on user's preferred language

### Impact on Existing Code

| File | Change |
|------|--------|
| `db/schema.ts` | Add `cardTranslations` table, add `cardLanguage` to `userCollectionItems` |
| `services/card.service.ts` | Join with translations on search, accept `language` param |
| `db/seeds/seed-cards.ts` | Fetch translations for all 9 languages |
| `routes/cards.ts` | Accept `?language=` query param |
| `packages/shared/schemas/card.ts` | Add `language` field |
| `services/collection.service.ts` | Handle `cardLanguage` on add/update |
| Mobile: card display components | Show card name/image in user's language preference |

---

## 7. Multi-Language UI (i18n)

### Architecture Decision

Use **react-i18next** with **expo-localization** for device language detection. react-i18next is the most mature and widely-used i18n library in the React ecosystem. It works on both React Native (mobile app) and React (web app), supports namespace-based lazy loading, and has excellent TypeScript support.

### Implementation Structure

```
packages/shared/
  src/
    i18n/
      locales/
        en/
          common.json       # Shared strings: "Save", "Cancel", "Loading..."
          trades.json       # "Create Post", "Offering", "Seeking", ...
          collection.json   # "Add to Collection", "Remove", ...
          meta.json         # "Win Rate", "Matchups", "Tier", ...
          auth.json         # "Login", "Sign Up", "Forgot Password", ...
        ja/
          common.json
          trades.json
          ...
        fr/
          ...
      index.ts              # i18n configuration, namespace definitions

apps/mobile/
  src/
    i18n/
      init.ts               # imports shared config + adds expo-localization detector

apps/web/
  src/
    i18n/
      init.ts               # imports shared config + adds browser language detector
```

### Key Design Decisions

- **Shared translation files in `packages/shared`** -- single source of truth for both mobile and web
- **Namespace per feature**: `common`, `trades`, `collection`, `meta`, `auth` -- enables lazy loading and smaller bundles
- **Type-safe keys**: Generate TypeScript types from the English JSON files
- **Fallback chain**: User preference --> device language --> English
- **No RTL needed**: All 9 TCG Pocket languages (en, ja, fr, de, es, it, pt, ko, zh) are LTR

### User Language Preference

Add to users table:
```typescript
preferredLanguage: varchar('preferred_language', { length: 5 }).default('en'),
```

This controls both UI language and default card language display.

---

## 8. Deck Meta System

### Architecture Decision

Import competitive deck data from public sources via BullMQ scheduled workers. Store in PostgreSQL. Serve via REST endpoints with Redis caching.

### Data Sources

| Source | Data Available | Access Method | Reliability |
|--------|---------------|---------------|-------------|
| [Limitless TCG](https://play.limitlesstcg.com/decks?game=POCKET) | Tournament results, decklists, win rates, matchups | Web scraping (no public API) | MEDIUM -- HTML structure may change |
| [PokemonMeta](https://www.pokemonmeta.com/top-decks) | Daily top decks, tier rankings | Web scraping | MEDIUM |
| Manual entry via admin panel | Curated decks, corrections | Admin routes (existing `routes/admin.ts`) | HIGH -- fallback |

### New Schema

```typescript
export const decks = pgTable('decks', {
  id: text('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  archetype: varchar('archetype', { length: 50 }),
  tier: integer('tier'),                    // 1, 2, 3
  winRate: integer('win_rate'),             // stored as basis points: 6750 = 67.50%
  usageRate: integer('usage_rate'),         // basis points
  sampleSize: integer('sample_size'),
  cardIds: jsonb('card_ids').notNull(),     // ["A1-001", "A1-042", ...]
  source: varchar('source', { length: 30 }).notNull(),
  sourceUrl: text('source_url'),
  lastUpdated: timestamp('last_updated').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('decks_tier_idx').on(table.tier),
]);

export const deckMatchups = pgTable('deck_matchups', {
  id: text('id').primaryKey(),
  deckId: text('deck_id').notNull().references(() => decks.id),
  opponentDeckId: text('opponent_deck_id').notNull().references(() => decks.id),
  winRate: integer('win_rate').notNull(),   // basis points
  sampleSize: integer('sample_size').notNull(),
  lastUpdated: timestamp('last_updated').notNull(),
}, (table) => [
  index('deck_matchups_deck_id_idx').on(table.deckId),
  uniqueIndex('deck_matchups_pair_idx').on(table.deckId, table.opponentDeckId),
]);
```

### BullMQ Worker

```typescript
// jobs/meta-scrape-worker.ts
// Runs daily at 3:00 UTC via cron schedule
// 1. Fetch Limitless TCG Pocket decks page
// 2. Parse deck lists, win rates, matchup data (cheerio HTML parsing)
// 3. Upsert into decks + deck_matchups tables
// 4. Invalidate Redis cache for meta endpoints
// 5. Log scrape results for monitoring
```

### Risk Mitigation

Web scraping is fragile. Mitigations:
- Admin manual entry as primary fallback (via existing admin routes)
- Monitor scrape success rate -- alert if 3 consecutive failures
- Cache aggressively (meta data is daily-update at most)
- Build the feature so it degrades gracefully -- app works fine with empty meta data

---

## Architectural Patterns

### Pattern 1: Feature Flag Gating

**What:** Gate all v2.0 features behind Redis-backed feature flags for incremental rollout.
**When to use:** Every new feature (posts, scanning, geo, AI suggestions, deck meta).

```typescript
// Simple implementation -- no external service needed
const FEATURES = {
  POSTS: 'feature:posts',
  SCAN: 'feature:scan',
  GEO: 'feature:geo',
  AI_SUGGEST: 'feature:ai_suggest',
  DECK_META: 'feature:deck_meta',
} as const;

// Route-level check:
async function requireFeature(flag: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const enabled = await request.server.redis.get(flag);
    if (enabled !== '1') reply.code(404).send({ error: 'Not found' });
  };
}
```

### Pattern 2: Service-per-Feature, Shared Database

**What:** Each new feature gets its own service file and route file, sharing the same PostgreSQL + Drizzle instance.
**When to use:** All new features. Do NOT create microservices.
**Trade-offs:** Simple deployment, shared transactions. The monolith stays a monolith -- at sub-100K users, this is correct.

### Pattern 3: BullMQ for External API Calls

**What:** All calls to external APIs (Cloud Vision, LLM, web scraping) go through BullMQ jobs with retry logic.
**When to use:** Any operation that calls a third-party service.
**Why:** Retries on transient failures, rate limiting, observability via BullMQ dashboard. The codebase already has 4 workers (`match-worker`, `analytics-worker`, `card-alert-worker`, `notification-worker`) -- new workers follow the exact same pattern.

---

## Data Flow Changes

### v1.0 Primary Trading Flow (Still Works, Secondary)

```
Collection/Wanted change --> BullMQ match-worker --> tradeMatches --> notification
    --> User reviews match --> creates proposal --> accept/reject/counter
```

### v2.0 Primary Trading Flow (NEW)

```
User creates post --> POST /api/posts --> trade_posts table
    --> BullMQ: find complementary posts --> notify matching post owners
    --> Browsing user finds post --> creates proposal (with postId)
    --> Same accept/reject/counter/complete/rate workflow
```

### Card Scan Flow (NEW)

```
User captures screenshot --> expo-image-picker
    --> POST /api/scan/card (multipart)
    --> scan.service: sharp preprocessing --> pHash match
    --> If low confidence: Google Cloud Vision fallback
    --> Return cardId + confidence
    --> User confirms --> POST /api/collection or POST /api/posts
```

### AI Suggestion Flow (NEW)

```
User opens app --> BullMQ: compute-suggestions (debounced, 1/hour)
    --> suggest.service: fetch context data --> LLM API call --> cache in Redis
GET /api/suggestions --> return cached suggestions
```

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-10K users | Current monolith is fine. PostGIS queries trivial. Single Fastify process. Redis handles all caching + queues. |
| 10K-100K users | Add Redis caching for post feed (paginated, 60s TTL). Move BullMQ workers to separate process. Add pgBouncer for connection pooling. Rate limit scan + AI endpoints aggressively. |
| 100K+ users | Read replicas for post feed queries. Card scan to dedicated queue with concurrency limit. CDN for card images. Consider separating web scraping worker to own process. |

### First Bottleneck: Post Feed Queries

The query `WHERE card_id = X AND type = 'offering' AND is_active = true ORDER BY created_at DESC` becomes the hottest path. Mitigated by the composite index on `(card_id, type)` plus Redis cache (60s TTL) for popular card feeds.

### Second Bottleneck: Card Scan Processing

Image upload + hash computation is CPU-intensive. Mitigated by BullMQ queue with concurrency: 4, and per-user rate limiting (20 scans/minute).

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Forcing Full Component Sharing Between Mobile and Web

**What people do:** Try to share every React component between Expo and Next.js via react-native-web, creating a `packages/ui` that handles all UI.
**Why it's wrong:** Mobile and web have different UX paradigms (bottom tabs vs sidebar nav, touch vs click, pull-to-refresh vs scroll, push notifications vs web notifications). Forced sharing produces abstraction layers that satisfy neither platform.
**Do this instead:** Share the data layer (`packages/shared` -- schemas, types, API contracts). Selectively share simple presentational components (card image, rarity badge, fairness indicator). Keep layouts, navigation, and interaction patterns platform-specific.

### Anti-Pattern 2: On-Device ML for Card Scanning

**What people do:** Bundle TensorFlow.js or ONNX Runtime in the React Native app.
**Why it's wrong:** 50-200MB app size increase. Requires Expo dev client (no Expo Go for development). Inconsistent performance across devices. Model updates require App Store review.
**Do this instead:** Server-side image processing. Upload image, get result. Fast to iterate, consistent, small app size.

### Anti-Pattern 3: Continuous Location Tracking

**What people do:** Track GPS coordinates in real-time for the "nearby traders" feature.
**Why it's wrong:** Battery drain, privacy concerns, regulatory burden (GDPR continuous tracking), unnecessary complexity.
**Do this instead:** Capture location once on app open (max 1/hour). Store approximate coordinates (~1km precision). Users opt in explicitly and can clear anytime.

### Anti-Pattern 4: Splitting Into Microservices

**What people do:** Create separate services for scanning, AI, geo because they "feel different."
**Why it's wrong:** Operational complexity explosion (separate deployments, networking, monitoring, logging) for a single-product team.
**Do this instead:** Feature-per-service-file in the same Fastify monolith. All new features are just new route files + service files + BullMQ workers. Extract only if a specific feature has fundamentally different scaling needs (unlikely before 100K users).

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| TCGdex API | REST fetch during card import (BullMQ job). Language via URL prefix: `/v2/{lang}/sets/{setId}` | HIGH confidence. 9 languages for TCG Pocket. |
| Google Cloud Vision | REST API from `scan.service.ts`. Fallback only when hash matching fails. | ~$1.50/1000 images. Budget ~$30/month at 10K users. |
| OpenAI / Anthropic API | REST API from `suggest.service.ts`. JSON mode for structured output. | GPT-4o-mini or Claude Haiku. ~$0.01/suggestion. Premium only. |
| Limitless TCG | Web scraping via cheerio in BullMQ worker. Daily schedule. | MEDIUM reliability -- HTML may change. Admin fallback. |
| Google OAuth | `@react-native-google-signin/google-signin` (mobile), web callback flow. Backend validates ID token. | Standard pattern, well-documented. |
| Apple Sign In | `expo-apple-authentication` (mobile), web callback. Backend validates identity token. | Required for iOS apps with third-party login. |
| expo-location | Mobile SDK. Sends coords to `PUT /api/users/me/location`. | Foreground only, opt-in, max 1 update/hour. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Posts <-> Proposals | Post provides `postId` to proposal creation endpoint | Extends existing proposal flow minimally |
| Card scan <-> Collection/Posts | Scan returns `cardId`, client calls existing collection add or post create | No direct service-to-service coupling |
| AI suggestions <-> Posts | Suggestions reference active posts; client navigates to post detail | Read-only dependency on posts + collection data |
| Deck meta <-> Cards | Decks reference card IDs from cards table | FK relationship via `cardIds` JSONB |
| Geo <-> Users | Location stored as column on users table | Same table, new nullable column |
| i18n <-> Card translations | Card display uses `cardTranslations` join based on user `preferredLanguage` | Query-time join, cached |

---

## Suggested Build Order (Dependency-Driven)

| Order | Feature | Rationale |
|-------|---------|-----------|
| 1 | OAuth (Google/Apple) | Foundation for user growth. Small scope: modify auth plugin + add provider columns to users. Unblocks web app auth. |
| 2 | Post-based trading model | Core architecture change. The primary v2.0 feature. Everything else (web app, suggestions, scan) builds on posts. |
| 3 | Multi-language cards + card translations table | Schema change that affects card display everywhere. Must be done before web app to avoid rework. |
| 4 | Multi-language UI (i18n) | Integrates naturally with language cards. Setting up `packages/shared/i18n/` before web app means both apps get i18n from day one. |
| 5 | Web app companion | Now has posts, multi-lang, i18n, OAuth foundations ready. Can build incrementally (start with posts + collection, add meta pages later). |
| 6 | Card scanning | Independent feature. Adds value to collection management and post creation. Server-side, no mobile native module complexity. |
| 7 | Local trade finder (PostGIS) | Independent feature. Enhances post discovery with "nearby" filter. PostGIS migration is low-risk. |
| 8 | AI trade suggestions | Benefits from existing post history and card analytics data. More meaningful with more users and trades. |
| 9 | Deck meta system | Independent. Web scraping needs monitoring. Public SSR pages on web app can drive organic traffic. |
| 10 | Luck calculator, tier lists, image export, promo codes | Smaller features with lower dependencies. Can be parallelized. |

**Key dependency chain:** OAuth --> Posts --> Multi-lang cards --> i18n --> Web app

**Parallelizable:** Card scanning, geo finder, deck meta can all be built in parallel with each other (after posts are done).

---

## Sources

- [Drizzle ORM PostGIS Geometry Point Guide](https://orm.drizzle.team/docs/guides/postgis-geometry-point) -- Official Drizzle docs for PostGIS columns, indexes, and queries (HIGH confidence)
- [Drizzle ORM PostgreSQL Extensions](https://orm.drizzle.team/docs/extensions/pg) -- PostGIS extension setup
- [PostGIS Nearest-Neighbour Searching](https://postgis.net/workshops/postgis-intro/knn.html) -- KNN queries with GiST indexes
- [TCGdex API](https://tcgdex.dev) -- Multi-language Pokemon TCG API, 9 languages for TCG Pocket (HIGH confidence)
- [TCGdex TCG Pocket Integration](https://tcgdex.dev/tcg-pocket) -- TCG Pocket-specific language support
- [Expo Monorepo Guide](https://docs.expo.dev/guides/monorepos/) -- Official Expo monorepo documentation
- [Expo Authentication Guide](https://docs.expo.dev/develop/authentication/) -- Official OAuth integration docs
- [Expo Google Authentication](https://docs.expo.dev/guides/google-authentication/) -- Google sign-in with @react-native-google-signin
- [Expo Localization Guide](https://docs.expo.dev/guides/localization/) -- i18n with expo-localization + react-i18next
- [Limitless TCG - TCG Pocket Decks](https://play.limitlesstcg.com/decks?game=POCKET) -- Tournament data source for deck meta
- [PokemonMeta Top Decks](https://www.pokemonmeta.com/top-decks) -- Daily meta rankings source
- [Turborepo + Next.js + Expo Monorepo (2025)](https://medium.com/@beenakumawat002/turborepo-monorepo-in-2025-next-js-react-native-shared-ui-type-safe-api-%EF%B8%8F-6194c83adff9) -- Monorepo setup patterns
- [drizzle-postgis Plugin](https://github.com/Schmavery/drizzle-postgis) -- Community Drizzle PostGIS extension (alternative approach)
- [Pokemon-TCGP-Card-Scanner](https://github.com/1vcian/Pokemon-TCGP-Card-Scanner) -- Open-source TCG Pocket card scanner using image hashing (MEDIUM confidence)

---
*Architecture research for: Pocket Trade Hub v2.0 Feature Integration*
*Researched: 2026-03-11*
