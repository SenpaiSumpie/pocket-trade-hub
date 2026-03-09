---
phase: 03-collection-management
plan: 01
subsystem: api
tags: [drizzle, fastify, zod, postgres, crud, collection, wanted]

# Dependency graph
requires:
  - phase: 01-foundation-and-auth
    provides: "JWT auth middleware, user model, Fastify plugin patterns"
  - phase: 02-card-database
    provides: "Cards and sets DB tables, card service patterns"
provides:
  - "Collection CRUD API (add, remove, update quantity, bulk, progress)"
  - "Wanted list CRUD API (add, remove, update priority)"
  - "Shared Zod schemas for collection/wanted validation"
  - "userCollectionItems and userWantedCards DB tables"
affects: [03-02, 03-03, 04-trade-matching]

# Tech tracking
tech-stack:
  added: []
  patterns: [upsert-on-conflict, bulk-transaction-batching, left-join-progress-query]

key-files:
  created:
    - packages/shared/src/schemas/collection.ts
    - apps/api/src/services/collection.service.ts
    - apps/api/src/services/wanted.service.ts
    - apps/api/src/routes/collection.ts
    - apps/api/src/routes/wanted.ts
    - apps/api/__tests__/routes/collection.route.test.ts
    - apps/api/__tests__/routes/wanted.route.test.ts
    - apps/api/__mocks__/expo-server-sdk.ts
  modified:
    - packages/shared/src/index.ts
    - apps/api/src/db/schema.ts
    - apps/api/src/server.ts
    - apps/api/__tests__/setup.ts
    - apps/api/jest.config.js

key-decisions:
  - "onConflictDoUpdate for upsert pattern on unique (userId, cardId) index"
  - "crypto.randomUUID for table IDs, consistent with existing services"
  - "expo-server-sdk jest mock to fix pre-existing ESM import issue in test suite"

patterns-established:
  - "Upsert pattern: onConflictDoUpdate with quantity increment for collection adds"
  - "Bulk operations: db.transaction with batched inserts and deletes"
  - "Progress query: LEFT JOIN cards + userCollectionItems grouped by set"

requirements-completed: [INV-01, INV-02, INV-03, INV-04, INV-05, WANT-01, WANT-02, WANT-03]

# Metrics
duration: 7min
completed: 2026-03-09
---

# Phase 03 Plan 01: Collection & Wanted API Summary

**Collection and wanted list CRUD with bulk operations, progress tracking, upsert semantics, and 28 integration tests covering all 8 requirements**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-09T01:49:46Z
- **Completed:** 2026-03-09T01:56:43Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- Full collection CRUD API: add (upsert), remove, update quantity, bulk add/remove, per-set progress
- Full wanted list CRUD API: add with priority, remove, update priority, list with filter
- 28 integration tests passing: 16 collection + 12 wanted, covering auth guards and validation
- All 101 tests across the full API suite pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Shared schemas, DB tables, and service layer** - `fe46fdf` (feat)
2. **Task 2: Collection and wanted API routes with integration tests** - `3bd8b12` (feat)

## Files Created/Modified
- `packages/shared/src/schemas/collection.ts` - Zod schemas for collection and wanted API validation
- `packages/shared/src/index.ts` - Barrel exports for new schemas and types
- `apps/api/src/db/schema.ts` - userCollectionItems and userWantedCards tables with priority enum
- `apps/api/src/services/collection.service.ts` - Collection CRUD + bulk + progress business logic
- `apps/api/src/services/wanted.service.ts` - Wanted list CRUD business logic
- `apps/api/src/routes/collection.ts` - 6 authenticated collection endpoints
- `apps/api/src/routes/wanted.ts` - 4 authenticated wanted endpoints
- `apps/api/src/server.ts` - Route registration for collection and wanted
- `apps/api/__tests__/setup.ts` - Updated test setup with new routes and table truncation
- `apps/api/__tests__/routes/collection.route.test.ts` - 16 collection integration tests
- `apps/api/__tests__/routes/wanted.route.test.ts` - 12 wanted integration tests
- `apps/api/jest.config.js` - Added expo-server-sdk mock mapping
- `apps/api/__mocks__/expo-server-sdk.ts` - Mock for ESM-only expo-server-sdk

## Decisions Made
- Used onConflictDoUpdate for upsert pattern on unique (userId, cardId) composite index
- Used crypto.randomUUID for table IDs, consistent with existing auth service pattern
- Created expo-server-sdk jest mock to fix pre-existing ESM import issue blocking all route tests

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed expo-server-sdk ESM import breaking all tests**
- **Found during:** Task 2 (running integration tests)
- **Issue:** expo-server-sdk uses ESM `import` syntax which jest/ts-jest cannot transform, preventing all route tests from running (pre-existing issue)
- **Fix:** Created `__mocks__/expo-server-sdk.ts` mock and configured jest `moduleNameMapper`
- **Files modified:** `apps/api/jest.config.js`, `apps/api/__mocks__/expo-server-sdk.ts`
- **Verification:** All 101 tests pass including existing test suites
- **Committed in:** 3bd8b12 (Task 2 commit)

**2. [Rule 3 - Blocking] Pushed DB schema to test database**
- **Found during:** Task 2 (running integration tests)
- **Issue:** New tables (user_collection_items, user_wanted_cards) did not exist in test database
- **Fix:** Ran `drizzle-kit push` against test database URL
- **Files modified:** None (database-only change)
- **Verification:** All tests pass with proper table access

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both auto-fixes necessary to run tests. No scope creep.

## Issues Encountered
None beyond the auto-fixed blocking issues above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Collection and wanted APIs ready for mobile UI consumption (plans 02 and 03)
- All 8 requirements (INV-01 through INV-05, WANT-01 through WANT-03) verified with integration tests

## Self-Check: PASSED

- All 9 key files verified present on disk
- Commits fe46fdf and 3bd8b12 verified in git log
- All 101 tests pass across full API suite

---
*Phase: 03-collection-management*
*Completed: 2026-03-09*
