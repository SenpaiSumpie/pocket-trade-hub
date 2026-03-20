# Phase 8: Post-Based Trading - Research

**Researched:** 2026-03-15
**Domain:** Post-based trade marketplace (database schema, API, BullMQ matching, Expo mobile UI)
**Confidence:** HIGH

## Summary

Phase 8 replaces the existing automatic collection/wanted-list matching engine with a user-driven post-based marketplace. Users create **Offering** and **Seeking** posts containing structured card data (including language per TRAD-06), and a background BullMQ job finds complementary matches between posts. Proposals can be sent directly from any post without a match record gatekeeper.

The existing codebase has mature patterns for every building block: Drizzle schema definitions, Fastify route/service separation, BullMQ workers, Socket.IO real-time events, Zustand stores, FlashList rendering, and the full proposal lifecycle. The work is largely an architecture pivot -- retire `tradeMatches` table and match engine, introduce a `tradePosts` table, adapt the proposal system to reference posts instead of matches, and build a new Market tab with filtered browsing.

**Primary recommendation:** Structure this as database schema + API first, then matching job, then proposal adaptation, then mobile UI (Market tab + Trades tab refactor). Keep the old match system functional until the new post system is fully wired.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Separate post types: Offering posts and Seeking posts (distinct, not combined)
- Card data only -- no free-text descriptions (structured, no moderation needed)
- Posts auto-populate from collection (Offering) and wanted list (Seeking) -- user selects which cards to post
- Card language included per TRAD-06 (leverages Phase 7 per-card language tracking)
- Posts become THE trading mechanism -- existing match engine is retired
- Collection + wanted lists remain for inventory tracking and feeding post creation
- Complementary matching runs as a BullMQ background job after post creation (existing pattern)
- Proposals can be sent directly from any post -- no match record required as gatekeeper
- New "Market" bottom tab for browsing ALL posts (marketplace/discovery)
- Trades tab becomes: My Posts + Proposals (manage your trading activity)
- Marketplace uses filtered feed with filter chips (reuses FilterChips, SearchBar, SetPicker patterns)
- All four filters: post type (Offering/Seeking), card set & rarity, card language, card name search
- Posts matching user's wanted/collection list get a visual highlight indicator for relevance
- Posts stay active until manually closed or auto-closed by trade completion -- no expiry timer
- Auto-close: when a trade completes and cards change hands, affected Offering/Seeking posts auto-close
- Free/Premium post limits: free users get limited active posts, premium users get unlimited
- Complementary post match notification: "Someone posted a card you're seeking!" / "Someone is seeking a card you're offering!"
- Proposal on your post: uses existing proposal notification infra
- Post closed/fulfilled: "Your post was auto-closed because the card was traded"
- Proactive: new Offering posts for cards on user's wanted list trigger notification (even without a Seeking post)

### Claude's Discretion
- Number of cards per post (single vs multi-card)
- Free tier post limit number (e.g., 10-20 active posts)
- Post card display layout and visual design
- Match highlight visual indicator style
- Marketplace sort options and default ordering
- Post creation flow UX details
- How to handle the migration/retirement of the old match engine code

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TRAD-01 | User can create an Offering post with cards they want to trade away | New `tradePosts` table with type='offering', post.service + routes, PostCreationModal sourcing from collection |
| TRAD-02 | User can create a Seeking post with cards they want to receive | Same `tradePosts` table with type='seeking', PostCreationModal sourcing from wanted list |
| TRAD-03 | User can browse/search Offering and Seeking posts with filters | New Market tab with FilterChips/SearchBar/SetPicker reuse, paginated GET /posts API with query filters |
| TRAD-04 | User gets matched with complementary posts | BullMQ post-match-worker job running after post creation, notification dispatch for matches |
| TRAD-05 | User can send a trade proposal directly from a matched post | Adapt proposal schema (matchId becomes optional, add postId), ProposalCreationModal launched from post detail |
| TRAD-06 | Posts include card language to prevent language mismatches | Post card items include `language` field (leverages Phase 7 composite key cardId:language) |
</phase_requirements>

