# Phase 17: Screen Migration Tier 2 - Research

**Researched:** 2026-03-21
**Domain:** React Native screen migration — visual refresh with Phase 16 primitives, glassmorphism (expo-blur), SVG gradient accents, skeleton compositions
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Market Tab (SCR-04)**
- D-01: Premium PostCard gets a 3px gold gradient left-border accent (gold[400]→gold[600])
- D-02: Premium boost indicator = Badge `premium` variant (gold solid, dark text), not a full-card gradient
- D-03: FAB adopts Button `primary` variant styling (gold fill), no gradient on FAB itself
- D-04: Filter chips → Badge primitive; search bar → Input primitive focus ring
- D-05: PostCard wraps in Card primitive; internal horizontal layout (image left, info right) unchanged
- D-06: MarketPostSkeleton — horizontal card shape with image placeholder + text lines
- D-07: EmptyState: Package icon + "No posts yet" + "Create Post" CTA
- D-08: Gold pull-to-refresh on FlashList

**Meta Tab (SCR-05)**
- D-09: Deck ranking cards → Card primitive; rank number = circular Badge (`default` variant, bold)
- D-10: Win/usage rate stats use Text `label` preset for label, `body` preset for value — data density unchanged
- D-11: Tier list cards → Card primitive; tier preview pills → Badge with rarity-mapped colors (S=gold, A=purple, B=blue, C=green, D=gray)
- D-12: Sort toggle pills → Button `ghost` (unselected) / `secondary` (selected)
- D-13: "Official" badge → Badge `success` variant + Shield icon
- D-14: Vote button → Button `ghost` unselected / `primary` voted
- D-15: DeckRankingSkeleton (3 rows) and TierListSkeleton (3 rows)
- D-16: EmptyState for empty rankings (Trophy) and empty tier lists (ListBullets)
- D-17: Preserve all current data points — visual consistency, not information reduction

**Profile Tab (SCR-06)**
- D-18: Glassmorphism on avatar/header section only — BlurView `intensity={40}` tint="dark"
- D-19: Glassmorphism header has gold overlay at 8% opacity (`rgba(240,192,64,0.08)`)
- D-20: Info sections (friend code, linked accounts, member since, language) → Card primitive (standard, not glass)
- D-21: Edit Profile → Button `primary`; Logout → Button `destructive`
- D-22: Link/Unlink account buttons → Button `secondary`
- D-23: Premium badge next to display name → Badge `premium` variant
- D-24: PaywallCard → Card primitive + 2px gold gradient top-border accent
- D-25: Reputation stars keep current visual (no changes)
- D-26: Replace ActivityIndicator loading with inline shimmer (ShimmerText for text fields)
- D-27: ProfileHeaderSkeleton (avatar shimmer + name shimmer + badge shimmer)
- D-28: Settings same sections/order — primitives only, no restructuring

**Shared (all three tabs)**
- D-29: Gold pull-to-refresh — `tintColor="#f0c040"` (iOS), `colors={["#f0c040"]}` (Android)
- D-30: useStaggeredList for entrance animations on list/section content
- D-31: Toast notifications for user actions (see UI-SPEC toast table)
- D-32: Modals stay as plain Modal components — DetailSheet migration out of scope

### Claude's Discretion
- Exact skeleton item counts and dimensions (within the spec ranges from UI-SPEC)
- Toast message copy for each action (fully defined in UI-SPEC)
- EmptyState subtitle copy and icon weights (fully defined in UI-SPEC)
- Staggered animation item grouping
- Whether to extract PostCard into its own component file or keep inline
- Glassmorphism blur intensity fine-tuning
- Gradient color stops and opacity values

### Deferred Ideas (OUT OF SCOPE)
- Modal → DetailSheet migration for Market/Meta modals
- Profile tab restructuring (reordering sections, adding new settings)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SCR-04 | Market tab refresh with gradient accents on premium sections | PostCard migration to Card primitive, Badge `premium` variant addition, SVG LinearGradient for left-border, MarketFilters chip/input migration, MarketPostSkeleton, EmptyState, gold PTR, stagger, toasts |
| SCR-05 | Meta tab refresh with deck cards and tier list visual overhaul | DeckRankingList and TierListBrowser card migration, sort-toggle Button migration, tier Badge colors, official Badge, vote Button, DeckRankingSkeleton, TierListSkeleton, EmptyStates, gold PTR, stagger, toasts |
| SCR-06 | Profile tab refresh with glassmorphism backdrops and settings redesign | expo-blur BlurView header, gold overlay, Card primitive info sections, Button variants for Edit/Logout/Link/Unlink, Badge premium for name, PaywallCard top-border gradient, ProfileHeaderSkeleton, ShimmerText loading, stagger, toasts |
</phase_requirements>

