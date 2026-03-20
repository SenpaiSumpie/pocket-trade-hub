# Phase 11: Intelligence - Research

**Researched:** 2026-03-19
**Domain:** AI trade suggestions, competitive deck meta scraping, tier list system
**Confidence:** HIGH

## Summary

Phase 11 introduces three interconnected features: rule-based AI trade suggestions for premium users, competitive deck meta browsing with scraped data from Limitless TCG, and a tier list system (curated + user-created). The existing codebase provides strong foundations -- BullMQ worker patterns, Redis caching, Zustand stores, premium gating, and analytics services all transfer directly to this phase.

The scraping target should be **Limitless TCG** (`play.limitlesstcg.com/decks?game=pocket`) rather than ptcgpocket.gg. Limitless renders deck data server-side in HTML tables (deck names, win rates, usage percentages, match records), making it scrapable with **cheerio + axios** without browser automation. ptcgpocket.gg loads data dynamically via JavaScript, requiring Puppeteer -- unnecessary complexity for this use case.

For the tier list drag-and-drop UI, **react-native-draggable-flatlist** is the standard choice. The project already has react-native-reanimated (4.1.6) and react-native-gesture-handler as transitive deps via Expo SDK 54, so no extra native dependencies are needed.

**Primary recommendation:** Use cheerio for static HTML scraping of Limitless TCG, BullMQ scheduled jobs for data refresh, Redis caching for suggestion results, and react-native-draggable-flatlist for the tier list creation UI.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- AI Trade Suggestions: Rule-based heuristics (NOT LLM) using wanted list gaps, demand trends, fairness scores, available trader count, rarity tier matching
- Reasoning text is template-generated from data signals
- Each suggestion: "Give: [Card A] -> Get: [Card B]" with 1-2 sentence reasoning, 3-5 suggestions at a time
- Computed on app open via BullMQ job, cached in Redis for the session
- Refreshed on pull-to-refresh or next app open; premium-only
- Deck Meta: Data scraped from ptcgpocket.gg (or similar: Limitless TCG) via periodic cron job
- Full breakdown per deck: name, win rate, usage rate, trend, full card list, matchup data, tournament placement
- Default sort by win rate; toggleable to usage rate or trending
- Free/premium split: everyone sees deck names + win rate + usage + top 3 cards; premium unlocks full details
- Tier List: One official tier list auto-generated from meta data, updated weekly
- Users create via drag-and-drop: pick decks, drag into S/A/B/C/D tiers, add title + optional description
- User-created tier lists public by default, browsable, with likes/upvotes (no comments)
- Community lists sortable by most liked; users can delete own lists
- Navigation: New "Meta" tab (6th tab) with "Rankings" | "Tier Lists" segmented control
- AI trade suggestions on Home tab as horizontally scrollable "Smart Trades" section
- Free users see blurred preview with upgrade CTA; premium details blurred with premium badge

### Claude's Discretion
- Scraping implementation details (cheerio, puppeteer, or API if available)
- Drag-and-drop library choice for tier list creation on React Native
- Redis caching strategy for suggestions (TTL, invalidation)
- BullMQ job scheduling for meta data scraping frequency
- Exact template strings for suggestion reasoning
- How to handle missing/stale meta data gracefully

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INTL-01 | User can view AI-powered trade suggestions with reasoning (premium) | Suggestion service using analytics signals, BullMQ computation, Redis caching, template reasoning |
| TRAD-07 | User receives smart trade suggestions on app open based on posts and activity (premium) | Same as INTL-01 -- suggestion computation on app open, cached per session |
| INTL-02 | User can browse competitive deck meta (top decks, win rates, tournament results) | Limitless TCG scraper via cheerio, meta service, free/premium data split |
| INTL-03 | User can view tier lists for current meta decks | Official auto-generated tier list from scraped meta data |
| INTL-04 | User can create and share custom tier lists | Tier list CRUD, drag-and-drop UI, upvote system |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| cheerio | ^1.0.0 | HTML parsing for scraping | Fast, jQuery-like API, no browser needed for static HTML |
| axios | ^1.7.0 | HTTP client for fetching pages | Standard HTTP client, pairs with cheerio |
| bullmq | ^5.70.4 | Job scheduling for scraping and suggestion computation | Already in project, proven pattern |
| ioredis | ^5.10.0 | Redis caching for suggestions and meta data | Already in project |
| react-native-draggable-flatlist | ^4.0.1 | Drag-and-drop for tier list creation | Standard RN drag-and-drop, uses existing reanimated + gesture handler |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| drizzle-orm | ^0.45.0 | Database access for new tables | Already in project, all DB operations |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| cheerio + axios | puppeteer | Puppeteer needed only for JS-rendered sites; Limitless TCG is SSR, so cheerio is faster and lighter |
| react-native-draggable-flatlist | react-native-reanimated-dnd | Newer (v1.1.0) but less battle-tested; draggable-flatlist is the proven choice |
| ptcgpocket.gg | Limitless TCG | ptcgpocket.gg requires Puppeteer (dynamic JS rendering); Limitless is SSR with cleaner data tables |

