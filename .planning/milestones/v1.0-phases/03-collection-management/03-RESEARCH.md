# Phase 3: Collection Management - Research

**Researched:** 2026-03-08
**Domain:** Inventory/Wanted CRUD with Zustand state, Drizzle ORM, Fastify authenticated routes, React Native UI overlays
**Confidence:** HIGH

## Summary

Phase 3 adds two user-scoped data domains -- inventory (cards owned with quantities) and wanted list (cards desired with priority levels) -- on top of the existing card browsing infrastructure. The backend work is straightforward: two new DB tables, a service layer, and authenticated Fastify routes. The frontend work involves extending existing components (CardThumbnail, CardDetailModal, SetPicker, Cards tab) with contextual overlays, a segmented control, a checklist mode, and a collection summary on the Home tab.

The project has well-established patterns from Phases 1-2: Drizzle ORM with PostgreSQL, Zod schemas in `packages/shared`, service-layer architecture, Zustand stores per domain, and `apiFetch` with token refresh. This phase follows the same patterns exactly -- no new libraries or architectural departures needed.

**Primary recommendation:** Build backend first (schema + service + routes), then shared schemas, then frontend store + hooks, then UI modifications -- following the same layered approach used in Phases 1-2.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Collection lives inside Cards tab as segmented control: Browse | My Collection | Wanted
- Reuses existing card grid, set picker, and search components
- No new tab -- keeps 4-tab navigation (Home, Cards, Trades, Profile)
- Owned cards full color with quantity badge, unowned cards dimmed/greyed out
- Quantity badge: small gold circle in top-right corner, only for qty > 1
- Set picker chips show progress bars with count (e.g., "42/286") and completion percentage
- Long-press card thumbnail to quick-add (adds x1, increments on repeated long-press)
- Brief haptic feedback + toast on quick-add
- Tap card opens detail modal with context-aware actions per mode
- Checklist Mode toggle in My Collection view with checkbox overlays, Select All/Deselect All, Cancel/Save
- Checklist sets quantity to 1; use detail modal or long-press for quantities > 1
- Per-set progress bar in set picker chips with "X/Y" count
- Overall collection summary card on Home tab (total unique cards, overall completion %, sets in progress)
- Wanted list: default priority Medium, color-coded badges (red High, gold Medium, grey Low)
- Sort wanted by priority, optional set filter
- Cards can exist in both collection AND wanted list simultaneously

### Claude's Discretion
- Loading states and optimistic update patterns
- Empty states for collection and wanted list
- API pagination for large collections
- Exact animation/transition for checklist mode toggle
- Error handling for failed bulk operations
- Whether to show a confirmation dialog when removing cards

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INV-01 | User can add cards to their inventory | DB schema `userCollectionItems`, POST /collection endpoint, quick-add long-press, detail modal "Add to Collection" button |
| INV-02 | User can remove cards from inventory | DELETE /collection/:cardId endpoint, detail modal "Remove from Collection", checklist uncheck-and-save |
| INV-03 | User can update card quantities | PUT /collection/:cardId with quantity, detail modal quantity stepper (+/-), long-press increment |
| INV-04 | User can bulk-add cards via set checklist UI | Checklist mode toggle, checkbox overlays, Select All/Deselect All, POST /collection/bulk endpoint with diff |
| INV-05 | User can view collection completion per set with progress bar | GET /collection/progress endpoint, SetPicker chip progress bars, Home tab summary card |
| WANT-01 | User can add cards to wanted list | DB schema `userWantedCards`, POST /wanted endpoint, detail modal "Add to Wanted" button |
| WANT-02 | User can remove cards from wanted list | DELETE /wanted/:cardId endpoint, detail modal "Remove from Wanted" |
| WANT-03 | User can set priority level on wanted cards | Priority enum (high/medium/low), PUT /wanted/:cardId with priority, color-coded badges on thumbnails |
</phase_requirements>

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | existing | DB schema + queries for collection/wanted tables | Already used for users, cards, sets tables |
| zod | existing | Request/response validation schemas | Already used in shared package for all schemas |
| fastify | existing | Authenticated API routes | Already used for all routes |
| @fastify/jwt | existing | Route authentication via `fastify.authenticate` | Already configured in auth plugin |
| zustand | existing | Client-side collection/wanted state | Already used for auth and cards stores |
| expo-image | existing | Card thumbnails with overlay badges | Already used in CardThumbnail |
| @shopify/flash-list | existing | Performant card grids | Already used in CardGrid |

