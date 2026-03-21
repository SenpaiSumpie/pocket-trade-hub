---
phase: 13-design-system-foundation
plan: 02
subsystem: ui
tags: [design-tokens, css-custom-properties, tailwind-v4, turborepo, code-generation]

requires:
  - phase: 13-01
    provides: Shared TS token package (colors, spacing, motion, elevation, borderRadius, typography)
provides:
  - CSS token generation script (TS tokens to CSS custom properties)
  - Generated tokens.css with Tailwind v4 @theme block
  - Turborepo pipeline step for token generation before web build
  - Web constants.ts consuming shared token imports instead of hardcoded hex
affects: [14-component-library, 16-screen-refresh, 17-screen-refresh, web-styling]

tech-stack:
  added: []
  patterns: [css-code-generation, single-source-of-truth-tokens, generated-file-gitignore]

key-files:
  created:
    - packages/shared/scripts/generate-css-tokens.ts
    - packages/shared/src/__tests__/generate-css.test.ts
  modified:
    - apps/web/src/app/globals.css
    - apps/web/src/lib/constants.ts
    - turbo.json
    - .gitignore
    - packages/shared/package.json

key-decisions:
  - "Generated tokens.css uses @theme block for Tailwind v4 compatibility"
  - "Script uses require.main guard for CLI vs import dual-mode usage"
  - "Spacing and border-radius converted from px to rem (divide by 16) for web"
  - "Elevation tokens converted to CSS box-shadow syntax"

patterns-established:
  - "CSS generation: Node script reads TS tokens and writes CSS custom properties file"
  - "Generated files gitignored, regenerated via Turborepo pipeline before build"
  - "Web constants import from shared package, never hardcode hex values"

requirements-completed: [DS-04]

duration: 3min
completed: 2026-03-21
---

# Phase 13 Plan 02: CSS Token Generation Pipeline Summary

**Node build script generating Tailwind v4 @theme CSS custom properties from shared TS tokens with Turborepo pipeline integration**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-21T15:56:37Z
- **Completed:** 2026-03-21T15:59:12Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Created CSS generation script that converts all 7 token categories (colors, spacing, borderRadius, typography, motion, elevation) to CSS custom properties
- Replaced hand-written @theme block in globals.css with import of generated tokens.css
- Replaced hardcoded hex values in constants.ts THEME object with shared token imports
- Added Turborepo generate-tokens pipeline step with build dependency
- 14 tests covering all token conversions and camelCase-to-kebab-case transformation

## Task Commits

Each task was committed atomically:

1. **Task 1: Create CSS generation script with tests** - `be25b47` (feat)
2. **Task 2: Integrate CSS tokens with web app and Turborepo** - `57a75dd` (feat)

## Files Created/Modified
- `packages/shared/scripts/generate-css-tokens.ts` - Node script converting TS tokens to CSS custom properties with @theme block
- `packages/shared/src/__tests__/generate-css.test.ts` - 14 tests for CSS generation and camelToKebab
- `apps/web/src/app/globals.css` - Replaced hand-written @theme with import of generated tokens.css
- `apps/web/src/lib/constants.ts` - THEME object now imports from @pocket-trade-hub/shared colors
- `turbo.json` - Added generate-tokens task, build depends on it
- `.gitignore` - Added apps/web/src/app/tokens.css (generated file)
- `packages/shared/package.json` - Added generate-tokens script

## Decisions Made
- Generated tokens.css uses Tailwind v4 `@theme {}` block for direct CSS-first configuration
- Script supports dual-mode: importable functions for testing, CLI entry point for generation
- Spacing and border-radius values converted from px to rem (/ 16) for web accessibility
- Elevation tokens map React Native shadow properties to CSS box-shadow syntax
- Typography tokens emit font-size, line-height (rem), and font-weight per style

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed output path in generate-css-tokens.ts**
- **Found during:** Task 2 (integration step)
- **Issue:** Script used `../../apps/web/` relative to `packages/shared/scripts/`, resolving to `packages/apps/web/` instead of monorepo root `apps/web/`
- **Fix:** Changed to `../../../apps/web/src/app/tokens.css` (3 levels up from scripts dir)
- **Files modified:** packages/shared/scripts/generate-css-tokens.ts
- **Verification:** Script generates to correct path, file verified
- **Committed in:** 57a75dd (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Path fix necessary for correct file generation. No scope creep.

## Issues Encountered

None beyond the path fix documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- CSS token pipeline complete, web app consumes shared tokens via generated CSS and TS imports
- Ready for Phase 14 (component library) to use CSS custom properties for web components
- Ready for Plan 03 (hardcoded value audit) to identify remaining hardcoded values across codebase

---
*Phase: 13-design-system-foundation*
*Completed: 2026-03-21*
