---
phase: 13-design-system-foundation
plan: 03
subsystem: tooling
tags: [audit, design-tokens, migration-prep, codebase-analysis]

requires:
  - phase: 13-01
    provides: Color tokens and primitive palette for reverse-lookup mapping

provides:
  - Audit script that scans mobile/web source for hardcoded hex values
  - AUDIT.md tracking list with 135 entries across 28 files for Phase 16/17 migration
  - Reverse-lookup from hex values to semantic token names

affects: [16-screen-migration, 17-screen-migration]

tech-stack:
  added: []
  patterns: [reverse-lookup-map, codebase-audit-script]

key-files:
  created:
    - packages/shared/scripts/audit-hardcoded-values.ts
    - packages/shared/src/__tests__/audit.test.ts
    - .planning/phases/13-design-system-foundation/AUDIT.md
  modified:
    - packages/shared/package.json

key-decisions:
  - "Semantic colors take priority over primitive palette in reverse lookup"
  - "No web hardcoded values found (0 entries) -- only mobile has the problem"
  - "41 UNKNOWN hex values need new tokens in future phases (avatars, energy types, misc)"

patterns-established:
  - "Audit script pattern: pure-function core (buildColorLookup, scanLine, formatMarkdownTable) with CLI wrapper for filesystem scanning"

requirements-completed: [DS-05]

duration: 5min
completed: 2026-03-21
---

# Phase 13 Plan 03: Hardcoded Value Audit Summary

**Audit script with reverse hex-to-token lookup scanning 28 mobile files, cataloguing 135 hardcoded color values with suggested token replacements for Phase 16/17 migration**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-21T15:56:34Z
- **Completed:** 2026-03-21T16:01:27Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Built audit script with TDD: 12 passing unit tests covering buildColorLookup, scanLine, and formatMarkdownTable pure functions
- Scanned all mobile source files (28 files) and identified 135 hardcoded hex color values
- 94 of 135 values (70%) have known token mappings; 41 need new tokens in future phases
- Produced comprehensive AUDIT.md tracking list with file-by-count prioritization table

## Task Commits

Each task was committed atomically:

1. **Task 1: Create audit script with tests (RED)** - `c6f936e` (test)
2. **Task 1: Create audit script with tests (GREEN)** - `81799ba` (feat)
3. **Task 1: Path resolution fix** - `87505e2` (fix)
4. **Task 2: Run audit and produce tracking list** - `dacc344` (feat)

## Files Created/Modified

- `packages/shared/scripts/audit-hardcoded-values.ts` - Audit script with buildColorLookup, scanLine, formatMarkdownTable, CLI runner
- `packages/shared/src/__tests__/audit.test.ts` - 12 unit tests for audit pure functions
- `packages/shared/package.json` - Added audit-values script
- `.planning/phases/13-design-system-foundation/AUDIT.md` - 135-entry tracking list for migration

## Decisions Made

- Semantic colors (colors.*) take priority in reverse lookup over primitive palette names -- gives more useful migration suggestions
- No web source files contained hardcoded hex values (0 entries) -- all 135 are in mobile
- 41 UNKNOWN values identified: avatar type colors (16), CardThumbnail energy colors (10), misc UI colors (15) -- noted for future token expansion

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed relative path resolution for scan directories**
- **Found during:** Task 2 (Run audit)
- **Issue:** Scan directories (apps/mobile/src, apps/web/src) were relative, so running from packages/shared/ found 0 files
- **Fix:** Resolved paths relative to monorepo root via `__dirname` traversal; output paths made relative for readability
- **Files modified:** packages/shared/scripts/audit-hardcoded-values.ts
- **Verification:** Script produces 135 entries when run from packages/shared/
- **Committed in:** 87505e2

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary fix for script to function in monorepo context. No scope creep.

## Issues Encountered

None beyond the path resolution deviation above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- AUDIT.md provides complete tracking list for Phases 16/17 screen migration
- Top files by hardcoded count: CardThumbnail.tsx (17), avatars.ts (16), RarityBadge.tsx (10)
- 41 UNKNOWN values may need new tokens added to primitives.ts before migration

---
*Phase: 13-design-system-foundation*
*Completed: 2026-03-21*
