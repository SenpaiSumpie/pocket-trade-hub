---
phase: 14-navigation-shell-and-app-chrome
plan: 04
subsystem: mobile-icons
tags: [icons, phosphor, migration, ui]
dependency_graph:
  requires: [14-02, 14-03]
  provides: [phosphor-icon-system]
  affects: [all-mobile-components]
tech_stack:
  added: [phosphor-react-native]
  removed: ["@expo/vector-icons (Ionicons)"]
  patterns: [component-reference-icons, weight-based-variants]
key_files:
  created:
    - apps/mobile/src/components/navigation/iconMap.ts
  modified:
    - apps/mobile/app/_layout.tsx
    - apps/mobile/app/(tabs)/index.tsx
    - apps/mobile/app/(tabs)/cards.tsx
    - apps/mobile/app/(tabs)/market.tsx
    - apps/mobile/app/(tabs)/profile.tsx
    - apps/mobile/app/(tabs)/trades.tsx
    - apps/mobile/app/card/[id].tsx
    - apps/mobile/app/notifications.tsx
    - apps/mobile/app/user/[id].tsx
    - apps/mobile/src/components/auth/LinkAccountModal.tsx
    - apps/mobile/src/components/auth/OAuthButtons.tsx
    - apps/mobile/src/components/cards/CardDetailModal.tsx
    - apps/mobile/src/components/cards/CardThumbnail.tsx
    - apps/mobile/src/components/cards/CollectionSummary.tsx
    - apps/mobile/src/components/cards/FilterChips.tsx
    - apps/mobile/src/components/cards/LuckCalculator.tsx
    - apps/mobile/src/components/cards/SearchBar.tsx
    - apps/mobile/src/components/collection/AddToCollectionModal.tsx
    - apps/mobile/src/components/export/ShareButton.tsx
    - apps/mobile/src/components/FriendCodeBadge.tsx
    - apps/mobile/src/components/LanguageSelector.tsx
    - apps/mobile/src/components/SetupChecklist.tsx
    - apps/mobile/src/components/market/MarketFilters.tsx
    - apps/mobile/src/components/market/PostCard.tsx
    - apps/mobile/src/components/market/PostCreationModal.tsx
    - apps/mobile/src/components/market/PostDetailModal.tsx
    - apps/mobile/src/components/meta/DeckDetailModal.tsx
    - apps/mobile/src/components/meta/DeckRankingList.tsx
    - apps/mobile/src/components/meta/TierListBrowser.tsx
    - apps/mobile/src/components/meta/TierListCard.tsx
    - apps/mobile/src/components/meta/TierListCreator.tsx
    - apps/mobile/src/components/meta/TierRow.tsx
    - apps/mobile/src/components/notifications/NotificationBell.tsx
    - apps/mobile/src/components/notifications/NotificationItem.tsx
    - apps/mobile/src/components/premium/AnalyticsDashboard.tsx
    - apps/mobile/src/components/premium/LockedFeatureCard.tsx
    - apps/mobile/src/components/premium/PaywallCard.tsx
    - apps/mobile/src/components/premium/PremiumBadge.tsx
    - apps/mobile/src/components/promo/RedeemCodeForm.tsx
    - apps/mobile/src/components/suggestions/SmartTradesSection.tsx
    - apps/mobile/src/components/suggestions/SuggestionCard.tsx
    - apps/mobile/src/components/trades/MatchCard.tsx
    - apps/mobile/src/components/trades/MatchDetailModal.tsx
    - apps/mobile/src/components/trades/MyPostCard.tsx
    - apps/mobile/src/components/trades/MyPostDetailModal.tsx
    - apps/mobile/src/components/trades/ProposalCard.tsx
    - apps/mobile/src/components/trades/ProposalCreationModal.tsx
    - apps/mobile/src/components/trades/ProposalDetailModal.tsx
    - apps/mobile/src/components/trades/RatingModal.tsx
decisions:
  - Converted data-driven icon maps from string-based Ionicons names to PhosphorIcon component references
  - Changed LockedFeatureCard interface from string icon prop to PhosphorIcon component prop
  - Used weight prop (fill/regular) instead of separate icon name variants for outline/filled states
  - Created iconMap.ts as documentation-only reference, not runtime dependency
metrics:
  duration: ~45min
  completed: 2026-03-21
---

# Phase 14 Plan 04: Ionicons-to-Phosphor Icon Migration Summary

