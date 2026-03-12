---
phase: 03-collection-management
plan: 02
subsystem: ui
tags: [zustand, react-native, expo-haptics, collection, wanted, segmented-control, optimistic-updates]

# Dependency graph
requires:
  - phase: 03-collection-management
    plan: 01
    provides: "Collection and wanted API endpoints, shared Zod schemas"
  - phase: 02-card-database
    provides: "CardThumbnail, CardGrid, CardDetailModal, SetPicker, Cards tab screen"
provides:
  - "Zustand collection store with mode switching (browse/collection/wanted)"
  - "Optimistic update hooks for collection and wanted API calls"
  - "Card thumbnail overlays (quantity badge, priority badge, dimmed state, long-press quick-add)"
  - "Segmented control on Cards tab with Browse/My Collection/Wanted modes"
  - "Context-aware CardDetailModal actions per mode"
  - "SetPicker progress bars with owned/total counts"
  - "Checklist mode for bulk collection management"
affects: [03-03, 04-trade-matching]

# Tech tracking
tech-stack:
  added: [expo-haptics]
  patterns: [optimistic-update-with-revert, debounced-api-calls, mode-aware-ui]

key-files:
  created:
    - apps/mobile/src/stores/collection.ts
    - apps/mobile/src/hooks/useCollection.ts
    - apps/mobile/src/hooks/useWanted.ts
  modified:
    - apps/mobile/src/components/cards/CardThumbnail.tsx
    - apps/mobile/src/components/cards/CardDetailModal.tsx
    - apps/mobile/src/components/cards/SetPicker.tsx
    - apps/mobile/src/components/cards/CardGrid.tsx
    - apps/mobile/app/(tabs)/cards.tsx
    - apps/mobile/package.json
    - pnpm-lock.yaml

key-decisions:
  - "Optimistic updates with revert-on-error for responsive collection/wanted mutations"
  - "300ms debounce on rapid addToCollection calls to batch API requests"
  - "expo-haptics for long-press feedback with web platform guard"

patterns-established:
  - "Optimistic update pattern: update store immediately, revert on API error"
  - "Mode-aware UI: components accept mode prop and render differently per mode"
  - "Debounced API calls: queue rapid mutations with setTimeout, clear on new call"

requirements-completed: [INV-01, INV-02, INV-03, INV-04, INV-05, WANT-01, WANT-02, WANT-03]

# Metrics
duration: 6min
completed: 2026-03-09
---

# Phase 03 Plan 02: Mobile Collection UI Summary

**Zustand collection store with optimistic hooks, segmented Browse/Collection/Wanted tab modes, card overlays with quantity/priority badges, long-press quick-add with haptics, context-aware detail modal, and SetPicker progress bars**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-09T01:59:42Z
- **Completed:** 2026-03-09T02:05:54Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments
- Zustand store with mode switching, collection/wanted maps, and progress tracking with full optimistic update actions
- API hooks for collection (load, add with debounce, remove, update quantity, bulk update, refresh progress) and wanted (load, add, remove, update priority), all with optimistic updates and revert-on-error
- CardThumbnail overlays: quantity badge (gold circle, top-right), priority badge (colored circle, top-left), dimmed overlay for unowned cards, long-press with expo-haptics feedback and animated "Added!" toast
- Segmented control on Cards tab switching between Browse, My Collection, and Wanted modes
- Checklist mode in My Collection: Select All/Deselect All, Cancel/Save with bulk diff computation
- Context-aware CardDetailModal: browse shows both add buttons, collection shows quantity stepper + remove, wanted shows priority picker + remove
- SetPicker progress bars showing owned/total counts per set in collection mode

## Task Commits

Each task was committed atomically:

1. **Task 1: Collection Zustand store and API hooks** - `014d982` (feat)
2. **Task 2: Card thumbnail overlays, CardGrid passthrough, and segmented Cards tab** - `153face` (feat)
3. **Task 3: CardDetailModal context-aware actions and SetPicker progress bars** - `8521a83` (feat)

## Files Created/Modified
- `apps/mobile/src/stores/collection.ts` - Zustand store for collection/wanted state with mode switching and optimistic update actions
- `apps/mobile/src/hooks/useCollection.ts` - Collection API hooks with debounced add, optimistic CRUD, bulk update, progress refresh
- `apps/mobile/src/hooks/useWanted.ts` - Wanted API hooks with optimistic add/remove/update priority
- `apps/mobile/src/components/cards/CardThumbnail.tsx` - Added quantity badge, priority badge, dimmed overlay, long-press with haptics, checklist checkbox, toast animation
- `apps/mobile/src/components/cards/CardGrid.tsx` - Added mode-aware prop passthrough for collection overlays and checklist mode
- `apps/mobile/src/components/cards/CardDetailModal.tsx` - Replaced "Coming soon" buttons with context-aware actions, inline QuantityStepper and PriorityPicker
- `apps/mobile/src/components/cards/SetPicker.tsx` - Added progress bars with owned/total counts per set
- `apps/mobile/app/(tabs)/cards.tsx` - Added segmented control, mode switching, checklist mode, wired all action callbacks

## Decisions Made
- Optimistic updates with revert-on-error for all collection/wanted mutations to keep UI responsive
- 300ms debounce on rapid addToCollection calls to prevent API spam during quick-add
- expo-haptics with Platform.OS guard (no-op on web) for long-press feedback
- Inline QuantityStepper and PriorityPicker in CardDetailModal to avoid unnecessary file proliferation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Collection and wanted UI fully functional with API integration
- Ready for plan 03 (notifications or additional collection features)
- Trade matching (phase 04) can read collection/wanted data from the store

## Self-Check: PASSED

- All 3 created files verified present on disk
- All 5 modified files verified updated
- Commits 014d982, 153face, and 8521a83 verified in git log

---
*Phase: 03-collection-management*
*Completed: 2026-03-09*
