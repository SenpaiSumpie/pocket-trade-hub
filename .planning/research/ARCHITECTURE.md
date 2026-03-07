# Architecture Patterns

**Domain:** Mobile trading/matchmaking platform (Pokemon TCG Pocket)
**Researched:** 2026-03-07

## Recommended Architecture

A three-tier architecture: React Native mobile client, a RESTful API server with WebSocket support, and background job workers -- all backed by PostgreSQL as the primary data store and Redis for caching, queues, and real-time pub/sub.

```
┌─────────────────────────────────────────────────────────┐
│                   MOBILE CLIENT                         │
│              (React Native / Expo)                      │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │Inventory │ │ Trade    │ │ Search   │ │ Premium   │  │
│  │Manager   │ │ Center   │ │ & Browse │ │ Features  │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘  │
│       │             │            │             │        │
│  ┌─────────────────────────────────────────────────┐    │
│  │  State Management (Zustand / TanStack Query)    │    │
│  └─────────────────────────────────────────────────┘    │
│       │ REST              │ WebSocket                   │
└───────┼───────────────────┼─────────────────────────────┘
        │                   │
┌───────┼───────────────────┼─────────────────────────────┐
│       ▼                   ▼          API SERVER          │
│  ┌──────────┐    ┌──────────────┐                       │
│  │ REST API │    │  WebSocket   │                       │
│  │ (Express │    │  Gateway     │                       │
│  │  / Hono) │    │  (Socket.io) │                       │
│  └────┬─────┘    └──────┬───────┘                       │
│       │                 │                                │
│  ┌────┴─────────────────┴────────┐                      │
│  │       Service Layer           │                      │
│  │  ┌─────────┐  ┌───────────┐  │                      │
│  │  │ Auth    │  │ Trade     │  │                      │
│  │  │ Service │  │ Service   │  │                      │
│  │  ├─────────┤  ├───────────┤  │                      │
│  │  │ Card    │  │ Matching  │  │                      │
│  │  │ Service │  │ Service   │  │                      │
│  │  ├─────────┤  ├───────────┤  │                      │
│  │  │Inventory│  │ Billing   │  │                      │
│  │  │ Service │  │ Service   │  │                      │
│  │  └─────────┘  └───────────┘  │                      │
│  └───────────────────────────────┘                      │
│       │                                                  │
└───────┼──────────────────────────────────────────────────┘
        │
┌───────┼──────────────────────────────────────────────────┐
│       ▼              DATA LAYER                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐   │
│  │PostgreSQL│  │  Redis   │  │  Job Queue (BullMQ)  │   │
│  │          │  │ (Cache + │  │  - Match worker      │   │
│  │ - Users  │  │  Pub/Sub)│  │  - Notification      │   │
│  │ - Cards  │  │          │  │    worker             │   │
│  │ - Trades │  │          │  │  - Billing worker     │   │
│  │ - Invent.│  │          │  │                       │   │
│  └──────────┘  └──────────┘  └──────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **React Native App** | UI, local state, offline card browsing, push notification handling | API Server (REST + WebSocket) |
| **REST API** | CRUD operations for users, cards, inventory, trades, subscriptions | Service Layer, PostgreSQL |
| **WebSocket Gateway** | Real-time trade match notifications, trade proposal updates, presence | Service Layer, Redis Pub/Sub |
| **Auth Service** | Registration, login, JWT token management, session refresh | PostgreSQL (users table) |
| **Card Service** | Card database queries, search, set management, admin import | PostgreSQL (cards tables), Redis (search cache) |
| **Inventory Service** | User collection CRUD, bulk import, wanted list management | PostgreSQL (inventory tables) |
| **Trade Service** | Trade proposals, accept/reject/counter, trade history | PostgreSQL (trades tables), Matching Service |
| **Matching Service** | Background trade matching algorithm, match scoring, fairness evaluation | PostgreSQL, Redis, Job Queue |
| **Billing Service** | Stripe subscription management, webhook processing, entitlement checks | Stripe API, PostgreSQL (subscriptions table) |
| **Job Queue (BullMQ)** | Async processing: match computation, notification dispatch, billing events | Redis, Service Layer |
| **PostgreSQL** | Primary data store, relational integrity, full-text search | All services |
| **Redis** | Caching (card data, match results), pub/sub for WebSocket, job queue backend | WebSocket Gateway, Job Queue, Services |

### Data Flow

**Core Trading Loop (the critical path):**

```
1. User adds cards to inventory + wanted list
   App → REST API → Inventory Service → PostgreSQL

2. Inventory change triggers match recalculation
   Inventory Service → Job Queue (enqueue match job)

