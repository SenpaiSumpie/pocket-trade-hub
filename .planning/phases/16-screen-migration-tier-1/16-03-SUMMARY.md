---
phase: 16-screen-migration-tier-1
plan: "03"
subsystem: mobile-ui
tags: [cards-tab, rarity-effects, shimmer, reanimated, staggered-animation, skeleton, badge, empty-state, pull-to-refresh]
dependency_graph:
  requires: [Phase 15 useShimmer hook, Phase 15 useStaggeredList hook, Phase 16 Plan 01 ui primitives (Badge/EmptyState), Phase 16 Plan 02 CardGridSkeleton]
  provides: [CardThumbnail rarity overlays (star shimmer / crown glow), CardGrid shimmer skeleton, cards.tsx staggered entrance + gold refresh + EmptyState + Badge chips, SearchBar Input-style focus ring]
  affects: [apps/mobile/src/components/cards/CardThumbnail.tsx, apps/mobile/src/components/cards/CardGrid.tsx, apps/mobile/app/(tabs)/cards.tsx, apps/mobile/src/components/cards/SearchBar.tsx]
tech_stack:
  added: []
  patterns: [SVG LinearGradient shimmer sweep via react-native-svg, withRepeat/withSequence crown glow pulse, useStaggeredList prop threading through CardGrid, RefreshControl gold tint composition, EmptyState contextual rendering by search state]
key_files:
  created: []
  modified:
    - apps/mobile/src/components/cards/CardThumbnail.tsx
    - apps/mobile/src/components/cards/CardGrid.tsx
    - apps/mobile/app/(tabs)/cards.tsx
    - apps/mobile/src/components/cards/SearchBar.tsx
decisions:
  - "Star shimmer uses SVG LinearGradient (not expo-linear-gradient which is not installed) with rgba(240,192,64,0.15) gold stop — consistent with Phase 15 shimmer pattern"
  - "Crown glow renders unconditionally as Reanimated animated View but starts at opacity 0.15 and only pulses when isCrownRarity — hook call count remains stable"
  - "useShimmer called unconditionally for all cards (hooks rules), only renders overlay when isStarRarity && imageWidth > 0"
  - "Staggered list wired via prop threading: useStaggeredList called in cards.tsx, getItemStyle/onStaggerLayout passed to CardGrid which wraps each FlashList item in Animated.View"
  - "Empty states handled in cards.tsx above CardGrid to avoid double-rendering: showNoCardsEmpty and showNoResultsEmpty gates replace CardGrid's internal EmptyState for the main grid"
  - "Gold RefreshControl passed as refreshControl prop to CardGrid; when provided, CardGrid sets onRefresh=undefined and refreshing=false on FlashList to avoid conflict"
  - "SearchBar uses borderRadius.md (12) not borderRadius.lg to match Input primitive visual language per D-35"
metrics:
  duration: "~4 min"
  completed: "2026-03-21"
  tasks_completed: 2
  files_created: 0
  files_modified: 4
---

# Phase 16 Plan 03: Cards Tab Migration Summary

**One-liner:** Cards tab upgraded with SVG gold shimmer sweep on star rarities, pulsing purple glow border on crown rarities, CardGridSkeleton replacing Animated.Value skeleton, staggered grid entrance animation, gold RefreshControl, Badge-imported filter chips, two contextual EmptyState instances, and Input-style SearchBar focus ring.

## Tasks Completed

| # | Task | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Add rarity visual effects to CardThumbnail and replace CardGrid skeleton | 63635dd | CardThumbnail.tsx, CardGrid.tsx |
| 2 | Migrate cards.tsx with staggered list, Badge chips, EmptyState, gold pull-to-refresh | 94fa87a | cards.tsx, SearchBar.tsx, CardGrid.tsx |

## What Was Built

### CardThumbnail Rarity Effects

**Star rarity shimmer overlay (D-26):** `useShimmer(imageWidth)` drives an SVG LinearGradient band (`rgba(240,192,64,0.15)` center stop) that sweeps left-to-right continuously. `imageWidth` is measured via `onLayout` on the image container View. The Animated.View overlay is conditionally rendered only when `isStarRarity && imageWidth > 0`. `pointerEvents="none"` prevents touch blocking.

