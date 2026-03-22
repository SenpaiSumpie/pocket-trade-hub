---
phase: 16-screen-migration-tier-1
plan: 05
subsystem: ui
tags: [react-native, home-tab, card-primitive, text-primitive, staggered-animation, shimmer-skeleton, empty-state, pull-to-refresh]

# Dependency graph
requires:
  - phase: 16-01
    provides: Card, Text, EmptyState, Button, Badge, Divider primitives
  - phase: 16-02
    provides: Toast system, animation hooks (useStaggeredList, useAnimatedPress)
provides:
  - Home tab with Card/Text primitives for all dashboard sections
  - Staggered entrance animation on 5 dashboard sections via useStaggeredList
  - Shimmer skeleton loading for smart trades async state
  - EmptyState with Lightbulb icon and 'Add Wanted Cards' CTA for premium empty state
  - Gold pull-to-refresh (tintColor #f0c040)
  - Analytics card uses Card onPress for animated press + haptics
affects: [screen-migration-tier-2, home-tab, dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dashboard sections wrapped in Animated.View with getItemStyle(index) for stagger"
    - "onLayout on container View triggers stagger animation once on mount"
    - "Shimmer/ShimmerBox/ShimmerText composited inside Card for loading skeletons"
    - "renderSmartTradesContent() helper encapsulates loading/empty/data states"

key-files:
  created: []
  modified:
    - apps/mobile/app/(tabs)/index.tsx

key-decisions:
  - "Smart trades empty state rendered at index.tsx level (not inside SmartTradesSection) to keep Card wrapping consistent"
  - "ShimmerText import added but skeleton uses ShimmerBox only — text shim not needed for card-height placeholders"
  - "Preview cards wrapped in Card primitive removing inline surface/borderRadius styles"

patterns-established:
  - "Async section skeleton pattern: Card > Shimmer > ShimmerBox rows, gated by loading && data.length === 0"
  - "Staggered sections: useStaggeredList(N) at component level, each section in Animated.View with getItemStyle(index)"

requirements-completed: [SCR-01]

# Metrics
duration: 8min
completed: 2026-03-21
---

# Phase 16 Plan 05: Home Tab Migration Summary

**Home tab dashboard migrated with Card/Text primitives, 5-section staggered entrance, Shimmer skeleton loading for smart trades, EmptyState for premium empty state, and gold pull-to-refresh**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-21T00:00:00Z
- **Completed:** 2026-03-21T00:08:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Replaced all inline-styled section containers with Card primitive (4 usages: analytics + 3 preview cards)
- Replaced all RN Text with Text primitive (heading/subheading/body/label presets throughout)
- Staggered entrance animation on 5 dashboard sections using useStaggeredList(5)
- Shimmer skeleton (ShimmerBox rows inside Card > Shimmer) shown while smart trades are loading
- EmptyState with Lightbulb icon and 'Add Wanted Cards' CTA for premium users with no suggestions
- Gold pull-to-refresh: tintColor="#f0c040" and colors=["#f0c040"] on RefreshControl
- Analytics card uses Card with onPress for built-in animated press + haptic feedback

## Task Commits

1. **Task 1: Migrate Home tab with Card/Text primitives, staggered sections, and skeleton loading** - `dc9a5b6` (feat)

## Files Created/Modified
- `apps/mobile/app/(tabs)/index.tsx` - Home tab fully migrated: primitives, animation, skeleton, empty state, gold refresh

## Decisions Made
- Smart trades empty state is rendered at index.tsx level rather than inside SmartTradesSection, so the Card wrapper stays consistent and the EmptyState appears inside a Card container
- ShimmerText was imported but skeleton uses ShimmerBox rows only — card-height boxes are sufficient placeholders for the smart trades loading state
- Preview cards now use Card primitive which removes the need for inline backgroundColor/borderRadius styles

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all sections wire to real data stores (useSuggestionsStore, useCollectionStore, useAuthStore, usePremiumStore).

## Issues Encountered
None

## Self-Check
- [x] `apps/mobile/app/(tabs)/index.tsx` exists and contains all required primitives
- [x] Commit dc9a5b6 exists

## Next Phase Readiness
- Home tab fully migrated with design system primitives
- Pattern established for other tabs: Card for sections, Text presets, useStaggeredList, Shimmer skeletons, gold RefreshControl

---
*Phase: 16-screen-migration-tier-1*
*Completed: 2026-03-21*
