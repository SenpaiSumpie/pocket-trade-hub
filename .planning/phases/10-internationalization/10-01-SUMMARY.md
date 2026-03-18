---
phase: 10-internationalization
plan: 01
subsystem: i18n
tags: [i18next, expo-localization, zustand, react-i18next, intl-pluralrules, drizzle]

# Dependency graph
requires:
  - phase: 07-multi-language-cards
    provides: card language constants and preferredCardLanguage column
provides:
  - Shared UI language constants (10 languages with native names)
  - Mobile i18n initialization with device locale detection
  - Complete English translation files (mobile 314+ keys, server errors/notifications/emails)
  - Zustand language store with optimistic update and server sync
  - Server-side i18n t() function for translated API responses
  - uiLanguage column on users table with profile API support
  - Wave 0 test scaffolds for i18n and uiLanguage profile operations
affects: [10-02-PLAN, 10-03-PLAN, ui-components, api-routes]

# Tech tracking
tech-stack:
  added: [i18next, react-i18next, expo-localization, intl-pluralrules]
  patterns: [i18next with compatibilityJSON v4 for React Native, device locale detection via expo-localization, optimistic language switching with server sync]

key-files:
  created:
    - packages/shared/src/schemas/i18n.ts
    - apps/mobile/src/i18n/index.ts
    - apps/mobile/src/i18n/locales/en.json
    - apps/mobile/src/stores/language.ts
    - apps/api/src/i18n/index.ts
    - apps/api/src/i18n/locales/en.json
    - apps/api/__tests__/services/i18n.test.ts
  modified:
    - packages/shared/src/schemas/user.ts
    - packages/shared/src/index.ts
    - apps/api/src/db/schema.ts
    - apps/api/src/services/user.service.ts
    - apps/api/__tests__/users.profile.test.ts

key-decisions:
  - "10 UI languages (adds Thai to the 9 card languages) for broader audience reach"
  - "compatibilityJSON v4 for React Native pluralization support"
  - "Optimistic language switching: UI changes immediately, server sync in background"
  - "Email template translation keys included per CONTEXT.md locked decision"

patterns-established:
  - "i18n key organization: nested by screen/feature (common, tabs, auth, home, cards, etc.)"
  - "Server i18n: t(key, lng, options) function with i18next instance"
  - "Language store pattern: initLanguage on auth, setLanguage with optimistic update"

requirements-completed: [PLAT-03, PLAT-04]

# Metrics
duration: 9min
completed: 2026-03-17
---

# Phase 10 Plan 01: i18n Infrastructure Summary

**i18next initialization on mobile and API with complete English translations (314+ keys), Zustand language store, uiLanguage DB column, and Wave 0 tests**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-18T00:46:53Z
- **Completed:** 2026-03-18T00:55:38Z
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments
- Shared i18n constants with 10 UI languages and native names, Zod validation schema
- Complete mobile en.json with 16 sections and 314+ translation keys extracted from all screens
- Server en.json with errors, notifications, and email template translations
- Mobile i18n init with expo-localization device detection and intl-pluralrules polyfill
- Server-side t() function ready for Plan 03 to wire into routes/services
- Zustand language store with initLanguage and setLanguage (optimistic update + server sync)
- uiLanguage column added to users table, exposed in GET/PATCH /users/me
- 13 passing tests (8 profile including 3 new uiLanguage tests, 5 i18n tests) plus 2 todo

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies, shared constants, DB migration, profile schema, Wave 0 tests** - `3aba99a` (feat)
2. **Task 2: Create i18n initialization, en.json translations, Zustand language store** - `4e7e42c` (feat)

## Files Created/Modified
- `packages/shared/src/schemas/i18n.ts` - UI language constants, types, native names, Zod schema
- `packages/shared/src/schemas/user.ts` - Added uiLanguage to updateProfileSchema
- `packages/shared/src/index.ts` - Re-exports for i18n module
- `apps/api/src/db/schema.ts` - uiLanguage column on users table
- `apps/api/src/services/user.service.ts` - uiLanguage in getOwnProfile and updateProfile
- `apps/api/src/i18n/index.ts` - Server-side i18n with t() and initServerI18n()
- `apps/api/src/i18n/locales/en.json` - Server English translations (errors, notifications, emails)
- `apps/api/__tests__/services/i18n.test.ts` - Wave 0 i18n test scaffold
- `apps/api/__tests__/users.profile.test.ts` - uiLanguage PATCH/GET test cases
- `apps/mobile/src/i18n/index.ts` - i18next init with expo-localization and intl-pluralrules
- `apps/mobile/src/i18n/locales/en.json` - Complete mobile English translations (314+ keys)
- `apps/mobile/src/stores/language.ts` - Zustand language store with server sync

## Decisions Made
- 10 UI languages (en, de, es, fr, it, ja, ko, pt, zh, th) -- adds Thai beyond the 9 card languages
- compatibilityJSON v4 set for React Native pluralization support
- Optimistic language switching: change UI immediately, sync to server in background
- Email template translation keys included per CONTEXT.md locked decision
- Test DB required separate schema push (drizzle-kit push against test database URL)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Test database schema out of sync**
- **Found during:** Task 1 (running profile tests)
- **Issue:** drizzle-kit push only applied to dev database; test database lacked ui_language column, causing all authenticated tests to return 401
- **Fix:** Ran drizzle-kit push with test database URL
- **Files modified:** None (database migration only)
- **Verification:** All 8 profile tests pass after migration
- **Committed in:** 3aba99a (part of Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential fix for test database sync. No scope creep.

## Issues Encountered
None beyond the test database migration issue documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 02 can wire useTranslation() into all mobile screens using the en.json keys
- Plan 03 can wire t() into API routes/services and add non-English translation files
- Language store ready for Plan 02 to add language picker UI in profile screen

## Self-Check: PASSED

All 7 created files verified on disk. Both task commits (3aba99a, 4e7e42c) verified in git history.

---
*Phase: 10-internationalization*
*Completed: 2026-03-17*
