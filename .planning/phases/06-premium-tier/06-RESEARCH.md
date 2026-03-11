# Phase 6: Premium Tier - Research

**Researched:** 2026-03-10
**Domain:** In-app purchases (RevenueCat), analytics aggregation, premium gating, background jobs
**Confidence:** MEDIUM-HIGH

## Summary

Phase 6 adds a premium subscription ($5/month) via RevenueCat SDK with four feature pillars: IAP subscription flow, card demand analytics, priority match placement, and advanced card alerts. The project already has BullMQ infrastructure for background jobs, dual-delivery notification patterns, and Drizzle ORM with PostgreSQL -- all directly reusable for premium features.

RevenueCat handles all App Store/Google Play billing compliance. The mobile app uses `react-native-purchases` for purchase flow, while the API receives RevenueCat webhooks to sync subscription status server-side. Analytics are pre-computed via a daily BullMQ cron job querying existing `user_wanted_cards` and `user_collection_items` tables. Priority placement is a score multiplier in the existing `calculateMatchScore` function. Advanced alerts trigger when cards are added to collections, batched via a 2-hour BullMQ digest job.

**Primary recommendation:** Add `isPremium` + `premiumExpiresAt` columns to users table for fast local checks; sync via RevenueCat webhooks. Use existing BullMQ patterns for analytics cron and alert batching.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Premium section lives in Profile tab with "Go Premium" card showing features and price
- Soft upsells: locked premium features show lock icon + "Premium" label; tapping opens paywall
- No aggressive pop-ups or interruptions -- users discover premium organically
- After subscribing: Profile premium section shows subscription status, manage/cancel link, and quick links to premium features (Analytics, Alert settings)
- RevenueCat SDK for IAP compliance on both iOS and Android
- Gold crown icon next to premium users' display names on profiles and match cards
- Uses existing gold accent (#f0c040) for brand consistency
- Badge visible to other users viewing match cards
- Analytics: dedicated full-screen accessible from Home tab summary card + Profile premium quick link
- Free users see a locked card on Home tab with soft upsell
- Four analytics sections: Most Wanted Cards, Least Available Cards, Trending Cards, Your Trade Power
- Visual style: card lists with thumbnails, names, rarity, and stat numbers (no charts)
- Data refreshed daily via BullMQ background job (pre-computed, fast reads)
- Premium users get a moderate score boost (~20-30% multiplier) on match ranking
- Quality still matters -- a 3-star free match beats a 1-star premium match
- Applies to match ranking only, NOT to proposal ordering
- Advanced alerts trigger when any user adds a card from the premium user's wanted list to their collection
- Wanted list = alert list automatically -- no extra configuration needed
- Frequency: batched digest every 2 hours max
- Alerts appear in both push notifications AND in-app notification inbox

### Claude's Discretion
- RevenueCat SDK integration details and webhook setup
- Database schema for subscription status (users table field vs separate table)
- Analytics pre-computation job implementation (SQL aggregation queries)
- Score boost multiplier exact value within 20-30% range
- Alert batching job configuration and deduplication
- Paywall screen visual design and feature list copy
- Home tab analytics summary card design
- Error handling for subscription edge cases (expired, grace period, refunded)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PREM-01 | User can subscribe to premium tier via in-app purchase ($5/month) | RevenueCat SDK setup, webhook sync, DB schema for subscription status |
| PREM-02 | Premium users see card demand analytics (most wanted, least available, trending) | BullMQ daily cron job, SQL aggregation queries on existing tables, pre-computed analytics table |
| PREM-03 | Premium users' trade offers appear first in search results | Score multiplier in existing calculateMatchScore, isPremium check in getMatchesForUser |
| PREM-04 | Premium users receive advanced card alerts for wanted cards | Collection-add trigger, BullMQ 2-hour batching job, dual-delivery notification pattern |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native-purchases | latest (Expo-compatible) | RevenueCat SDK for iOS/Android IAP | Official RevenueCat SDK; handles StoreKit/Google Billing complexity, free tier available |
| react-native-purchases-ui | latest | Pre-built paywall UI components | Optional but provides native paywall screens out of the box |
| bullmq | ^5.70.4 (already installed) | Background job queue for analytics cron + alert batching | Already in project; proven pattern with match-worker and notification-worker |
| drizzle-orm | ^0.45.0 (already installed) | Database schema changes and aggregation queries | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ioredis | ^5.10.0 (already installed) | Redis connection for BullMQ workers | Required for new workers (analytics, alerts) |
| expo-server-sdk | ^6.0.0 (already installed) | Push notifications for card alerts | Extend existing notification patterns |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| RevenueCat | expo-iap directly | RevenueCat abstracts store-specific APIs, handles receipt validation, provides webhook events; expo-iap requires manual receipt validation |
| react-native-purchases-ui | Custom paywall screen | Custom gives full design control; RC UI is faster but less customizable. Given "Discord Nitro" styling goal, custom paywall recommended |
| Separate subscriptions table | Fields on users table | Separate table is more normalized but overkill for single-tier; fields on users are simpler and faster to query |

**Installation (mobile):**
```bash
npx expo install react-native-purchases
```

**No new API dependencies needed** -- all server-side libraries already installed.

## Architecture Patterns

### Recommended Project Structure
```
apps/api/src/
  services/
    premium.service.ts       # Subscription status checks, entitlement helpers
    analytics.service.ts     # Analytics aggregation queries
  routes/
    premium.ts               # Webhook endpoint, subscription status, analytics API
  jobs/
    analytics-worker.ts      # Daily analytics pre-computation cron
    card-alert-worker.ts     # 2-hour batched card alert digest
  db/
    schema.ts                # Add isPremium, premiumExpiresAt to users; new analytics tables

apps/mobile/
  src/
    services/
      purchases.ts           # RevenueCat initialization, purchase flow helpers
    stores/
      premium.ts             # Zustand store for premium state
    components/
      premium/
        PremiumBadge.tsx      # Gold crown icon component
        PaywallScreen.tsx     # Premium subscription paywall
        AnalyticsDashboard.tsx # Full-screen analytics view
        LockedFeatureCard.tsx  # Soft upsell card with lock icon
    hooks/
      usePremium.ts           # Hook for premium status checks

packages/shared/src/schemas/
  premium.ts                  # Analytics response types, subscription status types
```

### Pattern 1: RevenueCat SDK Initialization
**What:** Configure RevenueCat with platform-specific API keys at app startup
**When to use:** App entry point, after auth state is resolved
**Example:**
```typescript
// Source: RevenueCat official Expo docs
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';

export function initPurchases(appUserId?: string) {
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

  const apiKey = Platform.select({
    ios: process.env.EXPO_PUBLIC_RC_IOS_KEY,
    android: process.env.EXPO_PUBLIC_RC_ANDROID_KEY,
  });

  if (!apiKey) return;

  Purchases.configure({
    apiKey,
    appUserID: appUserId, // Link to our user ID
  });
}
```

### Pattern 2: Server-Side Subscription Sync via Webhooks
**What:** RevenueCat POSTs subscription events to our API; we update user's premium status
**When to use:** All subscription lifecycle events (purchase, renewal, expiration, cancellation)
**Example:**
```typescript
// Webhook handler in premium routes
fastify.post('/webhooks/revenuecat', async (request, reply) => {
  // Verify authorization header
  const authHeader = request.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.REVENUECAT_WEBHOOK_SECRET}`) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const event = request.body as RevenueCatWebhookEvent;

  // Idempotency: track event.id to avoid duplicate processing
  const appUserId = event.app_user_id;

  switch (event.type) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'UNCANCELLATION':
      await setPremiumStatus(db, appUserId, true, new Date(event.expiration_at_ms));
      break;
    case 'EXPIRATION':
      await setPremiumStatus(db, appUserId, false, null);
      break;
    case 'CANCELLATION':
      // Still active until expiration_at_ms -- don't revoke yet
      break;
  }

  return reply.code(200).send({ ok: true });
});
```

### Pattern 3: Premium-Gated API Middleware
**What:** Fastify preHandler that checks isPremium before allowing access
**When to use:** Analytics endpoints, any premium-only API
**Example:**
```typescript
const requirePremium = async (request: FastifyRequest, reply: FastifyReply) => {
  const user = await db.select({ isPremium: users.isPremium })
    .from(users).where(eq(users.id, request.user.sub));
  if (!user[0]?.isPremium) {
    return reply.code(403).send({ error: 'Premium subscription required' });
  }
};

