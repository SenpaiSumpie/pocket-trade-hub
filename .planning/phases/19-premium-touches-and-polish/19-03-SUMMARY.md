---
phase: 19-premium-touches-and-polish
plan: "03"
subsystem: mobile/cards
tags: [layout, cards, zustand, ux, persistence]
dependency_graph:
  requires: []
  provides: [CardLayoutMode store, CardCompactItem, CardListItem, layout toggle]
  affects: [apps/mobile/app/(tabs)/cards.tsx, apps/mobile/src/components/cards/CardGrid.tsx]
tech_stack:
  added: [zustand persist middleware with AsyncStorage]
  patterns: [Zustand persist store, FlashList key remount, cycling toggle]
key_files:
  created:
    - apps/mobile/src/stores/layoutPreference.ts
    - apps/mobile/src/components/cards/CardCompactItem.tsx
    - apps/mobile/src/components/cards/CardListItem.tsx
  modified:
    - apps/mobile/src/components/cards/CardGrid.tsx
    - apps/mobile/app/(tabs)/cards.tsx
decisions:
  - Removed estimatedItemSize from FlashList to avoid pre-existing TS type conflict
  - No haptic feedback on layout toggle (Plan 04 depends on Plan 01 for useHaptics)
metrics:
  duration: 3 min
  completed: "2026-03-23"
  tasks_completed: 2
  files_changed: 5
---

# Phase 19 Plan 03: Card Layout Toggle Summary

Three card layout modes (grid/compact/list) with a cycling toggle and AsyncStorage-persisted preference.

## What Was Built

- **Layout preference store** (`layoutPreference.ts`): Zustand persist store with `CardLayoutMode` type (`'grid' | 'compact' | 'list'`), `cycleLayoutMode()` action cycling grid->compact->list->grid, persisted to AsyncStorage under key `'layout-preference'`.
- **CardCompactItem**: 2-column card renderer showing art (aspect ratio 0.715) + card name + set label, wrapped in Pressable.
- **CardListItem**: Full-width 76px-height row with 60x60 art thumbnail, card name, set name, and `RarityBadge` on the right.
- **CardGrid update**: Accepts `layoutMode?: CardLayoutMode` prop, derives `numColumns` (3/2/1), uses `key={layoutMode}` to force FlashList remount on mode change, renders appropriate item component per mode.
- **cards.tsx toggle**: `SquaresFour`/`GridFour`/`ListIcon` cycling button at right of tab bar row with gold accent (#f0c040), 12px padding for 44px+ touch target, `accessibilityLabel` per mode.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create layout preference store and item components | 3950020 | layoutPreference.ts, CardCompactItem.tsx, CardListItem.tsx |
| 2 | Update CardGrid for layout modes and add toggle to cards.tsx | d8ac249 | CardGrid.tsx, cards.tsx |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed estimatedItemSize from FlashList in CardGrid**
- **Found during:** Task 2 TypeScript check
- **Issue:** `estimatedItemSize` causes a TypeScript error on FlashList (pre-existing incompatibility in the project's type definitions — same error exists in market.tsx and trades.tsx)
- **Fix:** Removed `estimatedItemSize` prop from the FlashList in CardGrid to avoid introducing a new TS error (original CardGrid did not have it either)
- **Files modified:** apps/mobile/src/components/cards/CardGrid.tsx
- **Commit:** d8ac249

## Known Stubs

None — all three layout modes are fully wired with real data from the existing card data flow.

## Self-Check: PASSED

- [x] apps/mobile/src/stores/layoutPreference.ts exists and exports CardLayoutMode + useLayoutPreferenceStore
- [x] apps/mobile/src/components/cards/CardCompactItem.tsx exists
- [x] apps/mobile/src/components/cards/CardListItem.tsx exists
- [x] apps/mobile/src/components/cards/CardGrid.tsx contains key={layoutMode} and renders CardCompactItem/CardListItem
- [x] apps/mobile/app/(tabs)/cards.tsx contains SquaresFour, cycleLayoutMode, layoutMode={cardLayoutMode}
- [x] Commits 3950020 and d8ac249 exist
