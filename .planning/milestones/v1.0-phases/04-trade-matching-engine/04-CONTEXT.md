# Phase 4: Trade Matching Engine - Context

**Gathered:** 2026-03-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Automated two-way trade match detection: system finds users who have cards you want AND want cards you have. Pre-computed matches stored in DB, displayed in the Trades tab as ranked match cards. Push notifications (batched digest + immediate for high-priority) and real-time in-app toast banners. Manual trade proposals, fairness evaluation, and reputation are separate phases (Phase 5).

</domain>

<decisions>
## Implementation Decisions

### Match presentation
- Match cards in a scrollable vertical list on the Trades tab (replaces "Coming soon" placeholder)
- Each match card shows: partner avatar/name, card(s) you'd give, card(s) you'd get, star rating (1-3)
- Star rating based on combined priority of wanted cards in the match (maps from high/medium/low priority system)
- Tap match card opens full match modal: partner profile (name, avatar, friend code, trade count), all tradeable card pairs with images, priority indicators, and "Propose Trade" button (placeholder, wired in Phase 5)

### Multi-card match display
- Claude's discretion on best approach for displaying multi-card matches on the match card

### Match ranking & filtering
- Default sort: priority-first (high-priority wanted cards first, then medium, then low; within same priority, sort by number of tradeable cards)
- Sort toggle button at top of Trades tab: Priority (default), Most Cards, Newest
- No filter controls in v1 — users scroll and use sort
- Stale matches auto-removed silently on next refresh

### Rarity balance
- Claude's discretion on whether/how to handle rarity imbalance in match ranking (fairness evaluation proper comes in Phase 5 with TRADE-06)

### Real-time in-app notifications
- Toast banner slides down from top when new match found while app is open: "New match found! [Partner] has [Card] you want."
- Tap banner jumps to the match in Trades tab
- Auto-dismisses after 5 seconds
- Red count badge on Trades tab icon showing unseen match count, clears when tab opened

### Push notifications
- Batched digest: "You have X new trade matches!" sent at most once per hour for medium/low priority
- High-priority matches bypass batch and push immediately: "High-priority match! [Partner] has [Card] you want."
- Tap notification opens Trades tab
- Uses existing Expo Push SDK infrastructure from Phase 2

### Match refresh cadence
- Event-driven: recompute when user adds/removes collection or wanted cards, plus on app open
- Collection/wanted changes queue a match job with 30-second debounce (bulk-add = one recompute)
- Matches stored in DB table (pre-computed) — enables push notifications, badge counts, "seen" tracking
- No periodic background cron needed — changes are the trigger

### Trades tab loading
- Show cached matches immediately from DB, refresh in background
- Pull-to-refresh for manual update
- Instant feel — always something to see

### Claude's Discretion
- Real-time transport choice (Socket.IO, SSE, or polling for in-app notifications)
- Matching algorithm implementation (SQL query strategy, indexing)
- BullMQ job queue configuration for debounced match computation
- Match staleness detection logic
- Empty state design for Trades tab (no matches yet)
- Match card visual design details (spacing, animations)
- Multi-card match display approach (best pair featured, all pairs, or summary)

</decisions>

<specifics>
## Specific Ideas

- Match cards should feel like "trade offers waiting for you" — the Trades tab should create excitement and a sense of opportunity when there are matches
- Star rating keeps it simple and ties directly into the priority system users already understand from wanted lists
- Batched notifications prevent spam but high-priority cards get VIP treatment — users who mark cards as high-priority should feel like the app is working hard to find those cards
- Event-driven matching means the system responds to user actions, not arbitrary schedules — feels alive and responsive

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `notification.service.ts`: Push notification infrastructure (Expo Push SDK, token management, chunk sending, stale token cleanup) — extend for match notifications
- `collection.service.ts` / `wanted.service.ts`: Collection and wanted CRUD — these are the event sources that trigger match recomputation
- `useCollection.ts` / `useWanted.ts`: Mobile hooks with optimistic updates — add match recompute trigger after mutations
- Zustand store pattern (`collection.ts`, `cards.ts`, `auth.ts`): Create `trades.ts` store for match state
- `CardThumbnail.tsx`: Card image rendering with overlays — reuse in match card give/get displays
- `CardDetailModal.tsx`: Modal pattern for card details — reference for match detail modal
- Theme system (`colors`, `typography`, `spacing`): Dark theme with gold accent (#f0c040)

### Established Patterns
- Service layer: routes validate with Zod, call service, return response
- Drizzle ORM with PostgreSQL — matches table follows existing schema pattern
- BullMQ + Redis in stack (from Phase 2 research) — use for debounced match job queue
- Expo Push SDK for push notifications with chunk sending and stale token cleanup
- FlashList for performant scrollable lists

### Integration Points
- Trades tab (`app/(tabs)/trades.tsx`): Replace "Coming soon" placeholder with match list
- Tab layout (`app/(tabs)/_layout.tsx`): Add badge count to Trades tab icon
- API routes: New match endpoints (GET /matches, POST /matches/refresh)
- DB schema: New `trade_matches` table with user pairs, card pairs, scores, seen status
- Collection/wanted service hooks: Trigger match recompute job on mutations
- `server.ts`: Register new match routes, initialize BullMQ worker

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-trade-matching-engine*
*Context gathered: 2026-03-08*
