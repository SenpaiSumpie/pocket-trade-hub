---
phase: 15-animation-utilities-and-motion-system
plan: "01"
subsystem: mobile-animation
tags: [animation, reanimated, hooks, springs, motion]
dependency_graph:
  requires: []
  provides: [springs.ts presets, useAnimatedPress, useStaggeredList]
  affects: [phases 16-19 screen migrations]
tech_stack:
  added: []
  patterns: [named-spring-presets, mount-once-gate, reduced-motion-guard]
key_files:
  created:
    - apps/mobile/src/constants/springs.ts
    - apps/mobile/src/hooks/useAnimatedPress.ts
    - apps/mobile/src/hooks/useStaggeredList.ts
  modified: []
key_decisions:
  - "Pre-allocate MAX_STAGGER_ITEMS (15) shared values at hook init to maintain stable hook call count across renders — avoids Rules of Hooks violation"
  - "useStaggeredList returns getItemStyle(index) pattern (not array) to match how callers index into items during render"
metrics:
  duration: "~2 minutes"
  completed_date: "2026-03-21"
  tasks: 2
  files_created: 3
  files_modified: 0
---

# Phase 15 Plan 01: Animation Utilities and Motion System Summary

Named spring/timing presets in springs.ts plus two Reanimated hooks (useAnimatedPress with haptic and reduced-motion support, useStaggeredList with 50ms stagger and mount-once gate) that serve as the animation foundation for all Phases 16-19 screen migrations.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create spring and timing preset constants | c06e254 | apps/mobile/src/constants/springs.ts |
| 2 | Create useAnimatedPress and useStaggeredList hooks | 5e2f563 | apps/mobile/src/hooks/useAnimatedPress.ts, apps/mobile/src/hooks/useStaggeredList.ts |

## What Was Built

### springs.ts
Centralized animation preset constants with a header comment enforcing the "no inline values" rule. Six spring presets (SNAPPY, PRESS, CARD_APPEAR, FLIP, TILT, SHEET) and three timing presets (COUNTER, SHIMMER, FADE_IN) plus TIMING_STAGGER_DELAY (50ms) and MAX_STAGGER_ITEMS (15). SPRING_SNAPPY intentionally matches the existing `{ damping: 20, stiffness: 200 }` from useCollapsibleHeader.ts for consistency.

### useAnimatedPress
Follows the established useCollapsibleHeader pattern (useSharedValue + useAnimatedStyle + withSpring). Scales to 0.97 on press-in with SPRING_PRESS, returns to 1.0 on press-out. Optional haptic feedback via `expo-haptics` ImpactFeedbackStyle.Light routed through `runOnJS(triggerHaptic)()` to safely call JS from the UI thread. useReducedMotion guard sets scale directly without spring animation when accessibility setting is active.

### useStaggeredList
Accepts itemCount, pre-allocates exactly MAX_STAGGER_ITEMS (15) shared values and animated styles at hook initialization to maintain a stable React hook call count regardless of itemCount (avoids Rules of Hooks violation). `hasAnimated` ref gates animation to first-mount-only (D-08) — returning to a tab does not replay. onLayout callback triggers withDelay + withTiming chains with 50ms between items and 12px upward translate. Items beyond the 15-item cap receive an empty style object (appear instantly). Reduced motion guard skips all animation — shared values initialized to final state.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Replaced dynamic array hook calls with pre-allocated static arrays**
- **Found during:** Task 2
- **Issue:** The plan's suggested approach of using `Array.from({ length: clampedCount }, () => useSharedValue(...))` violates React's Rules of Hooks — hook call count must be stable between renders, but `clampedCount` can vary per component instance
- **Fix:** Pre-allocate exactly MAX_STAGGER_ITEMS (15) useSharedValue and useAnimatedStyle calls as a static array literal — hook count is always 30 useSharedValue + 15 useAnimatedStyle calls regardless of itemCount
- **Files modified:** apps/mobile/src/hooks/useStaggeredList.ts
- **Commit:** 5e2f563

## Known Stubs

None — all three files are complete implementations with no placeholder data or unresolved TODOs.

## Self-Check

- [x] apps/mobile/src/constants/springs.ts exists
- [x] apps/mobile/src/hooks/useAnimatedPress.ts exists
- [x] apps/mobile/src/hooks/useStaggeredList.ts exists
- [x] Commit c06e254 exists
- [x] Commit 5e2f563 exists