---

## Summary

Phase 17 applies the same migration playbook established in Phase 16 to the three remaining tabs: Market, Meta, and Profile. All Phase 16 primitives (Button, Card, Text, Badge, Input, Divider, EmptyState, ToastOverlay) are already built and available. The animation infrastructure (useAnimatedPress, useStaggeredList, useShimmer, Shimmer/ShimmerBox/ShimmerCircle/ShimmerText) is also complete. This phase is additive rather than foundational — the main new work items are: (1) adding the `premium` Badge variant, (2) installing `expo-blur` for the Profile glassmorphism header, (3) creating three new skeleton compositions, and (4) migrating nine existing component files.

**expo-blur is NOT currently installed** — it is absent from `apps/mobile/package.json`. The first plan that touches Profile tab must add `expo install expo-blur` before implementing the BlurView header.

The SVG LinearGradient approach for gradient accents (left-border on PostCard, top-border on PaywallCard) reuses the same `react-native-svg` already installed (v15.12.1, used for shimmer sweep in Phase 15). No new gradient library is needed.

**Primary recommendation:** Migrate in three independent plans (one per tab), with a shared Wave 0 plan for Badge `premium` variant and expo-blur install, since Market and Profile both need `premium` and Profile is blocked on expo-blur.

---

## Standard Stack

### Core (all already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native-reanimated | 4.1.6 | All animations | Project standard since Phase 15 |
| react-native-svg | 15.12.1 | SVG LinearGradient for accents | Already used for shimmer in Phase 15 |
| @shopify/flash-list | 2.0.2 | Market/Meta list rendering | Already used in market.tsx and DeckRankingList |
| phosphor-react-native | ^3.0.3 | All icons | Phase 14 full migration |
| zustand | ^5.0.11 | Toast store, meta store, tier list store | Project standard |
| expo-haptics | ^55.0.8 | Haptic feedback in useAnimatedPress | Phase 15 standard |

### New Dependency
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| expo-blur | ~15.0.x (Expo 54 compatible) | BlurView for Profile glassmorphism header | NOT INSTALLED — must add |

**Version note (HIGH confidence):** Expo SDK 54 is installed (`expo: ~54.0.33`). The matching expo-blur version is `~15.0.x`. Verify with `expo install expo-blur` which resolves the correct compatible version automatically.

### Phase 16 Primitives (ready to use, no changes required except Badge)
| Component | Path | Changes in Phase 17 |
|-----------|------|---------------------|
| Button | `apps/mobile/src/components/ui/Button.tsx` | None — use as-is |
| Card | `apps/mobile/src/components/ui/Card.tsx` | None — use as-is |
| Text | `apps/mobile/src/components/ui/Text.tsx` | None — use as-is |
| Badge | `apps/mobile/src/components/ui/Badge.tsx` | Add `premium` variant |
| Input | `apps/mobile/src/components/ui/Input.tsx` | None — use as-is |
| Divider | `apps/mobile/src/components/ui/Divider.tsx` | None — use as-is |
| EmptyState | `apps/mobile/src/components/ui/EmptyState.tsx` | None — use as-is |
| ToastOverlay | `apps/mobile/src/components/ui/ToastOverlay.tsx` | None — use as-is |
| useToast | `apps/mobile/src/hooks/useToast.ts` | None — use as-is |

**Installation:**
```bash
cd apps/mobile && expo install expo-blur
```

---

## Architecture Patterns

### Recommended Project Structure (additions only)
```
apps/mobile/src/
├── components/
│   ├── ui/
│   │   └── Badge.tsx              # Add `premium` variant (one-line addition to variantMap)
│   ├── skeleton/
│   │   ├── MarketPostSkeleton.tsx  # NEW — horizontal card, 3 rows
│   │   ├── DeckRankingSkeleton.tsx # NEW — 3 rows with circle + stats
│   │   └── TierListSkeleton.tsx    # NEW — 3 rows with pill row
│   ├── market/
│   │   ├── PostCard.tsx            # MIGRATE — Card primitive + premium border
│   │   └── MarketFilters.tsx       # MIGRATE — chips → Badge, search → Input
│   ├── meta/
│   │   ├── DeckRankingList.tsx     # MIGRATE — Card + Button sort toggles
│   │   ├── TierListBrowser.tsx     # MIGRATE — Button sort toggles
│   │   └── TierListCard.tsx        # MIGRATE — Card + Badge tiers + Button vote
│   └── profile/
│       └── PaywallCard.tsx         # MIGRATE — Card + gradient top border
└── app/(tabs)/
    ├── market.tsx                  # MIGRATE — FAB → Button, EmptyState, stagger, PTR, toasts
    ├── meta.tsx                    # MIGRATE — EmptyState integration (from sub-components)
    └── profile.tsx                 # MIGRATE — BlurView header, Card sections, Button actions, stagger, toasts
```