fastify.get('/analytics', {
  preHandler: [fastify.authenticate, requirePremium]
}, handler);
```

### Pattern 4: Analytics Pre-Computation (BullMQ Cron)
**What:** Daily job aggregates card demand data into a pre-computed table
**When to use:** Runs at 4am daily via BullMQ repeatable scheduler
**Example:**
```typescript
// SQL aggregation for "Most Wanted Cards"
const mostWanted = await db
  .select({
    cardId: userWantedCards.cardId,
    demandCount: sql<number>`count(*)::int`,
  })
  .from(userWantedCards)
  .groupBy(userWantedCards.cardId)
  .orderBy(desc(sql`count(*)`))
  .limit(10);
```

### Pattern 5: Card Alert Trigger + Batching
**What:** When a user adds a card to collection, check if premium users want it; batch alerts every 2 hours
**When to use:** Hook into `addToCollection` and `bulkUpdateCollection` service functions
**Example:**
```typescript
// After card is added to collection
export async function checkCardAlerts(db: any, addedByUserId: string, cardId: string) {
  // Find premium users who want this card
  const premiumWanters = await db
    .select({ userId: userWantedCards.userId })
    .from(userWantedCards)
    .innerJoin(users, eq(users.id, userWantedCards.userId))
    .where(and(
      eq(userWantedCards.cardId, cardId),
      eq(users.isPremium, true),
      sql`${userWantedCards.userId} != ${addedByUserId}`
    ));

  // Queue alert events for batching (not send immediately)
  for (const wanter of premiumWanters) {
    await queueCardAlert(wanter.userId, cardId, addedByUserId);
  }
}
```

### Anti-Patterns to Avoid
- **Checking subscription on every API call via RevenueCat API:** Use local DB flag synced via webhooks; calling RevenueCat API adds latency and rate limit risk
- **Revoking access on CANCELLATION event:** User has paid through the billing period; revoke only on EXPIRATION
- **Real-time analytics computation:** Pre-compute daily; real-time aggregation across all users is expensive
- **Sending individual card alerts immediately:** Users could get dozens of notifications; batch into 2-hour digests
- **Storing RevenueCat receipts/tokens in DB:** Let RevenueCat handle receipt validation; store only status flags

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| IAP receipt validation | Custom StoreKit/Google Billing integration | RevenueCat SDK | Platform-specific receipt validation is fragile; App Store review catches mistakes |
| Subscription lifecycle management | Custom renewal/expiration tracking | RevenueCat webhooks | Grace periods, family sharing, price changes, refunds have dozens of edge cases |
| Paywall A/B testing | Custom experiment framework | RevenueCat Paywalls (optional) | If needed later, RC provides this built-in |
| Cron job scheduling | Custom setInterval/setTimeout | BullMQ repeatable jobs | Already proven in project; handles restarts, deduplication |

**Key insight:** RevenueCat abstracts the hardest part (store compliance). The server only needs to track "is this user premium right now?" via webhook sync.

## Common Pitfalls

### Pitfall 1: Revoking Access on Cancellation
**What goes wrong:** Removing premium immediately when user cancels
**Why it happens:** Confusing CANCELLATION (won't renew) with EXPIRATION (subscription ended)
**How to avoid:** Only revoke on EXPIRATION event; cancellation means user paid through current period
**Warning signs:** Users complaining about losing access they paid for

### Pitfall 2: Race Condition Between Client and Webhook
**What goes wrong:** User purchases on mobile, app shows premium, but API still sees free tier
**Why it happens:** Webhook delivery takes 5-60 seconds; client knows about purchase before server
**How to avoid:** After purchase on client, call a `/premium/sync` endpoint that fetches latest status from RevenueCat REST API as a fallback; also trust the client-side `CustomerInfo` for immediate UI updates
**Warning signs:** Users seeing "Premium required" errors right after purchasing

### Pitfall 3: Expo Go Incompatibility
**What goes wrong:** `react-native-purchases` crashes or no-ops in Expo Go
**Why it happens:** IAP requires native modules not available in Expo Go
**How to avoid:** Use development builds (EAS Build) for testing; RevenueCat has Preview API Mode for basic Expo Go testing
**Warning signs:** `NativeEventEmitter` errors, undefined purchase methods

### Pitfall 4: Analytics Query Performance
**What goes wrong:** Slow API responses when computing analytics on demand
**Why it happens:** Aggregating across all users' wanted lists and collections is O(n) on total rows
**How to avoid:** Pre-compute daily into a `card_analytics` table; API reads pre-computed data
**Warning signs:** Analytics endpoint taking >1 second

### Pitfall 5: Alert Notification Spam
**What goes wrong:** Premium user with 50 wanted cards gets constant notifications
**Why it happens:** Each collection add triggers a check; popular cards trigger many alerts
**How to avoid:** Batch alerts into 2-hour digests; deduplicate by (userId, cardId) within batch window
**Warning signs:** Users disabling notifications entirely

### Pitfall 6: Premium Score Boost Dominance
**What goes wrong:** Free users never see their matches because premium users always rank higher
**Why it happens:** Score multiplier too aggressive; premium users always at top
**How to avoid:** Use 25% additive boost (not multiplicative); ensure high-quality free matches beat low-quality premium ones
**Warning signs:** Free user engagement dropping; matches feel "pay-to-win"

## Code Examples

### Database Schema Changes
```typescript
// Add to users table in schema.ts
export const users = pgTable('users', {
  // ...existing fields...
  isPremium: boolean('is_premium').default(false).notNull(),
  premiumExpiresAt: timestamp('premium_expires_at'),
  revenuecatId: varchar('revenuecat_id', { length: 100 }),
});

