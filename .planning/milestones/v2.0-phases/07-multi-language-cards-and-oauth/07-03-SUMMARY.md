---
phase: 07-multi-language-cards-and-oauth
plan: 03
subsystem: auth
tags: [oauth, google-auth, apple-sign-in, jose, jwt, fastify, account-linking]

requires:
  - phase: 07-01
    provides: "oauthAccounts table, nullable passwordHash, shared Zod schemas for OAuth"
provides:
  - "Google OAuth token verification via google-auth-library"
  - "Apple Sign-In token verification via jose JWKS"
  - "findOrCreateOAuthUser handling 3 cases: existing OAuth, needs_linking, new user"
  - "linkOAuthAccount with password verification before provider linking"
  - "POST /auth/oauth/google and POST /auth/oauth/apple endpoints"
  - "POST /auth/link authenticated endpoint for account linking"
affects: [07-05, 08-post-based-trading]

tech-stack:
  added: [google-auth-library, jose]
  patterns: ["OAuth token verification with mocked providers in tests", "Per-test route registration for ESM-only dependencies", "needs_linking response pattern for email collision"]

key-files:
  created:
    - "apps/api/src/services/oauth.service.ts"
    - "apps/api/src/routes/oauth.ts"
    - "apps/api/__tests__/auth.oauth.test.ts"
    - "apps/api/__tests__/auth.link.test.ts"
  modified:
    - "apps/api/src/server.ts"
    - "apps/api/__tests__/setup.ts"
    - "apps/api/package.json"

key-decisions:
  - "jose ESM-only: OAuth routes registered per-test-file with mocks instead of shared test setup"
  - "OAuth-only users get null passwordHash; verifyCredentials rejects them gracefully"
  - "needs_linking returns 200 (not error) with { needsLinking: true, email, provider } body"

patterns-established:
  - "Per-test route registration pattern for modules with ESM-only dependencies"
  - "Mocking google-auth-library OAuth2Client.verifyIdToken via jest.fn wrapper"
  - "Mocking jose jwtVerify/createRemoteJWKSet via jest.fn wrapper"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04]

duration: 7min
completed: 2026-03-13
---

# Phase 7 Plan 3: OAuth API Summary

**Google and Apple OAuth server-side token verification with needs_linking detection and password-verified account linking**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-13T03:06:00Z
- **Completed:** 2026-03-13T03:13:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- OAuth service verifies Google tokens via google-auth-library and Apple tokens via jose JWKS
- findOrCreateOAuthUser handles 3 cases: existing OAuth account, email collision (needs_linking), and new user creation
- linkOAuthAccount verifies password before linking OAuth provider to existing email/password account
- 11 integration tests covering all OAuth and linking flows with mocked token verification

## Task Commits

Each task was committed atomically:

1. **Task 1: OAuth service + tests (TDD RED)** - `439e30c` (test)
2. **Task 1: OAuth service + routes + tests (TDD GREEN)** - `3d1cb53` (feat)
3. **Task 2: ESM compatibility fix for test setup** - `ef25e79` (fix)

## Files Created/Modified
- `apps/api/src/services/oauth.service.ts` - Google/Apple token verification, findOrCreateOAuthUser, linkOAuthAccount
- `apps/api/src/routes/oauth.ts` - POST /auth/oauth/google, /auth/oauth/apple, /auth/link endpoints
- `apps/api/src/server.ts` - Registered oauthRoutes alongside existing routes
- `apps/api/__tests__/auth.oauth.test.ts` - 7 tests for Google/Apple OAuth login flows
- `apps/api/__tests__/auth.link.test.ts` - 4 tests for account linking with password verification
- `apps/api/__tests__/setup.ts` - Comment noting OAuth route exclusion for jose ESM compatibility
- `apps/api/package.json` - Added google-auth-library and jose dependencies

## Decisions Made
- jose is ESM-only and incompatible with ts-jest CommonJS transform. Resolved by registering OAuth routes per-test-file after jest.mock hoisting, rather than in shared setup.ts.
- needs_linking response uses HTTP 200 (not 409 or error) to signal the frontend should prompt for password linking rather than showing an error.
- OAuth-only users have null passwordHash; verifyCredentials already guards against this (added in Plan 01 deviation).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] jose ESM incompatibility with shared test setup**
- **Found during:** Task 1 (test creation)
- **Issue:** jose is ESM-only; importing oauth.service.ts in shared setup.ts breaks all non-mocked test suites
- **Fix:** Excluded oauthRoutes from shared setup.ts; OAuth tests register routes themselves after jest.mock hoisting
- **Files modified:** apps/api/__tests__/setup.ts, apps/api/__tests__/auth.oauth.test.ts, apps/api/__tests__/auth.link.test.ts
- **Verification:** All 11 OAuth tests pass; other test suites unaffected
- **Committed in:** ef25e79

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minimal architectural adjustment for ESM/CJS compatibility. Pattern documented for future OAuth-dependent tests.

## Issues Encountered
- Pre-existing ioredis type mismatches in worker files (analytics-worker, card-alert-worker) -- not related to this plan
- Pre-existing FK constraint failures in proposal/rating tests -- documented in STATE.md

## User Setup Required

**External services require manual configuration for production use:**
- **GOOGLE_CLIENT_ID**: Google Cloud Console -> APIs & Services -> Credentials -> OAuth 2.0 Client IDs
- **APPLE_BUNDLE_ID**: Apple Developer Portal -> Certificates, Identifiers & Profiles -> App ID

Tests use mocked token verification and do not require these env vars.

## Next Phase Readiness
- OAuth API complete for Plan 05 (mobile OAuth buttons) to consume
- Three endpoints ready: POST /auth/oauth/google, POST /auth/oauth/apple, POST /auth/link
- needs_linking response format defined for frontend handling

---
*Phase: 07-multi-language-cards-and-oauth*
*Completed: 2026-03-13*
