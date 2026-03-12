# Phase 4: Trade Matching Engine - Research

**Researched:** 2026-03-08
**Domain:** Two-way trade match detection, job queues, real-time notifications, pre-computed match storage
**Confidence:** HIGH

## Summary

Phase 4 implements the core value proposition of the app: automatically finding two-way trade matches between users. The system needs a matching algorithm (SQL-based), a job queue for debounced recomputation (BullMQ), a real-time transport for in-app notifications (Socket.IO), and a pre-computed matches table for fast retrieval. Push notifications extend the existing Expo Push SDK infrastructure.

The matching algorithm is fundamentally a SQL self-join: find all user pairs where user A's collection intersects user B's wanted list AND user B's collection intersects user A's wanted list. This can be expressed as a single query but must be carefully indexed. Matches are pre-computed and stored in a `trade_matches` table, enabling instant load on app open, badge counts, and "seen" tracking.

BullMQ handles debounced match recomputation when users modify collections/wanted lists. Socket.IO provides real-time in-app notifications. The project already has `react-native-toast-message` installed for toast banners.

**Primary recommendation:** Use SQL-based matching with pre-computed results stored in a `trade_matches` table, BullMQ with deduplication/debounce mode for event-driven recomputation, and Socket.IO for real-time in-app notifications with toast banners.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Match cards in scrollable vertical list on Trades tab (replaces "Coming soon" placeholder)
- Each match card shows: partner avatar/name, card(s) you'd give, card(s) you'd get, star rating (1-3)
- Star rating based on combined priority of wanted cards in the match (maps from high/medium/low priority system)
- Tap match card opens full match modal: partner profile (name, avatar, friend code, trade count), all tradeable card pairs with images, priority indicators, and "Propose Trade" button (placeholder, wired in Phase 5)
- Default sort: priority-first (high-priority wanted cards first, then medium, then low; within same priority, sort by number of tradeable cards)
- Sort toggle button at top of Trades tab: Priority (default), Most Cards, Newest
- No filter controls in v1 -- users scroll and use sort
- Stale matches auto-removed silently on next refresh
- Toast banner slides down from top when new match found while app is open: "New match found! [Partner] has [Card] you want."
- Tap banner jumps to the match in Trades tab
- Auto-dismisses after 5 seconds
- Red count badge on Trades tab icon showing unseen match count, clears when tab opened
- Batched digest push: "You have X new trade matches!" sent at most once per hour for medium/low priority
- High-priority matches bypass batch and push immediately: "High-priority match! [Partner] has [Card] you want."
- Tap notification opens Trades tab
- Uses existing Expo Push SDK infrastructure from Phase 2
- Event-driven: recompute when user adds/removes collection or wanted cards, plus on app open
- Collection/wanted changes queue a match job with 30-second debounce (bulk-add = one recompute)
- Matches stored in DB table (pre-computed) -- enables push notifications, badge counts, "seen" tracking
- No periodic background cron needed -- changes are the trigger
- Show cached matches immediately from DB, refresh in background
- Pull-to-refresh for manual update

### Claude's Discretion
- Real-time transport choice (Socket.IO, SSE, or polling for in-app notifications)
- Matching algorithm implementation (SQL query strategy, indexing)
- BullMQ job queue configuration for debounced match computation
- Match staleness detection logic
- Empty state design for Trades tab (no matches yet)
- Match card visual design details (spacing, animations)
- Multi-card match display approach (best pair featured, all pairs, or summary)
- Whether/how to handle rarity imbalance in match ranking

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MATCH-01 | System automatically finds two-way trade matches (A has what B wants AND B has what A wants) | SQL matching algorithm with pre-computed results table, BullMQ for event-driven recomputation |
| MATCH-02 | User sees pre-computed suggested trades when opening the app | trade_matches DB table with cached results, GET /matches endpoint, Zustand trades store |
| MATCH-03 | User receives push notification when a new match is found | Extend notification.service.ts with match notification types, batched digest + immediate high-priority |
| MATCH-04 | Matching engine uses wanted card priority to rank suggestions | Star rating (1-3) derived from priority enum, sort by priority then card count |
| MATCH-05 | User receives real-time in-app notification for new matches | Socket.IO server integration with Fastify, socket.io-client in React Native, toast banner via react-native-toast-message |
</phase_requirements>

## Standard Stack