### Supporting (already in project)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-haptics | existing | Haptic feedback on quick-add long-press | Quick-add interaction |
| @expo/vector-icons (Ionicons) | existing | Icons for action buttons, badges | UI elements throughout |

### New (may need install)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-haptics | check if installed | Haptic feedback for long-press quick-add | Required by locked decision |

**Installation check needed:**
```bash
# Verify expo-haptics is available
cd apps/mobile && cat package.json | grep haptics
# If not installed:
npx expo install expo-haptics
```

### Alternatives Considered
None -- all decisions are locked. No new libraries needed beyond the existing stack.

## Architecture Patterns

### Recommended Project Structure (new/modified files)
```
packages/shared/src/schemas/
  collection.ts              # NEW: Zod schemas for collection + wanted

apps/api/src/
  db/schema.ts               # MODIFY: add userCollectionItems + userWantedCards tables
  services/collection.service.ts  # NEW: collection CRUD + bulk + progress
  services/wanted.service.ts      # NEW: wanted CRUD
  routes/collection.ts        # NEW: authenticated collection endpoints
  routes/wanted.ts            # NEW: authenticated wanted endpoints
  server.ts                   # MODIFY: register new route plugins

apps/mobile/src/
  stores/collection.ts        # NEW: Zustand store for collection + wanted state
  hooks/useCollection.ts      # NEW: hooks for collection API calls
  hooks/useWanted.ts          # NEW: hooks for wanted API calls
  components/cards/
    CardThumbnail.tsx          # MODIFY: add quantity badge, priority badge, dimmed state
    CardDetailModal.tsx        # MODIFY: context-aware actions per mode
    SetPicker.tsx              # MODIFY: progress bar + count in chips
    ChecklistMode.tsx          # NEW: checklist overlay + controls
    QuantityStepper.tsx        # NEW: +/- quantity control for detail modal
    PriorityPicker.tsx         # NEW: High/Medium/Low picker for wanted
    CollectionSummary.tsx      # NEW: Home tab summary card

apps/mobile/app/(tabs)/
  cards.tsx                    # MODIFY: add segmented control, mode switching
  index.tsx                    # MODIFY: replace "Coming Soon" with CollectionSummary
```

### Pattern 1: Database Schema (Drizzle)
**What:** Two new tables following existing conventions (text PK, userId FK, timestamps)
**When to use:** All collection/wanted data persistence

```typescript
// Follow exact pattern from existing schema.ts
export const priorityEnum = pgEnum('priority', ['high', 'medium', 'low']);

export const userCollectionItems = pgTable('user_collection_items', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  cardId: text('card_id').notNull().references(() => cards.id),
  quantity: integer('quantity').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('uci_user_id_idx').on(table.userId),
  index('uci_card_id_idx').on(table.cardId),
  // Unique constraint: one row per user+card
]);

export const userWantedCards = pgTable('user_wanted_cards', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  cardId: text('card_id').notNull().references(() => cards.id),
  priority: priorityEnum('priority').notNull().default('medium'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('uwc_user_id_idx').on(table.userId),
  index('uwc_card_id_idx').on(table.cardId),
]);
```

**Critical:** Add a unique constraint on (userId, cardId) for both tables. Drizzle supports this via `.unique()` on the table or a unique index.

### Pattern 2: Service Layer (following card.service.ts)
**What:** Pure functions that take db instance, return data
**When to use:** All business logic

```typescript
// collection.service.ts - follows exact pattern of card.service.ts
type Db = any; // Same pattern used in existing services

export async function addToCollection(db: Db, userId: string, cardId: string, quantity = 1) {
  // Upsert: if exists, increment quantity; if not, insert
}

export async function bulkUpdateCollection(db: Db, userId: string, additions: string[], removals: string[]) {
  // Transaction with batch inserts/deletes
}

export async function getCollectionProgress(db: Db, userId: string) {
  // Group by setId, count owned vs total per set
}
```

### Pattern 3: Authenticated Routes (following users.ts pattern)
**What:** Fastify routes using `preHandler: [fastify.authenticate]`
**When to use:** All collection/wanted endpoints (user-scoped data)

```typescript
// The existing auth pattern decorates fastify with authenticate
fastify.post('/collection', {
  preHandler: [fastify.authenticate],
}, async (request, reply) => {
  const userId = request.user.sub; // JWT payload has { sub: string }
  // ... validate body with Zod, call service
});
```

### Pattern 4: Zustand Store (following cards.ts and auth.ts)
**What:** Domain-specific store for collection and wanted state
**When to use:** Client-side state for collection/wanted data, mode switching

