---
phase: 06-premium-tier
plan: 02
subsystem: api
tags: [bullmq, cron, workers, redis, card-alerts, analytics]

requires:
  - phase: 06-01
    provides: "analytics.service (computeAllAnalytics) and card-alert.service (checkCardAlerts, processCardAlertBatch)"
provides:
  - "BullMQ analytics worker running daily at 4am"
  - "BullMQ card alert worker running every 2 hours"
  - "Collection route wiring that triggers card alerts on add/bulk-add"
  - "Worker lifecycle management in server.ts (init + graceful shutdown)"
affects: [06-premium-tier]

tech-stack:
  added: []
  patterns: ["BullMQ upsertJobScheduler for repeatable cron jobs", "Fire-and-forget pattern for non-critical async operations"]

key-files:
  created:
    - apps/api/src/jobs/analytics-worker.ts
    - apps/api/src/jobs/card-alert-worker.ts
  modified:
    - apps/api/src/routes/collection.ts
    - apps/api/src/server.ts

key-decisions:
  - "Workers initialized after app.listen in server start block, not in buildApp"
  - "Card alert triggers at route level (not service level) to maintain service purity"
  - "Fire-and-forget pattern with .catch(() => {}) for non-blocking alert checks"

patterns-established:
  - "upsertJobScheduler pattern: queue.upsertJobScheduler(schedulerName, { pattern: cronExpr }, { name, data }) for repeatable BullMQ jobs"
  - "Graceful shutdown: SIGTERM/SIGINT handlers close workers before app"

requirements-completed: [PREM-02, PREM-04]

duration: 3min
completed: 2026-03-10
---

# Phase 6 Plan 02: Background Workers and Collection Triggers Summary

**BullMQ cron workers for daily analytics (4am) and 2-hour card alert batching, with fire-and-forget alert triggers on collection mutations**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-11T03:24:39Z
- **Completed:** 2026-03-11T03:27:34Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Analytics worker pre-computes most-wanted/least-available/trending data daily at 4am via BullMQ cron
- Card alert worker batches and processes alert events every 2 hours to prevent notification spam
- Collection POST and bulk POST routes trigger checkCardAlerts fire-and-forget for premium user alerts
- Both workers initialize on server start with graceful shutdown on SIGTERM/SIGINT

## Task Commits

Each task was committed atomically:

1. **Task 1: Analytics and card alert BullMQ workers** - `59ce986` (feat)
2. **Task 2: Wire alert triggers into collection mutations and start workers** - `d9256da` (feat)

## Files Created/Modified
- `apps/api/src/jobs/analytics-worker.ts` - BullMQ worker with daily 4am cron calling computeAllAnalytics
- `apps/api/src/jobs/card-alert-worker.ts` - BullMQ worker with 2-hour cron calling processCardAlertBatch
- `apps/api/src/routes/collection.ts` - Added fire-and-forget checkCardAlerts on POST and bulk POST
- `apps/api/src/server.ts` - Worker imports, initialization after listen, graceful shutdown handlers

## Decisions Made
- Workers initialized after app.listen (not in buildApp) to keep buildApp pure for testing
- Card alert triggers placed at route level rather than service level to maintain service domain purity
- Fire-and-forget pattern (.catch(() => {})) used so alert checks never block API responses

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing ioredis type mismatch between workspace root and apps/api packages causes TS errors on all worker files (including existing match-worker.ts). Not a regression -- same error pattern as established code.
- Pre-existing test failures in proposal.service.test.ts and rating.service.test.ts (FK constraint violations from dirty working tree changes). Not related to this plan's changes. Collection route tests all pass (16/16).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Workers ready for production deployment alongside Redis
- Plan 03 (premium mobile UI) can consume analytics data and rely on alert notifications
- All backend premium infrastructure complete (services from 06-01, workers from 06-02)

---
*Phase: 06-premium-tier*
*Completed: 2026-03-10*