### Core (New Dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| bullmq | ^5.x | Job queue for debounced match recomputation | Industry standard Node.js job queue built on Redis, supports deduplication/debounce mode natively |
| ioredis | ^5.x | Redis client (BullMQ dependency) | Required by BullMQ, also useful for Socket.IO adapter if scaling later |
| socket.io | ^4.x | Real-time server for in-app notifications | Mature WebSocket abstraction with fallback transports, well-supported Fastify plugin |
| socket.io-client | ^4.x | Real-time client for React Native | Official client, works with Expo/React Native out of the box |
| fastify-socket.io | ^5.x | Fastify plugin for Socket.IO integration | Official community plugin, adds `io` decorator to Fastify instance |

### Already Installed (Reuse)
| Library | Purpose | How Used |
|---------|---------|----------|
| react-native-toast-message | ^2.3.3 | Toast banners for in-app match notifications (already installed) |
| expo-notifications | ~0.32.16 | Push notification infrastructure (already wired) |
| expo-server-sdk | ^6.0.0 | Server-side push notification sending |
| zustand | ^5.0.11 | Client-side trades store for match state |
| @shopify/flash-list | 2.0.2 | Performant scrollable list for match cards |
| drizzle-orm | ^0.45.0 | Database queries and schema for trade_matches table |
| zod | ^3.24.0 | Request/response validation schemas |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Socket.IO | SSE (Server-Sent Events) | SSE is simpler and one-directional (sufficient for notifications), but Socket.IO provides room-based targeting (emit to specific user), automatic reconnection, and future-proofs for Phase 5 bidirectional trade proposal flow |
| Socket.IO | Polling | Much simpler but poor UX -- up to 30s delay for notifications, wastes bandwidth |
| BullMQ | setTimeout in-process | No persistence, lost on server restart, no deduplication, no monitoring |

**Recommendation: Use Socket.IO** over SSE for these reasons:
1. Room-based targeting: each user joins a room `user:{userId}`, server emits directly to them
2. Bidirectional: will be needed in Phase 5 for trade proposal real-time updates
3. Automatic reconnection and transport fallback built-in
4. Fastify plugin provides clean integration

**Installation (API):**
```bash
cd apps/api && npm install bullmq ioredis socket.io fastify-socket.io
```

**Installation (Mobile):**
```bash
cd apps/mobile && npx expo install socket.io-client
```

## Architecture Patterns

### Database Schema: trade_matches table

```sql
CREATE TABLE trade_matches (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  partner_id TEXT NOT NULL REFERENCES users(id),
  -- JSON arrays of card IDs that can be traded
  user_gives JSONB NOT NULL,    -- cards user has that partner wants
  user_gets JSONB NOT NULL,     -- cards partner has that user wants
  -- Scoring
  score INTEGER NOT NULL,       -- computed priority score for ranking
  star_rating INTEGER NOT NULL, -- 1-3 stars derived from score
  card_count INTEGER NOT NULL,  -- total tradeable card pairs
  -- Tracking
  seen BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, partner_id)
);

-- Indexes
CREATE INDEX trade_matches_user_id_idx ON trade_matches(user_id);
CREATE INDEX trade_matches_user_seen_idx ON trade_matches(user_id, seen);
```

Key design notes:
- Each match is stored TWICE (one row per user perspective) for fast user-specific queries
- `user_gives` / `user_gets` are JSONB arrays of `{cardId, priority}` objects
- `score` is computed from priority weights: high=3, medium=2, low=1, summed across user_gets cards
- `star_rating`: score >= 6 = 3 stars, score >= 3 = 2 stars, else 1 star
- `UNIQUE(user_id, partner_id)` prevents duplicate match rows -- upsert on recompute

### Pattern 1: SQL Two-Way Matching Algorithm

**What:** Find all user pairs where both sides have cards the other wants
**When to use:** On match recomputation (triggered by collection/wanted changes)

