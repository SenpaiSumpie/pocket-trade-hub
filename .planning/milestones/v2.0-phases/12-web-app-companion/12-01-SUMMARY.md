---
phase: 12-web-app-companion
plan: 01
subsystem: auth
tags: [cookie, jwt, fastify, cors, vitest, jsdom]

# Dependency graph
requires:
  - phase: 07-multi-language-oauth
    provides: JWT auth with Bearer tokens, OAuth routes
provides:
  - Dual auth (cookie + Bearer) for API
  - HTTP-only cookie setting on login/signup/refresh
  - CORS credentials support
  - Web app test infrastructure (vitest + jsdom)
  - Cookie auth integration tests
affects: [12-02, 12-03, 12-04, 12-05, 12-06, 12-07]

# Tech tracking
tech-stack:
  added: ["@fastify/cookie", "vitest", "@vitejs/plugin-react", "jsdom"]
  patterns: ["cookie fallback auth in authenticate decorator", "setAuthCookies helper for consistent cookie setting"]

key-files:
  created:
    - apps/api/__tests__/auth-cookie.test.ts
    - apps/web/package.json
    - apps/web/vitest.config.ts
    - apps/web/__tests__/middleware.test.ts
    - apps/web/__tests__/lib/api.test.ts
  modified:
    - apps/api/src/plugins/auth.ts
    - apps/api/src/routes/auth.ts
    - apps/api/src/server.ts
    - apps/api/package.json
    - apps/api/__tests__/setup.ts

key-decisions:
  - "Cookie fallback auth: try Bearer header first, then cookies -- mobile backward compat preserved"
  - "Always set cookies on auth responses (harmless for mobile, required for web)"
  - "Refresh token read from body OR cookie, supporting both mobile and web clients"
  - "Test files placed in apps/api/__tests__/ matching existing project convention (not src/__tests__/)"

patterns-established:
  - "setAuthCookies helper: centralized cookie setting with env-aware secure/sameSite options"
  - "parseCookies test helper: extract cookies from set-cookie response headers"

requirements-completed: [PLAT-01]

# Metrics
duration: 8min
completed: 2026-03-20
---

# Phase 12 Plan 01: API Cookie Auth and Web Test Infrastructure Summary

**Dual cookie+Bearer JWT auth for Fastify API with @fastify/cookie, CORS credentials, and vitest scaffold for web app**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-20T22:53:36Z
- **Completed:** 2026-03-20T23:02:00Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- API auth plugin accepts JWT from both cookies and Bearer headers (mobile backward compat preserved)
- Auth routes set HTTP-only cookies on login/signup/refresh and clear on logout
- CORS updated with credentials: true and dynamic origin callback
- Vitest configured and runnable in apps/web with jsdom environment
- 5 passing cookie auth integration tests in apps/api
- 6 todo test stubs registered for middleware and apiFetch in apps/web

## Task Commits

Each task was committed atomically:

1. **Task 1: API cookie auth and CORS updates** - `b9c0958` (feat)
2. **Task 2: Wave 0 test infrastructure for web app and cookie auth** - `bf22e0a` (feat)

## Files Created/Modified
- `apps/api/src/plugins/auth.ts` - Dual auth decorator: Bearer header + cookie fallback
- `apps/api/src/routes/auth.ts` - setAuthCookies on login/signup/refresh, clearCookie on logout
- `apps/api/src/server.ts` - Register @fastify/cookie, CORS credentials
- `apps/api/package.json` - Added @fastify/cookie dependency
- `apps/api/__tests__/setup.ts` - Cookie plugin + dual auth in test setup
- `apps/api/__tests__/auth-cookie.test.ts` - 5 cookie auth integration tests
- `apps/web/package.json` - New web app package with vitest
- `apps/web/vitest.config.ts` - Vitest config with jsdom environment
- `apps/web/__tests__/middleware.test.ts` - 3 todo stubs for auth middleware
- `apps/web/__tests__/lib/api.test.ts` - 3 todo stubs for apiFetch wrapper

## Decisions Made
- Cookie fallback auth: try Bearer header first, then cookies -- mobile backward compat preserved
- Always set cookies on auth responses (harmless for mobile, required for web)
- Refresh token read from body OR cookie, supporting both mobile and web clients
- Test files placed in apps/api/__tests__/ matching existing project convention (not src/__tests__/)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated test setup.ts for cookie support**
- **Found during:** Task 1 (API cookie auth and CORS updates)
- **Issue:** Test setup builds its own Fastify instance without @fastify/cookie, so cookie auth tests would fail
- **Fix:** Registered @fastify/cookie and updated authenticate decorator in setup.ts to match production auth plugin
- **Files modified:** apps/api/__tests__/setup.ts
- **Verification:** All existing auth tests pass, new cookie auth tests pass
- **Committed in:** b9c0958 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential for test correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Cookie auth foundation ready for web app session management
- Vitest infrastructure ready for Next.js component and middleware testing
- Plan 02 can proceed with Next.js project setup and auth pages

---
*Phase: 12-web-app-companion*
*Completed: 2026-03-20*