// New pre-computed analytics table
export const cardAnalytics = pgTable('card_analytics', {
  id: text('id').primaryKey(),
  cardId: text('card_id').notNull().references(() => cards.id),
  metric: varchar('metric', { length: 30 }).notNull(), // 'most_wanted', 'least_available', 'trending'
  value: integer('value').notNull(),
  rank: integer('rank').notNull(),
  computedAt: timestamp('computed_at').defaultNow().notNull(),
}, (table) => [
  index('card_analytics_metric_rank_idx').on(table.metric, table.rank),
  uniqueIndex('card_analytics_card_metric_idx').on(table.cardId, table.metric),
]);

// Pending card alert events (for batching)
export const cardAlertEvents = pgTable('card_alert_events', {
  id: text('id').primaryKey(),
  premiumUserId: text('premium_user_id').notNull().references(() => users.id),
  cardId: text('card_id').notNull().references(() => cards.id),
  addedByUserId: text('added_by_user_id').notNull().references(() => users.id),
  processed: boolean('processed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('card_alert_events_user_processed_idx').on(table.premiumUserId, table.processed),
]);
```

### Premium Score Boost in Match Service
```typescript
// Modify getMatchesForUser in match.service.ts
// After fetching matchRows and before sorting:
// Apply premium boost to partner's matches when viewing
export function applyPremiumBoost(score: number, isPremium: boolean): number {
  if (!isPremium) return score;
  // 25% additive boost -- ensures quality still matters
  return Math.round(score * 1.25);
}
```

### RevenueCat Customer Info Check (Mobile)
```typescript
// Source: RevenueCat official docs
import Purchases from 'react-native-purchases';

export async function checkPremiumStatus(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return typeof customerInfo.entitlements.active['premium'] !== 'undefined';
  } catch {
    return false;
  }
}
```

### Analytics BullMQ Worker Setup
```typescript
// Follow existing notification-worker.ts pattern
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

