---
phase: 12-web-app-companion
plan: 02
subsystem: ui
tags: [nextjs, tailwind, zustand, i18next, socket.io, middleware]

# Dependency graph
requires:
  - phase: 12-web-app-companion
    provides: Cookie auth API support, vitest infrastructure, test stubs
provides:
  - Next.js 15 App Router project scaffold with dark theme
  - apiFetch wrapper with cookie credentials and 401 refresh
  - Auth Zustand store (login/signup/logout/hydrate)
  - i18n with 10 locale files
  - Socket.IO client with withCredentials
  - Auth middleware for route protection
  - Route group layouts ((app) and (auth))
  - Sidebar, MobileGate, Skeleton components
affects: [12-03, 12-04, 12-05, 12-06, 12-07]

# Tech tracking
tech-stack:
  added: ["next@15", "react@19", "react-dom@19", "tailwindcss@4", "@tailwindcss/postcss", "zustand@5", "socket.io-client@4.8", "i18next@25.8", "react-i18next@16.5", "lucide-react", "zod@3.24"]
  patterns: ["apiFetch with credentials:include and 401 refresh retry", "Zustand auth store with hydrate pattern", "CSS-first Tailwind v4 @theme dark theme", "Next.js middleware cookie-based auth redirect"]

key-files:
  created:
    - apps/web/src/lib/api.ts
    - apps/web/src/lib/constants.ts
    - apps/web/src/lib/socket.ts
    - apps/web/src/i18n/index.ts
    - apps/web/src/stores/auth.ts
    - apps/web/src/middleware.ts
    - apps/web/src/app/layout.tsx
    - apps/web/src/app/globals.css
    - apps/web/src/app/(app)/layout.tsx
    - apps/web/src/app/(auth)/layout.tsx
    - apps/web/src/components/layout/Sidebar.tsx
    - apps/web/src/components/layout/MobileGate.tsx
  modified:
    - apps/web/package.json
    - apps/web/vitest.config.ts
    - apps/web/__tests__/lib/api.test.ts
    - apps/web/__tests__/middleware.test.ts
    - turbo.json

key-decisions:
  - "Tailwind v4 CSS-first @theme config instead of JS config file"
  - "Vitest path alias @/* for web src imports in tests"
  - "Auth middleware uses PUBLIC_PATHS array for route matching"
  - "apiFetch retries original fetch (not recursive call) after refresh for cleaner control flow"

patterns-established:
  - "apiFetch: centralized fetch wrapper with credentials:include, 401 refresh, /login redirect"
  - "useAuthStore: Zustand store with hydrate() for session restoration on page load"
  - "MobileGate: CSS-only viewport gate (hidden md:contents) avoiding hydration mismatch"
  - "(app)/(auth) route groups: sidebar layout for authenticated, minimal for auth pages"

requirements-completed: [PLAT-01]

# Metrics
duration: 5min
completed: 2026-03-20
---

# Phase 12 Plan 02: Next.js Project Scaffold and Core Libraries Summary

**Next.js 15 scaffold with Tailwind v4 dark/gold theme, apiFetch cookie-auth wrapper, Zustand auth store, i18n with 10 locales, and Socket.IO client**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-20T23:05:39Z
- **Completed:** 2026-03-20T23:10:28Z
- **Tasks:** 2
- **Files modified:** 43

## Accomplishments
- Next.js 15 project builds and produces static pages at localhost:3001
- Dark theme with gold accent (#f0c040) configured via Tailwind v4 CSS-first @theme
- apiFetch wrapper sends credentials: include, handles 401 refresh retry, redirects to /login on failure
- Auth Zustand store with login/signup/logout/hydrate actions
- i18n initialized with 10 locale files (en, de, es, fr, it, ja, ko, pt, th, zh)
- Socket.IO client configured with autoConnect: false and withCredentials: true
- Auth middleware protects routes via cookie check with login/signup redirect
- 8 passing tests (3 apiFetch + 5 middleware)

## Task Commits

Each task was committed atomically:

1. **Task 1: Project scaffold, config, and theme** - `3e3cc2b` (feat)
2. **Task 2: Core lib utilities, auth store, and i18n** - `bd37db6` (feat)

## Files Created/Modified
- `apps/web/package.json` - Updated with Next.js 15, React 19, Tailwind v4, Zustand, i18next dependencies
- `apps/web/tsconfig.json` - TypeScript config with @/* path alias
- `apps/web/next.config.ts` - transpilePackages for shared package
- `apps/web/postcss.config.mjs` - PostCSS with @tailwindcss/postcss
- `apps/web/src/app/globals.css` - Tailwind v4 dark theme with gold accent
- `apps/web/src/app/layout.tsx` - Root layout with dark bg and metadata
- `apps/web/src/app/page.tsx` - Root redirect to /cards
- `apps/web/src/app/not-found.tsx` - 404 page with dark theme
- `apps/web/src/app/error.tsx` - Error boundary with retry button
- `apps/web/src/app/(app)/layout.tsx` - Authenticated layout with sidebar and hydration
- `apps/web/src/app/(auth)/layout.tsx` - Minimal auth page layout
- `apps/web/src/lib/api.ts` - apiFetch with credentials: include and 401 refresh
- `apps/web/src/lib/constants.ts` - API_URL and theme color tokens
- `apps/web/src/lib/socket.ts` - Socket.IO client instance
- `apps/web/src/i18n/index.ts` - i18next init with 10 locales and browser language detection
- `apps/web/src/stores/auth.ts` - Zustand auth store
- `apps/web/src/middleware.ts` - Auth route protection middleware
- `apps/web/src/components/layout/Sidebar.tsx` - Navigation sidebar
- `apps/web/src/components/layout/MobileGate.tsx` - Mobile viewport gate
- `apps/web/src/components/ui/Skeleton.tsx` - Loading skeleton component
- `apps/web/vitest.config.ts` - Added @/* path alias
- `turbo.json` - Added .next/** to build outputs

## Decisions Made
- Tailwind v4 CSS-first @theme config instead of JS config file -- aligns with v4 best practices
- Vitest path alias @/* for web src imports -- needed for Zustand store imports in tests
- Auth middleware uses PUBLIC_PATHS array for simple route matching
- apiFetch retries original fetch after refresh for cleaner control flow (not recursive)

## Deviations from Plan

None - plan executed exactly as written. The Next.js build auto-scaffolded some additional files (route group layouts, middleware, components) that align with the research architecture patterns and will be used by subsequent plans.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Project scaffold complete with all core utilities ready
- Auth pages (login/signup) have placeholder routes ready for Plan 03
- Sidebar and app layout ready for feature pages
- apiFetch and auth store ready for data-fetching stores in Plan 04+

## Self-Check: PASSED

All key files verified present. Both task commits (3e3cc2b, bd37db6) confirmed in git log.

---
*Phase: 12-web-app-companion*
*Completed: 2026-03-20*
