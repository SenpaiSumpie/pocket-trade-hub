---
phase: 07-multi-language-cards-and-oauth
plan: 02
subsystem: api
tags: [drizzle, postgres, i18n, fastify, multi-language, cards, collection, wanted]

requires:
  - phase: 07-01
    provides: "cardTranslations table, language columns on collection/wanted, shared Zod schemas with language fields"
provides:
  - "Language-aware card search via cardTranslations JOIN"
  - "GET /cards/:id/translations endpoint returning all translations"
  - "getCardById with optional language parameter and English fallback"
  - "Language parameter on collection add/remove/update operations"
  - "Language parameter on wanted add/remove/update operations"
  - "3-column composite key (userId, cardId, language) for collection/wanted operations"
affects: [07-04, 08-post-based-trading]

tech-stack:
  added: []
  patterns: ["INNER JOIN cardTranslations for language-filtered search", "English fallback when translation missing", "language in composite conflict target for upsert"]

key-files:
  created:
    - "apps/api/__tests__/services/card-translation.service.test.ts"
  modified:
    - "apps/api/src/services/card.service.ts"
    - "apps/api/src/routes/cards.ts"
    - "apps/api/src/routes/collection.ts"
    - "apps/api/src/routes/wanted.ts"
    - "apps/api/src/services/collection.service.ts"
    - "apps/api/src/services/wanted.service.ts"
    - "apps/api/__tests__/routes/cards.route.test.ts"
    - "apps/api/__tests__/routes/collection.route.test.ts"
    - "apps/api/__tests__/setup.ts"

key-decisions:
  - "searchCards with language uses INNER JOIN (only returns cards with translations in that language)"
  - "getCardById falls back to English base card when no translation exists for requested language"
  - "Collection progress remains language-agnostic (counts distinct cardId regardless of language)"

patterns-established:
  - "Language-filtered search: INNER JOIN cardTranslations with language condition, select translated name/imageUrl"
  - "Language fallback: try JOIN first, fall back to base card if no translation row"
  - "Language on DELETE/PUT routes: passed as query param with default 'en'"

requirements-completed: [CARD-02, CARD-03, CARD-04]

duration: 9min
completed: 2026-03-13
---

# Phase 7 Plan 2: Card API Language Support Summary

**Language-aware card search with translation JOINs, card translations endpoint, and language-tracked collection/wanted API operations**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-13T03:06:02Z
- **Completed:** 2026-03-13T03:15:07Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- searchCards with language parameter returns translated card names and images via cardTranslations JOIN
- New GET /cards/:id/translations endpoint returns all available translations for a card
- Collection and wanted endpoints accept language parameter, creating separate entries per language
- All backward-compatible: omitting language defaults to 'en'

## Task Commits

Each task was committed atomically:

1. **Task 1: Add language-aware card search and translation queries (TDD)** - `3d15efd` (test), `821abcd` (feat), `e8d1bd0` (fix)
2. **Task 2: Update card and collection routes for language support** - `2e5f5c7` (feat)

_TDD task had separate red/green/fix commits_

## Files Created/Modified
- `apps/api/src/services/card.service.ts` - Added language JOIN on searchCards, getCardTranslations, getCardById with language
- `apps/api/src/routes/cards.ts` - Added /cards/:id/translations route, language on search and detail
- `apps/api/src/routes/collection.ts` - Language param on POST/PUT/DELETE collection
- `apps/api/src/routes/wanted.ts` - Language param on POST/PUT/DELETE wanted
- `apps/api/src/services/collection.service.ts` - Language in add/remove/update, 3-column conflict target
- `apps/api/src/services/wanted.service.ts` - Language in add/remove/update, 3-column conflict target
- `apps/api/__tests__/services/card-translation.service.test.ts` - 9 tests for translation queries
- `apps/api/__tests__/routes/cards.route.test.ts` - Tests for language search and translations endpoint
- `apps/api/__tests__/routes/collection.route.test.ts` - Tests for multi-language collection entries
- `apps/api/__tests__/setup.ts` - Added card_translations/oauth_accounts to truncate, removed oauth route (jose ESM)

## Decisions Made
- searchCards with language uses INNER JOIN (only cards with translations in that language are returned, not all cards with null translations)
- getCardById falls back to English base card when the requested translation doesn't exist
- Collection progress tracking remains language-agnostic (set completion doesn't care about language)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed oauth route from test setup**
- **Found during:** Task 1 (GREEN phase)
- **Issue:** Linter auto-added oauth route import to setup.ts; jose library is ESM-only and incompatible with ts-jest
- **Fix:** Removed import and registration, added comments to prevent re-addition
- **Files modified:** apps/api/__tests__/setup.ts
- **Verification:** All tests pass without jose import errors
- **Committed in:** e8d1bd0

**2. [Rule 3 - Blocking] Added card_translations and oauth_accounts to cleanDb truncate**
- **Found during:** Task 1 (GREEN phase)
- **Issue:** New tables from Plan 01 not in test cleanup, causing relation not found errors
- **Fix:** Added both tables to TRUNCATE statement in setup.ts
- **Files modified:** apps/api/__tests__/setup.ts
- **Verification:** Tests run cleanly with proper table cleanup
- **Committed in:** 821abcd

**3. [Rule 3 - Blocking] Pushed schema to test database**
- **Found during:** Task 1 (GREEN phase)
- **Issue:** card_translations table didn't exist in test DB (Plan 01 schema not pushed to test)
- **Fix:** Ran drizzle-kit push against test database
- **Files modified:** None (database-only change)
- **Verification:** Tests connect and query successfully
- **Committed in:** N/A (database operation)

---

**Total deviations:** 3 auto-fixed (3 blocking)
**Impact on plan:** All fixes necessary for test infrastructure to work with Plan 01's new tables. No scope creep.

## Issues Encountered
- Pre-existing proposal/rating test failures due to FK constraints (card IDs not in cards table) -- documented in STATE.md, not related to this plan
- Pre-existing ioredis type mismatches in worker files -- documented in 07-01-SUMMARY.md, not related to this plan

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Card API fully language-aware, ready for mobile UI consumption (Plan 04)
- Collection/wanted APIs accept language, ready for language selection UI
- Plan 03 (OAuth API) can proceed independently

## Self-Check: PASSED

All 10 files verified present. All 4 commits verified in git log.

---
*Phase: 07-multi-language-cards-and-oauth*
*Completed: 2026-03-13*
