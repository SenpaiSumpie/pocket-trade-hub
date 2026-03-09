# Phase 5: Trade Proposals and Reputation - Research

**Researched:** 2026-03-09
**Domain:** Trade proposal workflow, reputation system, notification inbox
**Confidence:** HIGH

## Summary

Phase 5 builds the core trading workflow on top of the existing match engine. Users create proposals from matches, negotiate via counter-offers, complete trades, rate partners, and receive notifications. The existing codebase provides strong foundations: Drizzle ORM with PostgreSQL, Socket.IO for real-time events, BullMQ for background jobs, Expo push notifications, and a well-established Zustand store pattern on mobile. The phase adds 3-4 new database tables (proposals, proposal_items, ratings, notifications), extends the Socket.IO event system, and adds significant mobile UI (proposal editor modal, notification inbox, rating modal).

The biggest architectural decision is the proposal data model. Proposals form a thread (original + counter-offers linked via parentId), each containing card items. The fairness algorithm is advisory-only and computes a score from rarity weights and demand signals already available in the schema. The notification inbox is a new persistent server-side table with push notification triggers, replacing the ephemeral toast-only approach used for matches.

**Primary recommendation:** Follow the established service-layer pattern (Zod validation in routes, service functions for logic, Socket.IO emit for real-time). Use a single `trade_proposals` table with self-referencing `parent_id` for counter-offer threads, and a separate `notifications` table for the persistent inbox.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Proposals start from matches only -- tap "Propose Trade" on a MatchDetailModal
- Pre-filled with matched card pairs from the match
- User can add and remove cards before sending (add from own collection / partner's wanted list)
- Fairness meter bar displayed live as cards are added/removed
- Fairness meter is advisory only -- warns on unfair proposals but does not block sending
- Fairness meter shows horizontal bar from "Unfair" to "Fair" to "Great" based on rarity/demand balance
- Counter opens the proposal editor pre-filled with original cards -- user adjusts and resends
- Original proposal marked as "countered" with thread history visible
- Unlimited counter-offer rounds -- negotiate until agreement or rejection
- Counter-offer creates a linked proposal in the thread (not a new standalone proposal)
- After acceptance, either party can tap "Mark as Completed" to finalize (one confirmation sufficient)
- Accepted proposal shows partner's friend code prominently with tap-to-copy for in-game trading
- Bell icon in top-right of app header with unread badge count, accessible from any tab
- Tapping bell opens full-screen notification inbox
- All event types persisted: trade proposals, trade matches, completions/ratings, system announcements
- Tapping a notification deep-links to the relevant content
- Notification marked as read on tap
- "Mark all as read" button at top of inbox
- Old notifications auto-archive after 30 days
- Push notifications for new proposals and proposal responses (accepted/rejected/countered)
- 5-star rating scale (1-5 stars)
- Rating modal appears immediately after tapping "Mark as Completed" -- skippable
- Stars only, no text comments
- Average rating and trade count displayed on: user profiles, match cards, and proposal views
- Rating is one-per-trade-per-user (each party rates independently)

### Claude's Discretion
- Proposal list UI layout within Trades tab (sub-tab vs combined list vs separate screen)
- Fairness algorithm specifics (rarity weights, demand scoring)
- Notification inbox empty state design
- Toast notification style for proposal events (extend existing match toast pattern)
- Animation/transitions for proposal editor modal
- Error handling for edge cases (proposing on stale match, race conditions)
- Database schema details (tables, indexes, constraints)
- How to handle proposals when underlying collection changes

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TRADE-01 | User can create a trade proposal selecting cards to give and receive | Proposal creation modal from match, `trade_proposals` + `trade_proposal_items` tables, POST /proposals endpoint |
| TRADE-02 | User can accept or reject incoming trade proposals | Status transitions (pending -> accepted/rejected), PUT /proposals/:id/respond endpoint |
| TRADE-03 | User can send a counter-offer modifying a received proposal | Self-referencing parent_id on proposals, status "countered", pre-filled editor |
| TRADE-04 | User can view all pending incoming and outgoing proposals | GET /proposals with direction filter, proposals store + list UI |
| TRADE-05 | User can mark a trade as completed (executed in-game) | Status "completed", PUT /proposals/:id/complete, triggers rating prompt |
| TRADE-06 | System shows trade fairness evaluation | Client-side fairness calculator using rarity weights + demand count |
| REP-01 | User can rate a trade partner after completing a trade | `trade_ratings` table, POST /proposals/:id/rate, 5-star modal |
| REP-02 | User profile shows trade count and average rating | Aggregate query on ratings, wire partnerTradeCount + avgRating |
| NOTIF-01 | Push notifications for new trade proposals | Extend notification.service.ts with proposal push types |
| NOTIF-02 | Push notifications for proposal responses | Push on accept/reject/counter status changes |
| NOTIF-03 | Persistent in-app notification inbox | `notifications` table, GET /notifications, bell icon + inbox screen |
</phase_requirements>

## Standard Stack

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Drizzle ORM | (existing) | Database schema, queries, migrations | Already used for all tables |
| PostgreSQL | (existing) | Persistent storage | Already the project database |
| Fastify | 5.x | API routes and plugins | Already the API framework |
| Zod | (existing) | Request/response validation | Already used in shared schemas |
| Socket.IO | (existing) | Real-time proposal events | Already used for match events |
| BullMQ | (existing) | Background notification jobs | Already used for match recompute |
| expo-server-sdk | (existing) | Push notifications | Already used for match/set notifications |
| Zustand | (existing) | Mobile state management | Already used per-domain |
| Expo Router | (existing) | Navigation and deep linking | Already the router |
| FlashList | (existing) | Performant lists | Already used for match list |
| react-native-toast-message | (existing) | Toast notifications | Already configured with custom types |

### No New Dependencies Needed
This phase requires zero new npm packages. All functionality is achievable with the existing stack. The fairness algorithm, notification inbox, and rating system are all straightforward implementations using existing tools.

## Architecture Patterns

### Recommended Database Schema

```sql
-- Proposal status enum
CREATE TYPE proposal_status AS ENUM ('pending', 'accepted', 'rejected', 'countered', 'completed', 'cancelled');

-- Core proposals table (self-referencing for counter-offer threads)
CREATE TABLE trade_proposals (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES trade_matches(id),
  sender_id TEXT NOT NULL REFERENCES users(id),
  receiver_id TEXT NOT NULL REFERENCES users(id),
  parent_id TEXT REFERENCES trade_proposals(id),  -- NULL for originals, set for counters
  status proposal_status NOT NULL DEFAULT 'pending',
  sender_gives JSONB NOT NULL,   -- [{cardId, cardName, imageUrl, rarity}]
  sender_gets JSONB NOT NULL,    -- [{cardId, cardName, imageUrl, rarity}]
  fairness_score INTEGER,        -- Stored at creation time for history
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
-- Indexes: sender_id, receiver_id, match_id, parent_id, status

-- Ratings table
CREATE TABLE trade_ratings (
  id TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL REFERENCES trade_proposals(id),
  rater_id TEXT NOT NULL REFERENCES users(id),
  rated_id TEXT NOT NULL REFERENCES users(id),
  stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(proposal_id, rater_id)  -- one rating per trade per user
);
-- Indexes: rated_id (for profile lookups), proposal_id

-- Persistent notifications table
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  type VARCHAR(30) NOT NULL,     -- 'proposal_received', 'proposal_accepted', 'proposal_rejected', 'proposal_countered', 'trade_completed', 'new_match', 'rating_received', 'system'
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,                    -- {proposalId, matchId, partnerId, etc.} for deep linking
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
-- Indexes: (user_id, read), (user_id, created_at DESC)
```

**Design rationale:**
- `sender_gives`/`sender_gets` stored as JSONB snapshots (not join table) because proposals are immutable records. When a counter-offer is made, a new proposal row is created with adjusted cards. This matches the existing `userGives`/`userGets` JSONB pattern in `trade_matches`.
- `parent_id` creates a linked list of proposals in a thread. The "active" proposal is the most recent non-rejected one.
- Notifications are server-side persistent records, not ephemeral Socket.IO events. This supports the inbox requirement and 30-day auto-archive.

### Drizzle Schema Addition Pattern

```typescript
// In db/schema.ts -- follow existing patterns
export const proposalStatusEnum = pgEnum('proposal_status', [
  'pending', 'accepted', 'rejected', 'countered', 'completed', 'cancelled'
]);

export const tradeProposals = pgTable('trade_proposals', {
  id: text('id').primaryKey(),
  matchId: text('match_id').notNull().references(() => tradeMatches.id),
  senderId: text('sender_id').notNull().references(() => users.id),
  receiverId: text('receiver_id').notNull().references(() => users.id),
  parentId: text('parent_id'), // Self-reference added via raw SQL or left as text
  status: proposalStatusEnum('status').default('pending').notNull(),
  senderGives: jsonb('sender_gives').notNull(),
  senderGets: jsonb('sender_gets').notNull(),
  fairnessScore: integer('fairness_score'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('trade_proposals_sender_id_idx').on(table.senderId),
  index('trade_proposals_receiver_id_idx').on(table.receiverId),
  index('trade_proposals_match_id_idx').on(table.matchId),
  index('trade_proposals_status_idx').on(table.status),
]);
```

### Recommended API Routes

```
POST   /proposals                   -- Create proposal from match
GET    /proposals                   -- List user's proposals (query: direction=incoming|outgoing|all, status=pending|all)
GET    /proposals/:id               -- Get proposal with thread history
PUT    /proposals/:id/accept        -- Accept proposal
PUT    /proposals/:id/reject        -- Reject proposal
POST   /proposals/:id/counter       -- Create counter-offer
PUT    /proposals/:id/complete      -- Mark as completed
POST   /proposals/:id/rate          -- Rate trade partner
GET    /notifications               -- List notifications (paginated)
PUT    /notifications/:id/read      -- Mark single notification as read
PUT    /notifications/read-all      -- Mark all as read
DELETE /notifications/archive       -- Clean old notifications (or cron job)
```

### Recommended Mobile Structure

```
src/
  stores/
    trades.ts          -- Extend with proposals state
    notifications.ts   -- NEW: notification inbox store
  hooks/
    useProposals.ts    -- NEW: proposal CRUD operations
    useNotifications.ts -- EXTEND: add inbox fetching
    useMatchSocket.ts  -- EXTEND: add proposal socket events
  components/
    trades/
      ProposalCreationModal.tsx  -- NEW: card picker + fairness meter
      ProposalCard.tsx           -- NEW: proposal list item
      ProposalDetailModal.tsx    -- NEW: proposal thread view
      ProposalThreadItem.tsx     -- NEW: single proposal in thread
      FairnessMeter.tsx          -- NEW: horizontal bar component
      RatingModal.tsx            -- NEW: 5-star rating prompt
    notifications/
      NotificationBell.tsx       -- NEW: header bell icon + badge
      NotificationInbox.tsx      -- NEW: full-screen inbox list
      NotificationItem.tsx       -- NEW: single notification row
app/
  notifications.tsx              -- NEW: notification inbox screen
```

### Proposal Lifecycle State Machine

```
                    +-----------+
         +--------->| countered |------+
         |          +-----------+      |
         |                             v
  +------+---+                  +-----------+
  | pending   |<----------------| pending   | (new counter)
  +------+---+                  +-----------+
         |
    +----+----+
    |         |
    v         v
+--------+ +---------+
|accepted| |rejected |
+---+----+ +---------+
    |
    v
+-----------+
| completed |
+-----------+
```

Status transitions:
- `pending` -> `accepted` (receiver accepts)
- `pending` -> `rejected` (receiver rejects)
- `pending` -> `countered` (receiver counters, creating new linked pending proposal)
- `accepted` -> `completed` (either party marks as completed)
- `pending` -> `cancelled` (sender cancels, edge case)

### Fairness Algorithm (Claude's Discretion Recommendation)

Use rarity-based weights since the schema already has rarity data on cards:

```typescript
const RARITY_WEIGHTS: Record<string, number> = {
  diamond1: 1,
  diamond2: 2,
  diamond3: 4,
  diamond4: 8,
  star1: 15,
  star2: 30,
  star3: 60,
  crown: 100,
};

function calculateFairness(givingCards: CardWithRarity[], gettingCards: CardWithRarity[]): {
  score: number;    // 0-100, where 50 = perfectly fair
  label: 'Unfair' | 'Fair' | 'Great';
} {
  const giveValue = givingCards.reduce((sum, c) => sum + (RARITY_WEIGHTS[c.rarity] || 1), 0);
  const getValue = gettingCards.reduce((sum, c) => sum + (RARITY_WEIGHTS[c.rarity] || 1), 0);

  if (giveValue === 0 && getValue === 0) return { score: 50, label: 'Fair' };

  const total = giveValue + getValue;
  const ratio = getValue / total; // 0 to 1, where 0.5 = perfectly fair

  // Map to 0-100 scale
  const score = Math.round(ratio * 100);

  // Label thresholds
  if (score >= 35 && score <= 65) return { score, label: 'Great' };
  if (score >= 20 && score <= 80) return { score, label: 'Fair' };
  return { score, label: 'Unfair' };
}
```

This runs client-side for live updates as cards are added/removed. The score is also stored server-side when the proposal is created (snapshot for history).

### Notification Inbox Design (Claude's Discretion Recommendation)

**Recommendation: Segment proposals within Trades tab using a header toggle (Matches / Proposals), and use a separate full-screen route for the notification inbox.**

Rationale:
- The Trades tab already has a header area with sort toggle. Replace/extend this with a segment control: "Matches" | "Proposals"
- Notification inbox is accessed via bell icon in the tab bar header (accessible from any tab per user requirement)
- The inbox is a separate screen (not a tab) pushed via `router.push('/notifications')`

### Socket.IO Event Extensions

```typescript
// New events to emit from server
'new-proposal'       -> { proposalId, senderId, senderName, matchId }
'proposal-accepted'  -> { proposalId, responderId, responderName }
'proposal-rejected'  -> { proposalId, responderId, responderName }
'proposal-countered' -> { proposalId, counterProposalId, responderId, responderName }
'trade-completed'    -> { proposalId, completedBy }
'notification-new'   -> { notificationId, type, title, body }  // Generic inbox update
```

Extend `useMatchSocket.ts` to listen for these events, update the proposals store, and show toasts.

### Anti-Patterns to Avoid
- **Don't store card details in proposal items by reference only:** Store JSONB snapshots of card name/image/rarity at proposal creation time. Cards don't change, but if the schema ever evolves, proposals remain self-contained historical records.
- **Don't compute fairness server-side only:** The user needs live feedback as they add/remove cards. Compute client-side with the same algorithm, store snapshot on submit.
- **Don't create separate Socket.IO connections:** Extend the existing single connection in `useMatchSocket.ts` with new event listeners.
- **Don't use separate notification tables per type:** One `notifications` table with a `type` field and `data` JSONB for type-specific payload. Keeps the inbox query simple.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Push notifications | Custom push infra | expo-server-sdk (already in use) | Token management, chunking, error handling all solved |
| Real-time events | Polling | Socket.IO (already in use) | Bidirectional, room-based, reconnection built in |
| Background jobs | setTimeout/setInterval | BullMQ (already in use) | Persistence, retry, deduplication, delayed execution |
| Animated progress bar | Custom animation | React Native Animated API | Built-in, hardware-accelerated, no dependency |
| Star rating input | Custom touch handler | Pressable with star icons | Ionicons "star" / "star-outline" with touch regions |
| Deep linking | Manual URL parsing | Expo Router's router.push() | Already the navigation system, type-safe |

## Common Pitfalls

### Pitfall 1: Stale Match References
**What goes wrong:** User opens MatchDetailModal, taps "Propose Trade", but the match was already recomputed and no longer exists (cards changed).
**Why it happens:** Match recomputation deletes and re-inserts rows. The match ID in the modal is stale.
**How to avoid:** When creating a proposal, verify the match still exists server-side. Return 404/409 if gone. Show user-friendly error: "This match is no longer available. Your cards or partner's cards may have changed."
**Warning signs:** 404 errors on POST /proposals.

### Pitfall 2: Race Conditions on Proposal Status
**What goes wrong:** Both parties tap accept/reject simultaneously, or one counters while the other accepts.
**Why it happens:** No optimistic locking on proposal status.
**How to avoid:** Use `WHERE status = 'pending'` in UPDATE queries. If affected rows = 0, the status already changed. Return 409 Conflict. Use `updatedAt` for optimistic concurrency if needed.
**Warning signs:** Users see stale Accept/Reject buttons after partner already responded.

### Pitfall 3: Counter-Offer Thread Complexity
**What goes wrong:** Thread display becomes confusing with many counter-offers, or losing track of which is the "active" proposal.
**Why it happens:** Self-referencing parent_id creates a linked list that needs careful traversal.
**How to avoid:** Always query the full thread by finding the root proposal (parentId IS NULL) and then all descendants. The "active" proposal is the most recent with status = 'pending'. Display chronologically.
**Warning signs:** Users confused about which proposal is current.

### Pitfall 4: Notification Inbox Performance
**What goes wrong:** Inbox query becomes slow as notifications accumulate.
**Why it happens:** No pagination, no archival of old notifications.
**How to avoid:** Paginate with cursor-based pagination (createdAt + id). Auto-archive after 30 days via scheduled BullMQ job. Index on (user_id, created_at DESC).
**Warning signs:** Inbox load time > 500ms.

### Pitfall 5: Duplicate Ratings
**What goes wrong:** User rates same trade multiple times.
**Why it happens:** No unique constraint, or client allows re-submission.
**How to avoid:** UNIQUE(proposal_id, rater_id) constraint. Check server-side before insert. Hide rating button if already rated.
**Warning signs:** Average rating skewed by duplicate entries.

### Pitfall 6: Match Deletion Cascading to Proposals
**What goes wrong:** Match recompute deletes match rows, but proposals reference match_id with a foreign key.
**Why it happens:** The existing `recomputeMatchesForUser` deletes all match rows before re-inserting.
**How to avoid:** Either (a) don't delete matches that have active proposals, (b) use ON DELETE SET NULL, or (c) store match data snapshot in proposal rather than referencing match_id with a strict FK. Recommendation: use option (c) -- store partner info directly in proposal, and make match_id nullable or remove the FK. Proposals are independent records once created.
**Warning signs:** Foreign key violation errors during match recompute.

## Code Examples

### Creating a Proposal (Service Layer Pattern)

```typescript
// Source: follows existing service pattern in match.service.ts
export async function createProposal(
  db: DbInstance,
  io: Server | null,
  opts: {
    senderId: string;
    receiverId: string;
    matchId: string;
    senderGives: ProposalCard[];
    senderGets: ProposalCard[];
    fairnessScore: number;
    parentId?: string; // For counter-offers
  }
) {
  const id = randomUUID();

  // If this is a counter-offer, mark the parent as 'countered'
  if (opts.parentId) {
    const updated = await db
      .update(tradeProposals)
      .set({ status: 'countered', updatedAt: new Date() })
      .where(and(
        eq(tradeProposals.id, opts.parentId),
        eq(tradeProposals.status, 'pending'),
      ))
      .returning({ id: tradeProposals.id });

    if (updated.length === 0) {
      throw new Error('Cannot counter: proposal no longer pending');
    }
  }

  await db.insert(tradeProposals).values({
    id,
    matchId: opts.matchId,
    senderId: opts.senderId,
    receiverId: opts.receiverId,
    parentId: opts.parentId || null,
    status: 'pending',
    senderGives: opts.senderGives,
    senderGets: opts.senderGets,
    fairnessScore: opts.fairnessScore,
  });

  // Create notification
  await createNotification(db, {
    userId: opts.receiverId,
    type: 'proposal_received',
    title: 'New trade proposal!',
    body: `${senderName} sent you a trade proposal`,
    data: { proposalId: id, matchId: opts.matchId },
  });

  // Socket.IO + push notification
  if (io) {
    io.to(`user:${opts.receiverId}`).emit('new-proposal', { proposalId: id });
  }
  await sendProposalPushNotification(db, opts.receiverId, 'New trade proposal!', '...');

  return { id };
}
```

### Bell Icon with Badge (Header Component)

```typescript
// Source: follows existing Ionicons + badge pattern from tab bar
function NotificationBell() {
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  return (
    <TouchableOpacity
      onPress={() => router.push('/notifications')}
      style={{ padding: spacing.sm }}
    >
      <Ionicons name="notifications-outline" size={24} color={colors.text} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
```

### Fairness Meter Component

```typescript
// Animated horizontal bar
function FairnessMeter({ score, label }: { score: number; label: string }) {
  const barColor = label === 'Great' ? colors.success
    : label === 'Fair' ? colors.primary
    : colors.error;

  return (
    <View style={styles.meterContainer}>
      <View style={styles.meterLabels}>
        <Text style={styles.meterLabel}>Unfair</Text>
        <Text style={styles.meterLabel}>Fair</Text>
        <Text style={styles.meterLabel}>Great</Text>
      </View>
      <View style={styles.meterTrack}>
        <View style={[styles.meterIndicator, {
          left: `${Math.min(Math.max(score, 5), 95)}%`,
          backgroundColor: barColor,
        }]} />
      </View>
    </View>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Polling for notifications | Socket.IO + persistent inbox | Standard pattern | Real-time + persistence for offline |
| Complex join tables for proposal items | JSONB card snapshots | Matches JSONB pattern in codebase | Simpler queries, immutable records |
| Separate notification services | Single notifications table + push | Established pattern | Unified inbox, consistent deep linking |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest with ts-jest |
| Config file | `apps/api/jest.config.js` |
| Quick run command | `cd apps/api && npx jest --testPathPattern="proposal" -x` |
| Full suite command | `cd apps/api && npx jest` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TRADE-01 | Create proposal from match | unit | `cd apps/api && npx jest --testPathPattern="proposal" -x` | Wave 0 |
| TRADE-02 | Accept/reject proposal | unit | `cd apps/api && npx jest --testPathPattern="proposal" -x` | Wave 0 |
| TRADE-03 | Counter-offer with linked parent | unit | `cd apps/api && npx jest --testPathPattern="proposal" -x` | Wave 0 |
| TRADE-04 | List proposals by direction/status | unit | `cd apps/api && npx jest --testPathPattern="proposal" -x` | Wave 0 |
| TRADE-05 | Mark trade as completed | unit | `cd apps/api && npx jest --testPathPattern="proposal" -x` | Wave 0 |
| TRADE-06 | Fairness score calculation | unit | `cd packages/shared && npx jest --testPathPattern="fairness" -x` | Wave 0 |
| REP-01 | Rate trade partner | unit | `cd apps/api && npx jest --testPathPattern="rating" -x` | Wave 0 |
| REP-02 | Profile shows rating + trade count | unit | `cd apps/api && npx jest --testPathPattern="rating" -x` | Wave 0 |
| NOTIF-01 | Push notification on new proposal | unit | `cd apps/api && npx jest --testPathPattern="notification" -x` | Wave 0 |
| NOTIF-02 | Push on proposal response | unit | `cd apps/api && npx jest --testPathPattern="notification" -x` | Wave 0 |
| NOTIF-03 | Persistent notification inbox CRUD | unit | `cd apps/api && npx jest --testPathPattern="notification" -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd apps/api && npx jest --testPathPattern="proposal|rating|notification" -x`
- **Per wave merge:** `cd apps/api && npx jest`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/api/__tests__/proposal.service.test.ts` -- covers TRADE-01 through TRADE-05
- [ ] `apps/api/__tests__/rating.service.test.ts` -- covers REP-01, REP-02
- [ ] `apps/api/__tests__/notification.service.test.ts` -- covers NOTIF-01 through NOTIF-03
- [ ] `packages/shared/src/__tests__/fairness.test.ts` -- covers TRADE-06

## Open Questions

1. **Match ID foreign key vs snapshot**
   - What we know: Match recompute deletes and re-inserts match rows. Proposals need to reference the match context.
   - What's unclear: Whether to use a nullable FK or store match context as snapshot data in the proposal.
   - Recommendation: Store `matchId` as nullable text (no FK constraint), and store partner info (partnerId, receiverId) directly on the proposal. This decouples proposals from volatile match data.

2. **Notification auto-archive mechanism**
   - What we know: 30-day auto-archive requirement. BullMQ is available for scheduled jobs.
   - What's unclear: Whether to use a repeatable BullMQ job or a database trigger.
   - Recommendation: Use a daily repeatable BullMQ job that runs `DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '30 days'`. Simple and uses existing infrastructure.

3. **Collection changes after proposal creation**
   - What we know: A user might remove a card from their collection after including it in a pending proposal.
   - What's unclear: Whether to validate card ownership at acceptance time or let it proceed.
   - Recommendation: Validate at acceptance time. If cards are no longer available, return 409 and show "Some cards in this proposal are no longer available." The proposal remains but cannot be accepted until counter-offered with valid cards.

## Sources

### Primary (HIGH confidence)
- Project codebase: `apps/api/src/db/schema.ts` -- existing table patterns, JSONB usage, index conventions
- Project codebase: `apps/api/src/services/match.service.ts` -- service layer pattern, Socket.IO integration, push notification pattern
- Project codebase: `apps/api/src/jobs/match-worker.ts` -- BullMQ job pattern
- Project codebase: `apps/mobile/src/stores/trades.ts` -- Zustand store pattern
- Project codebase: `apps/mobile/src/hooks/useMatchSocket.ts` -- Socket.IO client pattern
- Project codebase: `apps/mobile/src/components/trades/MatchDetailModal.tsx` -- integration point for proposal button
- Project codebase: `apps/mobile/app/(tabs)/_layout.tsx` -- tab layout and header configuration

### Secondary (MEDIUM confidence)
- Drizzle ORM pgEnum and self-referencing patterns (standard PostgreSQL, well-documented)
- Expo Router deep linking via `router.push()` (already working in codebase)
- React Native Animated API for fairness meter (built-in, stable)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero new dependencies, extending existing patterns
- Architecture: HIGH -- follows established project patterns (service layer, Zustand stores, Socket.IO events, JSONB storage)
- Pitfalls: HIGH -- identified from direct codebase analysis (match deletion cascade, race conditions, stale references)
- Fairness algorithm: MEDIUM -- rarity weights are reasonable but may need tuning based on user feedback
- Notification inbox: HIGH -- standard pattern, well-understood requirements

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable domain, no external dependencies changing)