### Pattern 1: Badge `premium` Variant Addition

**What:** Add one entry to the `variantMap` in `Badge.tsx`
**When to use:** Market PostCard boost indicator, Profile display name next to premium users

```typescript
// Badge.tsx — add to BadgeVariant union and variantMap
export type BadgeVariant =
  | 'default' | 'success' | 'warning' | 'error'
  | 'rarity-diamond' | 'rarity-star' | 'rarity-crown'
  | 'premium';  // NEW

// In variantMap:
premium: {
  backgroundColor: '#f0c040',      // palette.gold[500] solid fill
  textColor: '#0c0c18',            // dark text on gold — same as primary Button text
},
```

**Source:** UI-SPEC §Badge — New `premium` Variant, CONTEXT.md D-02/D-23

### Pattern 2: SVG LinearGradient Accent Border

**What:** Absolute-positioned thin View filled with SVG LinearGradient, overlaid on a Card's edge
**When to use:** PostCard premium left-border (3px vertical), PaywallCard top-border (2px horizontal)

```typescript
// Left-border accent (PostCard premium gradient) — 3px vertical strip
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

function PremiumBorderAccent({ height }: { height: number }) {
  return (
    <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 }}>
      <Svg width={3} height={height}>
        <Defs>
          <LinearGradient id="premiumGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#f5d060" stopOpacity="1" />  {/* palette.gold[400] */}
            <Stop offset="1" stopColor="#c9a020" stopOpacity="1" />  {/* palette.gold[600] */}
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={3} height={height} fill="url(#premiumGrad)" />
      </Svg>
    </View>
  );
}
```

**Key pitfall:** SVG LinearGradient IDs must be unique per instance when multiple premium cards are rendered in a list. Use a unique ID per render (e.g., `premiumGrad-${post.id}`) to avoid gradient color bleeding between cards on Android.

**Source:** UI-SPEC §Gradient Accent Patterns, confirmed by react-native-svg usage in Phase 15 shimmer (same SVG LinearGradient pattern with id="shimmerGrad")

### Pattern 3: expo-blur Glassmorphism Header

**What:** BlurView wraps only the avatar + name section of the Profile header
**When to use:** Profile tab header section only (D-18)

```typescript
import { BlurView } from 'expo-blur';
import { View } from 'react-native';

// Glassmorphism header container
<BlurView intensity={40} tint="dark" style={styles.glassHeader}>
  {/* Gold overlay at 8% opacity — absolute fill */}
  <View style={styles.goldOverlay} pointerEvents="none" />
  {/* Avatar, display name, premium badge, email, reputation */}
  <View style={styles.headerContent}>
    {/* ... */}
  </View>
</BlurView>

// Styles
glassHeader: {
  borderRadius: borderRadius.lg,
  overflow: 'hidden',           // Required for BlurView border radius to clip
  marginHorizontal: spacing.md,
  marginBottom: spacing.xl,
},
goldOverlay: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: 'rgba(240, 192, 64, 0.08)',
},
```

**Source:** CONTEXT.md D-18/D-19, UI-SPEC §Glassmorphism Profile Header

### Pattern 4: Tier Badge Colors (one-off Badge style overrides)

**What:** Tier preview pills on TierListCard use Badge primitive with color overrides via the `style` prop — no new variants needed
**When to use:** TierListCard tier preview section (S/A/B/C/D pills)

```typescript
const TIER_BADGE_STYLES: Record<string, { bg: string; text: string }> = {
  S: { bg: 'rgba(240, 192, 64, 0.2)',  text: '#f0c040' },  // gold
  A: { bg: 'rgba(167, 139, 250, 0.2)', text: '#a78bfa' },  // purple
  B: { bg: 'rgba(96, 165, 250, 0.2)',  text: '#60a5fa' },  // blue
  C: { bg: 'rgba(52, 211, 153, 0.2)',  text: '#34d399' },  // green
  D: { bg: colors.surfaceLight,        text: colors.textMuted }, // gray
};

// Usage:
<Badge
  label={tierKey}
  variant="default"
  style={{
    backgroundColor: TIER_BADGE_STYLES[tierKey].bg,
  }}
  // Note: Badge.tsx needs a textStyle prop OR inline text color override
  // Alternative: render a custom View+Text matching Badge dimensions for tier pills
/>
```