**Installation:**
```bash
# API
cd apps/api && npm install cheerio axios

# Mobile
cd apps/mobile && npm install react-native-draggable-flatlist
```

## Architecture Patterns

### Recommended Project Structure
```
apps/api/src/
  services/
    suggest.service.ts       # Rule-based suggestion computation
    meta.service.ts          # Deck meta data management
    tierlist.service.ts      # Tier list CRUD + voting
    meta-scraper.service.ts  # Cheerio scraping logic for Limitless TCG
  routes/
    suggestions.ts           # GET /suggestions (premium-gated)
    meta.ts                  # GET /meta/decks, GET /meta/decks/:id
    tierlists.ts             # CRUD /tierlists, POST /tierlists/:id/vote
  jobs/
    suggest-worker.ts        # BullMQ worker for suggestion computation
    meta-scrape-worker.ts    # BullMQ scheduled worker for scraping

apps/mobile/src/
  stores/
    suggestions.ts           # Zustand store for smart trade suggestions
    meta.ts                  # Zustand store for deck meta data
    tierlists.ts             # Zustand store for tier lists
  components/
    suggestions/
      SmartTradesSection.tsx  # Horizontal scroll cards on Home tab
      SuggestionCard.tsx      # Individual suggestion card
    meta/
      DeckRankingList.tsx     # Deck rankings list view
      DeckDetailModal.tsx     # Full deck detail (premium for full data)
    tierlists/
      TierListCreator.tsx     # Drag-and-drop tier list builder
      TierListCard.tsx        # Tier list display card
      TierRow.tsx             # Single S/A/B/C/D tier row
  app/(tabs)/
    meta.tsx                  # New Meta tab screen
```

### Pattern 1: Suggestion Computation (BullMQ On-Demand Job)
**What:** Compute trade suggestions for a user when they open the app, cache in Redis
**When to use:** On GET /suggestions when no cached result exists
**Example:**
```typescript
// suggest.service.ts
export async function computeSuggestions(db: any, redis: any, userId: string) {
  // Check cache first
  const cached = await redis.get(`suggestions:${userId}`);
  if (cached) return JSON.parse(cached);

  // Gather signals
  const userWanted = await getUserWantedCards(db, userId);
  const userCollection = await getUserCollection(db, userId);
  const trending = await getTrendingCards(db);
  const tradePower = await getTradePower(db, userId);

  // Build suggestions: find cards user has that are in-demand,
  // paired with cards user wants that are available from traders
  const suggestions = buildSuggestionPairs(userWanted, userCollection, trending, tradePower);

  // Cache with 1-hour TTL (session-length)
  await redis.set(`suggestions:${userId}`, JSON.stringify(suggestions), 'EX', 3600);
  return suggestions;
}
```

