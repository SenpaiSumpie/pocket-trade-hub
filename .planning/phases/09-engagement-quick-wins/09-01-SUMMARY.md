---
phase: 09-engagement-quick-wins
plan: 01
subsystem: ui
tags: [react-native, svg, probability, math, bottom-sheet]

requires:
  - phase: 04-card-data
    provides: Card schema with rarity field and set data
provides:
  - Pull rate constants (SLOT_RATES, GOD_PACK_RATE, GOD_PACK_SLOT_RATES)
  - Probability math functions (probabilityInNPacks, packsForProbability)
  - LuckCalculator bottom sheet component
  - "Calculate odds" button on CardDetailModal
affects: []

tech-stack:
  added: [react-native-svg]
  patterns: [hypergeometric-probability, bottom-sheet-modal]

key-files:
  created:
    - packages/shared/src/schemas/pull-rates.ts
    - packages/shared/src/__tests__/pull-rates.test.ts
    - apps/mobile/src/components/cards/LuckCalculator.tsx
  modified:
    - packages/shared/src/index.ts
    - apps/mobile/src/components/cards/CardDetailModal.tsx
    - apps/mobile/package.json

key-decisions:
  - "Used react-native-svg for cumulative probability curve chart"
  - "Diamond1 rarity shows 'Guaranteed in every pack' instead of probability stats"
  - "Per-card rate = (slot4Rate + slot5Rate) / cardsOfSameRarityInPack"

patterns-established:
  - "Pull rate math in shared package for reuse across platforms"

requirements-completed: [INTL-05]

duration: ~110min
completed: 2026-03-15
---

# Plan 09-01: Luck Calculator Summary

**Hypergeometric pull rate calculator with SVG probability curve, showing per-card odds and expected pack counts for any Pokemon TCG Pocket card**

## Performance

- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Pull rate constants for all slot positions with probability math functions
- 12 unit tests covering slot rate sums, edge cases, and probability calculations
- LuckCalculator bottom sheet with stats grid (pull rate, expected packs at 50%/90%, cost estimate)
- SVG cumulative probability curve with gold accent styling
- Diamond1 "Guaranteed in every pack" special case handling

## Task Commits

1. **Task 1: Pull rate constants and probability math with tests** - `dfe0bed` (feat)
2. **Task 2: LuckCalculator bottom sheet and CardDetailModal integration** - `f5caf70` (feat)

## Files Created/Modified
- `packages/shared/src/schemas/pull-rates.ts` - SLOT_RATES, probability functions
- `packages/shared/src/__tests__/pull-rates.test.ts` - 12 unit tests
- `packages/shared/src/index.ts` - Added pull-rates exports
- `apps/mobile/src/components/cards/LuckCalculator.tsx` - Bottom sheet with stats + SVG chart
- `apps/mobile/src/components/cards/CardDetailModal.tsx` - "Calculate odds" button integration
- `apps/mobile/package.json` - react-native-svg dependency

## Decisions Made
- Used react-native-svg for the probability curve (lightweight, no external charting lib needed)
- Diamond1 cards show "Guaranteed" message since they appear in slots 1-3 always
- Cost estimate uses 2 pack points per pack (Pokemon TCG Pocket standard)

## Deviations from Plan
None - plan executed as written.

## Issues Encountered
- Agent lost bash permissions mid-execution; task 2 commit completed by orchestrator

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Pull rate math available in shared package for any future features
- LuckCalculator integrated into card detail flow

---
*Phase: 09-engagement-quick-wins*
*Completed: 2026-03-15*