3. Match worker processes in background
   Job Queue → Matching Service:
     a. Query all users who WANT cards this user HAS
     b. Filter to users who HAVE cards this user WANTS
     c. Score matches by fairness + priority (premium users first)
     d. Store match results in PostgreSQL

4. Notify matched users in real-time
   Matching Service → Redis Pub/Sub → WebSocket Gateway → Connected clients
   Matching Service → Push notification service → Offline clients

5. User reviews match, creates trade proposal
   App → REST API → Trade Service → PostgreSQL

6. Counter-party receives proposal notification
   Trade Service → Redis Pub/Sub → WebSocket / Push

7. Trade accepted → both inventories updated
   Trade Service → Inventory Service → PostgreSQL (transaction)
```

**Card Database Management:**

```
1. Admin imports new card set (JSON file)
   Admin tool → REST API (admin-only endpoint) → Card Service

2. Card Service validates and inserts cards
   Card Service → PostgreSQL (cards, sets tables)

3. Cache invalidated
   Card Service → Redis (clear card cache)

4. Users see new cards available in search
   App → REST API → Card Service → Redis (cache miss) → PostgreSQL
```

**Subscription Flow:**

```
1. User initiates subscription
   App → REST API → Billing Service → Stripe Checkout Session

2. Stripe processes payment, sends webhook
   Stripe → REST API (webhook endpoint) → Billing Service

3. Billing Service updates user entitlements
   Billing Service → PostgreSQL (subscriptions table)

4. Premium features unlocked
   App checks entitlements on each premium feature access