### Pattern 2: Scraper Service (Cheerio + Axios)
**What:** Scrape Limitless TCG deck data from server-rendered HTML
**When to use:** BullMQ scheduled job (daily at 5am, after analytics at 4am)
**Example:**
```typescript
// meta-scraper.service.ts
import * as cheerio from 'cheerio';
import axios from 'axios';

export async function scrapeDeckMeta() {
  const { data: html } = await axios.get('https://play.limitlesstcg.com/decks?game=pocket');
  const $ = cheerio.load(html);

  const decks: DeckMeta[] = [];
  // Parse table rows for deck name, win rate, usage, match record
  $('table tbody tr').each((_, row) => {
    const cells = $(row).find('td');
    decks.push({
      name: $(cells[1]).text().trim(),
      playCount: parseInt($(cells[2]).text()),
      usagePercent: parseFloat($(cells[3]).text()),
      winRate: parseFloat($(cells[5]).text()),
      // ... extract other fields
    });
  });
  return decks;
}
```

### Pattern 3: Free/Premium Data Split
**What:** Return partial data to free users, full data to premium
**When to use:** All deck meta and suggestion endpoints
**Example:**
```typescript
// meta.ts route
f.get('/decks', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const userId = request.user.sub;
  const isPremium = await isPremiumUser(fastify.db, userId);
  const decks = await getDeckMeta(fastify.db);

  const result = decks.map(deck => ({
    name: deck.name,
    winRate: deck.winRate,
    usageRate: deck.usageRate,
    topCards: deck.cards.slice(0, 3), // Everyone gets top 3
    // Premium-only fields
    ...(isPremium ? {
      cards: deck.cards,
      matchups: deck.matchups,
      winRateTrend: deck.winRateTrend,
      tournamentResults: deck.tournamentResults,
    } : {}),
  }));

  return reply.send({ decks: result, isPremium });
});
```

### Pattern 4: Tier List with Upvotes
**What:** User-created tier lists with S/A/B/C/D tiers and community voting
**When to use:** Tier list creation and browsing
**Example:**
```typescript
// DB schema for tier lists
export const tierLists = pgTable('tier_lists', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  title: varchar('title', { length: 100 }).notNull(),
  description: text('description'),
  tiers: jsonb('tiers').notNull(), // { S: [...deckIds], A: [...], B: [...], C: [...], D: [...] }
  isOfficial: boolean('is_official').default(false).notNull(),
  upvoteCount: integer('upvote_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tierListVotes = pgTable('tier_list_votes', {
  id: text('id').primaryKey(),
  tierListId: text('tier_list_id').notNull().references(() => tierLists.id),
  userId: text('user_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('tier_list_votes_list_user_idx').on(table.tierListId, table.userId),
]);
```

### Anti-Patterns to Avoid
- **Scraping too frequently:** Limitless TCG is a community resource. Scrape once daily max, use generous User-Agent and rate limiting. Do NOT scrape on every user request.
- **LLM for suggestions:** The user explicitly locked rule-based heuristics. No OpenAI/Claude API calls. Template strings only.
- **Storing full HTML:** Only store extracted structured data in the database, never raw HTML.
- **Premium check on client only:** Always verify premium status server-side. Client-side isPremium is for UI display only.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTML parsing | Custom regex parsers | cheerio | HTML structure changes break regex; cheerio handles malformed HTML |
| Drag-and-drop lists | Custom gesture handlers | react-native-draggable-flatlist | Touch gesture math, scroll containment, animation are deceptively complex |
| Job scheduling | setInterval/cron strings | BullMQ upsertJobScheduler | Already in project, handles retries, failures, deduplication |
| Caching with TTL | Manual expiry tracking | Redis SET with EX | Redis handles expiry atomically |
| Vote counting | Manual count queries | Denormalized upvoteCount + trigger | Avoids COUNT(*) on every list render |

**Key insight:** The project already has BullMQ, Redis, and Zustand patterns established. Every new feature in this phase should follow those patterns rather than inventing alternatives.

## Common Pitfalls

### Pitfall 1: Scraper Fragility
**What goes wrong:** Limitless TCG changes their HTML structure, breaking the scraper silently
**Why it happens:** Web scraping is inherently brittle against site redesigns
**How to avoid:** Store scrape timestamp with data. If scrape returns 0 decks or throws, keep stale data and log error. Show "Last updated: X" in the UI so users understand staleness.
**Warning signs:** Zero decks returned, parse errors in logs, meta data older than 48 hours

