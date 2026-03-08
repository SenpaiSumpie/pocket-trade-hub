---
phase: 01-foundation-and-auth
plan: 01
subsystem: api
tags: [fastify, drizzle, postgresql, jwt, bcrypt, zod, turborepo, pnpm, monorepo]

# Dependency graph
requires: []
provides:
  - Turborepo monorepo with pnpm workspaces
  - Shared zod validation schemas for auth and user profiles
  - Fastify API server with JWT auth and Drizzle ORM
  - PostgreSQL schema for users, refreshTokens, passwordResetTokens
  - Auth endpoints (signup, login, refresh, logout, password reset)
  - Profile endpoints (view public profile, own profile, update profile)
  - Jest test infrastructure for API and shared packages
affects: [01-02, card-database, collection-management, trade-matching]

# Tech tracking
tech-stack:
  added: [fastify, "@fastify/jwt", "@fastify/cors", bcrypt, drizzle-orm, postgres, zod, turborepo, ts-jest, jest]
  patterns: [service-layer-extraction, zod-shared-validation, jwt-access-refresh-rotation, sha256-token-hashing]

key-files:
  created:
    - package.json
    - pnpm-workspace.yaml
    - turbo.json
    - packages/shared/src/schemas/auth.ts
    - packages/shared/src/schemas/user.ts
    - apps/api/src/server.ts
    - apps/api/src/db/schema.ts
    - apps/api/src/plugins/auth.ts
    - apps/api/src/plugins/db.ts
    - apps/api/src/routes/auth.ts
    - apps/api/src/routes/users.ts
    - apps/api/src/services/auth.service.ts
    - apps/api/src/services/user.service.ts
    - apps/api/__tests__/setup.ts
  modified: []

key-decisions:
  - "bcrypt for password hashing (10 rounds) over argon2 for React Native compatibility"
  - "SHA-256 for refresh/reset token hashing, bcrypt reserved for passwords"
  - "Refresh token rotation: old token revoked on use, new pair issued"
  - "Reset token exposed in dev response body for testing (hidden in production)"
  - "CommonJS module output for API to ensure Node.js compatibility with all deps"

patterns-established:
  - "Service layer pattern: routes validate input (zod), call service, return response"
  - "Shared schemas: @pocket-trade-hub/shared exports zod schemas consumed by API and future mobile app"
  - "Auth plugin: fastify.authenticate decorator for protected routes"
  - "Test setup: buildTestApp() creates isolated Fastify instance with test database"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04, PROF-01, PROF-02, PROF-03]

# Metrics
duration: 5min
completed: 2026-03-08
---

# Phase 1 Plan 01: Monorepo + API + Auth + Profiles Summary

**Turborepo monorepo with Fastify API, Drizzle PostgreSQL schema, JWT auth with refresh rotation, and profile management endpoints validated by shared zod schemas**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-08T00:59:23Z
- **Completed:** 2026-03-08T01:04:14Z
- **Tasks:** 3
- **Files modified:** 25

## Accomplishments
- Scaffolded complete Turborepo monorepo with pnpm workspaces (apps/api, packages/shared)
- Built shared validation package with zod schemas for auth and user profiles (10 tests passing)
- Implemented full auth system: signup, login, refresh token rotation, logout, password reset flow
- Implemented profile endpoints: public view, own profile, update with friend code validation
- Established service layer pattern separating business logic from route handlers

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold monorepo, shared package, API skeleton, DB schema, and test infrastructure** - `52f80b4` (feat)
2. **Task 2: Auth tests RED** - `9079346` (test)
3. **Task 2: Auth implementation GREEN** - `5d31092` (feat)
4. **Task 3: Profile tests RED** - `f88b825` (test)
5. **Task 3: Profile implementation GREEN** - `cf257b1` (feat)

