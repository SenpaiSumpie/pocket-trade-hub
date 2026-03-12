# Phase 2: Card Database - Research

**Researched:** 2026-03-07
**Domain:** Pokemon TCG Pocket card catalog (database, search, image grid, push notifications)
**Confidence:** HIGH

## Summary

Phase 2 adds the core card browsing experience: a complete Pokemon TCG Pocket card database with set-based browsing, global search with filters, card detail modal, admin JSON import, and push notifications for new sets. The existing codebase provides a solid foundation with Drizzle ORM + PostgreSQL, Fastify service-layer pattern, Expo Router file-based routing, and Zustand state management.

The primary data source recommendation is TCGdex API for the initial seed data, which provides comprehensive TCG Pocket card data with image URLs, multilingual support, and structured JSON across all released sets (14+ sets, 2000+ cards). For the card grid, FlashList with expo-image provides the performant scrolling and automatic image caching needed for an image-heavy catalog. Push notifications use Expo Push Service with expo-server-sdk-node on the API side.

**Primary recommendation:** Seed database from TCGdex API, use FlashList + expo-image for the card grid, and Expo Push Notifications for new-set alerts.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Card image grid, 3 cards per row
- Horizontal scrollable set picker at top to switch between sets
- Each card thumbnail shows: name, rarity (in-game symbols), and type icon
- Rarity uses Pokemon TCG Pocket's authentic symbol system: diamonds (1-4), stars (1-3), crown
- Persistent search bar above the set picker on the Cards tab
- Live search -- results update as user types
- Search is global across all sets (ignores set picker selection)
- Filter chips below search bar for Set, Rarity, and Type -- tap to open picker
- Active filters shown as dismissible chips
- Search results displayed as flat grid with small set badge on each card
- Full-screen modal when tapping a card
- Large card image with all stats below: name, set, rarity (in-game symbols), type, HP, attacks with damage/energy cost, weakness, resistance, retreat cost, card number in set (e.g. "042/286")
- Swipe left/right to navigate between cards in the set
- Placeholder "Add to Collection" and "Add to Wanted" buttons -- visible but disabled with "Coming in next update" text
- Ship with pre-built JSON seed file for all existing sets
- Admin API route (POST /admin/cards/import) protected by admin role check
- Each card in JSON includes imageUrl pointing to externally hosted card images (no self-hosted image storage)
- Automatic push notification to all users when a new set is imported: "New Set Available! [Set Name] -- [X] new cards added"

### Claude's Discretion
- Loading skeletons and placeholder states while card images load
- Image caching strategy for card thumbnails
- Exact JSON schema for card import (fields, validation rules)
- Admin role implementation (simple flag on user vs separate admin table)
- Push notification service choice (Expo Push, FCM, etc.)
- Database schema for cards and sets tables
- API pagination strategy for large sets
- Error states (network failure, missing images, empty search results)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CARD-01 | App contains complete Pokemon TCG Pocket card database | TCGdex API provides all 14+ sets with 2000+ cards; seed script populates PostgreSQL via Drizzle schema |
| CARD-02 | User can search cards by name, set, rarity, and type | PostgreSQL ILIKE queries + indexed columns; Zod-validated search params; debounced live search on mobile |
| CARD-03 | User can browse cards by set with card images | FlashList + expo-image grid; set picker component; TCGdex-hosted images with caching |
| CARD-04 | Admin can import new card sets via JSON | POST /admin/cards/import with Zod validation; isAdmin flag on users table; transactional insert |
| CARD-05 | Users receive push notification when new sets are added | expo-notifications on mobile; expo-server-sdk-node on API; push token storage in DB |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-image | ~55.x | Image component with caching | Built-in disk+memory cache, blurhash placeholders, recycling-safe for FlashList |
| @shopify/flash-list | ^2.0 | Performant card grid | Drop-in FlatList replacement, cell recycling, estimated 5x faster for image grids |
| expo-notifications | ~55.x | Push notification handling (client) | Native Expo integration, handles permissions, tokens, foreground/background |
| expo-server-sdk | ^3.x | Push notification sending (server) | Official Node.js SDK, auto-throttling, gzip, receipt handling |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| drizzle-orm | ^0.45.0 | Database ORM (already installed) | Cards/sets table definitions, queries, migrations |
| zod | ^3.24.0 | Schema validation (already installed) | Card import validation, search param validation, shared types |
| zustand | ^5.0.11 | State management (already installed) | Card search state, filter state, selected set state |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| expo-image | react-native Image | No built-in caching, no blurhash, worse recycling perf |
| FlashList | FlatList | FlatList blanks during fast scroll with image-heavy grids |
| Expo Push Service | FCM directly | FCM requires separate iOS/Android config; Expo abstracts both |
| TCGdex API (seed) | flibustier/pokemon-tcg-pocket-database | TCGdex has REST API + hosted images; flibustier requires self-hosting images |