### Pitfall 2: Suggestion Computation Timeout
**What goes wrong:** Computing suggestions for users with large collections takes too long
**Why it happens:** Multiple DB queries (wanted cards, collection, trending, trade power) plus matching logic
**How to avoid:** Limit candidate pools (top 20 trending, top 20 trade power). Set BullMQ job timeout to 30 seconds. Cache aggressively with 1-hour TTL.
**Warning signs:** Job duration > 5 seconds, Redis misses > 50%

### Pitfall 3: Vote Race Conditions
**What goes wrong:** Two simultaneous upvotes result in incorrect upvoteCount
**Why it happens:** Read-increment-write is not atomic
**How to avoid:** Use SQL `UPDATE tier_lists SET upvote_count = upvote_count + 1` (atomic increment). Use unique index on (tierListId, userId) to prevent double-voting.
**Warning signs:** upvoteCount diverging from COUNT(*) of tierListVotes

### Pitfall 4: Tab Bar Overflow on Small Screens
**What goes wrong:** Adding a 6th tab makes tab labels truncate or icons overlap on narrow phones
**Why it happens:** Expo Router tabs distribute width equally; 6 tabs on a 320px screen = 53px each
**How to avoid:** Use short tab label ("Meta"), test on iPhone SE (320pt width). Consider icon-only mode if labels overflow.
**Warning signs:** Tab text wrapping or getting cut off on smaller devices

### Pitfall 5: Drag-and-Drop Inside ScrollView
**What goes wrong:** Vertical scroll conflicts with drag gesture in tier list creator
**Why it happens:** Both gestures compete for vertical touch events
**How to avoid:** react-native-draggable-flatlist handles this internally via NestableScrollContainer. Wrap the tier list creator in NestableScrollContainer, use NestableDraggableFlatList for each tier row.
**Warning signs:** Items not draggable, scroll jumping, gesture not detected

## Code Examples

### Suggestion Signal Gathering
```typescript
// suggest.service.ts - Building suggestion pairs from data signals
interface SuggestionSignal {
  giveCardId: string;
  getCardId: string;
  score: number;
  reasons: string[];
}

function buildSuggestionPairs(
  userWanted: { cardId: string; priority: string }[],
  userCollection: { cardId: string }[],
  trending: { cardId: string; value: number }[],
  tradePower: { cardId: string; value: number }[],
): SuggestionSignal[] {
  const signals: SuggestionSignal[] = [];
  const trendingMap = new Map(trending.map(t => [t.cardId, t.value]));
  const collectionSet = new Set(userCollection.map(c => c.cardId));

  // For each card user wants, find cards in collection that have high trade power
  for (const wanted of userWanted) {
    for (const power of tradePower) {
      if (!collectionSet.has(power.cardId)) continue;
      if (power.cardId === wanted.cardId) continue;

      let score = power.value; // Base: how many people want user's card
      const reasons: string[] = [];

      // Boost if wanted card is trending
      const trendValue = trendingMap.get(wanted.cardId);
      if (trendValue) {
        score += trendValue * 2;
        reasons.push(`trending_demand`);
      }

      // Boost if high priority wanted
      if (wanted.priority === 'high') {
        score *= 1.5;
        reasons.push(`high_priority`);
      }

      signals.push({
        giveCardId: power.cardId,
        getCardId: wanted.cardId,
        score: Math.round(score),
        reasons,
      });
    }
  }

  // Sort by score desc, take top 5
  return signals.sort((a, b) => b.score - a.score).slice(0, 5);
}
```

### Template Reasoning Generation
```typescript
// suggest.service.ts - Template-based reasoning text
function generateReasoning(
  signal: SuggestionSignal,
  giveCard: { name: string; rarity: string },
  getCard: { name: string; rarity: string },
  traderCount: number,
  demandChange: number | null,
): string {
  const parts: string[] = [];

  if (signal.reasons.includes('trending_demand') && demandChange) {
    parts.push(`${getCard.name} demand up ${demandChange}% this week.`);
  }

  if (traderCount > 0) {
    parts.push(`${traderCount} trader${traderCount > 1 ? 's' : ''} ${traderCount > 1 ? 'are' : 'is'} offering it.`);
  }

  if (signal.reasons.includes('high_priority')) {
    parts.push(`This is on your high priority list.`);
  }

  if (parts.length === 0) {
    parts.push(`Good value trade based on current demand.`);
  }

  return parts.join(' ');
}
```