```typescript
// Conceptual query using Drizzle ORM
// Step 1: Find what user A can give to each potential partner
// user A's collection INTERSECT other users' wanted lists
const aGivesToB = db
  .select({
    userId: sql`${userCollectionItems.userId}`.as('giver'),
    partnerId: sql`${userWantedCards.userId}`.as('receiver'),
    cardId: userCollectionItems.cardId,
    priority: userWantedCards.priority,
  })
  .from(userCollectionItems)
  .innerJoin(
    userWantedCards,
    and(
      eq(userCollectionItems.cardId, userWantedCards.cardId),
      ne(userCollectionItems.userId, userWantedCards.userId),
    )
  )
  .where(eq(userCollectionItems.userId, targetUserId));

// Step 2: Find what partners can give back to user A
// Partners' collections INTERSECT user A's wanted list
const bGivesToA = db
  .select({
    userId: sql`${userWantedCards.userId}`.as('receiver'),
    partnerId: sql`${userCollectionItems.userId}`.as('giver'),
    cardId: userCollectionItems.cardId,
    priority: userWantedCards.priority,
  })
  .from(userCollectionItems)
  .innerJoin(
    userWantedCards,
    and(
      eq(userCollectionItems.cardId, userWantedCards.cardId),
      ne(userCollectionItems.userId, userWantedCards.userId),
    )
  )
  .where(eq(userWantedCards.userId, targetUserId));

// Step 3: Partners who appear in BOTH directions are two-way matches
```

**Performance:** The existing indexes on `user_collection_items(user_id, card_id)` and `user_wanted_cards(user_id, card_id)` support this query. For the reverse lookup (finding partners), the `card_id` indexes enable the join efficiently.

### Pattern 2: BullMQ Debounced Match Job

**What:** Queue match recomputation with 30-second debounce
**When to use:** After collection/wanted mutations

```typescript
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis({ maxRetriesPerRequest: null });

const matchQueue = new Queue('match-recompute', { connection });

// Add job with deduplication in debounce mode
export async function queueMatchRecompute(userId: string) {
  await matchQueue.add(
    'recompute',
    { userId },
    {
      deduplication: {
        id: `match:${userId}`,
        ttl: 30000,       // 30-second window
        extend: true,     // reset timer on each new trigger
        replace: true,    // use latest data
      },
      delay: 30000,       // wait 30 seconds before processing
    }
  );
}

// Worker processes the job
const worker = new Worker('match-recompute', async (job) => {
  const { userId } = job.data;
  await recomputeMatchesForUser(db, userId);
}, { connection });
```

### Pattern 3: Socket.IO User Room Pattern

**What:** Real-time notification delivery to specific users
**When to use:** After match computation finds new matches

```typescript
// Server: Fastify plugin setup
import fastifySocketIO from 'fastify-socket.io';

await app.register(fastifySocketIO, {
  cors: { origin: true },
});

// On connection, join user-specific room
app.io.on('connection', (socket) => {
  const userId = socket.handshake.auth.userId;
  if (userId) {
    socket.join(`user:${userId}`);
  }
});

// Emit new match to specific user
function notifyNewMatch(userId: string, match: TradeMatch) {
  app.io.to(`user:${userId}`).emit('new-match', match);
}
```

```typescript
// Client: React Native hook
import { io, Socket } from 'socket.io-client';

export function useMatchSocket() {
  const userId = useAuthStore((s) => s.userId);

  useEffect(() => {
    if (!userId) return;

    const socket = io(API_URL, {
      auth: { userId },
      transports: ['websocket'],
    });

    socket.on('new-match', (match) => {
      // Update Zustand store
      useTradesStore.getState().addMatch(match);

      // Show toast
      Toast.show({
        type: 'matchNotification',
        text1: 'New match found!',
        text2: `${match.partnerName} has ${match.topCardName} you want.`,
        visibilityTime: 5000,
      });
    });

    return () => { socket.disconnect(); };
  }, [userId]);
}
```

### Pattern 4: Tab Badge Count

**What:** Red badge on Trades tab icon showing unseen match count
**When to use:** When unseen matches exist

```typescript
// In _layout.tsx, read from Zustand store
const unseenCount = useTradesStore((s) => s.unseenCount);

<Tabs.Screen
  name="trades"
  options={{
    title: 'Trades',
    tabBarBadge: unseenCount > 0 ? unseenCount : undefined,
    tabBarBadgeStyle: { backgroundColor: '#e53e3e' },
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="swap-horizontal" size={size} color={color} />
    ),
  }}
/>
```

### Recommended Project Structure (New Files)

```
apps/api/src/
  services/
    match.service.ts         # Core matching algorithm + recompute logic
  routes/
    matches.ts               # GET /matches, POST /matches/refresh, PUT /matches/:id/seen
  jobs/
    match-worker.ts          # BullMQ worker for match recomputation
  plugins/
    socket.ts                # Socket.IO Fastify plugin setup
    redis.ts                 # Shared Redis/IORedis connection

apps/mobile/
  src/
    stores/
      trades.ts              # Zustand store for matches, unseen count
    hooks/
      useMatches.ts          # Load matches, refresh, mark seen
      useMatchSocket.ts      # Socket.IO connection + toast notifications
    components/
      MatchCard.tsx           # Match card component (vertical list item)
      MatchDetailModal.tsx    # Full match detail modal
      MatchSortToggle.tsx     # Sort toggle button (Priority/Most Cards/Newest)

packages/shared/src/schemas/
  match.ts                    # Zod schemas for match types
```

