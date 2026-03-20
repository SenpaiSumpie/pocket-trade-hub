---
phase: 12-web-app-companion
plan: 06
subsystem: ui
tags: [marketplace, trading, proposals, zustand, modal, filters, accept-reject-counter]

# Dependency graph
requires:
  - phase: 12-web-app-companion
    provides: Next.js scaffold, apiFetch, sidebar, route group layouts, Tailwind theme, shared UI components (Button, Input, Modal), card store
provides:
  - Marketplace page with post browsing, type/search/filter controls, pagination
  - Post creation modal with 3-step wizard flow
  - Post detail modal with send proposal and delete actions
  - Proposals page with received/sent tabs and pending count badge
  - Full proposal workflow (accept, reject, counter with card search)
  - Create proposal modal for sending proposals from post detail
  - Zustand stores for posts and proposals domains
affects: [12-07]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Post store with filter/pagination state", "Proposal store with accept/reject/counter actions", "Confirmation dialog pattern in ProposalDetailModal", "3-step wizard modal pattern in CreatePostModal", "Fairness indicator with score thresholds"]

key-files:
  created:
    - apps/web/src/stores/posts.ts
    - apps/web/src/stores/proposals.ts
    - apps/web/src/components/trading/PostFilters.tsx
    - apps/web/src/components/trading/PostCard.tsx
    - apps/web/src/components/trading/PostList.tsx
    - apps/web/src/components/trading/PostDetailModal.tsx
    - apps/web/src/components/trading/CreatePostModal.tsx
    - apps/web/src/components/trading/ProposalCard.tsx
    - apps/web/src/components/trading/ProposalList.tsx
    - apps/web/src/components/trading/ProposalDetailModal.tsx
    - apps/web/src/components/trading/CreateProposalModal.tsx
    - apps/web/src/app/(app)/market/page.tsx
    - apps/web/src/app/(app)/proposals/page.tsx
  modified: []

key-decisions:
  - "Fairness score thresholds: >=80 Great, >=60 Fair, >=40 Uneven, <40 Poor"
  - "Confirmation dialog for accept/reject to prevent accidental actions"
  - "Counter-offer form embedded in ProposalDetailModal rather than separate modal"

requirements-completed: [PLAT-02]

# Metrics
duration: 5min
completed: 2026-03-20
---

# Phase 12 Plan 06: Marketplace and Proposals Pages Summary

**Marketplace page with post browsing/creation and proposals page with full accept/reject/counter workflow using Zustand stores and card search integration**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-20T23:26:27Z
- **Completed:** 2026-03-20T23:31:40Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments

- Marketplace page with responsive 3-column grid, type toggle (All/Offering/Seeking), search, set/rarity/language filters, and pagination
- Post creation via 3-step wizard modal: select type, search and select cards, review and submit
- Post detail modal showing all cards with images, poster info, delete (own posts) and send proposal (others) actions
- Proposals page with received/sent tab toggle, pending count badge, and full proposal workflow
- Accept/reject with confirmation dialogs, counter-offer with inline card search form
- CreateProposalModal for sending proposals directly from post detail with card search
- Build succeeds with /market and /proposals routes, 8 tests passing

## Task Commits

1. **Task 1: Market page with post browsing, filtering, and creation** - `2b8cf95` (feat)
2. **Task 2: Proposals page with full accept/reject/counter workflow** - `9d7d287` (feat)

## Files Created/Modified

- `apps/web/src/stores/posts.ts` - Zustand store for post fetch, filter, pagination, create, delete
- `apps/web/src/stores/proposals.ts` - Zustand store for proposal fetch, accept, reject, counter, create
- `apps/web/src/components/trading/PostFilters.tsx` - Type toggle, debounced search, set/rarity/language filters, create button
- `apps/web/src/components/trading/PostCard.tsx` - Post card with type badge, card thumbnails, poster info, time ago
- `apps/web/src/components/trading/PostList.tsx` - Responsive grid with loading skeletons, empty state, pagination
- `apps/web/src/components/trading/PostDetailModal.tsx` - Post detail overlay with card images and actions
- `apps/web/src/components/trading/CreatePostModal.tsx` - 3-step wizard: type, card search/select, review/submit
- `apps/web/src/components/trading/ProposalCard.tsx` - Status badge, fairness indicator, card exchange preview
- `apps/web/src/components/trading/ProposalList.tsx` - Received/sent tabs with pending count, loading/empty states
- `apps/web/src/components/trading/ProposalDetailModal.tsx` - Full detail with accept/reject/counter workflow
- `apps/web/src/components/trading/CreateProposalModal.tsx` - Send proposal from post with card search
- `apps/web/src/app/(app)/market/page.tsx` - Marketplace page composing filters, list, and modals
- `apps/web/src/app/(app)/proposals/page.tsx` - Proposals page with pending count badge

## Decisions Made

- Fairness score display thresholds: >=80 "Great" (green), >=60 "Fair" (yellow), >=40 "Uneven" (orange), <40 "Poor" (red)
- Accept/reject require confirmation dialog click to prevent accidental actions
- Counter-offer form is embedded inline in ProposalDetailModal (not a separate modal) for smoother UX
- Default fairness score of 50 when creating proposals from post detail (server can recalculate)
- Post store uses optimistic delete with rollback on API error

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Marketplace and proposals pages complete, ready for final plan (12-07)
- All trading components available for cross-page integration
- Post and proposal stores provide full CRUD actions for the trading workflow

## Self-Check: PASSED

All 13 key files verified present. Task 1 commit (2b8cf95) and Task 2 commit (9d7d287) confirmed in git log. Build succeeds with /market and /proposals routes. 8 tests passing.

---
*Phase: 12-web-app-companion*
*Completed: 2026-03-20*
