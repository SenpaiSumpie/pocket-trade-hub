---
phase: 02-card-database
plan: 02
subsystem: api, mobile
tags: [push-notifications, expo-server-sdk, expo-notifications, fastify, drizzle]

# Dependency graph
requires:
  - phase: 02-card-database
    plan: 01
    provides: Fastify API server with card/set tables, admin import endpoint, JWT auth
provides:
  - Push token storage in PostgreSQL (pushTokens table)
  - Notification service with Expo Push SDK integration (registerPushToken, sendNewSetNotification)
  - POST /notifications/register-token endpoint (auth required)
  - Admin import triggers push notification to all registered users
  - Mobile push notification registration hook (useNotificationSetup)
affects: [mobile-engagement, admin-import-flow]

# Tech tracking
tech-stack:
  added: [expo-server-sdk, expo-notifications, expo-device]
  patterns: [upsert-by-delete-insert, expo-push-chunking, stale-token-cleanup, silent-fail-non-critical]

key-files:
  created:
    - apps/api/src/services/notification.service.ts
    - apps/api/src/routes/notifications.ts
    - apps/api/__tests__/services/notification.service.test.ts
    - apps/mobile/src/hooks/useNotifications.ts
  modified:
    - apps/api/src/db/schema.ts
    - apps/api/src/routes/admin.ts
    - apps/api/src/server.ts
    - apps/api/__tests__/setup.ts
    - apps/api/package.json
    - apps/mobile/app/_layout.tsx
    - apps/mobile/package.json

key-decisions:
  - "Upsert push token by deleting old token for userId then inserting new one"
  - "Stale tokens cleaned up automatically on DeviceNotRegistered error from Expo Push"
  - "Push notification registration fails silently since it is non-critical"

patterns-established:
  - "Expo Push SDK chunk pattern: chunkPushNotifications + sendPushNotificationsAsync"
  - "Non-critical hook pattern: useEffect with catch(() => {}) for silent failure"

requirements-completed: [CARD-05]

# Metrics
duration: 4min
completed: 2026-03-08
---

# Phase 2 Plan 02: Push Notification Infrastructure Summary

**Push token storage with Expo Push SDK integration, token registration endpoint, admin import notification wiring, and mobile push permission/registration hook**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-08T04:27:57Z
- **Completed:** 2026-03-08T04:32:14Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Added pushTokens table to PostgreSQL schema with userId FK and unique token constraint
- Created notification service with registerPushToken (upsert pattern) and sendNewSetNotification (Expo Push SDK with chunking and stale token cleanup)
- Built POST /notifications/register-token endpoint with JWT auth and zod validation for token + platform
- Wired sendNewSetNotification into admin card import route so all users get notified on new set imports
- Created registerForPushNotifications function handling device check, permission request, Expo push token retrieval, and backend registration
- Created useNotificationSetup hook that auto-registers on authenticated launch with silent failure
- Configured foreground notification handler in root layout for alert display with sound
- Wrote 7 tests covering token registration, upsert, notification sending, empty token list, stale token cleanup, and invalid token filtering

## Task Commits

Each task was committed atomically:

1. **Task 1: Push token storage, notification service, token registration endpoint, and admin import notification wiring** - `d91a1ad` (feat)
2. **Task 2: Mobile push notification registration hook and app integration** - `5696804` (feat, bundled with 02-03 card components)

## Files Created/Modified
- `apps/api/src/db/schema.ts` - Added pushTokens table with id, userId, token (unique), platform, createdAt
- `apps/api/src/services/notification.service.ts` - registerPushToken (upsert), sendNewSetNotification (Expo Push SDK)
- `apps/api/src/routes/notifications.ts` - POST /notifications/register-token with auth + zod validation
- `apps/api/src/routes/admin.ts` - Added sendNewSetNotification call after successful card import
- `apps/api/src/server.ts` - Registered notificationRoutes
- `apps/api/__tests__/setup.ts` - Added push_tokens to TRUNCATE, registered notification routes
- `apps/api/__tests__/services/notification.service.test.ts` - 7 tests with mocked Expo SDK
- `apps/api/package.json` - Added expo-server-sdk dependency
- `apps/mobile/src/hooks/useNotifications.ts` - registerForPushNotifications + useNotificationSetup hook
- `apps/mobile/app/_layout.tsx` - Integrated useNotificationSetup and foreground notification handler
- `apps/mobile/package.json` - Added expo-notifications, expo-device dependencies

## Decisions Made
- Push token upsert implemented as delete-then-insert (simpler than ON CONFLICT with Drizzle)
- DeviceNotRegistered errors trigger automatic stale token deletion from database
- Push notification registration is non-critical and fails silently to not block app usage
- Foreground notifications configured to show as alerts with sound but no badge

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Task 2 files were already committed by a concurrent 02-03 execution, so no separate commit was needed. The notification hook and layout changes are verified present in commit `5696804`.
- Push token tests require database schema push (`drizzle-kit push`) to run, same as Plan 01 situation.

## User Setup Required

Before running notification tests:
- **PostgreSQL database** must have schema pushed: `cd apps/api && pnpm db:push`
- Push notification testing on mobile requires physical device with EAS development build

## Self-Check: PASSED

- All 11 key files verified present on disk
- Task 1 commit `d91a1ad` verified in git log
- Task 2 commit `5696804` verified in git log

---
*Phase: 02-card-database*
*Completed: 2026-03-08*