```typescript
// collection.ts store - follows cards.ts pattern
interface CollectionState {
  mode: 'browse' | 'collection' | 'wanted';
  collectionByCardId: Record<string, number>;  // cardId -> quantity
  wantedByCardId: Record<string, 'high' | 'medium' | 'low'>; // cardId -> priority
  checklistMode: boolean;
  checklistSelections: Set<string>;
  progressBySet: Record<string, { owned: number; total: number }>;
  // ... actions
}
```

### Pattern 5: Optimistic Updates (Claude's discretion)
**What:** Update UI immediately, revert on API failure
**When to use:** Quick-add, quantity changes, wanted add/remove

**Recommendation:** Use optimistic updates for single-item operations (quick-add, quantity +/-, priority change). For bulk operations (checklist save), show a loading indicator and wait for server confirmation. This provides the best UX for the common case while being safe for batch operations.

### Anti-Patterns to Avoid
- **Fetching entire collection on every mode switch:** Cache collection data in Zustand store, invalidate on mutations
- **Separate API call per card in bulk operations:** Use a single bulk endpoint with all additions/removals as a diff
- **Storing collection state in the cards store:** Keep domain separation -- collection.ts store is separate from cards.ts store
- **Re-rendering entire card grid on single quantity change:** Use cardId-keyed lookups (Record<string, number>) so individual thumbnail components can subscribe to their own data
- **Loading all cards for a set to compute progress:** Compute progress server-side with SQL COUNT queries, not client-side

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Haptic feedback | Custom native module | expo-haptics `impactAsync(ImpactFeedbackStyle.Light)` | Cross-platform, handles permissions |
| Long-press detection | Custom gesture handler | React Native `Pressable` `onLongPress` prop | Built-in, 500ms default delay is fine |
| Toast notifications | Custom toast system | Simple Animated.View with setTimeout | Keep minimal -- just a brief "Added!" overlay |
| Progress bar | Custom SVG/Canvas | React Native `View` with percentage width + backgroundColor | Simple colored bar is sufficient |
| Segmented control | Custom tab component | Simple row of Pressable buttons with active state | Matches existing chip/pill pattern |
| Unique constraint enforcement | Application-level checks | PostgreSQL UNIQUE constraint on (userId, cardId) | Database guarantees correctness |

**Key insight:** Everything in this phase is standard CRUD with UI overlays. The complexity is in the number of UI touchpoints, not in any individual feature. Keep each piece simple.

## Common Pitfalls

### Pitfall 1: Race Conditions on Quick-Add
**What goes wrong:** User long-presses rapidly, multiple API calls fire, quantity gets out of sync
**Why it happens:** Each long-press fires an independent API call
**How to avoid:** Debounce rapid long-presses (300ms). Use optimistic local state increment, then reconcile with server response. Consider a queue that batches rapid increments into a single API call.
**Warning signs:** Quantity badge flickers or shows wrong number after rapid presses

### Pitfall 2: Stale Collection Data After Mode Switch
**What goes wrong:** User adds card in Browse mode, switches to My Collection, card doesn't appear
**Why it happens:** Collection data cached from a previous fetch, not updated after mutation
**How to avoid:** When mutating collection (add/remove/update), update the Zustand store immediately. When switching modes, use cached data but trigger a background refresh.
**Warning signs:** User needs to pull-to-refresh to see changes

### Pitfall 3: Checklist Mode Losing Unsaved Changes
**What goes wrong:** User checks 50 cards, accidentally taps Cancel or navigates away
**Why it happens:** Checklist state only exists in local component state
**How to avoid:** Store checklist selections in Zustand so they survive mode switches. Show a confirmation dialog if user has unsaved changes and tries to exit checklist mode.
**Warning signs:** User frustration when large batch operations are lost

### Pitfall 4: N+1 Queries for Collection Progress
**What goes wrong:** Computing per-set completion makes one query per set
**Why it happens:** Naive implementation loops over sets and queries each
**How to avoid:** Single SQL query that groups by setId and joins with sets table to get total counts:
```sql
SELECT s.id, s.card_count as total, COUNT(uci.id) as owned
FROM sets s
LEFT JOIN user_collection_items uci ON uci.card_id LIKE s.id || '-%' AND uci.user_id = $1
GROUP BY s.id, s.card_count
```
Better approach: join on cards table's setId column rather than LIKE pattern.
**Warning signs:** Slow Home tab load, slow set picker rendering

### Pitfall 5: Bulk Operation Timeout
**What goes wrong:** User checks all ~286 cards in a set, POST takes too long
**Why it happens:** Individual inserts in a loop rather than batch
**How to avoid:** Use Drizzle's batch insert (`db.insert(table).values([...array])`) in groups of 50, same pattern as card import. Wrap in a transaction.
**Warning signs:** Spinner shows for more than 2 seconds on bulk save