**Installation:**
```bash
# Mobile
cd apps/mobile
npx expo install expo-image @shopify/flash-list expo-notifications expo-device expo-constants

# API
cd apps/api
pnpm add expo-server-sdk
```

## Architecture Patterns

### Recommended Project Structure
```
apps/api/src/
  db/
    schema.ts              # Add sets, cards, pushTokens tables
  routes/
    cards.ts               # GET /cards, GET /cards/:id, GET /cards/search
    sets.ts                # GET /sets, GET /sets/:id
    admin.ts               # POST /admin/cards/import (protected)
    notifications.ts       # POST /notifications/register-token
  services/
    card.service.ts        # Card queries, search logic, import logic
    notification.service.ts # Push token management, send notifications
  middleware/
    admin.ts               # Admin role check preHandler

apps/mobile/src/
  components/
    cards/
      CardGrid.tsx         # FlashList-based 3-column grid
      CardThumbnail.tsx    # Single card cell with image, name, rarity, type
      SetPicker.tsx        # Horizontal scrollable set chips
      SearchBar.tsx        # Persistent search input with debounce
      FilterChips.tsx      # Set, Rarity, Type filter chips
      CardDetailModal.tsx  # Full-screen card detail with swipe
      RarityBadge.tsx      # Diamond/star/crown symbols
  hooks/
    useCards.ts            # Card fetching, search, pagination
    useNotifications.ts    # Push token registration, permission handling
  stores/
    cards.ts               # Search query, active filters, selected set

apps/mobile/app/
  (tabs)/
    cards.tsx              # Main cards screen (replace placeholder)
  card/
    [id].tsx               # Card detail route (modal presentation)

packages/shared/src/
  schemas/
    card.ts                # Card, Set, CardImport Zod schemas + types
```

### Pattern 1: Database Schema Design
**What:** Cards and sets tables with proper indexes for search performance
**When to use:** Core data model for entire phase
**Example:**
```typescript
// apps/api/src/db/schema.ts
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';

export const rarityEnum = pgEnum('rarity', [
  'diamond1', 'diamond2', 'diamond3', 'diamond4',
  'star1', 'star2', 'star3', 'crown',
]);

export const sets = pgTable('sets', {
  id: text('id').primaryKey(),            // e.g., "A1", "A1a"
  name: varchar('name', { length: 100 }).notNull(),
  series: varchar('series', { length: 10 }).notNull(), // e.g., "A", "B"
  cardCount: integer('card_count').notNull(),
  releaseDate: varchar('release_date', { length: 10 }),
  imageUrl: text('image_url'),            // Set logo/symbol
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const cards = pgTable('cards', {
  id: text('id').primaryKey(),            // e.g., "A1-001"
  setId: text('set_id').notNull().references(() => sets.id),
  localId: varchar('local_id', { length: 10 }).notNull(), // "001"
  name: varchar('name', { length: 100 }).notNull(),
  rarity: rarityEnum('rarity'),
  type: varchar('type', { length: 30 }),  // fire, water, grass, etc.
  category: varchar('category', { length: 30 }), // pokemon, trainer, energy
  hp: integer('hp'),
  stage: varchar('stage', { length: 20 }),
  imageUrl: text('image_url').notNull(),
  attacks: jsonb('attacks'),              // [{name, damage, energyCost, description}]
  weakness: varchar('weakness', { length: 30 }),
  resistance: varchar('resistance', { length: 30 }),
  retreatCost: integer('retreat_cost'),
  illustrator: varchar('illustrator', { length: 100 }),
  cardNumber: varchar('card_number', { length: 20 }), // "042/286"
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const pushTokens = pgTable('push_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  token: text('token').notNull().unique(),
  platform: varchar('platform', { length: 10 }), // ios, android
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### Pattern 2: Admin Role (Simple Flag)
**What:** Add `isAdmin` boolean column to existing users table
**When to use:** Simplest approach for single admin capability needed now
**Example:**
```typescript
// Add to users table in schema.ts
isAdmin: boolean('is_admin').default(false).notNull(),

