---
phase: 10-internationalization
plan: 03
subsystem: i18n-translations
tags: [i18n, translations, server-i18n, localization, notifications]
dependency_graph:
  requires: [10-01]
  provides: [complete-translations, server-i18n-wiring]
  affects: [api-routes, notification-services, push-notifications]
tech_stack:
  added: []
  patterns: [per-user-language-lookup, accept-language-parsing, t()-calls-in-services]
key_files:
  created:
    - apps/api/src/i18n/locales/de.json
    - apps/api/src/i18n/locales/es.json
    - apps/api/src/i18n/locales/fr.json
    - apps/api/src/i18n/locales/it.json
    - apps/api/src/i18n/locales/ja.json
    - apps/api/src/i18n/locales/ko.json
    - apps/api/src/i18n/locales/pt.json
    - apps/api/src/i18n/locales/zh.json
    - apps/api/src/i18n/locales/th.json
    - apps/mobile/src/i18n/locales/th.json
  modified:
    - apps/api/src/i18n/index.ts
    - apps/api/src/i18n/locales/en.json
    - apps/api/src/server.ts
    - apps/api/src/routes/auth.ts
    - apps/api/src/routes/users.ts
    - apps/api/src/routes/posts.ts
    - apps/api/src/routes/proposals.ts
    - apps/api/src/routes/collection.ts
    - apps/api/src/routes/wanted.ts
    - apps/api/src/routes/promo.ts
    - apps/api/src/routes/premium.ts
    - apps/api/src/services/notification.service.ts
    - apps/api/src/services/match.service.ts
    - apps/api/src/services/post-match.service.ts
    - apps/api/src/services/proposal.service.ts
    - apps/api/src/services/rating.service.ts
    - apps/api/src/services/card-alert.service.ts
    - apps/api/__tests__/setup.ts
    - apps/api/__tests__/services/notification.service.test.ts
    - apps/mobile/src/i18n/index.ts
decisions:
  - Used parseAcceptLanguage for all routes rather than per-request DB lookups
  - Per-user language lookup via users.uiLanguage for notification services
  - Expanded en.json notification keys to cover all service notification types
metrics:
  duration: ~25min
  completed: 2026-03-18
---

# Phase 10 Plan 03: Translation Files and Server i18n Wiring Summary

9 server + 1 mobile translation files created, all API routes and 6 notification services wired with t() calls using per-user language preferences from DB

## What Was Done

### Task 1: Mobile Translation Files (commit 1afa1f4)
- Created Thai (th.json) mobile translation file -- the only missing mobile locale
- Verified 8 existing mobile locale files (de, es, fr, it, ja, ko, pt, zh) matched en.json structure from prior Plan 02 work
- Registered all 9 non-English locales in mobile i18n config

### Task 2: Server Translation Files and i18n Wiring (commit fe8a242)
- Created 9 server translation files (de, es, fr, it, ja, ko, pt, zh, th) with full key structure: errors, notifications (expanded with 15+ new keys), and email templates
- Expanded en.json notification section from 13 to 28+ keys to cover: match notifications (high-priority/normal), proposal lifecycle (received/countered/accepted/rejected/cancelled), trade completion, post auto-close, post-match offering/seeking, rating received, card alerts
- Registered all 9 locales in server i18n config with initServerI18n()
- Added initServerI18n() call to server.ts buildApp() startup
- Wired t() + parseAcceptLanguage into all 8 API route files for error messages
- Wired t() with per-user uiLanguage DB lookup into 6 notification services:
  - notification.service.ts: sendNewSetNotification joins pushTokens with users for per-user language
  - match.service.ts: sendMatchPushNotification queries user uiLanguage
  - post-match.service.ts: processPostMatch batch-fetches user languages
  - proposal.service.ts: createProposal, acceptProposal, rejectProposal, completeProposal, autoCloseAffectedPosts all use per-user language
  - rating.service.ts: rateTradePartner queries rated user's language
  - card-alert.service.ts: processCardAlertBatch batch-fetches user languages
- Added initServerI18n() to test setup for proper i18n initialization
- Updated notification test assertions to match new i18n translation strings

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Test setup missing i18n initialization**
- **Found during:** Task 2 verification
- **Issue:** Tests using t() returned key paths instead of translations because initServerI18n() was never called in test setup
- **Fix:** Added initServerI18n() call to buildTestApp() in __tests__/setup.ts
- **Files modified:** apps/api/__tests__/setup.ts
- **Commit:** fe8a242

**2. [Rule 3 - Blocking] Test assertion mismatch after i18n wiring**
- **Found during:** Task 2 verification
- **Issue:** notification.service.test.ts expected old hardcoded strings ("New Set Available!") instead of i18n translations ("New Set Available")
- **Fix:** Updated test assertions to match new i18n-derived notification text
- **Files modified:** apps/api/__tests__/services/notification.service.test.ts
- **Commit:** fe8a242

**3. [Rule 2 - Missing functionality] Expanded notification translation keys**
- **Found during:** Task 2 service wiring
- **Issue:** Server en.json only had 13 notification keys but services used 28+ distinct notification messages (proposal countered, rejected, cancelled, trade completed, post auto-closed, post-match offering/seeking)
- **Fix:** Added 15+ new notification keys to en.json and all 9 non-English locale files
- **Files modified:** All 10 server locale files
- **Commit:** fe8a242

## Verification Results

- TypeScript check (API): No errors in modified files (pre-existing ioredis type issues in worker files only)
- TypeScript check (Mobile): No errors from i18n changes (pre-existing FlashList/theme issues only)
- API tests: 13/14 proposal tests pass (1 pre-existing FK constraint failure), 7/7 notification tests pass, card-alert and post-match tests pass
- All 10 locale files exist in both mobile and server directories
- All server locale files contain errors, notifications, and emails sections

## Self-Check: PASSED

All created files verified on disk. Both task commits (1afa1f4, fe8a242) verified in git log.