**Pitfall:** The current `Badge` component does not expose a `textStyle` prop — only `label` (string) and `style` (ViewStyle). For tier pills where text color must change per tier, either (a) add a `textColor` prop to Badge, or (b) render tier pills as inline View+Text matching Badge dimensions rather than using the Badge primitive. Option (b) avoids a primitive change and is simpler.

**Source:** UI-SPEC §Tier Badge Colors (Meta Tab), Badge.tsx source inspection

### Pattern 5: Sort Toggle Migration (DeckRankingList, TierListBrowser)

**What:** Replace manual Pressable sort pills with Button primitive
**When to use:** DeckRankingList sortRow, TierListBrowser sortRow

```typescript
// Replace:
<Pressable style={[styles.sortPill, active && styles.sortPillActive]} onPress={() => setSortBy(opt.key)}>
  <Text ...>{t(opt.labelKey)}</Text>
</Pressable>

// With:
<Button
  label={t(opt.labelKey)}
  variant={active ? 'secondary' : 'ghost'}
  size="sm"
  onPress={() => setSortBy(opt.key)}
/>
```

**Note:** Button `sm` size is 32px height. Use `md` (44px) to meet the 44px accessibility floor per UI-SPEC.

**Source:** UI-SPEC §Meta Tab: Sort Toggle Visual States, CONTEXT.md D-12

### Pattern 6: Skeleton Composition Pattern (reference Phase 16)

**What:** New skeletons follow the same composition pattern as Phase 16 skeletons
**When to use:** MarketPostSkeleton, DeckRankingSkeleton, TierListSkeleton, ProfileHeaderSkeleton

```typescript
// Template from PostListSkeleton.tsx (Phase 16):
export function MarketPostSkeleton() {
  return (
    <Shimmer>
      {Array.from({ length: 3 }).map((_, index) => (
        <View key={index} style={styles.row}>
          <ShimmerBox width={72} height={72} borderRadius={borderRadius.md} />
          <View style={styles.textGroup}>
            <ShimmerText width="70%" />
            <ShimmerText width="45%" style={{ marginTop: spacing.xs }} />
          </View>
        </View>
      ))}
    </Shimmer>
  );
}
```

**Source:** `apps/mobile/src/components/skeleton/PostListSkeleton.tsx`, `CardGridSkeleton.tsx` — verified pattern

### Pattern 7: staggerCount Gate (Phase 16 Decision)

**What:** `staggerCount = loading ? 0 : items.length` — prevents premature stagger before data loads
**When to use:** All three tab screens when integrating useStaggeredList

```typescript
// From Phase 16 STATE.md decision:
const { onLayout, getItemStyle } = useStaggeredList(loading ? 0 : items.length);
```

**Source:** STATE.md `[Phase 16]: Stagger count gated behind loaded data`

### Pattern 8: Stagger Prop Threading for FlashList

**What:** For FlashList-based lists, `getItemStyle` must be threaded via props into the list component, not called directly in the parent
**When to use:** DeckRankingList, TierListBrowser (both use FlashList inside sub-components)

```typescript
// Parent (meta.tsx) holds stagger hook; passes down to DeckRankingList:
const { onLayout, getItemStyle } = useStaggeredList(loading ? 0 : decks.length);

// DeckRankingList receives getItemStyle prop and applies in renderItem:
const renderItem = ({ item, index }) => (
  <Animated.View style={getItemStyle(index)}>
    <Card onPress={() => handleDeckPress(item)}>...</Card>
  </Animated.View>
);
```

**Source:** STATE.md `[Phase Phase 16]: Staggered list in cards.tsx uses prop threading: getItemStyle/onStaggerLayout passed to CardGrid`

### Anti-Patterns to Avoid

