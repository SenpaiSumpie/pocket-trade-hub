---
phase: 15-animation-utilities-and-motion-system
plan: 02
subsystem: ui
tags: [react-native, reanimated, animation, hooks, accessibility]

# Dependency graph
requires:
  - phase: 15-animation-utilities-and-motion-system
    provides: springs.ts with named spring/timing presets (SPRING_FLIP, SPRING_TILT, TIMING_COUNTER)
provides:
  - useCardFlip hook with 3D Y-axis flip (perspective 1000, backfaceVisibility hidden, reduced motion)
  - useCardTilt hook with touch-normalized 3-degree tilt and spring return
  - AnimatedCounter component with odometer-style digit transitions and accessibilityLiveRegion
affects: [16-screen-migrations, 17-card-detail-screen, 18-collection-screens, 19-trade-screens]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - useSharedValue + useAnimatedStyle hook pattern for animation
    - perspective 1000 first in transform array (Android requirement)
    - useReducedMotion guard pattern in all animation hooks/components
    - accessibilityLiveRegion polite for animated value announcements

key-files:
  created:
    - apps/mobile/src/hooks/useCardFlip.ts
    - apps/mobile/src/hooks/useCardTilt.ts
    - apps/mobile/src/components/animation/AnimatedCounter.tsx
  modified: []

key-decisions:
  - "perspective 1000 placed first in transform array in both flip and tilt hooks (Android requirement per RESEARCH Pitfall 2)"
  - "AnimatedCounter uses two stacked Animated.Text elements with progress shared value (0→1) for odometer effect"
  - "lineHeight derived from style prop with fallback chain: style.lineHeight → style.fontSize * 1.4 → 22"

patterns-established:
  - "Card flip pattern: rotation 0→1 drives front 0→180deg and back 180→360deg interpolation"
  - "Card tilt pattern: touch locationX/Y normalized to [-1,1], multiplied by 3deg max angle"
  - "AnimatedCounter pattern: progress shared value drives both outgoing (translateY: 0→-lineHeight, opacity: 1→0) and incoming (translateY: lineHeight→0, opacity: 0→1)"

requirements-completed: [MOT-02, MOT-03]

# Metrics
duration: 5min
completed: 2026-03-21
---

# Phase 15 Plan 02: Card Physics Hooks and AnimatedCounter Summary

**3D card flip hook (perspective 1000, backfaceVisibility), touch-normalized tilt hook (3-degree max), and odometer-style AnimatedCounter with accessibility — all using named spring/timing presets and reduced motion guards**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-21T22:59:04Z
- **Completed:** 2026-03-21T23:04:00Z
- **Tasks:** 2
- **Files modified:** 3 created

## Accomplishments

- useCardFlip provides front/back animated styles with perspective 1000 first in transform array, backfaceVisibility hidden, and SPRING_FLIP preset
- useCardTilt normalizes touch location to [-1, 1] and tilts max 3 degrees toward touch point, springs to (0,0) on release
- AnimatedCounter slides digits vertically using progress shared value driving two stacked Animated.Text elements, with accessibilityLiveRegion="polite"

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useCardFlip and useCardTilt hooks** - `9f481c8` (feat)
2. **Task 2: Create AnimatedCounter component** - `377a457` (feat)

**Plan metadata:** (pending final docs commit)

## Files Created/Modified

- `apps/mobile/src/hooks/useCardFlip.ts` - 3D Y-axis card flip: rotation 0→1 drives front (0→180deg) and back (180→360deg) interpolation with reduced motion guard
- `apps/mobile/src/hooks/useCardTilt.ts` - Touch-point tilt: normalizes locationX/Y relative to card dimensions, max 3 degrees, springs to zero on release
- `apps/mobile/src/components/animation/AnimatedCounter.tsx` - Odometer-style digit transition: two Animated.Text elements driven by progress 0→1, TIMING_COUNTER preset, accessibilityLiveRegion polite

## Decisions Made

- `perspective: 1000` placed first in all transform arrays (Android requires perspective before rotation transforms)
- AnimatedCounter uses two stacked `Animated.Text` nodes rather than a single re-rendering node — cleaner animation with no layout flicker
- lineHeight fallback chain: `style.lineHeight` → `style.fontSize * 1.4` → `22` (matches default body line-height)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] springs.ts already created by parallel Plan 01 agent**
- **Found during:** Pre-task dependency check
- **Issue:** springs.ts dependency was expected to come from Plan 01 (same wave). File was already present when this agent started.
- **Fix:** Read existing file, confirmed all required exports (SPRING_FLIP, SPRING_TILT, TIMING_COUNTER) present, proceeded without modification
- **Files modified:** None
- **Verification:** grep confirmed all required exports present in springs.ts

---

**Total deviations:** 1 (informational — no action required, dependency already satisfied)
**Impact on plan:** No scope creep. All plan tasks executed exactly as specified.

## Issues Encountered

None — springs.ts was already created by concurrent Plan 01 execution. Plan 02 proceeded directly to its own tasks.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- useCardFlip ready for card detail screen in Phase 17
- useCardTilt ready for any card component requiring press feedback
- AnimatedCounter ready for stats displays, trade counts, collection numbers
- All three files import named presets from springs.ts — no inline values

---
*Phase: 15-animation-utilities-and-motion-system*
*Completed: 2026-03-21*