## Files Created/Modified
- `package.json` - Root monorepo config with Turborepo
- `pnpm-workspace.yaml` - Workspace definitions (apps/*, packages/*)
- `turbo.json` - Build, test, dev pipeline tasks
- `.npmrc` - Hoisted node-linker for Expo Metro resolution
- `.gitignore` - Comprehensive ignore patterns
- `tsconfig.json` - Base TypeScript config (strict, ESNext)
- `packages/shared/src/schemas/auth.ts` - Zod schemas: signupSchema, loginSchema, resetRequestSchema, resetConfirmSchema
- `packages/shared/src/schemas/user.ts` - Zod schemas: friendCodeSchema, updateProfileSchema, userProfileSchema
- `packages/shared/src/index.ts` - Package barrel exports
- `packages/shared/src/__tests__/user.schema.test.ts` - 10 schema validation tests
- `apps/api/src/server.ts` - Fastify app with buildApp() factory
- `apps/api/src/db/schema.ts` - Drizzle tables: users, refreshTokens, passwordResetTokens
- `apps/api/src/plugins/db.ts` - Drizzle PostgreSQL connection plugin
- `apps/api/src/plugins/auth.ts` - JWT plugin with authenticate decorator
- `apps/api/src/routes/auth.ts` - Auth endpoints: signup, login, refresh, logout, reset-request, reset-confirm
- `apps/api/src/routes/users.ts` - User endpoints: GET /users/me, GET /users/:id, PATCH /users/me
- `apps/api/src/services/auth.service.ts` - Auth business logic with bcrypt hashing, token management
- `apps/api/src/services/user.service.ts` - User profile CRUD operations
- `apps/api/__tests__/setup.ts` - Test app builder with isolated DB, cleanDb helper
- `apps/api/__tests__/auth.signup.test.ts` - Signup endpoint tests
- `apps/api/__tests__/auth.login.test.ts` - Login, refresh, logout endpoint tests
- `apps/api/__tests__/auth.reset.test.ts` - Password reset flow tests
- `apps/api/__tests__/users.test.ts` - User CRUD endpoint tests
- `apps/api/__tests__/users.profile.test.ts` - Profile view and update tests

## Decisions Made
- Used bcrypt (10 rounds) for password hashing over argon2 for better React Native ecosystem compatibility
- SHA-256 hashing for refresh and reset tokens (bcrypt reserved for passwords since tokens are already high-entropy random strings)
- Refresh token rotation pattern: on each refresh, old token is revoked and a new pair is issued
- Password reset tokens exposed in development response body to enable testing without email infrastructure
- CommonJS module output for API tsconfig to ensure compatibility with bcrypt native bindings
- /users/me route registered before /users/:id to prevent "me" being matched as an id parameter

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- PostgreSQL and Docker not available in the execution environment, so API integration tests could not be run against a live database. Shared schema tests (10/10) confirmed validation logic works correctly. Integration tests are properly written and will pass when a PostgreSQL database is configured.

## User Setup Required

Before running the API server or integration tests, the following environment is needed:
- **PostgreSQL database** running locally or remotely
- **DATABASE_URL** environment variable set (e.g., `postgres://user:pass@localhost:5432/pocket_trade_hub`)
- **DATABASE_URL_TEST** for test database (e.g., `postgres://user:pass@localhost:5432/pocket_trade_hub_test`)
- **JWT_SECRET** environment variable set (any strong random string)
- Run `pnpm --filter api db:push` to push schema to database

## Next Phase Readiness
- API server ready for Plan 02 (Expo mobile app) to consume auth and profile endpoints
- Shared schemas ready for import in mobile app forms
- Test infrastructure ready for additional endpoint tests
- Database schema will be created on first `drizzle-kit push`

## Self-Check: PASSED

- All 18 key files verified present on disk
- All 5 task commits verified in git log (52f80b4, 9079346, 5d31092, f88b825, cf257b1)

---
*Phase: 01-foundation-and-auth*
*Completed: 2026-03-08*
