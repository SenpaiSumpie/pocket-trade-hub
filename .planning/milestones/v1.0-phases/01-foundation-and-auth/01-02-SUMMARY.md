---
phase: 01-foundation-and-auth
plan: 02
subsystem: mobile
tags: [expo, react-native, zustand, expo-router, expo-secure-store, expo-clipboard, react-hook-form, zod, dark-theme]

# Dependency graph
requires:
  - phase: 01-foundation-and-auth/01
    provides: Fastify API with auth and profile endpoints, shared zod schemas
provides:
  - Expo mobile app with dark-themed branded UI
  - Auth flow (login, signup, reset password) with form validation
  - Zustand auth store with SecureStore token persistence
  - Tab navigation shell (Home, Cards, Trades, Profile)
  - Onboarding screen with avatar picker, display name, friend code
  - Edit profile screen with pre-populated values
  - User profile view with friend code copy-to-clipboard
  - Setup checklist on home screen
  - 16 Pokemon-type-themed avatar presets
affects: [card-database, collection-management, trade-matching, trade-proposals]

# Tech tracking
tech-stack:
  added: [expo, expo-router, expo-secure-store, expo-clipboard, zustand, react-hook-form, "@hookform/resolvers", react-native-toast-message, burnt]
  patterns: [zustand-securestore-hydration, expo-router-stack-protected, api-fetch-with-token-refresh, dark-theme-constants]

key-files:
  created:
    - apps/mobile/app/_layout.tsx
    - apps/mobile/app/(auth)/_layout.tsx
    - apps/mobile/app/(auth)/login.tsx
    - apps/mobile/app/(auth)/signup.tsx
    - apps/mobile/app/(auth)/reset-password.tsx
    - apps/mobile/app/(tabs)/_layout.tsx
    - apps/mobile/app/(tabs)/index.tsx
    - apps/mobile/app/(tabs)/cards.tsx
    - apps/mobile/app/(tabs)/trades.tsx
    - apps/mobile/app/(tabs)/profile.tsx
    - apps/mobile/app/onboarding.tsx
    - apps/mobile/app/edit-profile.tsx
    - apps/mobile/app/user/[id].tsx
    - apps/mobile/src/stores/auth.ts
    - apps/mobile/src/hooks/useApi.ts
    - apps/mobile/src/constants/theme.ts
    - apps/mobile/src/constants/avatars.ts
    - apps/mobile/src/components/FriendCodeBadge.tsx
    - apps/mobile/src/components/AvatarPicker.tsx
    - apps/mobile/src/components/SetupChecklist.tsx
  modified: []

key-decisions:
  - "Dark theme with Pokemon-inspired gold accent (#f0c040) for branded immersive feel"
  - "Web-compatible SecureStore wrapper using localStorage fallback for development"
  - "Emoji-based avatar presets representing 16 Pokemon types for cross-platform compatibility"
  - "Friend code auto-formatting with dash insertion on input for UX"

patterns-established:
  - "Auth store pattern: Zustand + SecureStore hydration with splash screen guard"
  - "API hook pattern: apiFetch with automatic 401 token refresh retry"
  - "Theme constants: centralized colors, typography, spacing, borderRadius"
  - "Form pattern: react-hook-form + zod resolver for shared schema validation"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04, PROF-01, PROF-02, PROF-03, PROF-04]

# Metrics
duration: 4min
completed: 2026-03-08
---

# Phase 1 Plan 02: Expo Mobile App with Auth Flow, Profile Management, and Tab Navigation Summary

**Expo mobile app with dark-themed branded UI, Zustand auth store with SecureStore hydration, login/signup/reset forms using shared zod schemas, tab navigation, onboarding flow, and friend code copy-to-clipboard**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-08T01:07:15Z
- **Completed:** 2026-03-08T01:11:30Z
- **Tasks:** 3/3 (all complete, Task 3 checkpoint approved)
- **Files modified:** 20