### New Database Tables
```typescript
// schema.ts additions
export const deckMeta = pgTable('deck_meta', {
  id: text('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  winRate: integer('win_rate'), // stored as basis points (5022 = 50.22%)
  usageRate: integer('usage_rate'), // basis points
  playCount: integer('play_count'),
  matchRecord: varchar('match_record', { length: 50 }), // "W-L-D"
  cards: jsonb('cards'), // card images/names from scrape
  matchups: jsonb('matchups'), // { good: [...], bad: [...] }
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
  userId: text('user_id').notNull().references(() => users.id),
  giveCardId: text('give_card_id').notNull().references(() => cards.id),
  getCardId: text('get_card_id').notNull().references(() => cards.id),
  score: integer('score').notNull(),
  reasoning: text('reasoning').notNull(),
  computedAt: timestamp('computed_at').defaultNow().notNull(),
}, (table) => [
  index('trade_suggestions_user_idx').on(table.userId),
]);

export const tierLists = pgTable('tier_lists', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  title: varchar('title', { length: 100 }).notNull(),
  description: text('description'),
  tiers: jsonb('tiers').notNull(), // { S: [...], A: [...], B: [...], C: [...], D: [...] }
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
  tierListId: text('tier_list_id').notNull().references(() => tierLists.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('tier_list_votes_list_user_idx').on(table.tierListId, table.userId),
]);
```

