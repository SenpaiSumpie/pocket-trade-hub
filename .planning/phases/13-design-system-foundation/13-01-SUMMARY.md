---
phase: 13-design-system-foundation
plan: 01
subsystem: ui
tags: [design-tokens, typography, spacing, color-palette, shim, backward-compatibility]

requires:
  - phase: none
    provides: standalone foundation phase
provides:
  - Shared design token package (palette, colors, typography, spacing, elevation, motion, borderRadius)
  - Two-tier token hierarchy (primitive + semantic)
  - Backward-compatible mobile theme.ts shim
  - Energy type color primitives for Pokemon TCG
  - Rarity and tier grade first-class color tokens
affects: [14-component-library, 15-motion, 16-screen-refresh, 17-screen-refresh, web-token-css]

tech-stack:
  added: []
  patterns: [two-tier-token-hierarchy, backward-compatible-shim, semantic-color-aliases]

key-files:
  created:
    - packages/shared/src/tokens/primitives.ts
    - packages/shared/src/tokens/colors.ts
    - packages/shared/src/tokens/typography.ts
    - packages/shared/src/tokens/spacing.ts
    - packages/shared/src/tokens/elevation.ts
    - packages/shared/src/tokens/motion.ts
    - packages/shared/src/tokens/borderRadius.ts
    - packages/shared/src/tokens/index.ts
    - packages/shared/src/__tests__/tokens.test.ts
    - packages/shared/src/__tests__/theme-shim.test.ts
  modified:
    - packages/shared/src/index.ts
    - apps/mobile/src/constants/theme.ts

key-decisions:
  - "Token typography omits color property; shim adds it back for mobile convention"
  - "Shared barrel exports typography as tokenTypography to avoid name collision with potential schema exports"
  - "Shim spacing omits 2xs and 3xl to match old API; extended values available from token package directly"
  - "tierD uses one-off blue (#3498db) since no blue primitive exists in the palette"

patterns-established:
  - "Two-tier tokens: primitives.ts (raw values) -> colors.ts (semantic aliases via import)"
  - "Shim pattern: old API file becomes thin re-export layer mapping old names to new tokens"
  - "Token typography is platform-agnostic (no color); platform shims add color back"

requirements-completed: [DS-01, DS-02, DS-03]

duration: 3min
completed: 2026-03-21
---

# Phase 13 Plan 01: Design Token Package and Mobile Shim Summary

**Two-tier design token package (7 categories) with backward-compatible theme.ts shim preserving 44 consuming files unchanged**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-21T15:51:14Z
- **Completed:** 2026-03-21T15:54:33Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Created shared design token package with primitives (palette) and semantic colors referencing primitives
- Added typography, spacing, elevation, motion, and borderRadius token modules
- Rewrote theme.ts as zero-hex-value shim importing from shared tokens
- 32 new tests (21 token + 11 shim mapping) all passing alongside existing 29 tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Create token package with tests** - `876a423` (feat)
2. **Task 2: Create backward-compatible theme.ts shim with tests** - `790d09f` (feat)

## Files Created/Modified
- `packages/shared/src/tokens/primitives.ts` - Raw palette values (gray, gold, red, green, orange, diamond, crown, energy)
- `packages/shared/src/tokens/colors.ts` - Semantic color aliases referencing primitives
- `packages/shared/src/tokens/typography.ts` - Font sizes, weights, line heights (no color)
- `packages/shared/src/tokens/spacing.ts` - 8-level spacing scale (2xs through 3xl)
- `packages/shared/src/tokens/elevation.ts` - 4-level shadow definitions for React Native
- `packages/shared/src/tokens/motion.ts` - Easing curves and duration scale
- `packages/shared/src/tokens/borderRadius.ts` - 5-level border radius scale
- `packages/shared/src/tokens/index.ts` - Barrel export for all 7 token categories
- `packages/shared/src/index.ts` - Added token re-exports to shared package barrel
- `apps/mobile/src/constants/theme.ts` - Rewritten as thin shim mapping old names to new tokens
- `packages/shared/src/__tests__/tokens.test.ts` - 21 tests covering all token categories
- `packages/shared/src/__tests__/theme-shim.test.ts` - 11 tests verifying shim mapping contract

## Decisions Made
- Token typography omits `color` property to stay platform-agnostic; the mobile shim adds `color` back referencing the mapped `colors.text`/`colors.textSecondary`
- Shared barrel exports typography as `tokenTypography` to avoid potential name collisions
- Shim spacing exports only the original 6 keys (xs through xxl), not the extended 2xs/3xl
- `tierD` uses a one-off blue hex (`#3498db`) since no blue primitive exists in the palette

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Token package ready for consumption by Phase 14 (component library) and Phase 15 (motion)
- CSS token generation for web (DS-04) and hardcoded value audit (DS-05) are separate plans in this phase
- Pre-existing TypeScript errors in mobile app (FlashList, Themed.tsx, useMatches) are unrelated to this work

---
*Phase: 13-design-system-foundation*
*Completed: 2026-03-21*