### Pitfall 6: CardDetailModal Not Knowing Current Mode
**What goes wrong:** Modal shows wrong actions (e.g., "Add to Collection" when already in collection mode)
**Why it happens:** Modal doesn't receive the current view mode as context
**How to avoid:** Pass the current mode (browse/collection/wanted) to CardDetailModal as a prop. Use it to determine which action buttons to render.
**Warning signs:** Confusing UX where actions don't match the current view

## Code Examples

### Database Unique Constraint with Drizzle
```typescript
// Use unique index to prevent duplicate user+card entries
import { uniqueIndex } from 'drizzle-orm/pg-core';

// In table definition's third argument:
(table) => [
  uniqueIndex('uci_user_card_unique').on(table.userId, table.cardId),
  index('uci_user_id_idx').on(table.userId),
]
```

### Upsert Pattern for Add/Increment
```typescript
// Drizzle upsert using onConflictDoUpdate
import { sql } from 'drizzle-orm';

await db.insert(userCollectionItems)
  .values({ id: nanoid(), userId, cardId, quantity })
  .onConflictDoUpdate({
    target: [userCollectionItems.userId, userCollectionItems.cardId],
    set: {
      quantity: sql`${userCollectionItems.quantity} + ${quantity}`,
      updatedAt: new Date(),
    },
  });
```

### Collection Progress Query
```typescript
// Efficient per-set progress in one query
const progress = await db
  .select({
    setId: cards.setId,
    total: count(cards.id),
    owned: count(userCollectionItems.id),
  })
  .from(cards)
  .leftJoin(
    userCollectionItems,
    and(
      eq(userCollectionItems.cardId, cards.id),
      eq(userCollectionItems.userId, userId),
    ),
  )
  .groupBy(cards.setId);
```

### Authenticated Route with Body Validation
```typescript
// Following the existing route pattern
const addToCollectionSchema = z.object({
  cardId: z.string().min(1),
  quantity: z.number().int().min(1).max(99).default(1),
});

fastify.post('/collection', {
  preHandler: [fastify.authenticate],
}, async (request, reply) => {
  const userId = request.user.sub;
  const parsed = addToCollectionSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Invalid body', details: parsed.error.flatten() });
  }
  const result = await addToCollection(fastify.db, userId, parsed.data.cardId, parsed.data.quantity);
  return reply.send(result);
});
```

### CardThumbnail with Overlays
```typescript
// Extending existing CardThumbnail with badge overlays
// Quantity badge (gold circle, top-right)
{quantity > 1 && (
  <View style={styles.quantityBadge}>
    <Text style={styles.quantityText}>{quantity}</Text>
  </View>
)}

// Priority badge (colored dot)
{priority && (
  <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[priority] }]}>
    <Text style={styles.priorityText}>{priority.charAt(0).toUpperCase()}</Text>
  </View>
)}

// Dimmed state for unowned cards
{dimmed && (
  <View style={styles.dimOverlay} />  // absolute positioned, semi-transparent dark overlay
)}
```