## Standard Stack

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Drizzle ORM | 0.45.x | DB schema, queries, migrations | Already used for all tables |
| Fastify | 5.2.x | API routes and service layer | Project's HTTP framework |
| BullMQ | 5.70.x | Background job for post matching | Existing match-worker pattern |
| Socket.IO | (existing) | Real-time post/proposal events | Existing event infrastructure |
| Zustand | (existing) | Mobile state management | Per-domain store pattern |
| FlashList | (existing) | Performant list rendering | Used in trades.tsx, cards |
| Zod | (existing) | Schema validation (shared package) | All schemas use Zod |
| Expo Router | (existing) | Tab navigation | Tabs layout already configured |

### Supporting (Already in Project)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-server-sdk | 6.x | Push notifications | Post match notifications |
| ioredis | 5.x | Redis connection for BullMQ | Worker queue connection |
| react-native-toast-message | (existing) | In-app toast notifications | Post event toasts |

### No New Dependencies Needed
This phase requires zero new npm packages. Everything builds on existing infrastructure.

## Architecture Patterns

### Recommended Project Structure (New/Modified Files)

```
apps/api/src/
  db/
    schema.ts                    # ADD tradePosts table + postTypeEnum
  services/
    post.service.ts              # NEW: CRUD, search, auto-close logic
    post-match.service.ts        # NEW: complementary matching logic
    proposal.service.ts          # MODIFY: matchId optional, add postId
    match.service.ts             # DEPRECATE (keep for now, remove later)
  routes/
    posts.ts                     # NEW: /posts endpoints
    proposals.ts                 # MODIFY: matchId optional in schema
    matches.ts                   # DEPRECATE (keep for backward compat)
  jobs/
    post-match-worker.ts         # NEW: BullMQ worker for post matching
    match-worker.ts              # DEPRECATE (keep, disable queue)

packages/shared/src/schemas/
  post.ts                        # NEW: Zod schemas for posts
  proposal.ts                    # MODIFY: matchId -> optional, add postId

apps/mobile/
  app/(tabs)/
    _layout.tsx                  # MODIFY: add Market tab, restructure
    market.tsx                   # NEW: marketplace browse screen
    trades.tsx                   # MODIFY: My Posts + Proposals (remove matches)
  src/
    stores/
      posts.ts                   # NEW: Zustand store for marketplace posts
      trades.ts                  # MODIFY: remove match state, add my-posts state
    hooks/
      usePosts.ts                # NEW: post CRUD + search hook
      useMarketplace.ts          # NEW: marketplace browsing with filters
      useMatchSocket.ts          # MODIFY: add post events, remove match events
      useProposals.ts            # MODIFY: support post-based proposals
    components/
      market/
        PostCard.tsx             # NEW: card for displaying a post in feed
        PostDetailModal.tsx      # NEW: full post detail with proposal action
        PostCreationModal.tsx    # NEW: create offering/seeking post
        MarketFilters.tsx        # NEW: filter bar (reuses FilterChips, SearchBar)
      trades/
        MyPostCard.tsx           # NEW: card for user's own posts
        MyPostDetailModal.tsx    # NEW: manage own post (close, view proposals)
```

### Pattern 1: Post Database Schema

**What:** New `tradePosts` table with post type enum, card items as JSONB, and proper indexes.
**When to use:** All post storage and queries.

