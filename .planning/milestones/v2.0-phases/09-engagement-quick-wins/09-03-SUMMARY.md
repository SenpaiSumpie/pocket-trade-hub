---
phase: 09-engagement-quick-wins
plan: 03
subsystem: ui
tags: [react-native-view-shot, expo-sharing, image-export, share-sheet, watermark]

# Dependency graph
requires:
  - phase: 08-post-based-trading
    provides: PostDetailModal and MarketPost types for post export
  - phase: 06-premium-tier
    provides: isPremium user status for watermark gating
provides:
  - Image export hook (useImageExport) with captureRef and shareAsync
  - Four export templates (Collection, Post, Wanted, Card)
  - ShareButton reusable component
  - ExportRenderer offscreen capture wrapper
  - Share button integration on CardDetailModal, CollectionSummary, PostDetailModal
affects: [13-web-app-companion]

# Tech tracking
tech-stack:
  added: [react-native-view-shot, expo-sharing]
  patterns: [offscreen-render-capture, forwardRef-export-templates]

key-files:
  created:
    - apps/mobile/src/hooks/useImageExport.ts
    - apps/mobile/src/components/export/ExportRenderer.tsx
    - apps/mobile/src/components/export/ShareButton.tsx
    - apps/mobile/src/components/export/templates/CollectionExport.tsx
    - apps/mobile/src/components/export/templates/PostExport.tsx
    - apps/mobile/src/components/export/templates/WantedExport.tsx
    - apps/mobile/src/components/export/templates/CardExport.tsx
  modified:
    - apps/mobile/src/components/cards/CardDetailModal.tsx
    - apps/mobile/src/components/cards/CollectionSummary.tsx
    - apps/mobile/src/components/market/PostDetailModal.tsx

key-decisions:
  - "Offscreen positioning (left: -9999) instead of display:none for react-native-view-shot compatibility"
  - "Fixed 1080px width for consistent export resolution across devices"
  - "file:// prefix on captureRef result for Android compatibility"

patterns-established:
  - "Offscreen capture pattern: ExportRenderer wraps template at position absolute left -9999 with collapsable={false}"
  - "Export template pattern: forwardRef components with showWatermark prop gated by isPremium"

requirements-completed: [DISC-03]

# Metrics
duration: 8min
completed: 2026-03-15
---

# Phase 9 Plan 3: Image Export Summary

**Four branded image export templates (card, collection, post, wanted) with native share sheet via react-native-view-shot and expo-sharing, watermark gated by premium status**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-15
- **Completed:** 2026-03-15
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments
- Created useImageExport hook wrapping captureRef + shareAsync for one-call export-and-share
- Built four styled export templates (dark background, gold accents) for collection, post, wanted list, and single card
- Integrated share buttons into CardDetailModal, CollectionSummary, and PostDetailModal
- Watermark branding on free user exports, clean exports for premium users

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies, create export hook, renderer, and four export templates** - `e6c4ad3` (feat)
2. **Task 2: Integrate share buttons into existing screens** - `ce82dcf` (feat)
3. **Task 3: Verify image export visuals and share flow** - checkpoint:human-verify (approved, no commit)

## Files Created/Modified
- `apps/mobile/src/hooks/useImageExport.ts` - captureRef + shareAsync hook returning viewRef, exportAndShare, exporting state
- `apps/mobile/src/components/export/ExportRenderer.tsx` - Offscreen wrapper for capture targets (position absolute, left -9999)
- `apps/mobile/src/components/export/ShareButton.tsx` - Reusable share icon button with loading state
- `apps/mobile/src/components/export/templates/CollectionExport.tsx` - Collection summary export (set name, completion %, card grid)
- `apps/mobile/src/components/export/templates/PostExport.tsx` - Trade post export (Offering/Seeking badge, card list)
- `apps/mobile/src/components/export/templates/WantedExport.tsx` - Wanted list export (card grid with priority indicators)
- `apps/mobile/src/components/export/templates/CardExport.tsx` - Single card showcase export (large image, rarity, set name)
- `apps/mobile/src/components/cards/CardDetailModal.tsx` - Added share button with CardExport template
- `apps/mobile/src/components/cards/CollectionSummary.tsx` - Added share button with CollectionExport template
- `apps/mobile/src/components/market/PostDetailModal.tsx` - Added share button with PostExport template

## Decisions Made
- Used offscreen positioning (left: -9999) instead of display:none since react-native-view-shot requires rendered views
- Fixed 1080px width for export templates to ensure consistent resolution regardless of device screen
- Always prepend file:// to captureRef URI for Android share compatibility

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Image export infrastructure complete and integrated into key screens
- WantedExport template created but not yet wired to a wanted list screen (can be connected when that screen exists)
- Pattern established for adding export to any future screen: import ShareButton + ExportRenderer + template + useImageExport

## Self-Check: PASSED

- All 10 source files verified present on disk
- Commits e6c4ad3 and ce82dcf verified in git log
- SUMMARY.md created at expected path

---
*Phase: 09-engagement-quick-wins*
*Completed: 2026-03-15*