```

## Patterns to Follow

### Pattern 1: Optimistic UI with Server Reconciliation

**What:** Update the UI immediately on user action, then reconcile with server response.
**When:** Inventory changes, trade proposals, wanted list updates -- anywhere the user expects instant feedback.
**Why:** Mobile networks are unreliable. Users expect snappy interactions.

```typescript
// TanStack Query mutation with optimistic update
const addToInventory = useMutation({
  mutationFn: (cardId: string) => api.inventory.add(cardId),
  onMutate: async (cardId) => {
    await queryClient.cancelQueries({ queryKey: ['inventory'] });
    const previous = queryClient.getQueryData(['inventory']);
    queryClient.setQueryData(['inventory'], (old) => [...old, { cardId, quantity: 1 }]);
    return { previous };
  },
  onError: (err, cardId, context) => {
    queryClient.setQueryData(['inventory'], context.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
  },
});
```

### Pattern 2: Event-Driven Match Processing

**What:** Inventory changes emit events that trigger background match recalculation rather than computing matches synchronously.
**When:** Every inventory or wanted-list mutation.
**Why:** Match computation is O(n) against all users with overlapping interests. Must not block the API response.

```typescript
// After inventory update, enqueue match job
async function updateInventory(userId: string, changes: InventoryChange[]) {
  await db.inventory.bulkUpdate(userId, changes);

  // Don't compute matches synchronously -- enqueue for background processing
  await matchQueue.add('recompute-matches', {
    userId,
    changedCardIds: changes.map(c => c.cardId),
    priority: await getUserPriority(userId), // premium users get priority
  });
}
```

### Pattern 3: Tiered Caching for Card Data

**What:** Cache card data aggressively since it changes infrequently (only on set releases). Use Redis for API-level cache, in-memory for hot paths.
**When:** Card lookups, search results, set listings.
**Why:** Card data is read-heavy and write-rare. The card database is relatively small (hundreds to low thousands of cards) and fits comfortably in cache.

```typescript
// Card data cache hierarchy:
// 1. In-memory (Node process) - all cards, refreshed on set import
// 2. Redis - search results, filtered queries, 1-hour TTL
// 3. PostgreSQL - source of truth

const cardCache = new Map<string, Card>(); // ~2000 cards = trivial memory

async function getCard(id: string): Promise<Card> {
  if (cardCache.has(id)) return cardCache.get(id)!;
  const card = await redis.get(`card:${id}`) ?? await db.cards.findById(id);
  cardCache.set(id, card);
  return card;
}
```

### Pattern 4: Database-Level Trade Matching with Materialized Indexes

**What:** Use PostgreSQL set operations to find trade matches rather than application-level loops.
**When:** Match worker processes match jobs.
**Why:** SQL is purpose-built for set intersection. A query like "find users who have cards I want AND want cards I have" is a natural JOIN operation.

```sql
-- Find potential trade partners for user :userId
SELECT
  partner.user_id,
  array_agg(DISTINCT partner_has.card_id) AS cards_they_have_that_i_want,
  array_agg(DISTINCT partner_wants.card_id) AS cards_they_want_that_i_have
FROM user_inventory partner_has
JOIN user_wanted_list my_wants
  ON partner_has.card_id = my_wants.card_id
  AND my_wants.user_id = :userId
JOIN user_wanted_list partner_wants
  ON partner_wants.user_id = partner_has.user_id
JOIN user_inventory my_has
  ON my_has.card_id = partner_wants.card_id
  AND my_has.user_id = :userId
WHERE partner_has.user_id != :userId
GROUP BY partner.user_id
HAVING count(DISTINCT partner_has.card_id) > 0
   AND count(DISTINCT partner_wants.card_id) > 0;
```

### Pattern 5: Subscription Entitlement Middleware

**What:** A middleware layer that checks user subscription status before granting access to premium features.
**When:** Any premium-gated endpoint (analytics, demand metrics, priority listings, alerts).
**Why:** Centralizes billing logic. Prevents scattered subscription checks throughout the codebase.

```typescript
// Middleware approach
function requirePremium(req: Request, res: Response, next: NextFunction) {
  const subscription = req.user.subscription;
  if (!subscription || subscription.status !== 'active') {
    return res.status(403).json({ error: 'Premium subscription required' });
  }
  next();
}

// Route usage
router.get('/analytics/demand', requirePremium, getDemandAnalytics);
router.get('/analytics/trade-value', requirePremium, getTradeValueMetrics);
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Synchronous Match Computation

**What:** Computing trade matches inside the API request/response cycle.
**Why bad:** As user count grows, match queries become expensive. A 2-second match computation blocks the API and destroys mobile UX. At 10K users, this becomes untenable.
**Instead:** Always compute matches asynchronously via job queue. Return immediately with "matching in progress" and push results via WebSocket/notification.

### Anti-Pattern 2: Polling for Real-Time Updates

**What:** Client polling the server every N seconds for new matches or trade updates.
**Why bad:** Drains mobile battery, wastes bandwidth on metered connections, creates unnecessary server load. At 1000 concurrent users polling every 5 seconds = 200 req/sec of pure waste.
**Instead:** WebSocket connection for active sessions, push notifications for backgrounded app. Only poll as a fallback when WebSocket connection drops.

### Anti-Pattern 3: Storing Card Data as User-Owned Entities

**What:** Duplicating card metadata (name, set, rarity, image URL) into user inventory records.
**Why bad:** When card data needs correction or images change, you must update every user record. Data inconsistency is inevitable.
**Instead:** Inventory records reference card IDs only. Card metadata lives in the canonical cards table. Join at query time (cheap with proper indexes and caching).

### Anti-Pattern 4: Single Monolithic Process

**What:** Running the API server, WebSocket gateway, and background workers in one process.
**Why bad:** A CPU-heavy match computation starves WebSocket keepalives and API responses. Cannot scale workers independently. One crash takes down everything.
**Instead:** Separate processes from the start: API server, WebSocket server (can share codebase but run as separate process), and worker processes. They communicate via Redis.

### Anti-Pattern 5: Client-Side Trade Fairness Calculation

**What:** Computing trade fairness/value on the mobile client.
**Why bad:** Users can manipulate client-side calculations. Different app versions may compute differently. Fairness data (demand metrics, rarity weights) should be server-authoritative.
**Instead:** Server computes fairness scores. Client displays them. Server validates fairness claims before allowing trades.

## Key Database Schema Concepts

```
┌──────────┐     ┌──────────────┐     ┌──────────┐
│  users   │     │  cards       │     │  sets    │
│──────────│     │──────────────│     │──────────│
│ id       │     │ id           │     │ id       │
│ email    │     │ name         │     │ name     │
│ password │     │ set_id (FK)  │──── │ code     │
│ username │     │ rarity       │     │ released │
│ premium  │     │ image_url    │     └──────────┘
└──┬───────┘     │ pack         │
   │             └──────┬───────┘
   │                    │
   ├────────────────────┼──────────────────┐
   │                    │                  │
   ▼                    ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│user_inventory│  │user_wanted   │  │  trades      │
│──────────────│  │──────────────│  │──────────────│
│ user_id (FK) │  │ user_id (FK) │  │ id           │
│ card_id (FK) │  │ card_id (FK) │  │ proposer_id  │
│ quantity     │  │ priority     │  │ receiver_id  │
│ tradeable_qty│  │ created_at   │  │ status       │
└──────────────┘  └──────────────┘  │ created_at   │
                                    └──────┬───────┘
                                           │
                                    ┌──────┴───────┐
                                    │ trade_items  │
                                    │──────────────│
                                    │ trade_id(FK) │
                                    │ card_id (FK) │
                                    │ direction    │
                                    │ (give/receive)│
                                    └──────────────┘
```

Key indexing strategy:
- `user_inventory(card_id, user_id)` -- for "who has this card?" lookups (match queries)
- `user_wanted(card_id, user_id)` -- for "who wants this card?" lookups (match queries)
- `trades(proposer_id, status)` and `trades(receiver_id, status)` -- for "my active trades" views
- `cards(set_id, rarity)` -- for filtered card browsing

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 100K users |
|---------|--------------|--------------|---------------|
| **Match computation** | Inline in API is fine initially, but build with queue from start | BullMQ workers, batch processing, index-heavy SQL | Partitioned matching (by card set?), pre-computed match tables, incremental updates |
| **WebSocket connections** | Single server process handles it | Dedicated WebSocket server, Redis pub/sub for multi-instance | Socket.io with Redis adapter, multiple WS instances behind load balancer |
| **Card data** | Full in-memory cache (~2KB x 500 cards = 1MB) | Same -- card count grows slowly | Same -- total card count stays manageable |
| **Database** | Single PostgreSQL instance | Read replicas for search/browse queries | Connection pooling (PgBouncer), consider read replicas for match queries |
| **API** | Single instance | 2-3 instances behind load balancer | Horizontal scaling, rate limiting per user tier |
| **Push notifications** | Firebase/APNs direct | Batched notification sends via worker | Notification queue with deduplication and batching |

## Suggested Build Order (Dependencies)

The architecture has clear dependency chains that dictate build order:

```
Phase 1: Foundation (nothing depends on anything yet)
├── PostgreSQL schema + migrations
├── Auth service (JWT)
├── Card database + import tooling
└── Basic REST API skeleton

Phase 2: Core Data (depends on Phase 1)
├── Inventory service (CRUD)
├── Wanted list service (CRUD)
├── Card search + browse
└── Redis setup + card caching

Phase 3: Matching Engine (depends on Phase 2)
├── BullMQ + Redis job queue
├── Match algorithm (SQL-based)
├── Match worker process
└── Match results API

Phase 4: Real-Time + Notifications (depends on Phase 3)
├── WebSocket gateway (Socket.io)
├── Redis pub/sub integration
├── Push notification setup (Firebase/APNs)
└── Real-time match delivery

Phase 5: Trade Proposals (depends on Phase 3)
├── Trade proposal CRUD
├── Counter-offer flow
├── Trade acceptance + inventory reconciliation
├── Trade fairness scoring
└── Trade history

Phase 6: Premium Features (depends on Phases 2-5)
├── Stripe integration
├── Subscription management
├── Entitlement middleware
├── Demand analytics
├── Priority matching for premium users
└── Premium alerts
```

**Ordering rationale:**
- Card database must exist before inventory can reference cards
- Inventory and wanted lists must exist before matching can work
- Matching must work before real-time notifications have anything to deliver
- Trade proposals need match results to be useful (though manual proposals could come earlier)
- Premium features layer on top of working free features -- never build premium before the free version works

## Technology Mapping

| Architecture Component | Recommended Technology | Notes |
|----------------------|----------------------|-------|
| Mobile app | React Native (Expo) | Per project constraints |
| Client state | Zustand + TanStack Query | Zustand for app state, TanStack Query for server state/cache |
| REST API | Node.js + Express or Hono | Express for ecosystem, Hono for performance |
| WebSocket | Socket.io | Handles reconnection, rooms, fallback transport |
| Database | PostgreSQL | Relational data with strong indexing for set operations |
| ORM/Query builder | Drizzle ORM | Type-safe, lightweight, good migration story |
| Cache + Pub/Sub | Redis | BullMQ backend, Socket.io adapter, API cache |
| Job queue | BullMQ | Redis-backed, priority queues, retries, dashboard |
| Auth | JWT (access + refresh tokens) | Stateless API auth, short-lived access tokens |
| Push notifications | Firebase Cloud Messaging (FCM) + APNs | Cross-platform push via Expo notifications |
| Billing | Stripe | Subscriptions API, webhooks, customer portal |
| Hosting | Railway or Render | Simple deployment, managed PostgreSQL + Redis |

## Sources

- Architecture patterns based on established mobile marketplace and matchmaking platform patterns (training knowledge -- MEDIUM confidence)
- PostgreSQL set-operation matching is a well-documented pattern for inventory/trading systems
- BullMQ, Socket.io, Stripe patterns from established Node.js ecosystem conventions
- Note: Web search was unavailable during research; recommendations are based on training data and should be validated against current documentation during implementation