// Middleware
export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const user = await db.select().from(users).where(eq(users.id, request.user.id)).limit(1);
  if (!user[0]?.isAdmin) {
    return reply.code(403).send({ error: 'Admin access required' });
  }
}
```

### Pattern 3: Debounced Live Search
**What:** Search input with 300ms debounce sending API requests
**When to use:** CARD-02 live search requirement
**Example:**
```typescript
// useCards.ts hook pattern
const [searchQuery, setSearchQuery] = useState('');
const [debouncedQuery, setDebouncedQuery] = useState('');

useEffect(() => {
  const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
  return () => clearTimeout(timer);
}, [searchQuery]);

// Fetch when debouncedQuery or filters change
useEffect(() => {
  if (debouncedQuery.length >= 2 || activeFilters.length > 0) {
    fetchSearchResults(debouncedQuery, activeFilters);
  }
}, [debouncedQuery, activeFilters]);
```

### Pattern 4: Card Grid with FlashList + expo-image
**What:** 3-column image grid with cell recycling and built-in caching
**When to use:** Main card browsing view
**Example:**
```typescript
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';

const CARD_ASPECT_RATIO = 1.4; // Pokemon cards are roughly 2.5x3.5 inches

<FlashList
  data={cards}
  numColumns={3}
  estimatedItemSize={180}
  renderItem={({ item }) => (
    <Pressable onPress={() => openDetail(item.id)}>
      <Image
        source={{ uri: item.imageUrl }}
        style={{ width: '100%', aspectRatio: 1 / CARD_ASPECT_RATIO }}
        contentFit="cover"
        placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
        recyclingKey={item.id}
        transition={200}
      />
      <Text>{item.name}</Text>
      <RarityBadge rarity={item.rarity} />
    </Pressable>
  )}
/>
```

### Anti-Patterns to Avoid
- **FlatList for image grids:** FlatList does not recycle cells, causing blank frames during fast scroll. Use FlashList.
- **Fetching all cards at once:** Sets can have 200+ cards. Use cursor-based pagination (limit 50, offset-based).
- **Inline image URIs without caching:** expo-image handles caching automatically; do not build custom cache.
- **Synchronous search:** Never block the UI thread; always debounce and use async fetch.
- **Storing images in database:** Card images are externally hosted (TCGdex CDN). Store URLs only.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image caching | Custom download + file cache | expo-image (built-in disk+memory cache) | Handles cache eviction, memory pressure, format optimization |
| Push notifications | Raw FCM/APNs integration | expo-notifications + expo-server-sdk | Abstracts platform differences, handles tokens, receipts, throttling |
| List virtualization | Custom scroll-based rendering | FlashList | Cell recycling, estimated layout, proven at Shopify scale |
| Search debouncing | Custom timer management | Simple useEffect + setTimeout | 5 lines of code, no library needed |
| Rarity symbols | Custom font or images | Unicode characters + styled Text | Diamonds (U+2666), stars (U+2605), crown (U+1F451) with color |

**Key insight:** The image-heavy card grid is the biggest performance risk. expo-image + FlashList is the proven solution; custom image caching leads to memory leaks and stale cache bugs.

## Common Pitfalls

### Pitfall 1: FlashList estimatedItemSize Wrong
**What goes wrong:** FlashList renders blank cells or has janky scroll when estimatedItemSize is inaccurate
**Why it happens:** estimatedItemSize must approximate the average rendered cell height in pixels
**How to avoid:** Measure a single card cell (image + name + rarity) and use that value. For 3-column grid with card aspect ratio ~1.4, estimate ~180-200px
**Warning signs:** Blank frames during scroll, "FlashList's estimatedItemSize" console warning

### Pitfall 2: Search Performance on Large Datasets
**What goes wrong:** ILIKE queries on 2000+ cards are slow without indexes
**Why it happens:** PostgreSQL full table scan on text columns
**How to avoid:** Create indexes on cards.name, cards.set_id, cards.rarity, cards.type. Consider using `lower()` index for case-insensitive search
**Warning signs:** Search results taking > 200ms

### Pitfall 3: Push Token Expiration
**What goes wrong:** Stored push tokens become invalid, notifications silently fail
**Why it happens:** Users reinstall app, tokens rotate
**How to avoid:** Re-register push token on every app launch (upsert by userId). Handle `DeviceNotRegistered` errors by removing stale tokens
**Warning signs:** Notification delivery rate drops over time

### Pitfall 4: Card Detail Swipe Navigation State
**What goes wrong:** Swiping between cards loses scroll position or shows wrong card
**Why it happens:** State management conflict between modal and underlying list
**How to avoid:** Pass card index + card list reference to detail modal. Use a horizontal FlatList/PagerView inside the modal for swipe
**Warning signs:** Card detail shows stale data after swipe

### Pitfall 5: Seed Data Migration
**What goes wrong:** Seed script fails partway through, leaving partial data
**Why it happens:** 2000+ card inserts without transaction
**How to avoid:** Wrap entire seed in a database transaction. Use batch inserts (50-100 at a time) within the transaction
**Warning signs:** Card counts don't match expected set sizes

### Pitfall 6: expo-notifications Requires Development Build
**What goes wrong:** Push notifications don't work in Expo Go
**Why it happens:** Since SDK 54, push notifications require a development build
**How to avoid:** Set up EAS development build early. Test with Expo Push Notifications tool
**Warning signs:** `getExpoPushTokenAsync` returns error in Expo Go

## Code Examples

### Card Search API Route
```typescript
// apps/api/src/routes/cards.ts
// Source: Established project pattern (auth.ts route structure)
import type { FastifyInstance } from 'fastify';
import { cardSearchSchema } from '@pocket-trade-hub/shared';
import { searchCards, getCardById, getCardsBySet } from '../services/card.service';