### Meta Tab with Segmented Control
```typescript
// app/(tabs)/meta.tsx
import { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import DeckRankingList from '@/src/components/meta/DeckRankingList';
import TierListBrowser from '@/src/components/meta/TierListBrowser';

type MetaTab = 'rankings' | 'tierlists';

export default function MetaScreen() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<MetaTab>('rankings');

  return (
    <View style={styles.container}>
      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[styles.segment, activeTab === 'rankings' && styles.activeSegment]}
          onPress={() => setActiveTab('rankings')}
        >
          <Text style={[styles.segmentText, activeTab === 'rankings' && styles.activeText]}>
            {t('meta.rankings')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, activeTab === 'tierlists' && styles.activeSegment]}
          onPress={() => setActiveTab('tierlists')}
        >
          <Text style={[styles.segmentText, activeTab === 'tierlists' && styles.activeText]}>
            {t('meta.tierLists')}
          </Text>
        </TouchableOpacity>
      </View>
      {activeTab === 'rankings' ? <DeckRankingList /> : <TierListBrowser />}
    </View>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Puppeteer for all scraping | Cheerio for SSR sites, Puppeteer only for SPA | Ongoing | 10x faster, no Chrome dependency for SSR targets |
| react-native-sortable-list | react-native-draggable-flatlist v4 | 2024 | Better Reanimated 3/4 support, NestableDraggableFlatList |
| BullMQ repeat jobs | BullMQ upsertJobScheduler | 2024 (v5) | Cleaner API for scheduled recurring jobs |

**Deprecated/outdated:**
- `react-native-sortable-list`: No longer maintained, does not support Reanimated 4
- Puppeteer for Limitless TCG: Unnecessary since Limitless is SSR

## Open Questions

1. **Limitless TCG HTML structure stability**
   - What we know: Data is in HTML tables, SSR rendered, currently working
   - What's unclear: How often their HTML structure changes, if they have rate limiting
   - Recommendation: Add generous User-Agent header, implement retry with backoff, store data timestamp, gracefully handle stale data (show "Last updated: X" in UI)

2. **Deck detail page scraping**
   - What we know: Limitless TCG has deck list pages with individual URLs
   - What's unclear: Whether individual deck pages (matchups, card lists) are also SSR
   - Recommendation: Start with the main decks list page. If detail pages need Puppeteer, consider storing only summary data initially and adding detail scraping later

3. **Suggestion quality with small user base**
   - What we know: Suggestions rely on trade power (cards wanted by others) and trending
   - What's unclear: With few users, most-wanted and trending data will be sparse
   - Recommendation: Fall back to rarity-tier-based suggestions when data is sparse. Show fewer suggestions (1-2) rather than low-quality ones. Include a "Not enough data yet" state.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7 with ts-jest |
| Config file | `apps/api/jest.config.js` |
| Quick run command | `cd apps/api && npx jest --testPathPattern="PATTERN" --no-coverage` |
| Full suite command | `cd apps/api && npx jest --no-coverage` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INTL-01 | Suggestion computation returns valid pairs with reasoning | unit | `cd apps/api && npx jest --testPathPattern="suggest" --no-coverage` | No - Wave 0 |
| TRAD-07 | GET /suggestions returns cached suggestions for premium user | integration | `cd apps/api && npx jest --testPathPattern="suggest" --no-coverage` | No - Wave 0 |
| INTL-02 | Meta scraper parses deck data from HTML | unit | `cd apps/api && npx jest --testPathPattern="meta-scraper" --no-coverage` | No - Wave 0 |
| INTL-02 | GET /meta/decks returns free/premium split | integration | `cd apps/api && npx jest --testPathPattern="meta" --no-coverage` | No - Wave 0 |
| INTL-03 | Official tier list auto-generated from meta data | unit | `cd apps/api && npx jest --testPathPattern="tierlist" --no-coverage` | No - Wave 0 |
| INTL-04 | Tier list CRUD and voting | integration | `cd apps/api && npx jest --testPathPattern="tierlist" --no-coverage` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `cd apps/api && npx jest --testPathPattern="RELEVANT_PATTERN" --no-coverage`
- **Per wave merge:** `cd apps/api && npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/api/__tests__/suggest.service.test.ts` -- covers INTL-01, TRAD-07
- [ ] `apps/api/__tests__/meta-scraper.service.test.ts` -- covers INTL-02 (scraper parsing)
- [ ] `apps/api/__tests__/routes/meta.route.test.ts` -- covers INTL-02 (route + premium gating)
- [ ] `apps/api/__tests__/routes/tierlist.route.test.ts` -- covers INTL-03, INTL-04
- [ ] `apps/api/__tests__/tierlist.service.test.ts` -- covers INTL-03 (official generation), INTL-04 (CRUD + voting)

## Sources

### Primary (HIGH confidence)
- Existing codebase: `apps/api/src/services/analytics.service.ts`, `apps/api/src/jobs/analytics-worker.ts`, `apps/api/src/jobs/match-worker.ts` -- established BullMQ + service patterns
- Existing codebase: `apps/api/src/db/schema.ts` -- drizzle schema patterns with pgTable, indexes, JSONB
- Existing codebase: `apps/mobile/src/stores/premium.ts` -- Zustand store pattern
- Existing codebase: `apps/mobile/app/(tabs)/_layout.tsx` -- tab layout with 5 current tabs

### Secondary (MEDIUM confidence)
- [Limitless TCG decks page](https://play.limitlesstcg.com/decks?game=pocket) -- verified SSR, HTML table structure with deck data
- [react-native-draggable-flatlist](https://github.com/computerjazz/react-native-draggable-flatlist) -- v4.0.1, compatible with Reanimated 4 + Expo SDK 54
- [Cheerio vs Puppeteer comparison](https://proxyway.com/guides/cheerio-vs-puppeteer-for-web-scraping) -- cheerio sufficient for SSR sites

### Tertiary (LOW confidence)
- ptcgpocket.gg was verified to require JavaScript rendering (dynamic content loading), confirming Limitless TCG is the better scraping target

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already in project or well-established with verified compatibility
- Architecture: HIGH - follows existing project patterns exactly (BullMQ workers, Zustand stores, Fastify routes)
- Pitfalls: MEDIUM - scraper fragility is inherent risk, suggestion quality with small data needs runtime validation
- Scraping target: MEDIUM - Limitless TCG confirmed SSR but HTML structure could change

**Research date:** 2026-03-19
**Valid until:** 2026-04-02 (scraping targets may change structure)