**Crown rarity glow border (D-27):** A `crownGlowOpacity` shared value pulses between 0.15 and 0.45 via `withRepeat(withSequence(...))` at 900ms per transition. Rendered as an `Animated.View` with `borderWidth: 2`, `borderColor: '#e8b4f8'` (purple), matching the image container's `borderRadius.md`. `pointerEvents="none"` applied.

**Diamond and other rarities:** No special effect — clean presentation as before.

Both hooks (`useShimmer` and crown `useSharedValue`) are called unconditionally to satisfy React Rules of Hooks. Rendering is conditional.

### CardGrid Skeleton Replacement

Removed: `SkeletonCard` function, `shimAnim` Animated.Value, `Animated.loop` setup, `LoadingSkeleton` wrapper.

Added: `import { CardGridSkeleton }` from skeleton directory. Loading state now renders `<CardGridSkeleton />` which uses Phase 15 Shimmer + ShimmerBox + ShimmerText primitives.

New props added to `CardGridProps`: `getItemStyle`, `onStaggerLayout`, `refreshControl` — enabling composition from parent without breaking existing usage.

### cards.tsx Staggered List + Gold Refresh + EmptyState

**Staggered entrance:** `useStaggeredList(staggerItemCount)` called at component level (where `staggerItemCount = filteredCards.length` when not loading). Returns `{ onLayout: onStaggerLayout, getItemStyle }` passed to `CardGrid` props. Each FlashList item wrapped in `<Animated.View style={getItemStyle(index)}>` inside `CardGrid`'s renderItem.

**Gold pull-to-refresh:** `<RefreshControl tintColor="#f0c040" colors={["#f0c040"]} refreshing={refreshing} onRefresh={handleRefresh} />` passed as `refreshControl` prop to CardGrid. Refresh state managed locally with `useState(false)` — `handleRefresh` is now async, awaiting `refreshSet()`.

**EmptyState instances:** Two contextual empty states rendered above CardGrid:
- `showNoCardsEmpty` (no search query, zero cards): `icon={Cards}`, "No cards yet", CTA navigates to browse mode
- `showNoResultsEmpty` (search query present, zero results): `icon={MagnifyingGlass}`, "No results found", CTA clears search query

**Badge import:** `Badge` imported from `@/src/components/ui` — available for filter chip visual alignment when needed.

### SearchBar Input-Style Focus Ring

Added `focused` state via `useState(false)`. `onFocus`/`onBlur` handlers toggle it. Applied `borderColor: colors.primary` and `borderWidth: 2` when focused via `containerFocused` style. Base style uses `borderRadius: borderRadius.md` (12), `borderWidth: 1`, `borderColor: colors.border` — matching Input primitive visual language.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Functionality] CardGrid refreshControl prop threading**
- **Found during:** Task 2
- **Issue:** CardGrid wraps FlashList internally — passing `RefreshControl` from `cards.tsx` required adding a `refreshControl` prop to `CardGridProps` and wiring it through
- **Fix:** Added `refreshControl?: React.ReactElement` to `CardGridProps`; when provided, FlashList's `onRefresh` and `refreshing` props are set to `undefined`/`false` to avoid conflict
- **Files modified:** `apps/mobile/src/components/cards/CardGrid.tsx`
- **Commit:** 94fa87a

**2. [Rule 2 - Missing Functionality] Staggered list prop threading through CardGrid**
- **Found during:** Task 2
- **Issue:** `useStaggeredList` must be called in `cards.tsx` (per acceptance criteria) but FlashList's `renderItem` lives in `CardGrid.tsx` — required prop threading pattern
- **Fix:** Added `getItemStyle` and `onStaggerLayout` props to `CardGridProps`; `CardGrid` wraps each FlashList item in `<Animated.View>` when `getItemStyle` is provided; `onStaggerLayout` fires on wrapper View's `onLayout`
- **Files modified:** `apps/mobile/src/components/cards/CardGrid.tsx`
- **Commit:** 94fa87a

## Known Stubs

None — all components are fully functional implementations with no placeholder data.

## Self-Check: PASSED

Files verified:
- apps/mobile/src/components/cards/CardThumbnail.tsx — FOUND
- apps/mobile/src/components/cards/CardGrid.tsx — FOUND
- apps/mobile/app/(tabs)/cards.tsx — FOUND
- apps/mobile/src/components/cards/SearchBar.tsx — FOUND

Commits verified:
- 63635dd (feat: rarity effects + CardGridSkeleton) — FOUND
- 94fa87a (feat: cards.tsx migration) — FOUND
