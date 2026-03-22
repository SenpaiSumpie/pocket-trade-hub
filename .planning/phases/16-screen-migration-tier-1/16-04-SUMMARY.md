---
phase: 16-screen-migration-tier-1
plan: "04"
subsystem: mobile-trades-tab
tags: [ui, trades, card-components, skeletons, animations, react-native]
dependency_graph:
  requires:
    - apps/mobile/src/components/ui/Card.tsx
    - apps/mobile/src/components/ui/Text.tsx
    - apps/mobile/src/components/ui/Badge.tsx
    - apps/mobile/src/components/ui/EmptyState.tsx
    - apps/mobile/src/components/skeleton/PostListSkeleton.tsx
    - apps/mobile/src/components/skeleton/ProposalListSkeleton.tsx
    - apps/mobile/src/hooks/useStaggeredList.ts
  provides:
    - apps/mobile/src/components/trades/MyPostCard.tsx
    - apps/mobile/src/components/trades/ProposalCard.tsx
    - apps/mobile/src/components/trades/MatchCard.tsx
    - apps/mobile/app/(tabs)/trades.tsx
  affects:
    - apps/mobile/app/(tabs)/trades.tsx
tech_stack:
  added: []
  patterns:
    - Card primitive wrapping for animated press + haptic feedback
    - Badge variant-based status indicators (success/warning/error/default)
    - Skeleton shimmer in loading state instead of ActivityIndicator
    - useStaggeredList gated behind loaded data count to avoid premature animation
    - RefreshControl with tintColor=#f0c040 for gold pull-to-refresh
    - Animated.View wrapping FlashList renderItem for staggered entrance
key_files:
  created: []
  modified:
    - apps/mobile/src/components/trades/MyPostCard.tsx
    - apps/mobile/src/components/trades/ProposalCard.tsx
    - apps/mobile/src/components/trades/MatchCard.tsx
    - apps/mobile/app/(tabs)/trades.tsx
decisions:
  - "BadgeVariant type imported directly from @/src/components/ui/Badge since it is not re-exported via index.ts barrel"
  - "Stagger count gated behind loaded data (staggerCount = loading ? 0 : items.length) per Pitfall 4 to avoid premature animation"
  - "Proposals empty state uses ArrowsLeftRight icon for active view and Sparkle for history view — contextual iconography"
metrics:
  duration: 3 min
  completed_date: "2026-03-22T00:24:59Z"
  tasks: 2
  files_modified: 4
---

# Phase 16 Plan 04: Trades Tab Screen Migration Summary

Trade card components (MyPostCard, ProposalCard, MatchCard) migrated to Card/Text/Badge primitives with animated press + haptics, and trades.tsx updated with PostListSkeleton/ProposalListSkeleton shimmer loading, contextual EmptyState per segment, staggered list entrance animation, and gold pull-to-refresh.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Migrate MyPostCard, ProposalCard, MatchCard to Card primitive | 841bcbd | MyPostCard.tsx, ProposalCard.tsx, MatchCard.tsx |
| 2 | Migrate trades.tsx with skeletons, empty states, staggered list, gold refresh | 04096db | trades.tsx, ProposalCard.tsx |

## What Was Built

### Task 1: Trade Card Components

All three trade card components now use the `Card` primitive as their root container:

- **MyPostCard**: `Card onPress` replaces `TouchableOpacity`. Status uses `Badge` with `variant="success"/"warning"/"default"`. Text uses `Text` primitive with `preset="label"` for secondary info. Type badge retains custom coloured pill since it includes an icon with custom colors not covered by Badge variants.
- **ProposalCard**: `Card onPress` replaces `TouchableOpacity`. Status uses `Badge` with variant mapping (`pending→default`, `accepted→success`, `rejected→error`, etc.). Text elements use `Text` primitive. Layout structure (partner row, card preview, trade row) unchanged.
- **MatchCard**: `Card onPress` replaces `TouchableOpacity`. Text elements use `Text` primitive with `preset="label"` and `color` props for secondary/muted text. Partner avatar, card thumbnails, and star rating rendering unchanged.

### Task 2: Trades Tab Screen

The `trades.tsx` screen now:

1. **Skeleton loading**: When `loading && isEmpty`, renders `<PostListSkeleton />` for posts segment or `<ProposalListSkeleton />` for proposals segment — no `ActivityIndicator` remains.
2. **Contextual empty states**: Three distinct `EmptyState` components per state — `Tag` icon for "No posts yet" (with CTA), `ArrowsLeftRight` for "No proposals yet" (no CTA since proposals come from others), `Sparkle` for "No trade history".
3. **Staggered entrance**: `useStaggeredList(staggerCount)` where `staggerCount = loading ? 0 : items.length` gates animation behind loaded data. Each `renderItem` wraps content in `<Animated.View style={getItemStyle(index)}>`.
4. **Gold refresh**: Both FlashList instances use `<RefreshControl tintColor="#f0c040" colors={["#f0c040"]} />` instead of inline `refreshing`/`onRefresh` props.
5. **Badge/Text/EmptyState imports**: Tab badge counts, filter labels, and empty state all use `@/src/components/ui` primitives.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing] BadgeVariant type not exported from ui barrel index**
- **Found during:** Task 1 (ProposalCard migration)
- **Issue:** `BadgeVariant` type exists in `Badge.tsx` but is not re-exported from `@/src/components/ui/index.ts`
- **Fix:** Changed import to `import type { BadgeVariant } from '@/src/components/ui/Badge'` — direct module path
- **Files modified:** apps/mobile/src/components/trades/ProposalCard.tsx
- **Commit:** 04096db

## Known Stubs

None — all data flows are live (myPosts, proposals from existing hooks).

## Self-Check: PASSED

All 4 modified files present. Both task commits (841bcbd, 04096db) verified in git log.