const QUEUE_NAME = 'analytics-compute';

export async function initAnalyticsWorker(db: any): Promise<void> {
  const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
  });

  const queue = new Queue(QUEUE_NAME, { connection });

  // Run daily at 4am
  await queue.upsertJobScheduler(
    'compute-daily-analytics',
    { pattern: '0 4 * * *' },
    { name: 'compute', data: {} },
  );

  new Worker(QUEUE_NAME, async () => {
    await computeMostWanted(db);
    await computeLeastAvailable(db);
    await computeTrending(db);
  }, { connection: new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: null }) });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct StoreKit/Google Billing | RevenueCat SDK abstraction | 2020+ | Eliminates platform-specific receipt validation code |
| expo-iap | react-native-purchases | 2023+ | RevenueCat is the de facto standard for Expo IAP |
| Real-time analytics queries | Pre-computed background jobs | Standard pattern | Keeps API responses fast regardless of data size |
| Individual alert notifications | Batched digest notifications | Standard pattern | Prevents notification fatigue |

**Deprecated/outdated:**
- `expo-in-app-purchases` (Expo's old IAP module): Removed in favor of third-party solutions like RevenueCat
- RevenueCat API v1 for server-side checks: v2 is current but v1 still works; webhooks are preferred over polling

## Open Questions

1. **RevenueCat API Keys**
   - What we know: Need separate iOS and Android API keys from RevenueCat dashboard
   - What's unclear: Whether the project has RevenueCat account/project set up
   - Recommendation: Document as a prerequisite; keys go in `.env` and `app.json` environment

2. **EAS Build Requirement**
   - What we know: `react-native-purchases` requires native modules (no Expo Go)
   - What's unclear: Whether the project currently uses EAS Build or bare workflow
   - Recommendation: Plan includes EAS Build config if not already set up; development testing uses RevenueCat sandbox mode

3. **Trending Cards Time Window**
   - What we know: CONTEXT.md says "past 7 days" for trending
   - What's unclear: Exact implementation -- need `created_at` on wanted cards (already exists) to compute 7-day diff
   - Recommendation: Compare current wanted count vs 7-days-ago snapshot; store previous counts or compute delta

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7 + ts-jest |
| Config file | `apps/api/jest.config.js` |
| Quick run command | `cd apps/api && npx jest --testPathPattern="<pattern>" --no-coverage` |
| Full suite command | `cd apps/api && npx jest --no-coverage` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PREM-01 | Webhook updates user premium status correctly | unit | `cd apps/api && npx jest --testPathPattern="premium.service" --no-coverage` | No -- Wave 0 |
| PREM-01 | Webhook auth rejects invalid tokens | unit | `cd apps/api && npx jest --testPathPattern="premium" --no-coverage` | No -- Wave 0 |
| PREM-02 | Analytics queries return correct top-10 rankings | unit | `cd apps/api && npx jest --testPathPattern="analytics.service" --no-coverage` | No -- Wave 0 |
| PREM-02 | Analytics API returns 403 for free users | integration | `cd apps/api && npx jest --testPathPattern="premium" --no-coverage` | No -- Wave 0 |
| PREM-03 | Premium boost applied correctly to match scores | unit | `cd apps/api && npx jest --testPathPattern="match.service" --no-coverage` | Partial (existing match tests) |
| PREM-04 | Card alert events created when collection is updated | unit | `cd apps/api && npx jest --testPathPattern="card-alert" --no-coverage` | No -- Wave 0 |
| PREM-04 | Alert batching job sends digest notifications | unit | `cd apps/api && npx jest --testPathPattern="card-alert" --no-coverage` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `cd apps/api && npx jest --testPathPattern="<relevant_test>" --no-coverage`
- **Per wave merge:** `cd apps/api && npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/api/__tests__/services/premium.service.test.ts` -- covers PREM-01 (webhook handling, status sync)
- [ ] `apps/api/__tests__/services/analytics.service.test.ts` -- covers PREM-02 (aggregation queries)
- [ ] `apps/api/__tests__/routes/premium.route.test.ts` -- covers PREM-01, PREM-02 (API endpoints, auth gating)
- [ ] `apps/api/__tests__/services/card-alert.service.test.ts` -- covers PREM-04 (alert creation, batching)
- [ ] Extend existing `match.service.test.ts` -- covers PREM-03 (premium boost)

## Sources

### Primary (HIGH confidence)
- [RevenueCat Expo Installation Docs](https://www.revenuecat.com/docs/getting-started/installation/expo) -- SDK setup, configuration, API
- [RevenueCat Webhook Docs](https://www.revenuecat.com/docs/integrations/webhooks) -- Event types, payload structure, security
- [RevenueCat Event Types](https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields) -- Complete event list and fields
- Project codebase -- Existing BullMQ patterns, Drizzle schema, notification service, match service

### Secondary (MEDIUM confidence)
- [Expo IAP Guide](https://docs.expo.dev/guides/in-app-purchases/) -- Expo's official IAP recommendation (points to RevenueCat)
- [RevenueCat REST API](https://www.revenuecat.com/docs/api-v1) -- Server-side subscription verification fallback

### Tertiary (LOW confidence)
- Score boost exact percentage (25% recommended based on context constraints of 20-30%) -- needs tuning with real data

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- RevenueCat is the clear standard for Expo IAP; all other deps already in project
- Architecture: HIGH -- Follows established project patterns (BullMQ workers, Drizzle schema, service layer)
- Pitfalls: HIGH -- Well-documented in RevenueCat docs and community; subscription lifecycle is well-understood
- Analytics implementation: MEDIUM -- SQL aggregation patterns are standard but exact query performance depends on data volume
- Alert batching: MEDIUM -- Pattern is sound but deduplication edge cases need careful implementation

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable domain; RevenueCat SDK updates are backwards-compatible)