- **Nesting BlurView inside ScrollView without overflow: 'hidden':** BlurView on Android requires `overflow: 'hidden'` on its container for border radius to clip correctly. Missing this causes sharp corners despite setting `borderRadius`.
- **Duplicate SVG gradient IDs in FlashList:** Using a hardcoded gradient id (e.g., `id="premiumGrad"`) on every PostCard item in a FlashList causes all cards to share the same gradient definition, leading to incorrect colors on Android. Use `id={"premiumGrad-" + post.id}`.
- **Calling useStaggeredList inside FlashList renderItem:** FlashList renderItem is not a stable React component context. Call the hook at the screen/parent component level and pass `getItemStyle` down as a prop.
- **Replacing ProfileScreen's existing Toast.show (react-native-toast-message) calls without migration plan:** The current profile.tsx already uses `Toast.show` from `react-native-toast-message` for Google/Apple link feedback. Per STATE.md Phase 16 decision, the two toast systems coexist — new toasts use `useToast()`, but the existing `Toast.show` calls for OAuth flows can stay as-is or be migrated to useToast during this phase (migration is preferred for consistency).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Blur backdrop behind avatar | Custom overlay with shadow tricks | `expo-blur` BlurView | Platform-native blur, no custom compositing |
| Gradient border accent | CSS-style border gradients | SVG LinearGradient (react-native-svg) | RN doesn't support gradient borders natively — SVG is the established pattern already used in this codebase |
| Skeleton shimmer | Custom animation per component | Shimmer + ShimmerBox/Circle/Text | Already built in Phase 15 — identical API |
| Press animation on cards | withTiming scale in each component | Card primitive with onPress | Already encapsulates useAnimatedPress |
| Toast display | Another notification library | useToast() → useToastStore → ToastOverlay | Already built in Phase 16 |
| Stagger animation | Per-screen stagger implementation | useStaggeredList(count) | Already built in Phase 15 |

**Key insight:** Phase 16 intentionally pre-built all infrastructure this phase needs. The migration work is wiring existing primitives, not building new systems.

---

## File-by-File Migration Map

This is the critical planning artifact — maps source files to required changes.

### Wave 0: Shared Prerequisites (unblock other waves)
| File | Change | Reason |
|------|--------|--------|
| `apps/mobile/src/components/ui/Badge.tsx` | Add `premium` variant to BadgeVariant union and variantMap | Needed by Market (D-02) and Profile (D-23) |
| `apps/mobile/package.json` | `expo install expo-blur` | Needed by Profile (D-18) before BlurView can be imported |

### Wave 1: Market Tab (SCR-04)
| File | Changes Required |
|------|-----------------|
| `apps/mobile/src/components/market/PostCard.tsx` | Wrap in Card primitive; add PremiumBorderAccent (SVG LinearGradient) when `post.user?.isPremium`; replace manual typeBadge with Badge; replace matchBadge with Badge; replace languageBadge inline style with Badge |
| `apps/mobile/src/components/market/MarketFilters.tsx` | Replace Pressable chips with Badge primitive (D-04); replace SearchBar with Input primitive (D-04) |
| `apps/mobile/src/components/skeleton/MarketPostSkeleton.tsx` | NEW — 3-row horizontal skeleton per UI-SPEC dimensions |
| `apps/mobile/app/(tabs)/market.tsx` | Replace FAB Pressable with Button `primary`; replace renderEmpty with EmptyState; add useStaggeredList; add gold RefreshControl PTR; wire useToast for post create/delete actions |

### Wave 2: Meta Tab (SCR-05)
| File | Changes Required |
|------|-----------------|
| `apps/mobile/src/components/meta/DeckRankingList.tsx` | Wrap deckCard in Card; replace rankBadge View+Text with circular Badge `default`; replace sort Pressable pills with Button `ghost`/`secondary`; replace ActivityIndicator loading with DeckRankingSkeleton; replace ad-hoc empty state with EmptyState; add gold RefreshControl PTR; add getItemStyle/onLayout stagger props |
| `apps/mobile/src/components/meta/TierListBrowser.tsx` | Replace sort Pressable pills with Button `ghost`/`secondary`; replace ActivityIndicator loading with TierListSkeleton; replace ad-hoc empty state with EmptyState; add gold RefreshControl (FlashList refreshControl prop); add stagger props |
| `apps/mobile/src/components/meta/TierListCard.tsx` | Wrap card Pressable in Card primitive; replace officialBadge View+Text with Badge `success` + Shield icon; replace tierPill (dot+label+count) with Badge using tier color overrides; replace voteButton with Button `ghost`/`primary`; wire useToast for vote actions |
| `apps/mobile/src/components/skeleton/DeckRankingSkeleton.tsx` | NEW — 3-row skeleton per UI-SPEC dimensions |
| `apps/mobile/src/components/skeleton/TierListSkeleton.tsx` | NEW — 3-row skeleton per UI-SPEC dimensions |
| `apps/mobile/app/(tabs)/meta.tsx` | Replace segment Pressable controls with Button `ghost`/`secondary`; wire useToast for tier list create |

