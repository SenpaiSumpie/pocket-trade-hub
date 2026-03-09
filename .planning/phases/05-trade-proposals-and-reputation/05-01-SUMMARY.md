---
phase: 05-trade-proposals-and-reputation
plan: 01
subsystem: api
tags: [proposals, ratings, notifications, zod, drizzle, bullmq, socket.io, fairness]

# Dependency graph
requires:
  - phase: 04-trade-matching-engine
    provides: trade_matches table, Socket.IO plugin, BullMQ worker pattern, match service
provides:
  - Shared Zod schemas for proposals, ratings, notifications, fairness
  - tradeProposals, tradeRatings, notifications DB tables
  - Proposal service with full lifecycle (create, accept, reject, counter, complete)
  - Rating service with getUserReputation aggregation
  - Notification inbox service (CRUD, unread count, auto-archive)
  - REST API routes for proposals, ratings, notifications
  - BullMQ daily notification archive job
affects: [05-02, 05-03, mobile-trade-ui, mobile-notifications]

# Tech tracking
tech-stack:
  added: []
  patterns: [proposal-status-machine, counter-offer-thread-via-parentId, notification-inbox-pattern, fairness-score-calculator]

key-files:
  created:
    - packages/shared/src/schemas/proposal.ts
    - packages/shared/src/schemas/rating.ts
    - packages/shared/src/schemas/notification.ts
    - packages/shared/src/schemas/fairness.ts
    - packages/shared/src/__tests__/fairness.test.ts
    - apps/api/src/services/proposal.service.ts
    - apps/api/src/services/rating.service.ts
    - apps/api/src/routes/proposals.ts
    - apps/api/src/jobs/notification-worker.ts
    - apps/api/__tests__/proposal.service.test.ts
    - apps/api/__tests__/rating.service.test.ts
    - apps/api/__tests__/notification-inbox.service.test.ts
  modified:
    - packages/shared/src/index.ts
    - apps/api/src/db/schema.ts
    - apps/api/src/services/notification.service.ts
    - apps/api/src/routes/notifications.ts
    - apps/api/src/routes/users.ts
    - apps/api/src/server.ts
    - apps/api/__tests__/setup.ts

key-decisions:
  - "Proposal status machine: pending->accepted/rejected/countered, accepted->completed"
  - "Counter-offers linked via parentId with thread traversal for full chain"
  - "matchId is NOT a FK -- nullable text reference since matches are volatile"
  - "Notification inbox uses cursor-based pagination via createdAt+id"
  - "Rating is idempotent via onConflictDoNothing on (proposalId, raterId)"
  - "Fairness score: rarity weights with Great/Fair/Unfair labels at 35-65/20-80 thresholds"

patterns-established:
  - "Proposal status transitions guarded at DB level via WHERE status='pending' clauses"
  - "Counter-offer thread: parentId self-reference with matchId-based thread retrieval"
  - "Notification creation inline in service functions (not via separate event system)"
  - "BullMQ upsertJobScheduler for repeatable cron jobs"

requirements-completed: [TRADE-01, TRADE-02, TRADE-03, TRADE-04, TRADE-05, TRADE-06, REP-01, REP-02, NOTIF-01, NOTIF-02, NOTIF-03]

# Metrics
duration: 7min
completed: 2026-03-09
---

# Phase 5 Plan 1: Backend Foundation Summary

**Trade proposal lifecycle with status-guarded transitions, counter-offer threads, rating aggregation, notification inbox with auto-archive, and fairness scoring**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-09T16:25:26Z
- **Completed:** 2026-03-09T16:32:30Z
- **Tasks:** 4
- **Files modified:** 19

## Accomplishments
- Full proposal lifecycle: create, accept, reject, counter-offer, complete with DB-level status guards
- Rating service with unique constraint enforcement and reputation aggregation (avgRating + tradeCount)
- Notification inbox with CRUD, unread count, cursor pagination, and 30-day auto-archive via BullMQ
- Fairness calculator with rarity-weighted scoring and labeled thresholds
- 35 new tests across proposal, rating, and notification services (164 total tests pass)

## Task Commits

Each task was committed atomically:

1. **Task 1: Shared schemas, DB tables, and fairness utility** - `4c11bb7` (feat)
2. **Task 2: Proposal service with tests** - `ae58ae2` (feat)
3. **Task 3: Rating service, notification inbox service with auto-archive, and tests** - `cfc8d48` (feat)
4. **Task 4: API routes, route registration, and notification auto-archive job** - `dc09baa` (feat)

## Files Created/Modified
- `packages/shared/src/schemas/proposal.ts` - Zod schemas for proposal card, creation, status, full proposal
- `packages/shared/src/schemas/rating.ts` - Zod schemas for rating creation and trade rating
- `packages/shared/src/schemas/notification.ts` - Zod schemas for notification types and items
- `packages/shared/src/schemas/fairness.ts` - Rarity-weighted fairness calculator with score labels
- `packages/shared/src/index.ts` - Re-exports all new schemas and types
- `apps/api/src/db/schema.ts` - tradeProposals, tradeRatings, notifications tables with indexes
- `apps/api/src/services/proposal.service.ts` - Full proposal lifecycle with notifications and socket events
- `apps/api/src/services/rating.service.ts` - Rating creation with validation and reputation aggregation
- `apps/api/src/services/notification.service.ts` - Extended with inbox CRUD, unread count, archive
- `apps/api/src/routes/proposals.ts` - All proposal REST endpoints including rate
- `apps/api/src/routes/notifications.ts` - Extended with inbox list, unread-count, mark-read, mark-all-read
- `apps/api/src/routes/users.ts` - Profile endpoint now includes avgRating and tradeCount
- `apps/api/src/server.ts` - Proposals route registered
- `apps/api/src/jobs/notification-worker.ts` - BullMQ daily archive job at 3am
- `apps/api/__tests__/setup.ts` - Updated with new tables in cleanDb and proposal route registration

## Decisions Made
- Proposal status machine with DB-level guards (WHERE status='pending') prevents race conditions
- Counter-offers linked via parentId; thread retrieval walks up to root then filters by matchId
- matchId stored as plain text (not FK) since matches are volatile and can be recomputed
- Notification inbox uses cursor-based pagination for efficient mobile scrolling
- Rating is idempotent: onConflictDoNothing returns null for duplicates
- Fairness score uses rarity weights (diamond1=1 to crown=100) with Great/Fair/Unfair thresholds

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Applied schema to test database**
- **Found during:** Task 2 (Proposal service tests)
- **Issue:** drizzle-kit push only applied to main DB; test DB lacked new tables
- **Fix:** Ran drizzle-kit push with DATABASE_URL_TEST
- **Files modified:** None (DB-only operation)
- **Verification:** All tests pass after schema push

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential for test execution. No scope creep.

## Issues Encountered
None beyond the test DB schema push above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All backend services ready for Plan 02 (mobile trade proposal UI) and Plan 03 (notification inbox UI)
- Socket.IO events emitted on all proposal lifecycle changes
- Push notifications fire for new proposals and responses
- User profile endpoint returns reputation data for display

## Self-Check: PASSED

All 8 key created files verified present. All 4 task commits verified in git log.

---
*Phase: 05-trade-proposals-and-reputation*
*Completed: 2026-03-09*