```typescript
// In schema.ts
export const postTypeEnum = pgEnum('post_type', ['offering', 'seeking']);
export const postStatusEnum = pgEnum('post_status', ['active', 'closed', 'auto_closed']);

export const tradePosts = pgTable('trade_posts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  type: postTypeEnum('type').notNull(),
  status: postStatusEnum('status').default('active').notNull(),
  cards: jsonb('cards').notNull(), // Array of { cardId, language, name, imageUrl, rarity }
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('trade_posts_user_id_idx').on(table.userId),
  index('trade_posts_type_status_idx').on(table.type, table.status),
  index('trade_posts_created_at_idx').on(table.createdAt),
  // GIN index for JSONB card search
  index('trade_posts_cards_gin_idx').on(sql`(${table.cards}) jsonb_path_ops`).using('gin'),
]);
```

**Design decisions:**
- **Single card per post recommended:** Simpler matching logic (1:1 card comparison), cleaner UX, easier auto-close (close post when that specific card is traded). Multi-card posts create combinatorial complexity in matching and auto-close. The user can create multiple posts for multiple cards.
- **JSONB for cards array:** Even for single-card posts, storing as array of objects allows future expansion and keeps the schema consistent. Each card object: `{ cardId: string, language: string, name: string, imageUrl: string, rarity: string }`.
- **Free tier limit: 15 active posts.** Generous enough for casual users (most will have 5-10), constraining enough to incentivize premium. Premium gets unlimited.

### Pattern 2: Post Matching via BullMQ

**What:** When a post is created, queue a matching job that finds complementary posts and notifies affected users.
**When to use:** After every post creation.

```typescript
// post-match-worker.ts - follows existing match-worker.ts pattern
const QUEUE_NAME = 'post-match';

export async function queuePostMatch(postId: string, userId: string): Promise<void> {
  const queue = getOrCreateQueue();
  await queue.add('match-post', { postId, userId }, {
    jobId: `post-match:${postId}`,
    delay: 5000, // 5-second delay to batch rapid post creation
  });
}

// Worker logic:
// 1. Load the new post (type + cards)
// 2. If Offering: find active Seeking posts that want any of these cards (matching cardId + language)
// 3. If Seeking: find active Offering posts that have any of these cards (matching cardId + language)
// 4. Also check user wanted lists for proactive notifications (Offering post matches someone's wanted list)
// 5. Send notifications + Socket.IO events for each match
```

**Key matching query pattern:** Use JSONB containment operators to find complementary posts:
```sql
-- Find Seeking posts that want cardId X with language Y
SELECT * FROM trade_posts
WHERE type = 'seeking' AND status = 'active'
  AND cards @> '[{"cardId": "...", "language": "en"}]'::jsonb
  AND user_id != $currentUserId;
```

### Pattern 3: Proposal System Adaptation

**What:** Make `matchId` optional in proposals and add `postId` reference. Proposals can originate from browsing any post.
**When to use:** All proposal creation flows.

```typescript
// In schema.ts - tradeProposals table
// matchId is already nullable (text('match_id') without .notNull())
// Add postId column:
postId: text('post_id'), // references tradePosts.id

// In shared proposal schema:
export const createProposalSchema = z.object({
  postId: z.string().optional(),     // NEW: post that triggered this proposal
  matchId: z.string().optional(),    // NOW OPTIONAL (was required)
  receiverId: z.string(),
  senderGives: z.array(proposalCardSchema).min(1),
  senderGets: z.array(proposalCardSchema).min(1),
  fairnessScore: z.number(),
  parentId: z.string().optional(),
});
```

### Pattern 4: Marketplace Feed with Filters

**What:** GET /posts endpoint with query-based filtering, cursor pagination, and relevance highlighting.
**When to use:** Market tab browsing.

```typescript
// GET /posts?type=offering&set=A1&rarity=star2&language=en&search=pikachu&cursor=...&limit=20
// Returns: { posts: PostWithHighlight[], nextCursor: string | null }

interface PostWithHighlight {
  // ... post fields
  isRelevant: boolean; // true if cards match user's wanted (for Offering) or collection (for Seeking)
}
```