### Wave 3: Profile Tab (SCR-06)
| File | Changes Required |
|------|-----------------|
| `apps/mobile/app/(tabs)/profile.tsx` | Wrap avatarContainer in BlurView + goldOverlay; migrate infoCard Views to Card primitive; replace editButton TouchableOpacity with Button `primary`; replace logoutButton with Button `destructive`; replace linkProviderButton/unlinkText with Button `secondary`/Button `ghost destructive`; replace ActivityIndicator loading states with ShimmerText; add ProfileHeaderSkeleton for initial load; add useStaggeredList for info sections; replace Toast.show calls with useToast; add gold PTR pattern |
| `apps/mobile/src/components/premium/PaywallCard.tsx` | Wrap outer View in Card primitive; add 2px gold gradient top-border accent (SVG LinearGradient horizontal) |
| `apps/mobile/src/components/skeleton/ProfileHeaderSkeleton.tsx` | NEW — single block: ShimmerCircle 80px + ShimmerText name + ShimmerBox badge |

---

## Common Pitfalls

### Pitfall 1: SVG Gradient ID Collisions in Lists
**What goes wrong:** All PostCards rendered in a FlashList share the same SVG gradient `id` string, causing the gradient definition from one card to override others on Android — resulting in all cards showing the wrong gradient or a solid color.
**Why it happens:** SVG `<defs>` with duplicate IDs in the same document tree produce undefined behavior per SVG spec. React Native on Android is particularly sensitive.
**How to avoid:** Use a per-instance unique gradient ID: `id={"premiumGrad-" + post.id}` and `fill={"url(#premiumGrad-" + post.id + ")"}`.
**Warning signs:** Premium border shows wrong color on some cards; gradient disappears on scroll.

### Pitfall 2: BlurView Requires `overflow: 'hidden'` for Border Radius
**What goes wrong:** Setting `borderRadius` on a BlurView container doesn't clip the blur on Android without `overflow: 'hidden'`.
**Why it happens:** BlurView is a native view; the border radius clip requires explicit overflow clipping.
**How to avoid:** Always pair `borderRadius` with `overflow: 'hidden'` on the BlurView's container.

### Pitfall 3: Badge Text Color Cannot Be Set via `style` Prop (ViewStyle only)
**What goes wrong:** Badge's `style` prop accepts only ViewStyle — setting `color` in `style` doesn't affect text. Tier pills need per-tier text color.
**Why it happens:** Badge renders text color from `variantMap` internally; the `style` prop passes only to the container View.
**How to avoid:** For tier pills where text color must change, either (a) add a `textColor?: string` prop to Badge, or (b) render tier pills as inline `View`+`Text` matching Badge dimensions. The planner should choose option (a) since it's a small Badge change that avoids duplicating pill layout logic.

### Pitfall 4: Profile Tab Has Two Toast Systems
**What goes wrong:** `profile.tsx` currently uses `react-native-toast-message` (`Toast.show`) for OAuth link/unlink feedback. Adding `useToast()` calls alongside creates two active toast systems at once.
**Why it happens:** Phase 16 STATE.md documents the coexistence: "matchNotification push toasts use existing system, new success/error/info/warning toasts use the Zustand system."
**How to avoid:** Migrate all existing `Toast.show` calls in `profile.tsx` to `useToast()` during this phase. This eliminates the dual-system complexity in one screen. The import of `react-native-toast-message` can be removed from `profile.tsx` if no other usages remain.