### Anti-Patterns to Avoid
- **Computing matches on-demand per request:** Too slow for large user bases; always use pre-computed table
- **Storing matches only once per pair:** Creates complex queries to show user-specific perspective; store twice (one per user view)
- **Using setTimeout for debounce in API process:** Lost on restart, no deduplication across multiple server instances
- **Polling for real-time notifications:** Wastes bandwidth, poor UX; use Socket.IO

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Job queue with debounce | Custom setTimeout + Map tracking | BullMQ with deduplication mode | Persistence across restarts, built-in deduplication, monitoring |
| Real-time push to client | Custom WebSocket server | Socket.IO + fastify-socket.io | Reconnection, room targeting, transport fallback, Fastify integration |
| Toast banners | Custom Animated.View | react-native-toast-message (already installed) | Supports custom types, auto-dismiss, onPress handlers |
| Push notification chunking | Manual batch splitting | expo-server-sdk chunkPushNotifications (already used) | Handles Expo API limits, rate limiting |

**Key insight:** The complexity in this phase is in the matching algorithm and orchestration (when to recompute, how to debounce, how to diff new vs old matches for notifications). The transport layers (BullMQ, Socket.IO, push) are well-solved problems -- use the libraries.

## Common Pitfalls

### Pitfall 1: N+1 Query in Match Card Rendering
**What goes wrong:** Loading match list, then fetching card details and partner profiles individually
**Why it happens:** Match table stores card IDs, need to JOIN to get names/images
**How to avoid:** GET /matches endpoint returns fully hydrated match objects with card names, images, partner displayName, avatar, friend code in a single query with JOINs
**Warning signs:** Multiple API calls on Trades tab load, slow initial render

### Pitfall 2: Match Explosion with Large User Base
**What goes wrong:** Recomputing matches for ALL users when one user changes their collection
**Why it happens:** Naive approach recomputes globally
**How to avoid:** Only recompute matches FOR the user who changed their data. Their partners' match rows update as a side effect of the same computation. Scope the query: "find all matches WHERE user_id = targetUserId"
**Warning signs:** Match recompute taking > 5 seconds

### Pitfall 3: Duplicate Notifications for Existing Matches
**What goes wrong:** User gets "new match" notifications for matches they already knew about
**Why it happens:** Recompute replaces all matches, doesn't diff against previous state
**How to avoid:** Before upserting new matches, snapshot existing match partner IDs. After upsert, diff to find truly NEW partner matches. Only notify for new ones
**Warning signs:** Users getting repeated notifications for same partners

### Pitfall 4: Race Condition Between Debounce and Match Read
**What goes wrong:** User opens Trades tab, sees stale data, then match recompute runs 30s later
**Why it happens:** Debounce delay means matches may be slightly behind
**How to avoid:** On app open / pull-to-refresh, trigger an IMMEDIATE recompute (bypass debounce queue) via POST /matches/refresh endpoint. The 30-second debounce is only for collection/wanted mutation events
**Warning signs:** Users see empty Trades tab despite having matches

### Pitfall 5: Socket.IO Memory Leak on React Native
**What goes wrong:** Socket connections not cleaned up on logout/unmount
**Why it happens:** Missing cleanup in useEffect
**How to avoid:** Always disconnect socket in useEffect cleanup. On logout, disconnect and clear trades store
**Warning signs:** Multiple socket connections per user after navigating away/back