export default async function cardRoutes(fastify: FastifyInstance) {
  // GET /cards/search?q=charizard&set=A1&rarity=star1&type=fire&limit=50&offset=0
  fastify.get('/cards/search', async (request, reply) => {
    const parsed = cardSearchSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid search params', details: parsed.error.flatten() });
    }
    const results = await searchCards(fastify.db, parsed.data);
    return reply.send(results);
  });

  // GET /cards/:id
  fastify.get('/cards/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const card = await getCardById(fastify.db, id);
    if (!card) return reply.code(404).send({ error: 'Card not found' });
    return reply.send(card);
  });

  // GET /sets
  fastify.get('/sets', async (request, reply) => {
    const sets = await getAllSets(fastify.db);
    return reply.send(sets);
  });

  // GET /sets/:id/cards?limit=50&offset=0
  fastify.get('/sets/:id/cards', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { limit = 50, offset = 0 } = request.query as { limit?: number; offset?: number };
    const cards = await getCardsBySet(fastify.db, id, limit, offset);
    return reply.send(cards);
  });
}
```

### Admin Import Route
```typescript
// apps/api/src/routes/admin.ts
export default async function adminRoutes(fastify: FastifyInstance) {
  // POST /admin/cards/import
  fastify.post(
    '/admin/cards/import',
    { preHandler: [fastify.authenticate, requireAdmin] },
    async (request, reply) => {
      const parsed = cardImportSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Invalid import data', details: parsed.error.flatten() });
      }

      const result = await importCardSet(fastify.db, parsed.data);

      // Send push notification to all registered users
      await sendNewSetNotification(fastify.db, result.setName, result.cardCount);

      return reply.code(201).send({
        message: `Imported ${result.cardCount} cards for ${result.setName}`,
        setId: result.setId,
      });
    }
  );
}
```

### Push Token Registration
```typescript
// apps/mobile/src/hooks/useNotifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiFetch } from './useApi';

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  const projectId = Constants.expirationDate
    ? Constants.easConfig?.projectId
    : Constants.expoConfig?.extra?.eas?.projectId;

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

  // Register token with backend
  await apiFetch('/notifications/register-token', {
    method: 'POST',
    body: JSON.stringify({ token, platform: Platform.OS }),
  });

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  return token;
}
```

### Shared Card Schema
```typescript
// packages/shared/src/schemas/card.ts
import { z } from 'zod';

