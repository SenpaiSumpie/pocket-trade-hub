---
phase: 04-trade-matching-engine
plan: 01
subsystem: api
tags: [matching-algorithm, bullmq, redis, socket.io, ioredis, push-notifications, drizzle, zod]

# Dependency graph
requires:
  - phase: 03-collection-management
    provides: userCollectionItems and userWantedCards tables, collection/wanted CRUD services
provides:
  - trade_matches DB table with bidirectional match storage
  - Two-way matching algorithm (computeTwoWayMatches) via SQL joins
  - Match scoring with priority weights and 1-3 star ratings
  - GET /matches API with hydrated response (partner profile + card details)
  - POST /matches/refresh for immediate match recomputation
  - PUT /matches/:id/seen for seen tracking
  - BullMQ debounced match recomputation worker (30-second window)
  - Socket.IO real-time new-match events to user rooms
  - Push notifications for new matches (immediate for high-priority)
  - Shared Zod schemas (TradeMatch, MatchCardPair, MatchSort)
affects: [04-02 mobile UI, 05-trade-proposals]

# Tech tracking
tech-stack:
  added: [bullmq, ioredis, socket.io]
  patterns: [BullMQ debounced job queue, Socket.IO user rooms, bidirectional match storage]

key-files:
  created:
    - packages/shared/src/schemas/match.ts
    - apps/api/src/plugins/redis.ts
    - apps/api/src/plugins/socket.ts
    - apps/api/src/services/match.service.ts
    - apps/api/src/routes/matches.ts
    - apps/api/src/jobs/match-worker.ts
    - apps/api/__tests__/services/match.service.test.ts
    - apps/api/__tests__/routes/matches.route.test.ts
  modified:
    - packages/shared/src/index.ts
    - apps/api/src/db/schema.ts
    - apps/api/src/server.ts
    - apps/api/__tests__/setup.ts
    - apps/api/package.json

key-decisions:
  - "Socket.IO directly via fastify-plugin instead of fastify-socket.io (incompatible with Fastify 5)"
  - "Bidirectional match storage: both user and partner perspectives stored on recompute"
  - "Score thresholds: >=6 = 3 stars, >=3 = 2 stars, <3 = 1 star"
  - "Priority weights: high=3, medium=2, low=1"
  - "Match recompute uses onConflictDoUpdate for partner perspective upsert"

patterns-established:
  - "BullMQ queue pattern: debounced jobs with jobId-based deduplication"
  - "Socket.IO room pattern: user:userId rooms joined on connection auth"
  - "Match diff pattern: compare existing partner IDs to detect new matches"
  - "Hydrated response pattern: batch card/user lookups to avoid N+1 queries"

requirements-completed: [MATCH-01, MATCH-03, MATCH-04, MATCH-05]

# Metrics
duration: 9min
completed: 2026-03-09
---

# Phase 04 Plan 01: Trade Matching Engine Backend Summary

**Two-way matching algorithm with priority scoring, BullMQ debounced recomputation, Socket.IO real-time events, and push notifications for 18 passing match tests**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-09T03:48:28Z
- **Completed:** 2026-03-09T03:57:02Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- Core two-way matching algorithm that finds mutual trades via SQL joins on collection/wanted tables
- Match scoring with priority weights (high=3, medium=2, low=1) and star ratings (1-3)
- Full match API (GET /matches, POST /matches/refresh, PUT /matches/:id/seen) with hydrated responses
- BullMQ worker for debounced 30-second match recomputation
- Socket.IO real-time new-match events and push notifications (immediate for high-priority)
- 18 new tests (8 service + 10 route), full suite at 119 tests passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Shared schemas, DB table, Redis/Socket.IO plugins, and matching algorithm** - `d7736cc` (feat)
2. **Task 2: Match routes, BullMQ worker, push notifications, and route tests** - `d55b7dc` (feat)

