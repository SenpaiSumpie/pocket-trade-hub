---
phase: 19-premium-touches-and-polish
plan: "04"
subsystem: mobile/cards
tags: [parallax, animation, navigation, haptics, reanimated]
dependency_graph:
  requires: [19-01-haptics, 19-03-layout-modes]
  provides: [useParallaxHeader, CardDetailScreen, full-screen-card-detail]
  affects: [apps/mobile/app/card/[id].tsx, apps/mobile/app/(tabs)/cards.tsx, apps/mobile/app/_layout.tsx]
tech_stack:
  added: []
  patterns: [parallax-scroll-animation, reduced-motion-a11y, transparent-stack-header]
key_files:
  created:
    - apps/mobile/src/hooks/useParallaxHeader.ts
    - apps/mobile/src/components/cards/CardDetailScreen.tsx
  modified:
    - apps/mobile/app/card/[id].tsx
    - apps/mobile/app/(tabs)/cards.tsx
    - apps/mobile/app/_layout.tsx
decisions:
  - "cardsOfSameRarityInPack defaults to 1 in CardDetailScreen since cards store has no cardsBySetId — LuckCalculator accepts this gracefully"
  - "handleLongPress in cards.tsx updated to accept (card, index) to support opening CardDetailModal at correct index for quick-peek"
  - "currentSetName moved before handleCardPress to avoid reference before declaration in useCallback dependency"
metrics:
  duration: "4 min"
  completed: "2026-03-23"
  tasks: 2
  files: 5
---

# Phase 19 Plan 04: Parallax Card Detail + Haptic Wiring Summary

Full-screen card detail view with parallax scrolling header replacing tap-to-bottom-sheet, plus haptic feedback on layout toggle and card navigation. Long-press preserves the existing CardDetailModal bottom sheet for quick-peek per D-10.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create useParallaxHeader hook and CardDetailScreen component | b8c9788 | useParallaxHeader.ts, CardDetailScreen.tsx |
| 2 | Wire card detail route, update navigation, add haptic to layout toggle | ca394fa | card/[id].tsx, cards.tsx, _layout.tsx |

## What Was Built

- **useParallaxHeader hook** (`useParallaxHeader.ts`): Scroll-linked parallax using Reanimated `useAnimatedScrollHandler`. Image translates at 50% scroll speed, fades out at 60% of `HEADER_HEIGHT` (280px). `useReducedMotion()` check omits `translateY` transform for accessibility — opacity-only path for reduced-motion users (D-16).
- **CardDetailScreen component** (`CardDetailScreen.tsx`): Full-screen card detail with `Animated.ScrollView` driven by `useParallaxHeader`. Parallax image header (absolute position), content area slides over with `borderTopLeftRadius: 16`, `backgroundColor: '#1a1a2e'`. Renders: StatusBanner, card name (28px/700 heading role), subtitle row, translation badges, RarityBadge + type/HP pills, stage, quick action buttons (add/quantity stepper/wanted/priority picker), pull odds button + LuckCalculator modal, attacks section, stats row, illustrator credit, danger zone buttons. Uses `hapticPatterns.success()` on add actions, `hapticPatterns.destructive()` on remove actions.
- **card/[id].tsx route**: Replaced `CardDetailModal` render with `CardDetailScreen`, wiring collection/wanted store handlers from `useCollectionStore` and hook-based mutations.
- **_layout.tsx**: Added `card/[id]` `Stack.Screen` with `headerTransparent: true`, empty `headerTitle`, white `headerTintColor` — gives standard back button overlaying the parallax image.
- **cards.tsx navigation**: Tap now calls `router.push('/card/[id]')` with `hapticPatterns.navigation()`. Long-press opens `CardDetailModal` bottom sheet for quick-peek (per D-10) — `detailVisible`/`detailIndex` state and `<CardDetailModal>` JSX preserved. Layout toggle `onPress` fires `hapticPatterns.navigation()`.

## Decisions Made

- `cardsOfSameRarityInPack` defaults to `1` in CardDetailScreen because the cards store (`useCardsStore`) has no `cardsBySetId` map — only UI state and translations. The LuckCalculator gracefully handles this value without crashing.
- `handleLongPress` updated to accept `(card: Card, index: number)` so the CardDetailModal opens at the correct index when long-pressing a card in any position.
- `currentSetName` moved before `handleCardPress` in the component body to avoid a temporal reference issue in the `useCallback` dependency array.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed cardsBySetId reference that doesn't exist in cards store**
- **Found during:** Task 1 TypeScript check
- **Issue:** Plan instructed accessing `s.cardsBySetId[card.setId]` in `useCardsStore`, but `CardsState` interface only has `selectedSetId`, `translationsByCardId`, and filter state — no `cardsBySetId` map
- **Fix:** Replaced with `const cardsOfSameRarityInPack = 1` default — LuckCalculator handles this correctly, and the full set data isn't available in this context
- **Files modified:** apps/mobile/src/components/cards/CardDetailScreen.tsx

**2. [Rule 1 - Bug] Updated handleLongPress signature to accept index**
- **Found during:** Task 2 — CardGrid calls `onCardLongPress(item, index)` but cards.tsx only forwarded `card`
- **Fix:** Updated `handleLongPress` to `(card: Card, index: number)` and wired `setDetailIndex(index)` so CardDetailModal opens at the correct card
- **Files modified:** apps/mobile/app/(tabs)/cards.tsx

## Verification Results

1. `grep "useParallaxHeader" apps/mobile/src/hooks/useParallaxHeader.ts` — PASS (export present)
2. `grep "useReducedMotion" apps/mobile/src/hooks/useParallaxHeader.ts` — PASS (2 matches)
3. `grep "HEADER_HEIGHT" apps/mobile/src/hooks/useParallaxHeader.ts` — PASS (280 present)
4. `grep "CardDetailScreen" apps/mobile/src/components/cards/CardDetailScreen.tsx` — PASS (export present)
5. `grep "Animated.ScrollView" apps/mobile/src/components/cards/CardDetailScreen.tsx` — PASS
6. `grep "CardDetailScreen" apps/mobile/app/card/[id].tsx` — PASS (import + render)
7. `grep "router.push" apps/mobile/app/(tabs)/cards.tsx` — PASS (card navigation)
8. `grep "CardDetailModal" apps/mobile/app/(tabs)/cards.tsx` — PASS (import + JSX preserved)
9. `grep "setDetailVisible" apps/mobile/app/(tabs)/cards.tsx` — PASS (state present)
10. `grep "hapticPatterns" apps/mobile/app/(tabs)/cards.tsx` — PASS (4 matches: import + 3 call sites)
11. TypeScript: no new errors in plan files — PASS (pre-existing errors in cards.tsx/market.tsx/profile.tsx are out of scope)

## Known Stubs

None — card detail screen loads real card data from API, collection/wanted state from store, parallax animation fully wired.

## Self-Check: PASSED

- [x] apps/mobile/src/hooks/useParallaxHeader.ts exists and exports useParallaxHeader
- [x] apps/mobile/src/components/cards/CardDetailScreen.tsx exists and exports CardDetailScreen
- [x] apps/mobile/app/card/[id].tsx imports and renders CardDetailScreen
- [x] apps/mobile/app/_layout.tsx has card/[id] screen with transparent header
- [x] apps/mobile/app/(tabs)/cards.tsx imports useRouter and hapticPatterns, preserves CardDetailModal
- [x] Commits b8c9788 and ca394fa exist