### Pitfall 5: DeckRankingList and TierListBrowser Own Their Loading State
**What goes wrong:** The loading/empty state display logic is currently inside `DeckRankingList` and `TierListBrowser` (both return early with ActivityIndicator or centered empty text). If stagger is added at the `meta.tsx` level, the skeleton and stagger need access to the loading state.
**Why it happens:** The Meta tab uses a sub-component architecture where the FlashList lives inside a child component, not directly in meta.tsx.
**How to avoid:** Either (a) move skeleton/empty rendering up to `meta.tsx` and pass `loading` state as a prop, or (b) keep skeleton/empty inside each component but pass `getItemStyle`/`onLayout` as props (same pattern as Phase 16's cards.tsx approach). Option (b) keeps the component boundary clean and matches Phase 16 precedent.

### Pitfall 6: expo-blur on Android May Degrade
**What goes wrong:** `expo-blur` BlurView on Android uses a software renderer that can appear less crisp than iOS, and some Android versions show a flat dark overlay instead of a true blur.
**Why it happens:** Android doesn't have a native blur API as clean as iOS's vibrancy/blur effect.
**How to avoid:** The 8% gold overlay (D-19) provides enough visual differentiation that the fallback dark overlay still looks intentional. No special handling needed. Test on Android emulator to confirm visual quality is acceptable.

---

## Code Examples

### New Badge `premium` Variant Entry
```typescript
// Source: Badge.tsx variantMap (verified against current implementation)
premium: {
  backgroundColor: '#f0c040',
  textColor: '#0c0c18',
},
```

### MarketPostSkeleton Composition
```typescript
// Source: Pattern from PostListSkeleton.tsx (Phase 16) + UI-SPEC dimensions
import { View, StyleSheet } from 'react-native';
import { Shimmer } from '@/src/components/animation/Shimmer';
import { ShimmerBox } from '@/src/components/animation/ShimmerBox';
import { ShimmerText } from '@/src/components/animation/ShimmerText';
import { spacing, borderRadius } from '@/src/constants/theme';

export function MarketPostSkeleton() {
  return (
    <Shimmer>
      {Array.from({ length: 3 }).map((_, i) => (
        <View key={i} style={styles.row}>
          <ShimmerBox width={72} height={72} borderRadius={borderRadius.md} />
          <View style={styles.textGroup}>
            <ShimmerText width="70%" />
            <ShimmerText width="45%" style={{ marginTop: spacing.xs }} />
          </View>
        </View>
      ))}
    </Shimmer>
  );
}
```

### Gold RefreshControl (copy-paste pattern from Phase 16)
```typescript
// Source: Phase 16 implementation pattern — same across all three tabs
<RefreshControl
  refreshing={refreshing}
  onRefresh={handleRefresh}
  tintColor="#f0c040"
  colors={["#f0c040"]}
/>
```

### Toast Integration Pattern
```typescript
// Source: useToast.ts (Phase 16) — verified against current implementation
const toast = useToast();

// On success:
toast.success('Post created');
// On error:
toast.error('Could not create post. Please try again.');
```

### ProfileHeaderSkeleton
```typescript
// Source: UI-SPEC §ProfileHeaderSkeleton dimensions, Phase 15 shimmer pattern
import { View, StyleSheet } from 'react-native';
import { Shimmer } from '@/src/components/animation/Shimmer';
import { ShimmerCircle } from '@/src/components/animation/ShimmerCircle';
import { ShimmerText } from '@/src/components/animation/ShimmerText';
import { ShimmerBox } from '@/src/components/animation/ShimmerBox';
import { spacing } from '@/src/constants/theme';

export function ProfileHeaderSkeleton() {
  return (
    <Shimmer>
      <View style={styles.container}>
        <ShimmerCircle size={80} />
        <ShimmerText width="50%" style={{ marginTop: spacing.sm, alignSelf: 'center' }} />
        <ShimmerBox width={60} height={20} style={{ marginTop: spacing.sm, alignSelf: 'center' }} />
      </View>
    </Shimmer>
  );
}
const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: spacing.lg },
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Raw Pressable + inline StyleSheet for all interactive elements | Card/Button primitives with useAnimatedPress | Phase 16 | All cards/buttons in this phase use primitives |
| ActivityIndicator for loading states | Shimmer skeleton compositions | Phase 15/16 | Replace all ActivityIndicator usages in migrated components |
| Manual toast with react-native-toast-message | Zustand toast store + ToastOverlay | Phase 16 | useToast() for all new toasts; migrate existing profile.tsx Toast.show calls |
| Raw RefreshControl with colors.primary (variable) | Hardcoded `"#f0c040"` tint | Phase 16 (D-22) | Use hardcoded value, not color variable — consistency with Phase 16 PTR |

**Deprecated/outdated in this codebase:**
- `ActivityIndicator` as primary loading state: replaced by shimmer skeletons in Phase 16; Phase 17 continues this migration for Market/Meta/Profile
- Ad-hoc `View + StyleSheet` pill components: replaced by Badge/Button primitives

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no jest/vitest/pytest config found in project |
| Config file | None |
| Quick run command | Manual visual inspection on device/simulator |
| Full suite command | Manual visual inspection on device/simulator |

No automated test infrastructure exists for the mobile app. All validation is manual/visual.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCR-04 | Market tab uses new primitives + gradient accents | manual-visual | n/a | n/a |
| SCR-05 | Meta tab uses refreshed component library | manual-visual | n/a | n/a |
| SCR-06 | Profile tab glassmorphism + settings primitives | manual-visual | n/a | n/a |

### Wave 0 Gaps
None — no automated test infrastructure gaps to address. Validation is via manual device testing on the three migrated tabs.

---

## Open Questions

1. **Tier Badge text color approach**
   - What we know: Badge.tsx `style` prop accepts ViewStyle only; tier pills need per-tier text color
   - What's unclear: Which approach was chosen in discussions — Badge `textColor` prop extension vs. inline View+Text for tiers
   - Recommendation: Add `textColor?: string` prop to Badge (minimal one-line change to Badge component) to keep tier pills as Badge primitives throughout; this is cleaner than duplicating pill layout

2. **`post.user.isPremium` field existence**
   - What we know: The `MarketPost` type is `TradePost & { isRelevant?: boolean; poster?: {...} }`. No `isPremium` field is on `poster` or the post itself.
   - What's unclear: Does the API return a premium flag on poster data? The current PostCard only uses `post.poster.averageRating` and `post.poster.tradeCount` — no premium indicator exists in the type.
   - Recommendation: The premium left-border accent (D-01) requires a `poster.isPremium` field. Planner should add `isPremium?: boolean` to the `poster` shape in `MarketPost` and note that the API must be updated to return this field. If the API cannot be updated in this phase, the premium border should be scaffolded but remain dormant (never renders) until the field is available.

3. **FlashList's `refreshControl` prop vs. `onRefresh`/`refreshing`**
   - What we know: DeckRankingList and TierListBrowser currently use FlashList's `refreshing` and `onRefresh` props (native pull-to-refresh behavior). Gold tint requires a `RefreshControl` component with `tintColor`.
   - What's unclear: FlashList supports both the `refreshing`/`onRefresh` pair AND the `refreshControl` prop (like FlatList).
   - Recommendation: Replace `refreshing`/`onRefresh` props with `refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#f0c040" colors={["#f0c040"]} />}`. FlashList v2 supports `refreshControl` prop — verified in Phase 16 market.tsx which already uses this approach.

---

## Sources

### Primary (HIGH confidence)
- Direct source inspection: `apps/mobile/src/components/ui/Badge.tsx` — current BadgeVariant union and variantMap
- Direct source inspection: `apps/mobile/src/components/ui/Card.tsx` — PressableCard pattern
- Direct source inspection: `apps/mobile/src/components/ui/Button.tsx` — variant styles
- Direct source inspection: `apps/mobile/src/components/animation/Shimmer.tsx` — SVG LinearGradient shimmer pattern
- Direct source inspection: `apps/mobile/src/components/skeleton/PostListSkeleton.tsx` — Phase 16 skeleton composition pattern
- Direct source inspection: `apps/mobile/app/(tabs)/market.tsx`, `meta.tsx`, `profile.tsx` — current implementation baseline
- Direct source inspection: `apps/mobile/src/components/market/PostCard.tsx`, `MarketFilters.tsx`
- Direct source inspection: `apps/mobile/src/components/meta/DeckRankingList.tsx`, `TierListBrowser.tsx`, `TierListCard.tsx`
- Direct source inspection: `apps/mobile/src/components/premium/PaywallCard.tsx`
- Direct source inspection: `apps/mobile/package.json` — confirms expo-blur is NOT installed; react-native-svg v15.12.1 is installed
- `.planning/phases/17-screen-migration-tier-2/17-CONTEXT.md` — all locked decisions
- `.planning/phases/17-screen-migration-tier-2/17-UI-SPEC.md` — full visual contract including exact dimensions, colors, copy
- `.planning/STATE.md` — Phase 15/16 decisions (stagger gating, prop threading, SVG LinearGradient choice, dual toast coexistence)

### Secondary (MEDIUM confidence)
- expo-blur Expo SDK 54 compatibility: Expo versioning convention (`expo install` resolves compatible version automatically; `~54.x` SDK maps to `~15.0.x` for expo-blur based on naming pattern)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages directly verified in package.json
- Architecture patterns: HIGH — directly verified in Phase 15/16 source files and STATE.md decisions
- Pitfalls: HIGH — SVG ID collision verified from Phase 15 shimmer implementation; BlurView overflow from expo-blur documentation pattern; Badge text color verified from Badge.tsx source; dual toast from STATE.md
- Migration map: HIGH — based on direct source inspection of all 9 target files

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (stable project — no external dependencies changing)