## Files Created/Modified
- `packages/shared/src/schemas/match.ts` - Zod schemas for TradeMatch, MatchCardPair, MatchSort
- `packages/shared/src/index.ts` - Re-exports match schemas and types
- `apps/api/src/db/schema.ts` - trade_matches table with user/partner indexes
- `apps/api/src/plugins/redis.ts` - IORedis Fastify plugin with BullMQ-compatible config
- `apps/api/src/plugins/socket.ts` - Socket.IO Fastify plugin with user room joining
- `apps/api/src/services/match.service.ts` - Core matching algorithm, scoring, hydration, notifications
- `apps/api/src/routes/matches.ts` - GET /matches, POST /matches/refresh, PUT /matches/:id/seen
- `apps/api/src/jobs/match-worker.ts` - BullMQ worker with debounced recomputation
- `apps/api/src/server.ts` - Registered Redis, Socket.IO plugins and match routes
- `apps/api/__tests__/setup.ts` - Added trade_matches to TRUNCATE, registered match routes
- `apps/api/__tests__/services/match.service.test.ts` - 8 service tests for matching algorithm
- `apps/api/__tests__/routes/matches.route.test.ts` - 10 route tests for match API
- `apps/api/package.json` - Added bullmq, ioredis, socket.io dependencies

## Decisions Made
- Used Socket.IO directly with fastify-plugin instead of fastify-socket.io (Fastify 5 incompatibility)
- Bidirectional match storage: recompute stores both user and partner perspective rows
- onConflictDoUpdate upsert for partner perspective to handle concurrent recomputes
- Priority weights: high=3, medium=2, low=1 with star rating thresholds at 3 and 6
- Push notifications sent inline during recompute (not batched in v1)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test expectation for single high-priority card star rating**
- **Found during:** Task 1 (match service tests)
- **Issue:** Plan specified starRating=1 for score=3, but score=3 meets the >=3 threshold for 2 stars
- **Fix:** Corrected test to expect starRating=2, added separate test for starRating=1 (low priority)
- **Files modified:** apps/api/__tests__/services/match.service.test.ts
- **Verification:** All 8 service tests passing
- **Committed in:** d7736cc (Task 1 commit)

**2. [Rule 3 - Blocking] Removed incompatible fastify-socket.io, used Socket.IO directly**
- **Found during:** Task 1 (dependency installation)
- **Issue:** fastify-socket.io requires Fastify 4.x, project uses Fastify 5
- **Fix:** Created Socket.IO plugin directly with fastify-plugin wrapper
- **Files modified:** apps/api/src/plugins/socket.ts, apps/api/package.json
- **Verification:** Plugin registers correctly, Socket.IO server initializes
- **Committed in:** d7736cc (Task 1 commit)

**3. [Rule 1 - Bug] Fixed test checking unseenCount on wrong object**
- **Found during:** Task 2 (route tests)
- **Issue:** Test checked match.unseenCount instead of body.unseenCount
- **Fix:** Corrected test to check response body level unseenCount
- **Files modified:** apps/api/__tests__/routes/matches.route.test.ts
- **Verification:** All 10 route tests passing
- **Committed in:** d55b7dc (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 blocking)
**Impact on plan:** All auto-fixes necessary for correctness. No scope creep.

## Issues Encountered
- Database schema push needed for both production and test databases (drizzle-kit push for trade_matches table)
- pnpm install ENOENT error for metro-core temp directory (non-blocking, dependencies installed correctly)

## User Setup Required

**Redis is required for BullMQ job queue and Socket.IO.** Users need:
- `REDIS_URL` environment variable (default: `redis://localhost:6379`)
- Local Redis install (WSL/Memurai on Windows, brew on Mac) or cloud provider (Upstash, Redis Cloud)

## Next Phase Readiness
- Match API endpoints ready for mobile UI integration (Plan 02)
- BullMQ worker ready to be triggered from collection/wanted mutation hooks
- Socket.IO events ready for real-time in-app notifications
- All 119 tests passing, no regressions

---
*Phase: 04-trade-matching-engine*
*Completed: 2026-03-09*