## Accomplishments
- Scaffolded complete Expo mobile app with dark-themed branded UI and Pokemon-inspired gold accent colors
- Built full auth flow: login, signup, and password reset screens with react-hook-form + shared zod validation
- Implemented Zustand auth store with SecureStore persistence, splash screen hydration guard, and token refresh
- Created tab navigation with Home, Cards (coming soon), Trades (coming soon), and Profile tabs
- Built onboarding screen with avatar picker (16 Pokemon-type presets), display name, and friend code inputs
- Built edit profile and user profile view screens with friend code copy-to-clipboard

## Task Commits

Each task was committed atomically:

1. **Task 1: Expo app scaffolding, auth store, API hook, theme, and auth screens** - `b0977de` (feat)
2. **Task 2: Onboarding, edit profile, user profile view, friend code copy, and home screen** - `16c9c0c` (feat)
3. **Task 3: Verify complete auth and profile flow end-to-end** - Checkpoint: APPROVED by user (2026-03-08)

## Files Created/Modified
- `apps/mobile/package.json` - Expo app package with all dependencies
- `apps/mobile/app.json` - App config with dark theme and branding
- `apps/mobile/app/_layout.tsx` - Root layout with Stack.Protected auth guards and splash screen
- `apps/mobile/app/(auth)/_layout.tsx` - Auth group stack layout
- `apps/mobile/app/(auth)/login.tsx` - Branded login screen with email/password form
- `apps/mobile/app/(auth)/signup.tsx` - Signup screen with email, password, confirm password
- `apps/mobile/app/(auth)/reset-password.tsx` - Two-step password reset (request + confirm)
- `apps/mobile/app/(tabs)/_layout.tsx` - Bottom tab bar with 4 tabs and dark theme
- `apps/mobile/app/(tabs)/index.tsx` - Home tab with welcome, setup checklist, coming-soon previews
- `apps/mobile/app/(tabs)/cards.tsx` - Coming soon placeholder
- `apps/mobile/app/(tabs)/trades.tsx` - Coming soon placeholder
- `apps/mobile/app/(tabs)/profile.tsx` - Own profile with avatar, friend code badge, logout
- `apps/mobile/app/onboarding.tsx` - Post-signup onboarding (skippable)
- `apps/mobile/app/edit-profile.tsx` - Edit profile with avatar picker and form fields
- `apps/mobile/app/user/[id].tsx` - Other user profile view with 404 handling
- `apps/mobile/src/stores/auth.ts` - Zustand auth store with SecureStore hydration
- `apps/mobile/src/hooks/useApi.ts` - API fetch hook with token refresh
- `apps/mobile/src/constants/theme.ts` - Dark theme colors, typography, spacing
- `apps/mobile/src/constants/avatars.ts` - 16 Pokemon-type avatar presets
- `apps/mobile/src/components/FriendCodeBadge.tsx` - Tappable friend code with clipboard copy
- `apps/mobile/src/components/AvatarPicker.tsx` - Grid avatar selector
- `apps/mobile/src/components/SetupChecklist.tsx` - Profile completion checklist

## Decisions Made
- Dark theme with deep dark background (#0f0f1a) and Pokemon-inspired gold accent (#f0c040) for branded immersive feel
- Web-compatible SecureStore wrapper using localStorage fallback for web development/testing
- Emoji-based avatar presets for 16 Pokemon types (cross-platform compatible, no custom assets needed)
- Friend code input auto-formats with dashes as user types for better UX
- Profile screen shows FriendCodeBadge component when friend code is set, "Not set" text otherwise

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
Before testing the mobile app end-to-end:
- **API server** must be running: `cd apps/api && pnpm dev`
- **PostgreSQL** must be running with schema pushed
- **Expo dev server**: `cd apps/mobile && npx expo start`
- Set `EXPO_PUBLIC_API_URL` if API is not on localhost:3000

## Next Phase Readiness
- Mobile app ready to consume all API endpoints from Plan 01
- Tab navigation shell ready to receive real content in Phases 2-6
- Auth store and API hook patterns established for all future authenticated features
- Avatar and theme constants ready for consistent styling across future screens

## Self-Check: PASSED

- All 20 key files verified present on disk
- Both task commits verified in git log (b0977de, 16c9c0c)
- Expo web export succeeds with all routes rendered

---
*Phase: 01-foundation-and-auth*
*Completed: 2026-03-08*
