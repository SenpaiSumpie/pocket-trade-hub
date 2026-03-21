---
phase: 15
plan: 05
subsystem: mobile-ui
tags: [animation, bottom-sheet, modal-migration, detail-sheets]
one_liner: "Converted all 6 detail modals from React Native Modal to DetailSheet bottom sheets with drag-to-dismiss and backdrop tap"

dependency_graph:
  requires: [15-04]
  provides: [modal-to-sheet-migration-complete]
  affects: [cards-ui, market-ui, meta-ui, trades-ui]

tech_stack:
  added: []
  patterns:
    - "DetailSheet wraps detail content replacing Modal/overlay/container/ScrollView chrome"
    - "onClose prop passed as onDismiss to DetailSheet — zero consumer API change"
    - "Internal creation modals (ProposalCreationModal, LuckCalculator) preserved as Modal per D-02"

key_files:
  modified:
    - apps/mobile/src/components/cards/CardDetailModal.tsx
    - apps/mobile/src/components/market/PostDetailModal.tsx
    - apps/mobile/src/components/meta/DeckDetailModal.tsx
    - apps/mobile/src/components/trades/MatchDetailModal.tsx
    - apps/mobile/src/components/trades/MyPostDetailModal.tsx
    - apps/mobile/src/components/trades/ProposalDetailModal.tsx

decisions:
  - "Internal LuckCalculator modal in CardDetailModal preserved as Modal — it is a self-contained calculator popup, not a detail view"
  - "Internal ProposalCreationModal in MatchDetailModal and ProposalDetailModal preserved as Modal per D-02 (creation modals not converted)"
  - "X icon removed from phosphor imports in files where it was only used for the close button"
  - "postNotice section moved inside DetailSheet content area in ProposalDetailModal — was previously outside ScrollView but inside modal container"

metrics:
  duration_minutes: 5
  tasks_completed: 2
  files_modified: 6
  completed_date: "2026-03-21"
---

# Phase 15 Plan 05: Modal-to-Sheet Migration Summary

Converted all 6 detail modals from React Native Modal to DetailSheet bottom sheets, replacing static full-screen modals with gesture-driven bottom sheets that support drag-to-dismiss and backdrop tap dismiss per design decision D-01.

## Tasks Completed

### Task 1: Convert CardDetailModal, PostDetailModal, DeckDetailModal

**CardDetailModal.tsx** (1106 lines — largest file):
- Replaced `<Modal animationType="slide" presentationStyle="fullScreen">` with `<DetailSheet visible={visible} onDismiss={onClose}>`
- Removed close button (X Pressable), container View, overlay chrome
- Removed `closeBtn`, `container` styles; updated `shareBtn`/`navArrows` to remove status bar offset
- Preserved: FlatList card swiper, export renderer, header with share button and web nav arrows, LuckCalculator internal Modal

**PostDetailModal.tsx** (432 lines):
- Replaced `<Modal>` + `<SafeAreaView>` + `<View container>` + `<ScrollView>` with `<DetailSheet>`
- Removed close button (X Pressable), overlay, container, scrollContent styles
- Preserved: export renderer, post actions (propose/close/delete), all content

**DeckDetailModal.tsx** (430 lines):
- Replaced `<Modal presentationStyle="pageSheet">` + container + ScrollView with `<DetailSheet>`
- Removed close button, container, scrollView, scrollContent, closeButton styles
- Preserved: stats grid, card list grouped by type, premium matchup/tournament sections, PaywallCard

### Task 2: Convert MatchDetailModal, MyPostDetailModal, ProposalDetailModal

**MatchDetailModal.tsx** (277 lines):
- Replaced `<Modal animationType="slide" transparent>` + overlay + modalContainer + ScrollView with `<DetailSheet>`
- Removed close button (X TouchableOpacity), overlay, modalContainer, scrollContent styles
- Preserved: partner header, star rating, card pair columns, Propose Trade button, ProposalCreationModal internal modal (D-02)

**MyPostDetailModal.tsx** (320 lines):
- Replaced `<Modal>` + overlay + SafeAreaView + modalContainer + ScrollView with `<DetailSheet>`
- Removed close button, overlay, safeArea, modalContainer, closeButton, scrollContent styles
- Preserved: card image, type/status badges, card details, status notice, close/delete action buttons

**ProposalDetailModal.tsx** (669 lines):
- Replaced `<Modal>` + overlay + modalContainer with `<DetailSheet>`
- Removed close button, overlay, modalContainer, closeButton, scrollContent styles
- Moved postNotice section inside content area (was outside ScrollView in original structure)
- Preserved: loading state, partner reputation header, friend code box, proposal thread history, accept/reject/counter/complete/rate actions, ProposalCreationModal counter-offer modal (D-02)

## Deviations from Plan

None — plan executed exactly as written. All 6 modals converted with the consistent pattern described.

## Known Stubs

None. All content renders from live data sources. No hardcoded placeholders introduced.

## Verification

- All 6 detail modals import and use `DetailSheet` with `visible` and `onDismiss` props
- No outer `<Modal visible={visible}` remains in any of the 6 files
- Internal creation modals (LuckCalculator, ProposalCreationModal) preserved as Modal per D-02
- Creation modals (PostCreationModal, ProposalCreationModal) NOT converted — confirmed unchanged
- Props interfaces unchanged: all files still accept `visible: boolean` and `onClose: () => void`

## Self-Check: PASSED

All 6 modal files exist and contain DetailSheet imports. Task commits 4f1910d and 730a482 verified in git log.