### Segmented Control
```typescript
// Simple segmented control matching existing chip pattern
const MODES = ['Browse', 'My Collection', 'Wanted'] as const;

<View style={styles.segmentedControl}>
  {MODES.map((label, i) => (
    <Pressable
      key={label}
      style={[styles.segment, mode === MODES_MAP[i] && styles.segmentActive]}
      onPress={() => setMode(MODES_MAP[i])}
    >
      <Text style={[styles.segmentText, mode === MODES_MAP[i] && styles.segmentTextActive]}>
        {label}
      </Text>
    </Pressable>
  ))}
</View>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom gesture handlers for long-press | React Native Pressable `onLongPress` | RN 0.63+ | No third-party gesture library needed |
| Manual token management per request | Existing `apiFetch` with auto-refresh | Phase 1 | All new authenticated calls get free token refresh |
| Separate DB migration files | Drizzle `push` for dev, `generate`+`migrate` for prod | Project convention | Schema changes go in schema.ts, drizzle handles migration |

**Note on Drizzle migrations:** The project has `drizzle.config.ts` set up but no existing migration files in `./drizzle/`. The convention appears to be using `drizzle-kit push` for development. New tables added to `schema.ts` will be picked up automatically.

## Open Questions

1. **expo-haptics installation status**
   - What we know: The CONTEXT.md specifies haptic feedback on quick-add
   - What's unclear: Whether expo-haptics is already installed in the mobile app
   - Recommendation: Check package.json at plan time; if not installed, add `npx expo install expo-haptics` as first task step

2. **Toast notification approach**
   - What we know: Brief toast needed on quick-add ("Added!" feedback)
   - What's unclear: No existing toast system in the codebase
   - Recommendation: Simple animated View overlay that auto-dismisses after 1.5s. No library needed -- keep it minimal with Animated.timing or LayoutAnimation.

3. **Test setup needs new table truncation**
   - What we know: `cleanDb()` in `__tests__/setup.ts` truncates specific tables
   - What's unclear: N/A -- this is certain
   - Recommendation: Update `cleanDb()` TRUNCATE to include `user_collection_items, user_wanted_cards`

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest with ts-jest preset |
| Config file | `apps/api/jest.config.js` |
| Quick run command | `cd apps/api && npx jest --testPathPattern="collection\|wanted" --no-coverage` |
| Full suite command | `cd apps/api && npx jest --no-coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INV-01 | Add card to collection | integration | `cd apps/api && npx jest --testPathPattern="collection.route" -t "add card" --no-coverage` | Wave 0 |
| INV-02 | Remove card from collection | integration | `cd apps/api && npx jest --testPathPattern="collection.route" -t "remove card" --no-coverage` | Wave 0 |
| INV-03 | Update card quantity | integration | `cd apps/api && npx jest --testPathPattern="collection.route" -t "update quantity" --no-coverage` | Wave 0 |
| INV-04 | Bulk-add via checklist | integration | `cd apps/api && npx jest --testPathPattern="collection.route" -t "bulk" --no-coverage` | Wave 0 |
| INV-05 | Collection progress per set | integration | `cd apps/api && npx jest --testPathPattern="collection.route" -t "progress" --no-coverage` | Wave 0 |
| WANT-01 | Add card to wanted list | integration | `cd apps/api && npx jest --testPathPattern="wanted.route" -t "add card" --no-coverage` | Wave 0 |
| WANT-02 | Remove card from wanted list | integration | `cd apps/api && npx jest --testPathPattern="wanted.route" -t "remove card" --no-coverage` | Wave 0 |
| WANT-03 | Set priority level | integration | `cd apps/api && npx jest --testPathPattern="wanted.route" -t "priority" --no-coverage` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd apps/api && npx jest --testPathPattern="collection\|wanted" --no-coverage`
- **Per wave merge:** `cd apps/api && npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/api/__tests__/routes/collection.route.test.ts` -- covers INV-01 through INV-05
- [ ] `apps/api/__tests__/routes/wanted.route.test.ts` -- covers WANT-01 through WANT-03
- [ ] `apps/api/__tests__/services/collection.service.test.ts` -- unit tests for progress calculation, bulk operations
- [ ] `apps/api/__tests__/setup.ts` -- update TRUNCATE to include new tables
- [ ] `packages/shared/src/__tests__/collection.schema.test.ts` -- Zod schema validation tests

## Sources

### Primary (HIGH confidence)
- Project codebase analysis: `apps/api/src/db/schema.ts`, `apps/api/src/routes/cards.ts`, `apps/api/src/services/card.service.ts` -- established DB, route, and service patterns
- Project codebase analysis: `apps/mobile/src/components/cards/CardThumbnail.tsx`, `CardDetailModal.tsx`, `SetPicker.tsx` -- established component patterns
- Project codebase analysis: `apps/mobile/src/stores/cards.ts`, `apps/mobile/src/hooks/useCards.ts` -- established state and hook patterns
- Project codebase analysis: `apps/api/src/plugins/auth.ts` -- JWT authentication pattern with `request.user.sub`
- Project codebase analysis: `apps/api/__tests__/routes/cards.route.test.ts`, `__tests__/setup.ts` -- established test patterns

### Secondary (MEDIUM confidence)
- Drizzle ORM upsert/onConflictDoUpdate -- based on Drizzle documentation patterns; verify exact API for composite unique constraints

### Tertiary (LOW confidence)
- expo-haptics installation status -- not verified in package.json during research

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in use, no new dependencies
- Architecture: HIGH -- follows exact patterns established in Phases 1-2
- Pitfalls: HIGH -- based on direct codebase analysis and CRUD experience
- Database schema: HIGH -- follows existing table conventions exactly
- UI modifications: MEDIUM -- component changes are well-scoped but numerous touchpoints increase integration risk

**Research date:** 2026-03-08
**Valid until:** 2026-04-07 (30 days -- stable domain, no fast-moving dependencies)