Complete migration of all 50+ files from Ionicons/@expo/vector-icons to phosphor-react-native with weight-based variants and component-reference patterns for data-driven icon maps.

## What Was Done

### Task 1: Icon Mapping Reference + App-Level Migration (10 files)
**Commit:** `03a4e99`

Created `iconMap.ts` as a documentation-only reference mapping all Ionicons names to Phosphor equivalents. Migrated 10 app-level files:
- `_layout.tsx` - Toast config icon
- `index.tsx` - PreviewCard icons (Stack, GitBranch, PaperPlaneTilt), analytics section (ChartBar, CaretRight), LockedFeatureCard prop update
- `cards.tsx` - Segment tabs (GridFour, Stack, Heart), filter controls (CaretUp/Down, Globe, X), floating bar (PlusCircle, Heart, Trash)
- `market.tsx` - Empty state (Storefront), FAB (Plus, PlusCircle)
- `profile.tsx` - Star ratings, avatar (User), OAuth providers (GoogleLogo, AppleLogo), actions (CaretRight, PencilSimple, SignOut)
- `trades.tsx` - Segment tabs (Newspaper, FileText), filters (ArrowLeft, CaretUp/Down, Check), empty states (Clock)
- `card/[id].tsx` - Error icon (WarningCircle)
- `notifications.tsx` - Empty state (BellSlash)
- `user/[id].tsx` - Error/avatar/info icons (UserMinus, User, Calendar, ArrowsLeftRight)

### Task 2: Component-Level Migration (41 files)
**Commit:** `408165b`

Migrated all remaining component files across 10 subdirectories:
- **auth/** (2 files) - Link, GoogleLogo
- **cards/** (6 files) - Minus, Plus, CheckCircle, Heart, X, Stack, PlusCircle, Flag, Calculator, CaretRight, Trash, HeartBreak, CaretLeft, Circle, MagnifyingGlass, XCircle
- **collection/** (1 file) - Check, Minus, Plus, PlusCircle, Heart
- **export/** (1 file) - ShareNetwork
- **market/** (4 files) - X, CaretDown, Globe, Check, Star, Info, XCircle, Trash, PaperPlaneTilt, ArrowLeft, ArrowCircleUp/Down
- **meta/** (6 files) - X, Lock, CaretRight, Trophy, List, Plus, ShieldCheck, Heart, Trash, XCircle
- **notifications/** (2 files) - Bell, and TYPE_ICONS refactored from Record<string, string> to Record<string, PhosphorIcon>
- **premium/** (4 files) - Diamond, Lock, CheckCircle, ChartBar, GearSix, Flame, Warning, TrendUp, Lightning, CaretUp/Down
- **promo/** (1 file) - Gift, CheckCircle, WarningCircle
- **suggestions/** (2 files) - Lightning, Lightbulb, ArrowsLeftRight
- **trades/** (8 files) - Star, ArrowsLeftRight, X, Copy, ArrowCircleUp/Down, CaretRight, Info, XCircle, Trash, Newspaper, PlusCircle, Check, ArrowUTurnLeft, Trophy, StarHalf

#### Complex Patterns Handled
1. **Data-driven icon maps** (NotificationItem, AnalyticsDashboard, MyPostCard): Converted from string-based `Record<string, keyof typeof Ionicons.glyphMap>` to `Record<string, PhosphorIcon>` with dynamic component rendering via `<IconComponent />`
2. **Interface changes** (LockedFeatureCard): Changed `icon: keyof typeof Ionicons.glyphMap` prop to `Icon: PhosphorIcon`, updated all 2 callers
3. **Conditional fill/outline** (TierListCard votes, RatingModal stars): Replaced `name={voted ? 'heart' : 'heart-outline'}` with `weight={voted ? 'fill' : 'regular'}`
4. **Conditional component rendering** (CardThumbnail, SetupChecklist): Replaced ternary icon name patterns with conditional JSX using two different Phosphor components

## Deviations from Plan

None - plan executed exactly as written.

## Verification

Zero `Ionicons` or `@expo/vector-icons` imports remain in the mobile app (confirmed via grep). The only references to "Ionicons" are documentation comments in `iconMap.ts`.

## Self-Check: PASSED

- iconMap.ts: FOUND
- Commit 03a4e99: FOUND
- Commit 408165b: FOUND
- SUMMARY.md: FOUND