export const rarityValues = [
  'diamond1', 'diamond2', 'diamond3', 'diamond4',
  'star1', 'star2', 'star3', 'crown',
] as const;

export const cardSchema = z.object({
  id: z.string(),
  setId: z.string(),
  localId: z.string(),
  name: z.string().min(1),
  rarity: z.enum(rarityValues).nullable(),
  type: z.string().nullable(),
  category: z.string().nullable(),
  hp: z.number().nullable(),
  stage: z.string().nullable(),
  imageUrl: z.string().url(),
  attacks: z.array(z.object({
    name: z.string(),
    damage: z.string().nullable(),
    energyCost: z.array(z.string()),
    description: z.string().nullable(),
  })).nullable(),
  weakness: z.string().nullable(),
  resistance: z.string().nullable(),
  retreatCost: z.number().nullable(),
  illustrator: z.string().nullable(),
  cardNumber: z.string(),
});

export const setSchema = z.object({
  id: z.string(),
  name: z.string(),
  series: z.string(),
  cardCount: z.number(),
  releaseDate: z.string().nullable(),
  imageUrl: z.string().url().nullable(),
});

export const cardImportSchema = z.object({
  set: setSchema,
  cards: z.array(cardSchema.omit({ id: true, setId: true })).min(1),
});

export const cardSearchSchema = z.object({
  q: z.string().optional(),
  set: z.string().optional(),
  rarity: z.enum(rarityValues).optional(),
  type: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

export type Card = z.infer<typeof cardSchema>;
export type CardSet = z.infer<typeof setSchema>;
export type CardImportInput = z.infer<typeof cardImportSchema>;
export type CardSearchParams = z.infer<typeof cardSearchSchema>;
```

## Card Data Source

### Recommendation: TCGdex API for Seed Data

**TCGdex API** (https://api.tcgdex.net/v2/en/) is the recommended data source:

| Property | Value |
|----------|-------|
| API Base | `https://api.tcgdex.net/v2/en/` |
| TCG Pocket Series | `series/tcgp` |
| Set Endpoint | `sets/{setId}` (e.g., `sets/A1`) |
| Card Endpoint | `sets/{setId}/{localId}` |
| Image URL Pattern | `https://assets.tcgdex.net/en/tcgp/{setId}/{cardNumber}` |
| Sets Available | 14+ sets, 2000+ cards |
| Multilingual | 9 languages |
| Rate Limiting | Reasonable (no API key required) |

**Seed strategy:**
1. Write a seed script that fetches all TCG Pocket sets from TCGdex API
2. For each set, fetch all cards and transform to match our schema
3. Store as JSON seed file in `apps/api/src/db/seeds/cards-seed.json`
4. Ship seed file with the app; run seed on first database setup
5. Future sets imported via admin API (CARD-04)

**Alternative data source considered:** `flibustier/pokemon-tcg-pocket-database` on GitHub provides a similar dataset as static JSON files with webp images, but TCGdex provides hosted image CDN URLs which aligns with the "no self-hosted image storage" decision.

## Rarity Symbol Mapping

Pokemon TCG Pocket uses a specific rarity system:

| Rarity | Display | Unicode/Approach |
|--------|---------|-----------------|
| 1 Diamond | one small diamond | Repeat diamond character |
| 2 Diamond | two small diamonds | Repeat diamond character |
| 3 Diamond | three small diamonds | Repeat diamond character |
| 4 Diamond | four small diamonds | Repeat diamond character |
| 1 Star | one gold star | Gold-colored star |
| 2 Star | two gold stars | Gold-colored stars |
| 3 Star | three gold stars | Gold-colored stars |
| Crown | crown symbol | Crown character, special color |

**Implementation:** Create a `RarityBadge` component that renders the appropriate number of styled unicode characters based on rarity value.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-native Image | expo-image | Expo SDK 49+ | Built-in caching, blurhash, better perf |
| FlatList for grids | FlashList | 2023+ | Cell recycling eliminates blank frames |
| FastImage (3rd party) | expo-image | 2024+ | FastImage unmaintained; expo-image is official |
| Push via Expo Go | Development build required | SDK 54 | Must use EAS dev build for push testing |
| FCM legacy API | FCM v1 (via Expo Push) | 2024 | Google deprecated legacy; Expo handles v1 |

**Deprecated/outdated:**
- react-native-fast-image: Unmaintained, replaced by expo-image
- Expo Go push notifications: No longer supported since SDK 54
- FCM legacy HTTP API: Deprecated by Google in June 2024

## Open Questions

1. **TCGdex API reliability for seed data**
   - What we know: API is free, no key required, actively maintained
   - What's unclear: Rate limits for bulk fetching all cards during seed
   - Recommendation: Fetch once, save as static JSON seed file. Don't depend on runtime API calls.

2. **Push notification testing without physical device**
   - What we know: Requires development build + real device
   - What's unclear: How to test in CI or during development
   - Recommendation: Build notification service with testable interface; mock in tests. Manual push testing on device.

3. **Image CDN reliability (TCGdex assets)**
   - What we know: `assets.tcgdex.net` hosts card images, free to use
   - What's unclear: Uptime guarantees, potential rate limiting
   - Recommendation: Use TCGdex image URLs initially. If issues arise, could proxy through own CDN later. expo-image disk cache mitigates repeated loads.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7 + ts-jest |
| Config file | `apps/api/jest.config.js` |
| Quick run command | `cd apps/api && pnpm test -- --testPathPattern=cards` |
| Full suite command | `cd apps/api && pnpm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CARD-01 | Seed script populates all cards/sets | integration | `cd apps/api && pnpm test -- --testPathPattern=seed` | No - Wave 0 |
| CARD-02 | Search by name/set/rarity/type returns correct results | unit | `cd apps/api && pnpm test -- --testPathPattern=card.service` | No - Wave 0 |
| CARD-03 | GET /sets/:id/cards returns cards with images | integration | `cd apps/api && pnpm test -- --testPathPattern=cards.route` | No - Wave 0 |
| CARD-04 | POST /admin/cards/import validates and inserts | integration | `cd apps/api && pnpm test -- --testPathPattern=admin` | No - Wave 0 |
| CARD-05 | Push notification sent after import | unit | `cd apps/api && pnpm test -- --testPathPattern=notification` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `cd apps/api && pnpm test -- --testPathPattern={relevant} -x`
- **Per wave merge:** `cd apps/api && pnpm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/api/__tests__/services/card.service.test.ts` -- covers CARD-01, CARD-02
- [ ] `apps/api/__tests__/routes/cards.route.test.ts` -- covers CARD-03
- [ ] `apps/api/__tests__/routes/admin.route.test.ts` -- covers CARD-04
- [ ] `apps/api/__tests__/services/notification.service.test.ts` -- covers CARD-05
- [ ] Test database setup/teardown helpers (if not existing)

## Sources

### Primary (HIGH confidence)
- TCGdex API (`https://api.tcgdex.net/v2/en/series/tcgp`) -- verified card data structure, image URL format, set listing
- Expo Documentation (`https://docs.expo.dev/versions/latest/sdk/notifications/`) -- push notification setup, SDK 55 requirements
- Expo Documentation (`https://docs.expo.dev/versions/latest/sdk/image/`) -- expo-image caching, blurhash, recycling
- FlashList Documentation (`https://shopify.github.io/flash-list/`) -- estimatedItemSize, numColumns, cell recycling
- Drizzle ORM Documentation (`https://orm.drizzle.team/docs/column-types/pg`) -- pgEnum, jsonb, relations, indexes

### Secondary (MEDIUM confidence)
- `flibustier/pokemon-tcg-pocket-database` (`https://github.com/flibustier/pokemon-tcg-pocket-database`) -- alternative card data source with webp images
- expo-server-sdk-node (`https://github.com/expo/expo-server-sdk-node`) -- server-side push notification sending

### Tertiary (LOW confidence)
- Rarity symbol mapping -- derived from game knowledge; exact Unicode rendering should be visually tested on device

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries are official Expo ecosystem or well-established (FlashList)
- Architecture: HIGH -- follows existing project patterns (Fastify routes + services + Drizzle + shared Zod schemas)
- Pitfalls: HIGH -- FlashList/expo-image pitfalls well-documented; push notification SDK 54+ requirement verified
- Card data source: MEDIUM -- TCGdex API verified working, but long-term reliability unverified

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (30 days -- stable ecosystem, TCGdex API may add new sets)