### Pitfall 6: Android Cleartext Traffic Blocking
**What goes wrong:** Socket.IO connection fails on Android in development
**Why it happens:** Android 9+ blocks HTTP (non-HTTPS) by default
**How to avoid:** Use `transports: ['websocket']` in socket.io-client config; in development, configure Android to allow cleartext via network security config (or use Expo's built-in handling)
**Warning signs:** iOS works, Android does not connect

### Pitfall 7: Stale Match Detection
**What goes wrong:** Match shows a card the partner no longer has or user no longer wants
**Why it happens:** Collection/wanted changes by partner haven't triggered recompute for this user's view yet
**How to avoid:** On match refresh, re-validate all existing matches against current collection/wanted state. Delete matches where the intersection is now empty. This happens naturally if recompute does a full recalculation (delete old + insert new)
**Warning signs:** Tapping a match card shows cards that are no longer available

## Code Examples

### Star Rating Calculation
```typescript
// Priority weights for score calculation
const PRIORITY_WEIGHT = { high: 3, medium: 2, low: 1 } as const;

function calculateMatchScore(
  userGets: Array<{ cardId: string; priority: string }>
): { score: number; starRating: number } {
  const score = userGets.reduce(
    (sum, card) => sum + (PRIORITY_WEIGHT[card.priority as keyof typeof PRIORITY_WEIGHT] || 1),
    0
  );
  const starRating = score >= 6 ? 3 : score >= 3 ? 2 : 1;
  return { score, starRating };
}
```

### Match Recompute with Diff for Notifications
```typescript
async function recomputeMatchesForUser(db: Db, io: Server, userId: string) {
  // 1. Snapshot existing match partner IDs
  const existingPartners = new Set(
    (await db.select({ partnerId: tradeMatches.partnerId })
      .from(tradeMatches)
      .where(eq(tradeMatches.userId, userId))
    ).map(r => r.partnerId)
  );

  // 2. Delete old matches for this user
  await db.delete(tradeMatches).where(eq(tradeMatches.userId, userId));

  // 3. Compute new matches (SQL joins)
  const newMatches = await computeTwoWayMatches(db, userId);

  // 4. Insert new matches (both perspectives)
  for (const match of newMatches) {
    await insertMatchPair(db, userId, match);
  }

  // 5. Diff and notify
  const newPartnerIds = newMatches
    .map(m => m.partnerId)
    .filter(pid => !existingPartners.has(pid));

  for (const partnerId of newPartnerIds) {
    const match = newMatches.find(m => m.partnerId === partnerId);
    // Real-time in-app notification
    io.to(`user:${userId}`).emit('new-match', match);
    // Queue push notification (batched or immediate based on priority)
    await queueMatchPushNotification(db, userId, match);
  }
}
```

### Push Notification Batching
```typescript
// Use BullMQ for batched notifications
const notificationQueue = new Queue('match-notifications', { connection });

async function queueMatchPushNotification(db: Db, userId: string, match: MatchData) {
  const maxPriority = getMaxPriority(match.userGets);

  if (maxPriority === 'high') {
    // Immediate push for high-priority
    await sendMatchPush(db, userId, match, 'immediate');
  } else {
    // Batched digest -- aggregate in queue, send at most once per hour
    await notificationQueue.add(
      'digest',
      { userId, matchId: match.id },
      {
        deduplication: {
          id: `digest:${userId}`,
          ttl: 3600000, // 1 hour
        },
        delay: 3600000,
      }
    );
  }
}
```

### Toast Notification Config (react-native-toast-message)
```typescript
// Custom toast config for match notifications
const toastConfig = {
  matchNotification: ({ text1, text2, onPress }: any) => (
    <TouchableOpacity onPress={onPress} style={styles.matchToast}>
      <Ionicons name="swap-horizontal" size={20} color={colors.primary} />
      <View style={styles.matchToastText}>
        <Text style={styles.matchToastTitle}>{text1}</Text>
        <Text style={styles.matchToastBody}>{text2}</Text>
      </View>
    </TouchableOpacity>
  ),
};

// In app root: <Toast config={toastConfig} />
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Bull (v3) | BullMQ (v5) | 2023+ | BullMQ is the maintained successor; Bull is in maintenance mode |
| Manual WebSocket | Socket.IO v4 | 2021+ | Built-in reconnection, room targeting, transport fallback |
| Polling for real-time | Socket.IO / SSE | Standard | Better UX, lower bandwidth, instant notifications |
| On-demand match computation | Pre-computed match tables | Standard for scale | Instant load, enables push notifications, badge counts |

**Deprecated/outdated:**
- Bull (v3): Use BullMQ instead -- same team, better API, built on Redis Streams
- `fastify-websocket` for Socket.IO-like features: Use `fastify-socket.io` for Socket.IO integration

## Open Questions

1. **Redis Instance**
   - What we know: BullMQ and Socket.IO both need Redis. The project stack mentions Redis but no Redis instance is currently configured in the codebase
   - What's unclear: Whether to use a single Redis instance for both or separate ones
   - Recommendation: Single Redis instance for both (standard practice for this scale). Add REDIS_URL to .env configuration

2. **Match Recompute for Partners**
   - What we know: When user A changes collection, we recompute A's matches. But partner B's match view also changes
   - What's unclear: Whether to also queue recomputes for all affected partners
   - Recommendation: Recompute for BOTH sides in the same job. When computing A's matches, also upsert the partner-perspective rows. This avoids queueing N additional jobs

3. **Rarity Imbalance in Ranking**
   - What we know: User decided this is Claude's discretion. Fairness evaluation comes in Phase 5 (TRADE-06)
   - Recommendation: For Phase 4, do NOT penalize rarity-imbalanced matches in ranking. Show all valid two-way matches. Add a subtle rarity indicator on match cards (e.g., show rarity icons on give/get cards) so users can make informed decisions. Formal fairness scoring deferred to Phase 5

4. **Multi-Card Match Display**
   - What we know: Claude's discretion on approach
   - Recommendation: On the match card (list item), show the "best pair" -- the highest-priority card the user would GET, paired with any card they'd GIVE. Show "+N more" if additional pairs exist. In the detail modal, show ALL tradeable pairs

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7 + ts-jest |
| Config file | apps/api/package.json (jest config via ts-jest) |
| Quick run command | `cd apps/api && npx jest --testPathPattern=match -x` |
| Full suite command | `cd apps/api && npx jest` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MATCH-01 | Two-way match detection (A has B's wants, B has A's wants) | unit | `cd apps/api && npx jest __tests__/services/match.service.test.ts -x` | No - Wave 0 |
| MATCH-02 | GET /matches returns pre-computed matches | integration | `cd apps/api && npx jest __tests__/routes/matches.route.test.ts -x` | No - Wave 0 |
| MATCH-03 | Push notification sent for new matches | unit | `cd apps/api && npx jest __tests__/services/match.service.test.ts -t "notification" -x` | No - Wave 0 |
| MATCH-04 | Matches ranked by wanted card priority (star rating) | unit | `cd apps/api && npx jest __tests__/services/match.service.test.ts -t "ranking" -x` | No - Wave 0 |
| MATCH-05 | Socket.IO emits new-match event | integration | `cd apps/api && npx jest __tests__/services/match.service.test.ts -t "socket" -x` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `cd apps/api && npx jest --testPathPattern=match -x`
- **Per wave merge:** `cd apps/api && npx jest`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/api/__tests__/services/match.service.test.ts` -- covers MATCH-01, MATCH-03, MATCH-04, MATCH-05
- [ ] `apps/api/__tests__/routes/matches.route.test.ts` -- covers MATCH-02
- [ ] `apps/api/__tests__/setup.ts` -- needs update to register match routes and add trade_matches to TRUNCATE
- [ ] Redis mock or test Redis instance for BullMQ worker tests
- [ ] Framework install: `cd apps/api && npm install bullmq ioredis socket.io fastify-socket.io`

## Sources

### Primary (HIGH confidence)
- Project codebase analysis: schema.ts, collection.service.ts, wanted.service.ts, notification.service.ts, server.ts, _layout.tsx, trades.tsx
- [BullMQ Official Docs - Deduplication](https://docs.bullmq.io/guide/jobs/deduplication) - debounce mode configuration
- [BullMQ Official Docs - Quick Start](https://docs.bullmq.io/readme-1) - setup and worker patterns

### Secondary (MEDIUM confidence)
- [Socket.IO - How to use with React Native](https://socket.io/how-to/use-with-react-native) - client setup, transports config
- [fastify-socket.io npm](https://www.npmjs.com/package/fastify-socket.io) - Fastify integration pattern
- [Expo Router Tabs Documentation](https://docs.expo.dev/router/advanced/tabs/) - tabBarBadge configuration
- [react-native-toast-message GitHub](https://github.com/calintamas/react-native-toast-message) - custom toast types

### Tertiary (LOW confidence)
- WebSearch results on matching algorithm patterns (verified against SQL fundamentals)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - BullMQ, Socket.IO, and fastify-socket.io are well-documented, actively maintained libraries with clear APIs
- Architecture: HIGH - SQL matching algorithm is straightforward set intersection; pre-computed table pattern is standard
- Pitfalls: HIGH - based on codebase analysis and standard real-time notification patterns
- Validation: MEDIUM - test patterns follow existing project conventions but Socket.IO testing may require additional setup

**Research date:** 2026-03-08
**Valid until:** 2026-04-07 (stable libraries, 30 days)
