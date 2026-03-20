---
phase: 12-web-app-companion
plan: 05
subsystem: ui
tags: [cards, collection, zustand, grid, modal, search, filters, pagination]

# Dependency graph
requires:
  - phase: 12-web-app-companion
    provides: Next.js scaffold, apiFetch, sidebar, route group layouts, Tailwind theme
provides:
  - Card browsing page with responsive grid, search, set/rarity/language filters, pagination
  - Card detail modal with attacks, stats, and add-to-collection
  - Collection management page with add/remove and quantity controls
  - Set progress bars with completion percentages
  - Shared UI components (Button, Input, Modal)
  - Zustand stores for cards and collection domains
affects: [12-06, 12-07]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Zustand per-domain stores with optimistic updates", "Responsive grid cols-2 to cols-6", "Debounced search input with 300ms delay", "CardDetailModal dual mode (browse/collection)"]

key-files:
  created:
    - apps/web/src/stores/cards.ts
    - apps/web/src/stores/collection.ts
    - apps/web/src/components/ui/Button.tsx
    - apps/web/src/components/ui/Input.tsx
    - apps/web/src/components/ui/Modal.tsx
    - apps/web/src/components/cards/CardFilters.tsx
    - apps/web/src/components/cards/CardThumbnail.tsx
    - apps/web/src/components/cards/CardGrid.tsx
    - apps/web/src/components/cards/CardDetailModal.tsx
    - apps/web/src/components/collection/CollectionFilters.tsx
    - apps/web/src/components/collection/CollectionGrid.tsx
    - apps/web/src/app/(app)/collection/page.tsx
  modified:
    - apps/web/src/app/(app)/cards/page.tsx

key-decisions:
  - "Collection store uses optimistic updates with rollback on API error"
  - "CardDetailModal supports browse and collection modes via prop"
  - "Collection store created in Task 1 alongside cards store for forward dependency"

requirements-completed: [PLAT-01, PLAT-02]

# Metrics
duration: 5min
completed: 2026-03-20
---

# Phase 12 Plan 05: Cards and Collection Pages Summary

**Responsive card grid with debounced search, set/rarity/language filters, detail modal, and collection management with optimistic add/remove and set progress bars**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-20T23:17:29Z
- **Completed:** 2026-03-20T23:22:07Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments

- Card browsing page with responsive grid (2-6 columns), debounced search, set/rarity/language filters, and pagination
- Card detail modal showing card image, stats, attacks, and add-to-collection button
- Collection page with owned card grid, quantity badges, hover +/- controls, and remove capability
- Set progress section with horizontal scrollable progress bars showing owned/total percentages
- Shared UI components: Button (3 variants, 3 sizes, loading state), Input (with label/error), Modal (portal with escape/click-outside close)
- Two Zustand stores (cards and collection) with optimistic updates and API integration

## Task Commits

1. **Task 1: Card browsing page with grid, search, filters, and detail modal** - `a88c213` (feat)
2. **Task 2: Collection management page with add/remove** - `b06c592` (feat)

## Files Created/Modified

- `apps/web/src/components/ui/Button.tsx` - Shared button with primary/secondary/ghost variants and loading state
- `apps/web/src/components/ui/Input.tsx` - Styled text input with label and error support
- `apps/web/src/components/ui/Modal.tsx` - Portal-based overlay modal with escape/click-outside close
- `apps/web/src/stores/cards.ts` - Zustand store for card search, filters, pagination, selection
- `apps/web/src/stores/collection.ts` - Zustand store for collection CRUD with optimistic updates
- `apps/web/src/components/cards/CardFilters.tsx` - Search input with 300ms debounce, set/rarity/language filters
- `apps/web/src/components/cards/CardThumbnail.tsx` - Card image with hover scale, rarity badge, name overlay
- `apps/web/src/components/cards/CardGrid.tsx` - Responsive grid with loading skeletons, pagination, empty state
- `apps/web/src/components/cards/CardDetailModal.tsx` - Dual-mode modal showing card details, attacks, and actions
- `apps/web/src/components/collection/CollectionFilters.tsx` - Search and set filter with owned count display
- `apps/web/src/components/collection/CollectionGrid.tsx` - Collection grid with quantity/language badges and hover controls
- `apps/web/src/app/(app)/cards/page.tsx` - Card browsing page composing filters, grid, and modal
- `apps/web/src/app/(app)/collection/page.tsx` - Collection page with set progress and collection grid

## Decisions Made

- Collection store created alongside cards store in Task 1 since CardDetailModal references it for "Add to Collection" action
- CardDetailModal accepts mode prop ('browse' | 'collection') to support dual usage from both pages
- Optimistic updates in collection store: UI updates immediately, rolls back on API failure
- Card search uses URL query params (q, set, rarity, language, limit, offset) matching shared cardSearchSchema

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Cards and collection pages ready for integration with remaining pages (market, proposals, meta, tierlists)
- Shared UI components (Button, Input, Modal) available for reuse in Plans 06 and 07
- Collection store provides add/remove/updateQuantity actions for cross-page interaction

## Self-Check: PASSED

All 13 key files verified present. Task 1 commit (a88c213) and Task 2 commit (b06c592) confirmed in git log. Build succeeds with /cards and /collection routes. 8 tests passing.

---
*Phase: 12-web-app-companion*
*Completed: 2026-03-20*