**Marketplace sort options (Claude's discretion):**
- `newest` (default) - most recent posts first, standard marketplace behavior
- `relevant` - posts matching user's wanted/collection sorted first
- Premium users' posts get slight boost (consistent with existing premium boost pattern)

### Pattern 5: Post Auto-Close on Trade Completion

**What:** When a proposal completes, auto-close any active posts whose cards were just traded.
**When to use:** Extend `completeProposal` in proposal.service.ts.

```typescript
// After the existing trade completion transaction:
// 1. Find active Offering posts by sender where cards overlap senderGives
// 2. Find active Offering posts by receiver where cards overlap senderGets
// 3. Find active Seeking posts by receiver where cards overlap senderGives (they got what they wanted)
// 4. Find active Seeking posts by sender where cards overlap senderGets (they got what they wanted)
// 5. Set status = 'auto_closed' for all matches
// 6. Notify post owners: "Your post was auto-closed because the card was traded"
```

### Anti-Patterns to Avoid

- **Do NOT build a real-time matching system:** Post matching is a background job, not triggered synchronously in the request. The BullMQ pattern already handles this with debounce.
- **Do NOT combine Offering and Seeking in one post type:** The context explicitly requires separate types. This keeps matching simple (Offering matches Seeking, never same-type).
- **Do NOT require a match record before sending proposals:** The old flow was match -> proposal. New flow is: browse post -> send proposal directly.
- **Do NOT delete the old match system immediately:** Deprecate gracefully. Remove the match-worker queue additions but keep the routes temporarily in case any mobile client references them.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSONB querying | Custom card-matching SQL | Drizzle `sql` template + PostgreSQL JSONB operators (`@>`, `jsonb_path_query`) | PostgreSQL JSONB operators are indexed and battle-tested |
| Post feed pagination | Custom offset tracking | Cursor-based pagination (existing pattern in notification.service.ts) | Avoids skip-scan issues on large tables |
| Debounced job processing | setTimeout or custom queue | BullMQ with delay option (existing match-worker pattern) | Handles retries, failures, deduplication |
| Push + in-app notifications | Custom notification dispatch | Extend existing `insertNotification` + `sendPushToUser` in proposal.service.ts | Already handles Expo push tokens, in-app storage, Socket.IO |
| Filter chip UI | Custom filter component | Reuse existing `FilterChips`, `SearchBar`, `SetPicker` components | Already styled, tested, consistent with app design |
| Premium gating | Custom subscription check | Existing `isPremiumUser` from premium.service.ts | Already integrates with RevenueCat |

## Common Pitfalls

### Pitfall 1: JSONB Index Not Used for Card Queries
**What goes wrong:** Queries on `cards` JSONB column do full table scans without proper GIN index.
**Why it happens:** Drizzle doesn't auto-create GIN indexes; the `@>` containment operator needs them.
**How to avoid:** Add GIN index on `cards` column with `jsonb_path_ops` operator class. Use `@>` containment instead of `jsonb_array_elements` for index-eligible queries.
**Warning signs:** Slow marketplace browsing as post count grows.

### Pitfall 2: Race Condition in Auto-Close
**What goes wrong:** Two simultaneous trade completions involving the same post try to auto-close it, or a post gets auto-closed between when user browsed it and sent a proposal.
**Why it happens:** Concurrent writes without proper transaction isolation.
**How to avoid:** Use PostgreSQL transactions for trade completion + auto-close (existing pattern in `completeProposal`). When creating a proposal, check post status is still 'active' and return 409 if closed.
**Warning signs:** "Post not found" errors on proposal creation.

### Pitfall 3: Proposal Schema Migration Breaking Existing Data
**What goes wrong:** Making `matchId` required->optional breaks existing proposals that have matchId values, or new code assumes postId exists on old proposals.
**Why it happens:** Schema change without backward compatibility.
**How to avoid:** `matchId` is already nullable in the database (no `.notNull()` on the column). Only the Zod validation schema needs updating. Add `postId` as a new nullable column. Existing proposals keep their matchId, new ones use postId.
**Warning signs:** 400 errors on existing proposal queries.

### Pitfall 4: Notification Spam from Post Matching
**What goes wrong:** A user creates 15 posts and every other user gets 15 separate notifications.
**Why it happens:** No deduplication of match notifications.
**How to avoid:** Batch notifications per user: "3 new posts match your wanted cards!" rather than one per post. Use the BullMQ delay to batch rapid-fire post creation.
**Warning signs:** Users disabling notifications due to volume.

### Pitfall 5: Market Tab Route Ordering in Expo Router
**What goes wrong:** Adding a new `market.tsx` tab file doesn't appear in the expected position.
**Why it happens:** Expo Router file-based routing orders tabs alphabetically unless explicitly ordered in `_layout.tsx`.
**How to avoid:** Explicitly define tab order in `_layout.tsx` using `<Tabs.Screen name="market" />` before `trades`.
**Warning signs:** Market tab appears in wrong position or doesn't render.

### Pitfall 6: Stale Post Data After Auto-Close
**What goes wrong:** User is viewing a post in the marketplace, it gets auto-closed by a trade completion, user tries to send proposal and gets error.
**Why it happens:** No real-time event to update post status in the client.
**How to avoid:** Emit Socket.IO `post-closed` event when posts are auto-closed. Client handles by updating store and showing toast. Also validate post status server-side on proposal creation.
**Warning signs:** 409/404 errors when sending proposals.

## Code Examples

### Database Migration: Add tradePosts Table

```typescript
// schema.ts addition
export const postTypeEnum = pgEnum('post_type', ['offering', 'seeking']);
export const postStatusEnum = pgEnum('post_status', ['active', 'closed', 'auto_closed']);

export const tradePosts = pgTable('trade_posts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  type: postTypeEnum('type').notNull(),
  status: postStatusEnum('status').default('active').notNull(),
  cards: jsonb('cards').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('trade_posts_user_id_idx').on(table.userId),
  index('trade_posts_type_status_idx').on(table.type, table.status),
  index('trade_posts_created_at_idx').on(table.createdAt),
]);

// Add postId to tradeProposals:
// postId: text('post_id'), -- add via ALTER TABLE or schema push
```

### Shared Zod Schema: Post

```typescript
// packages/shared/src/schemas/post.ts
import { z } from 'zod';

export const postTypeValues = ['offering', 'seeking'] as const;
export const postStatusValues = ['active', 'closed', 'auto_closed'] as const;

export const postCardSchema = z.object({
  cardId: z.string(),
  language: z.string(), // TRAD-06
  name: z.string(),
  imageUrl: z.string(),
  rarity: z.string().nullable(),
  setId: z.string().optional(),
});

export const createPostSchema = z.object({
  type: z.enum(postTypeValues),
  cards: z.array(postCardSchema).min(1).max(1), // Single card per post
});

export const tradePostSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(postTypeValues),
  status: z.enum(postStatusValues),
  cards: z.array(postCardSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type PostCard = z.infer<typeof postCardSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type TradePost = z.infer<typeof tradePostSchema>;
export type PostType = typeof postTypeValues[number];
export type PostStatus = typeof postStatusValues[number];
```

### API Route: Posts CRUD

```typescript
// apps/api/src/routes/posts.ts - follows existing route patterns
export default async function postRoutes(fastify: FastifyInstance) {
  // POST /posts - create a new trade post
  fastify.post('/posts', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.sub;
    // Validate, check post limit for free users, create post, queue matching job
  });

  // GET /posts - browse marketplace (public feed)
  fastify.get('/posts', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    // Query params: type, set, rarity, language, search, cursor, limit
    // Returns posts with isRelevant flag based on user's collection/wanted
  });

  // GET /posts/mine - user's own posts
  fastify.get('/posts/mine', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    // Returns user's posts with proposal counts
  });

  // PUT /posts/:id/close - manually close a post
  fastify.put('/posts/:id/close', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    // Set status to 'closed'
  });

  // DELETE /posts/:id - delete a post
  fastify.delete('/posts/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    // Hard delete (only owner can delete)
  });
}
```

### Post Matching Job Pattern

```typescript
// apps/api/src/jobs/post-match-worker.ts
// Follows exact pattern from match-worker.ts
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

const QUEUE_NAME = 'post-match';

// Worker logic for a new Offering post:
// SELECT * FROM trade_posts WHERE type='seeking' AND status='active'
//   AND cards @> jsonb_build_array(jsonb_build_object('cardId', $cardId, 'language', $lang))
//   AND user_id != $postUserId
//
// Also: SELECT * FROM user_wanted_cards WHERE cardId = $cardId AND language = $lang
//   AND userId != $postUserId
// (Proactive notification even without a Seeking post)
```

### Mobile: Zustand Posts Store

```typescript
// apps/mobile/src/stores/posts.ts - follows existing store pattern
import { create } from 'zustand';
import type { TradePost } from '@pocket-trade-hub/shared';

interface PostsState {
  // Marketplace
  marketPosts: TradePost[];
  marketLoading: boolean;
  marketNextCursor: string | null;

  // My posts
  myPosts: TradePost[];
  myPostsLoading: boolean;

  // Actions
  setMarketPosts: (posts: TradePost[], cursor: string | null) => void;
  appendMarketPosts: (posts: TradePost[], cursor: string | null) => void;
  setMyPosts: (posts: TradePost[]) => void;
  addMyPost: (post: TradePost) => void;
  updatePostStatus: (postId: string, status: string) => void;
  reset: () => void;
}
```

## State of the Art

| Old Approach (v1.0) | New Approach (Phase 8) | Impact |
|---------------------|------------------------|--------|
| Automatic two-way matching from collection/wanted | User-created Offering/Seeking posts | Users control what they trade, not algorithmic |
| Match required before proposal | Proposals from any post directly | Lower friction, faster trading |
| tradeMatches table + match engine | tradePosts table + post matching job | Simpler data model, user-driven |
| Trades tab: Matches + Proposals | Market tab (browse) + Trades tab (My Posts + Proposals) | Clearer separation of discovery vs management |
| No card language in trades | Language per card in posts (TRAD-06) | Prevents language mismatch complaints |

**Deprecated/outdated after Phase 8:**
- `match.service.ts`: computeTwoWayMatches, recomputeMatchesForUser, getMatchesForUser - all replaced by post-based system
- `match-worker.ts`: BullMQ match-recompute queue - replaced by post-match queue
- `tradeMatches` table: No longer populated - can drop in future migration
- `useMatches` hook: Replaced by `usePosts` / `useMarketplace`
- `MatchCard`, `MatchDetailModal` components: Replaced by PostCard, PostDetailModal
- `matches.ts` route file: No longer needed (keep temporarily for backward compat)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (configured in apps/api/package.json) |
| Config file | apps/api/jest.config.ts (inferred from test command) |
| Quick run command | `cd apps/api && npx jest --testPathPattern=<file> --no-coverage` |
| Full suite command | `cd apps/api && npx jest --no-coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TRAD-01 | Create Offering post with cards | unit + route | `npx jest __tests__/services/post.service.test.ts -x` | No - Wave 0 |
| TRAD-02 | Create Seeking post with cards | unit + route | `npx jest __tests__/services/post.service.test.ts -x` | No - Wave 0 |
| TRAD-03 | Browse/search posts with filters | route | `npx jest __tests__/routes/posts.route.test.ts -x` | No - Wave 0 |
| TRAD-04 | Complementary post matching | unit | `npx jest __tests__/services/post-match.service.test.ts -x` | No - Wave 0 |
| TRAD-05 | Proposal from post (no match required) | unit | `npx jest __tests__/proposal.service.test.ts -x` | Exists (needs update) |
| TRAD-06 | Card language in posts | unit | `npx jest __tests__/services/post.service.test.ts -x` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `cd apps/api && npx jest --testPathPattern=<changed-file> --no-coverage`
- **Per wave merge:** `cd apps/api && npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/api/__tests__/services/post.service.test.ts` -- covers TRAD-01, TRAD-02, TRAD-06 (create/close/auto-close, language validation)
- [ ] `apps/api/__tests__/routes/posts.route.test.ts` -- covers TRAD-03 (browse, filter, pagination, premium limit)
- [ ] `apps/api/__tests__/services/post-match.service.test.ts` -- covers TRAD-04 (complementary matching, notification dispatch)
- [ ] Update `apps/api/__tests__/proposal.service.test.ts` -- covers TRAD-05 (postId-based proposal creation, optional matchId)

## Open Questions

1. **Single vs Multi-Card Posts**
   - What we know: Single-card posts are simpler for matching, auto-close, and UX. Multi-card posts reduce post spam but complicate matching.
   - Recommendation: **Single card per post.** Simpler matching (`cards @> [{"cardId":"X","language":"Y"}]`), simpler auto-close (close the specific post), and users can create multiple posts easily. The 15-post limit for free users naturally constrains spam. Schema stores cards as array for future flexibility.

2. **Free Tier Post Limit**
   - What we know: Needs to be generous enough for casual use, constraining enough for premium incentive.
   - Recommendation: **15 active posts** for free users, unlimited for premium. Most casual traders will have 5-10 cards to offer/seek. Power traders will hit 15 quickly.

3. **Marketplace Default Sort**
   - What we know: Users want to see fresh content first, but relevant content matters more.
   - Recommendation: **Newest first** as default, with **Relevant** as an alternative sort. Premium posts get a slight recency boost (appear as if posted 30 min more recently).

4. **Migration Strategy for Old Match Engine**
   - What we know: Old `tradeMatches` table has existing data, `match.service.ts` is called from routes and workers.
   - Recommendation: **Soft deprecation.** Stop enqueueing new match-recompute jobs. Keep GET /matches route returning empty array. Remove match UI from mobile. Do NOT drop the table in this phase -- leave cleanup for a future migration.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `apps/api/src/db/schema.ts` -- all existing table definitions, relationship patterns
- Codebase analysis: `apps/api/src/services/match.service.ts` -- match engine to be replaced
- Codebase analysis: `apps/api/src/services/proposal.service.ts` -- proposal lifecycle, trade completion logic
- Codebase analysis: `apps/api/src/jobs/match-worker.ts` -- BullMQ worker pattern to replicate
- Codebase analysis: `apps/mobile/app/(tabs)/_layout.tsx` -- tab navigation structure
- Codebase analysis: `apps/mobile/app/(tabs)/trades.tsx` -- current trades screen to refactor
- Codebase analysis: `apps/mobile/src/hooks/useMatchSocket.ts` -- Socket.IO event patterns
- Codebase analysis: `packages/shared/src/schemas/proposal.ts` -- shared Zod validation

### Secondary (MEDIUM confidence)
- PostgreSQL JSONB indexing: GIN indexes with `jsonb_path_ops` for containment queries (well-documented PostgreSQL feature)
- BullMQ job deduplication: existing pattern in match-worker.ts verified working

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in project, no new dependencies
- Architecture: HIGH -- follows existing patterns exactly (service/route, BullMQ worker, Zustand store)
- Database schema: HIGH -- extends existing Drizzle patterns, JSONB for card arrays proven in tradeMatches
- Pitfalls: HIGH -- derived from actual code analysis of existing race conditions and patterns
- Post matching logic: MEDIUM -- JSONB containment query performance at scale needs monitoring

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable -- no external dependency changes expected)
