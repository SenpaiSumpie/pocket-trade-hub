---
phase: 07-multi-language-cards-and-oauth
plan: 01
subsystem: database
tags: [drizzle, postgres, zod, i18n, oauth, tcgdex, multi-language]

requires:
  - phase: v1.0
    provides: "Existing Drizzle schema with users, cards, collections, wanted tables"
provides:
  - "cardTranslations table for multi-language card data"
  - "oauthAccounts table for Google/Apple sign-in"
  - "Language columns on userCollectionItems and userWantedCards"
  - "Nullable passwordHash on users for OAuth-only accounts"
  - "Shared Zod schemas for language-aware cards, collections, and OAuth"
  - "Translation seed script for 6 TCGdex languages"
affects: [07-02, 07-03, 07-04, 07-05, 08-post-based-trading]

tech-stack:
  added: []
  patterns: ["per-card language tracking in collections", "translation table pattern for localized content", "OAuth accounts table linked to users"]

key-files:
  created:
    - "apps/api/src/db/seeds/seed-translations.ts"
  modified:
    - "apps/api/src/db/schema.ts"
    - "packages/shared/src/schemas/card.ts"
    - "packages/shared/src/schemas/collection.ts"
    - "packages/shared/src/schemas/auth.ts"
    - "packages/shared/src/index.ts"
    - "apps/api/package.json"
    - "apps/api/src/services/auth.service.ts"

key-decisions:
  - "9 languages defined in schema (en,de,es,fr,it,ja,ko,pt,zh) but only 6 currently seedable from TCGdex"
  - "Translation ID format: {cardId}-{lang} for deterministic IDs"
  - "OAuth accounts table supports Google and Apple providers"

patterns-established:
  - "cardLanguageValues shared constant used by both Drizzle schema and Zod schemas"
  - "Language column with default 'en' on collection/wanted tables for backward compatibility"
  - "Composite unique index pattern: (userId, cardId, language) for language-aware collections"

requirements-completed: [CARD-01]

duration: 4min
completed: 2026-03-13
---

# Phase 7 Plan 1: Schema Foundation Summary

**Drizzle schema with cardTranslations and oauthAccounts tables, language-aware collection indexes, and shared Zod schemas for i18n cards and OAuth**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-13T02:58:48Z
- **Completed:** 2026-03-13T03:03:00Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- cardTranslations table with (cardId, language) unique index and name search index
- oauthAccounts table with (provider, providerUserId) unique constraint
- users.passwordHash made nullable, preferredCardLanguage added with 'en' default
- userCollectionItems and userWantedCards now have language column with 3-column unique indexes
- Shared Zod schemas export cardLanguageValues, cardTranslationSchema, oauthLoginSchema, linkAccountSchema
- Translation seed script fetches from TCGdex for 6 languages with upsert support

## Task Commits

Each task was committed atomically:

1. **Task 1: Add DB schema tables and alter existing tables** - `bdbb66e` (feat)
2. **Task 2: Update shared Zod schemas with language and OAuth types** - `a003438` (feat)
3. **Task 3: Create multi-language card translation seed script** - `702b844` (feat)

## Files Created/Modified
- `apps/api/src/db/schema.ts` - Added supportedLanguages, cardTranslations, oauthAccounts tables; altered users, collection, wanted
- `packages/shared/src/schemas/card.ts` - Added cardLanguageValues, cardTranslationSchema, language on search
- `packages/shared/src/schemas/collection.ts` - Added language field to collection and wanted schemas
- `packages/shared/src/schemas/auth.ts` - Added oauthLoginSchema, linkAccountSchema
- `packages/shared/src/index.ts` - Re-exported all new schemas and types
- `apps/api/src/db/seeds/seed-translations.ts` - New multi-language seed script
- `apps/api/package.json` - Added seed:translations npm script
- `apps/api/src/services/auth.service.ts` - Added null guard for nullable passwordHash

## Decisions Made
- Defined 9 languages in schema constant but only 6 are currently available on TCGdex (ja, ko, zh return 404)
- Used composite ID format `{cardId}-{lang}` for translation records for deterministic, human-readable IDs
- OAuth provider enum limited to 'google' and 'apple' as specified in context decisions

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added null guard for passwordHash in auth.service.ts**
- **Found during:** Task 1 (schema changes)
- **Issue:** Making passwordHash nullable caused TS2345 in bcrypt.compare call
- **Fix:** Added `if (!user.passwordHash) throw new Error('Invalid credentials')` guard
- **Files modified:** apps/api/src/services/auth.service.ts
- **Verification:** TypeScript compiles with zero new errors
- **Committed in:** bdbb66e (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minimal null guard addition required for type safety. No scope creep. Plan explicitly noted this would be handled in Plan 03 but the type error blocked compilation.

## Issues Encountered
- Pre-existing ioredis type mismatches in worker files (analytics-worker, card-alert-worker, match-worker, notification-worker) -- not related to this plan, pre-existing

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Schema foundation complete for all Phase 7 plans
- Plan 02 (card API language support) can build on cardTranslations table
- Plan 03 (OAuth API) can build on oauthAccounts table
- Translation seed script ready to run once base cards are seeded

---
*Phase: 07-multi-language-cards-and-oauth*
*Completed: 2026-03-13*
