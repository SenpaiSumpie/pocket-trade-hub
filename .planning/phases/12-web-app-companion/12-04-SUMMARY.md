---
phase: 12-web-app-companion
plan: 04
subsystem: ui
tags: [auth, login, signup, google-oauth, forms, react-hook-form]

# Dependency graph
requires:
  - phase: 12-web-app-companion
    provides: Auth store, apiFetch, auth layout, Tailwind theme, sidebar
provides:
  - Login page with email/password form and Google OAuth
  - Signup page with registration form and Google OAuth
  - Form validation via react-hook-form + zod
  - Cookie-setting on OAuth routes for web auth
affects: [12-05, 12-06, 12-07]

# Tech tracking
tech-stack:
  added: [react-hook-form, "@hookform/resolvers", "@react-oauth/google"]
  patterns: ["zodResolver for form validation", "Google OAuth with cookie-based auth", "or divider between email and OAuth"]

key-files:
  created:
    - apps/web/src/components/auth/LoginForm.tsx
    - apps/web/src/components/auth/SignupForm.tsx
    - apps/web/src/components/auth/GoogleSignIn.tsx
  modified:
    - apps/web/src/app/(auth)/login/page.tsx
    - apps/web/src/app/(auth)/signup/page.tsx
    - apps/api/src/routes/oauth.ts

key-decisions:
  - "Web signup form includes displayName field (API ignores it currently but form is forward-compatible)"
  - "GoogleSignIn renders null when NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set (graceful degradation)"
  - "OAuth routes now set cookies matching auth route pattern for web compatibility"

requirements-completed: [PLAT-01]

# Metrics
duration: 5min
completed: 2026-03-20
---

# Phase 12 Plan 04: Auth Pages (Login, Signup, Google OAuth) Summary

**Login and signup forms with react-hook-form validation, Google OAuth button, and cookie-setting on OAuth API routes**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-20T23:17:01Z
- **Completed:** 2026-03-20T23:21:54Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- LoginForm component with email/password fields, zodResolver validation, loading spinner, error display, redirect to /cards on success
- SignupForm component with display name, email, password, confirm password fields, client-side password match validation
- GoogleSignIn component using @react-oauth/google with NEXT_PUBLIC_GOOGLE_CLIENT_ID env var
- Login and signup pages updated with forms and Google OAuth button with "or" divider
- OAuth API routes (google and apple) now set httpOnly cookies matching auth route pattern
- needsLinking response handled with user-friendly error message
- 8 tests passing, build succeeds

## Task Commits

1. **Task 1: Login and signup forms with validation** - `08f6f42` (feat). LoginForm, SignupForm, updated page components, react-hook-form + resolver deps.
2. **Task 2: Google OAuth sign-in for web** - `7aa7506` (feat). GoogleSignIn component, @react-oauth/google dep, OAuth route cookie-setting.

## Files Modified

- `apps/web/src/components/auth/LoginForm.tsx` - Email/password login form with validation and error handling
- `apps/web/src/components/auth/SignupForm.tsx` - Registration form with display name and confirm password
- `apps/web/src/components/auth/GoogleSignIn.tsx` - Google OAuth button with provider wrapper
- `apps/web/src/app/(auth)/login/page.tsx` - Login page with LoginForm and GoogleSignIn
- `apps/web/src/app/(auth)/signup/page.tsx` - Signup page with SignupForm and GoogleSignIn
- `apps/api/src/routes/oauth.ts` - Added setAuthCookies to Google and Apple OAuth responses
- `apps/web/package.json` - Added react-hook-form, @hookform/resolvers, @react-oauth/google
- `apps/web/src/components/cards/CardFilters.tsx` - Fixed useRef for React 19 compatibility
- `pnpm-lock.yaml` - Updated lockfile

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed CardFilters.tsx useRef for React 19**
- **Found during:** Task 1
- **Issue:** `useRef<ReturnType<typeof setTimeout>>()` requires an initial value argument in React 19, causing build failure
- **Fix:** Added `undefined` as initial value: `useRef<ReturnType<typeof setTimeout>>(undefined)`
- **Files modified:** apps/web/src/components/cards/CardFilters.tsx
- **Commit:** 08f6f42

**2. [Rule 2 - Missing critical functionality] OAuth routes missing cookie-setting**
- **Found during:** Task 2
- **Issue:** OAuth routes returned tokens in response body but did not set httpOnly cookies like auth routes do, breaking web cookie-based auth
- **Fix:** Added setAuthCookies helper to oauth.ts, called on both Google and Apple OAuth success responses
- **Files modified:** apps/api/src/routes/oauth.ts
- **Commit:** 7aa7506

## Decisions Made

- Web signup form includes displayName field even though current API signup schema ignores it (forward-compatible)
- GoogleSignIn gracefully returns null when GOOGLE_CLIENT_ID env var is not set
- OAuth routes now set cookies using same pattern as auth routes (httpOnly, secure in production, sameSite lax/none)

## Issues Encountered

None.

## Self-Check: PASSED
