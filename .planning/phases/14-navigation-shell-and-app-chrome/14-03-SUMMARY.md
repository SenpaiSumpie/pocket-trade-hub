---
phase: 14-navigation-shell-and-app-chrome
plan: 03
subsystem: ui
tags: [react-native, reanimated, collapsible-header, scroll-animation, spring-physics]

# Dependency graph
requires:
  - phase: 14-navigation-shell-and-app-chrome
    provides: tab bar layout and navigation structure from plan 01
provides:
  - useCollapsibleHeader hook with Reanimated spring-based scroll tracking
  - CollapsibleHeader component with title, notification bell, and children slot
  - Collapsible header integration in Cards, Market, Trades, Meta screens
affects: [screen-refresh, component-library]

# Tech tracking
tech-stack:
  added: []
  patterns: [collapsible-header-pattern, scroll-handler-pass-through]

key-files:
  created:
    - apps/mobile/src/hooks/useCollapsibleHeader.ts
    - apps/mobile/src/components/navigation/CollapsibleHeader.tsx
  modified:
    - apps/mobile/app/(tabs)/cards.tsx
    - apps/mobile/app/(tabs)/market.tsx
    - apps/mobile/app/(tabs)/trades.tsx
    - apps/mobile/app/(tabs)/meta.tsx
    - apps/mobile/src/components/cards/CardGrid.tsx
    - apps/mobile/src/components/meta/DeckRankingList.tsx
    - apps/mobile/src/components/meta/TierListBrowser.tsx

key-decisions:
  - "Pass onScroll/scrollEventThrottle through child components (CardGrid, DeckRankingList, TierListBrowser) rather than wrapping in Animated.ScrollView to avoid nested scroll issues"
  - "Screen-specific tab bars/segment controls go into CollapsibleHeader children slot, search/filter controls remain in main content area"

patterns-established:
  - "Collapsible header pattern: useCollapsibleHeader hook + CollapsibleHeader component + onScroll pass-through to scrollable child"
  - "Scroll handler prop threading: child list components accept onScroll and scrollEventThrottle for parent-controlled scroll tracking"

requirements-completed: [NAV-02]

# Metrics
duration: 13min
completed: 2026-03-21
---

# Phase 14 Plan 03: Collapsible Headers Summary

**Reanimated spring-based collapsible headers on Cards, Market, Trades, and Meta screens with scroll-direction-aware collapse/expand and search row fade**

## Performance

- **Duration:** 13 min
- **Started:** 2026-03-21T17:23:47Z
- **Completed:** 2026-03-21T17:37:13Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Created reusable useCollapsibleHeader hook with spring physics (damping: 20, stiffness: 200), cancelAnimation for jank prevention, and interpolated animated styles for header, search row, title, and border
- Built CollapsibleHeader component with absolute positioning, NotificationBell integration, and children slot for screen-specific controls
- Integrated collapsible headers into all 4 scrollable tab screens (Cards, Market, Trades, Meta) while keeping Home and Profile with static headers

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useCollapsibleHeader hook and CollapsibleHeader component** - `b41818e` (feat)
2. **Task 2: Integrate collapsible headers into Cards, Market, Trades, and Meta screens** - `832d68b` (feat)

## Files Created/Modified
- `apps/mobile/src/hooks/useCollapsibleHeader.ts` - Reanimated hook: scroll handler, header/search/title/border animated styles, HEADER_MAX/HEADER_MIN exports
- `apps/mobile/src/components/navigation/CollapsibleHeader.tsx` - Absolute-positioned header wrapper with title row, NotificationBell, and collapsible children slot
- `apps/mobile/app/(tabs)/cards.tsx` - CollapsibleHeader with segment tab bar, scrollHandler on CardGrid
- `apps/mobile/app/(tabs)/market.tsx` - CollapsibleHeader with MarketFilters, scrollHandler on FlashList
- `apps/mobile/app/(tabs)/trades.tsx` - CollapsibleHeader with post/proposal tab bar, scrollHandler on FlashLists
- `apps/mobile/app/(tabs)/meta.tsx` - CollapsibleHeader with segment control, scrollHandler on DeckRankingList/TierListBrowser
- `apps/mobile/src/components/cards/CardGrid.tsx` - Added onScroll/scrollEventThrottle/contentContainerStyleExtra props
- `apps/mobile/src/components/meta/DeckRankingList.tsx` - Added onScroll/scrollEventThrottle/contentContainerStyleExtra props
- `apps/mobile/src/components/meta/TierListBrowser.tsx` - Added onScroll/scrollEventThrottle/contentContainerStyleExtra props

## Decisions Made
- Passed scroll handler through child component props (CardGrid, DeckRankingList, TierListBrowser) rather than wrapping in Animated.ScrollView to avoid nested scrollable issues with FlashList
- Screen-specific tab bars and segment controls placed in CollapsibleHeader children (fading on collapse), while search/filter controls remain in main content area below header

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added onScroll/scrollEventThrottle props to CardGrid, DeckRankingList, TierListBrowser**
- **Found during:** Task 2 (screen integration)
- **Issue:** Child components encapsulate their own FlashList instances; parent screens cannot attach scroll handlers without prop threading
- **Fix:** Added onScroll, scrollEventThrottle, and contentContainerStyleExtra props to all three child list components, forwarding to their internal FlashList
- **Files modified:** CardGrid.tsx, DeckRankingList.tsx, TierListBrowser.tsx
- **Verification:** All 4 screens compile and use scrollHandler correctly
- **Committed in:** 832d68b (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary prop threading to enable parent-controlled scroll tracking through child list components. No scope creep.

## Issues Encountered
- Pre-existing FlashList TypeScript type errors (estimatedItemSize not in FlashListProps) -- these are unrelated to our changes and exist across the codebase

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Collapsible header pattern established and reusable for any future scrollable screen
- Headers collapse on scroll down, re-expand on any scroll up with spring animation
- Home and Profile screens ready for their own static header treatment in future plans

---
*Phase: 14-navigation-shell-and-app-chrome*
*Completed: 2026-03-21*
