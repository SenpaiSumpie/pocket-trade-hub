# Phase 16: Screen Migration Tier 1 - Research

**Researched:** 2026-03-21
**Domain:** React Native primitive component library, skeleton loading, toast system, animated pressable, rarity visual effects, screen migration
**Confidence:** HIGH

## Summary

Phase 16 is a pure UI migration and component-building phase. All infrastructure it depends on (design tokens, animation hooks, shimmer primitives, bottom sheets) was completed in Phases 13–15 and is verified in the codebase. The task is to build 6 shared UI primitives, 3 skeleton compositions, 1 empty-state component, 1 toast system, and then migrate Home, Cards, and Trades tabs to use them.

A critical discovery: `app/_layout.tsx` already imports `react-native-toast-message` (a 3rd-party library) and has a custom `matchNotification` toast type wired at root. The D-15 decision to build a custom Zustand-based toast system will need to coexist with or replace this existing library. The planner must allocate a task for auditing which usages of `react-native-toast-message` exist before removing it, or scope the custom system to a new namespace that complements the existing one.

The three tab screens (index.tsx, cards.tsx, trades.tsx) use raw `TouchableOpacity` and `Pressable` with inline `StyleSheet.create` and `activeOpacity={0.7}` — none use `useAnimatedPress`. Cards in `MyPostCard` and `ProposalCard` use `TouchableOpacity`, not `Animated.Pressable`. The `CardGrid` has an existing `Animated.Value`-based `SkeletonCard` that must be replaced by the shimmer system from Phase 15.

The `CardThumbnail` component is the single integration point for rarity effects — it already imports `RarityBadge` and has `imageContainer` with `overflow: 'hidden'`, making it straightforward to add shimmer overlays and glow borders. The rarity classification is done via the `card.rarity` string (e.g. `'star1'`, `'star2'`, `'star3'`, `'crown'`), which is already mapped to colors in `RarityBadge.tsx` (`rarityStar: #f0c040`, `rarityCrown: #e8b4f8`).

**Primary recommendation:** Build primitives in `apps/mobile/src/components/ui/` first (Wave 1), then apply them per-screen bottom-up starting with Trades (simpler), then Cards (requires rarity effects), then Home (requires staggered sections). Build toast system in parallel as a standalone Zustand store + overlay component registered in `_layout.tsx`.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Shared Primitive Components (CL-01)**
- D-01: Build 6 shared primitives: Button, Card, Text, Badge, Input, Divider — located in `apps/mobile/src/components/ui/`
- D-02: Button variants: primary (gold fill), secondary (outline), ghost (text-only), destructive (error fill). Sizes: sm, md, lg. All use useAnimatedPress for scale feedback + haptics
- D-03: Card component: surface-colored container with elevation token, borderRadius.lg, optional onPress with animated press. Replaces ad-hoc View containers
- D-04: Text component: wraps RN Text with typography token presets (heading, subheading, body, caption, label). Color prop defaults to onSurface
- D-05: Badge: small pill with colored background + text. Variants: default, success, warning, error, rarity (diamond/star/crown colors). Used for status indicators, rarity labels
- D-06: Input: styled TextInput with surface background, border, focus ring (gold accent), label prop, error state. Replaces inline TextInput styling
- D-07: Divider: horizontal rule using border token color, configurable spacing (margin vertical)

**Skeleton Loading States (CL-02)**
- D-08: Build screen-specific skeleton compositions using Phase 15 shimmer primitives (ShimmerBox, ShimmerCircle, ShimmerText, Shimmer wrapper)
- D-09: Each list/grid screen gets a matching skeleton: CardGridSkeleton (grid of card-shaped rectangles), PostListSkeleton (rows with avatar + text lines), ProposalListSkeleton (rows with avatar + card previews + text)
- D-10: Skeletons mirror real content layout so the transition from loading to loaded feels seamless — same dimensions, spacing, and count as first visible page

**Empty States (CL-03)**
- D-11: Shared EmptyState component: large Phosphor icon (light weight, 64px) + title + subtitle + optional CTA button. Centered in available space
- D-12: Phosphor icons over custom illustrations — consistent with icon system, zero asset overhead
- D-13: Tone is friendly but concise: "No trades yet" + "Create a post to start trading" + [Create Post] button
- D-14: Every list/grid in Home, Cards, and Trades tabs gets a contextual empty state with a relevant CTA that navigates to the action

**Toast/Snackbar System (CL-04)**
- D-15: Build a lightweight custom toast system (no external library) — Zustand store + animated overlay component
- D-16: Position: bottom of screen, above tab bar. Floating card with rounded corners, icon + message text + colored left accent bar
- D-17: Variants: success (green), error (red), info (blue), warning (orange). Each with a matching Phosphor icon (CheckCircle, XCircle, Info, Warning)
- D-18: Auto-dismiss after 3 seconds with fade + slide-down animation. Swipe-down to dismiss early. Queue multiple toasts (show one at a time)
- D-19: Toast provider wraps app root. Trigger via `useToast()` hook: `toast.success("Card added to collection")`

**Animated Pressable (CL-05)**
- D-20: All tappable elements (cards, buttons, list items) use useAnimatedPress from Phase 15 — scale to 0.97 + light haptic on press-in
- D-21: The shared Button primitive includes this by default. Card primitive includes it when onPress is provided. Other touchable areas wrapped manually

**Branded Pull-to-Refresh (CL-06)**
- D-22: Tint the native RefreshControl gold (`tintColor="#f0c040"` on iOS, `colors={["#f0c040"]}` on Android) — keep native pull feel and resistance
- D-23: No custom pull-to-refresh component — native behavior is reliable and platform-appropriate
- D-24: Apply consistently to all scrollable lists in Home, Cards, and Trades tabs

**Card Rarity Visual Effects (SCR-02)**
- D-25: Diamond cards (common): no special visual effect — clean presentation
- D-26: Star cards: subtle gold shimmer overlay on the card thumbnail — reuses shimmer animation system from Phase 15 with gold-tinted gradient (#f0c040 at 15% opacity sweep)
- D-27: Crown cards: animated purple glow border — soft pulsing border glow using Reanimated opacity animation with crown purple (#e8b4f8 at 30% opacity)
- D-28: Rarity effects always visible in grid (subtle enough to not overwhelm) but intensify slightly on press
- D-29: Effects applied in CardThumbnail component — single integration point for all grid/list views

**Home Tab Refresh (SCR-01)**
- D-30: Replace inline-styled containers with Card primitive, replace text with Text primitive
- D-31: Apply useStaggeredList to dashboard sections (setup checklist, collection summary, smart trades, analytics cards)
- D-32: Add skeleton loading state for async sections (collection stats, smart trades)
- D-33: LockedFeatureCard and preview cards adopt Card primitive with animated press

**Cards Tab Refresh (SCR-02)**
- D-34: CardGrid adopts new skeleton compositions (CardGridSkeleton) replacing old Animated.Value-based skeleton
- D-35: SearchBar adopts Input primitive styling (or wraps Input with search icon)
- D-36: FilterChips adopt Badge primitive styling
- D-37: Apply useStaggeredList to card grid items on initial load
- D-38: Rarity visual effects applied per D-25 through D-29

**Trades Tab Refresh (SCR-03)**
- D-39: MyPostCard, ProposalCard, MatchCard adopt Card primitive with animated press
- D-40: Segment tabs (posts/proposals) and filter chips adopt consistent Badge/Button styling
- D-41: Apply useStaggeredList to post and proposal lists
- D-42: Add ProposalListSkeleton and PostListSkeleton for loading states
- D-43: Empty states with contextual CTAs per segment (create post, browse market)

### Claude's Discretion
- Exact component prop APIs and TypeScript interfaces
- Internal component implementation details
- Skeleton item counts and exact dimensions
- Toast animation spring/timing values
- Empty state exact copy and icon choices per screen
- Order of migration (which screen first)
- Whether to create sub-components (e.g., CardHeader, CardFooter)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CL-01 | Shared primitive components (Button, Card, Text, Badge, Input, Divider) | D-01 through D-07; primitives go in `apps/mobile/src/components/ui/`; use elevation token, borderRadius tokens, typography presets from theme.ts shim |
| CL-02 | Skeleton loading states with shimmer animation matching content layout | D-08 through D-10; Shimmer + ShimmerBox/Circle/Text from Phase 15 ready; replace existing Animated.Value SkeletonCard in CardGrid |
| CL-03 | Empty states with illustrations and CTAs for all list/grid screens | D-11 through D-14; Phosphor icons, shared EmptyState component with Button primitive CTA |
| CL-04 | Toast/snackbar system with success/error/info/warning variants | D-15 through D-19; Zustand store + overlay; must integrate with existing `react-native-toast-message` usage in _layout.tsx (matchNotification type) |
| CL-05 | Animated Pressable with scale-down + haptic touch feedback | D-20 through D-21; useAnimatedPress hook from Phase 15 already implemented; apply to Button, Card, list items |
| CL-06 | Branded pull-to-refresh with gold tint animation | D-22 through D-24; native RefreshControl with tintColor="#f0c040"; FlashList in trades already has onRefresh/refreshing |
| SCR-01 | Home tab full visual refresh with new primitives and motion | D-30 through D-33; index.tsx uses ScrollView + inline-styled Views; needs Card, Text primitives, useStaggeredList, skeleton for SmartTradesSection |
| SCR-02 | Cards tab refresh with rarity visual effects (holographic shimmer, crown glow) | D-34 through D-38; CardThumbnail is the integration point; card.rarity string determines effect (star1/2/3 vs crown); CardGrid skeleton replacement |
| SCR-03 | Trades tab refresh with animated proposal cards and match cards | D-39 through D-43; MyPostCard + ProposalCard use TouchableOpacity; replace with Card primitive + Animated.View wrapping; add skeleton and empty state CTAs |
</phase_requirements>

---

## Standard Stack

### Core (all already installed — no new packages required)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native-reanimated | 3.x | Animated.View wrapper for Card/Button with useAnimatedPress | Phase 15 established; all animation hooks use it |
| expo-haptics | latest | Haptic feedback in useAnimatedPress | Already in useAnimatedPress, confirmed working |
| zustand | 4.x | Toast store (useToastStore) | All existing domain stores use this pattern |
| phosphor-react-native | latest | Icons in EmptyState, Toast variants | Phase 14 migrated entire icon system to Phosphor |
| react-native-svg | latest | Shimmer gradient overlay (already used in Shimmer.tsx) | Phase 15 established |
| @shopify/flash-list | latest | List containers in Trades tab (not replaced) | Already in trades.tsx, cards.tsx |

### No new packages needed
All required libraries are already installed. The toast system, skeleton compositions, primitives, and rarity effects are built entirely from existing infrastructure.

**Verified dependency availability:**
- `react-native-reanimated` — confirmed in useAnimatedPress.ts, useStaggeredList.ts
- `expo-haptics` — confirmed in useAnimatedPress.ts
- `zustand` — confirmed in trades.ts, auth.ts, and 10 other stores
- `phosphor-react-native` — confirmed in all 3 tab screens
- `react-native-svg` — confirmed in Shimmer.tsx (Svg, Defs, LinearGradient, Stop, Rect)

## Architecture Patterns

### Recommended Project Structure
```
apps/mobile/src/components/ui/           # NEW — shared primitive library
├── Button.tsx                           # Primary, secondary, ghost, destructive variants
├── Card.tsx                             # Surface container with optional onPress
├── Text.tsx                             # Typography preset wrapper
├── Badge.tsx                            # Status pill component
├── Input.tsx                            # Styled TextInput with focus ring
├── Divider.tsx                          # Horizontal rule
└── index.ts                             # Barrel export

apps/mobile/src/components/skeleton/     # NEW — screen skeleton compositions
├── CardGridSkeleton.tsx                 # 9-card grid skeleton (3x3 using ShimmerBox)
├── PostListSkeleton.tsx                 # 3 post row skeletons (ShimmerCircle + ShimmerText)
└── ProposalListSkeleton.tsx             # 3 proposal skeletons (ShimmerCircle + previews + text)

apps/mobile/src/components/ui/EmptyState.tsx  # Shared empty state (or in /ui/)

apps/mobile/src/stores/toast.ts          # NEW — Zustand toast queue store
apps/mobile/src/hooks/useToast.ts        # NEW — convenience hook
apps/mobile/src/components/ui/ToastOverlay.tsx  # NEW — animated toast display
```

### Pattern 1: Shared Primitive (Card, Button, Text, Badge)
**What:** Thin wrappers over RN primitives that apply token values and optional animation.
**When to use:** Everywhere a surface container, touchable, text, or status pill appears.
**Example:**
```typescript
// Card primitive — surface container with optional onPress animation
import Animated from 'react-native-reanimated';
import { useAnimatedPress } from '@/src/hooks/useAnimatedPress';
import { colors, borderRadius, spacing } from '@/src/constants/theme';
import { elevation } from '@pocket-trade-hub/shared';

export function Card({ children, onPress, style }: CardProps) {
  const { animatedStyle, pressHandlers } = useAnimatedPress({ haptic: !!onPress });
  if (onPress) {
    return (
      <Animated.View style={[styles.card, animatedStyle, style]}>
        <Pressable onPress={onPress} {...pressHandlers}>{children}</Pressable>
      </Animated.View>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,  // borderRadius.lg = 16
    ...elevation.low,               // shadowColor, shadowOffset, shadowOpacity, shadowRadius, elevation
    overflow: 'hidden',
  },
});
```

### Pattern 2: Zustand Toast Store
**What:** A queue-based toast store that renders one toast at a time from an overlay component mounted at the app root.
**When to use:** System feedback for async operations (add to collection, trade action, error).
**Example:**
```typescript
// apps/mobile/src/stores/toast.ts
import { create } from 'zustand';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';
interface Toast { id: string; variant: ToastVariant; message: string; }

interface ToastState {
  queue: Toast[];
  show: (variant: ToastVariant, message: string) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  queue: [],
  show: (variant, message) =>
    set((s) => ({ queue: [...s.queue, { id: Date.now().toString(), variant, message }] })),
  dismiss: (id) =>
    set((s) => ({ queue: s.queue.filter((t) => t.id !== id) })),
}));

// apps/mobile/src/hooks/useToast.ts
export function useToast() {
  const show = useToastStore((s) => s.show);
  return {
    success: (msg: string) => show('success', msg),
    error: (msg: string) => show('error', msg),
    info: (msg: string) => show('info', msg),
    warning: (msg: string) => show('warning', msg),
  };
}
```

### Pattern 3: Screen-Specific Skeleton Composition
**What:** Compose ShimmerBox / ShimmerCircle / ShimmerText inside a Shimmer wrapper to match real content layout.
**When to use:** Replaces ActivityIndicator and old Animated.Value SkeletonCard in loading states.
**Example:**
```typescript
// CardGridSkeleton — mirrors 3-column CardGrid layout
import { View, StyleSheet } from 'react-native';
import { Shimmer } from '@/src/components/animation/Shimmer';
import { ShimmerBox } from '@/src/components/animation/ShimmerBox';
import { ShimmerText } from '@/src/components/animation/ShimmerText';
import { spacing } from '@/src/constants/theme';

function SkeletonCard() {
  return (
    <View style={styles.card}>
      <ShimmerBox height={undefined} style={{ aspectRatio: 0.715, borderRadius: 8 }} />
      <ShimmerText width="80%" style={{ marginTop: spacing.xs }} />
      <ShimmerText width="50%" style={{ marginTop: 2 }} />
    </View>
  );
}

export function CardGridSkeleton() {
  return (
    <Shimmer>
      <View style={styles.grid}>
        {Array.from({ length: 9 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </View>
    </Shimmer>
  );
}
// Note: Shimmer wrapper auto-measures width via onLayout; no manual width prop needed
```

### Pattern 4: Rarity Visual Effects on CardThumbnail
**What:** Overlay components inside `imageContainer` (which already has `overflow: 'hidden'`) conditioned on `card.rarity`.
**When to use:** Applied exclusively in `CardThumbnail.tsx` — single integration point for all grid/list views.
**Implementation approach:**
```typescript
// Inside CardThumbnail, after the Image component:

// Star rarity shimmer overlay — reuses Shimmer system with gold gradient
const isStarRarity = card.rarity?.startsWith('star');
const isCrownRarity = card.rarity === 'crown';

// Star: Gold-tinted shimmer overlay (15% opacity gradient sweep)
// Achieved by adding a second LinearGradient with gold stops inside the imageContainer
// Shimmer component is NOT used here (it wraps its children in a container with overflow:hidden
// which would clip our image). Instead, use useShimmer hook directly with a custom SVG overlay.

// Crown: Pulsing border glow — an absolutely-positioned View with borderWidth + Animated opacity
// The imageContainer already has borderColor: 'transparent' and borderWidth: 2.
// For crown, override borderColor to '#e8b4f8' and pulse the border opacity via Animated.View wrapper.
```

**CRITICAL NOTE for rarity shimmer:** The existing `Shimmer.tsx` wraps children in its own container. For `CardThumbnail`, the shimmer overlay needs to be applied as a `position: 'absolute'` child inside `imageContainer`, not as a Shimmer wrapper around the whole card. Use `useShimmer(containerWidth)` hook directly to get the `translateX` shared value, then render the SVG gradient as an `Animated.View` overlay. `containerWidth` for the card is calculated from the grid column width (screen width / 3 minus padding).

### Pattern 5: EmptyState Component
**What:** Shared component with icon, title, subtitle, optional CTA button.
**When to use:** Every list/grid screen when `!loading && items.length === 0`.
```typescript
interface EmptyStateProps {
  icon: React.ComponentType<{ size: number; color: string; weight: string }>;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
}
// Uses Button primitive (primary variant, sm size) for CTA
```

### Pattern 6: Branded RefreshControl
**What:** Pass tintColor and colors to the native RefreshControl already wired in FlashList.
**Implementation:** In FlashList components that already have `onRefresh`/`refreshing` props:
```typescript
import { RefreshControl, Platform } from 'react-native';
// Add refreshControl prop to FlashList:
refreshControl={
  <RefreshControl
    refreshing={refreshing}
    onRefresh={handleRefresh}
    tintColor="#f0c040"   // iOS
    colors={["#f0c040"]} // Android
  />
}
```
FlashList does not accept `tintColor` and `colors` directly — they must be passed via the `refreshControl` prop with a `RefreshControl` component.

### Anti-Patterns to Avoid
- **Shimmer wrapping FlashList:** Don't wrap the entire FlashList in a Shimmer — show skeleton when `loading && items.length === 0`, then show the list when data arrives.
- **Animated.Value for shimmer:** CardGrid currently uses `Animated.Value` with loop — replace entirely with Shimmer + ShimmerBox composition (uses Reanimated `withRepeat` + `withTiming` per Phase 15).
- **TouchableOpacity for Card/Button primitives:** Use `Animated.View` (from Reanimated) + `Pressable` pattern so `useAnimatedPress` scale transform works correctly. `TouchableOpacity` uses the legacy animated API and conflicts with Reanimated transforms.
- **Multiple GestureHandlerRootView:** `_layout.tsx` already has one at root — do NOT add another for the ToastOverlay. Mount it inside the existing `GestureHandlerRootView` tree.
- **Nesting Animated.View inside TouchableOpacity:** Use Reanimated `Animated.View` as the outermost element with `animatedStyle` applied, then `Pressable` inside it — not the reverse.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Shimmer gradient animation | Custom Animated.loop/sequence | `Shimmer` + `ShimmerBox/Circle/Text` from Phase 15 | Already implemented with Reanimated, SVG gradient, and auto-layout measurement |
| Press scale animation | activeOpacity / custom Animated.Value | `useAnimatedPress` from Phase 15 | Already handles reducedMotion, spring physics, haptics |
| Staggered list entrance | Manual Animated.stagger | `useStaggeredList` from Phase 15 | Already handles mount-once gate, MAX_STAGGER_ITEMS cap, reducedMotion |
| Toast positioning | Manual bottom offset calculation | Zustand store + position:absolute overlay with bottom padding | Tab bar height is handled by existing bottom safe area; toast goes above it |
| Elevation styles | Inline shadowColor/offset/opacity/radius | `elevation` token from `@pocket-trade-hub/shared` | Consistent cross-platform shadow values already defined |
| Typography styles | Inline fontSize/fontWeight per component | `typography` presets from theme.ts shim + `Text` primitive | Already maps to Inter font with correct PostScript names per Phase 14 |

**Key insight:** All animation and styling infrastructure is complete from Phases 13-15. Phase 16 is entirely about wiring existing infrastructure into new UI primitives and migrating existing screens to use them.

## Critical Discovery: Existing Toast Library

**Problem:** `app/_layout.tsx` already imports `react-native-toast-message` and uses it for push notification toasts (`matchNotification` custom type). The `<Toast config={toastConfig} />` component is mounted at root.

**Resolution options for planner:**
1. Keep `react-native-toast-message` for the existing `matchNotification` type and build the new custom Zustand toast system alongside it for CL-04 success/error/info/warning toasts. Both coexist — different namespaces.
2. Migrate the `matchNotification` type to the new custom system and remove `react-native-toast-message` entirely.

**Recommendation:** Option 1 (coexistence). D-15 says "no external library" for the new system. The existing library handles push notification toasts and should be preserved to avoid regressions. The new `ToastOverlay` component should be mounted adjacent to `<Toast config={toastConfig} />` in `_layout.tsx`.

## Common Pitfalls

### Pitfall 1: FlashList RefreshControl Props
**What goes wrong:** Passing `tintColor` or `colors` directly to `FlashList` — these props don't exist on FlashList and are silently ignored.
**Why it happens:** These are `ScrollView`/`FlatList` props that FlashList doesn't proxy.
**How to avoid:** Always pass `refreshControl={<RefreshControl tintColor="..." colors={["..."]} refreshing={...} onRefresh={...} />}` as the `refreshControl` prop. Remove the existing `refreshing` and `onRefresh` props from FlashList when doing this.
**Warning signs:** Pull-to-refresh spinner remains default blue/gray on both platforms.

### Pitfall 2: Shimmer Width Measurement Timing
**What goes wrong:** Shimmer overlay renders at width=0 until `onLayout` fires, causing a flash of no-shimmer on first paint.
**Why it happens:** `Shimmer.tsx` uses `useState(0)` for containerWidth and only updates it in `onLayout`. On first render, `containerWidth > 0` guard prevents overlay from rendering.
**How to avoid:** For skeleton compositions with known widths (e.g., card grid where each card is `(screenWidth - padding * 2) / 3`), pass `width` prop to `Shimmer` explicitly to skip the layout measurement cycle. For variable-width skeletons, the first-frame flash is acceptable.
**Warning signs:** Shimmer appears 1 frame late — brief pure-color flash before sweep appears.

### Pitfall 3: useAnimatedPress with Pressable vs TouchableOpacity
**What goes wrong:** Wrapping `useAnimatedPress.animatedStyle` on a `TouchableOpacity` — the opacity animation from `TouchableOpacity` conflicts with the scale animation from Reanimated, causing jank or the scale being ignored.
**Why it happens:** `TouchableOpacity` uses the legacy RN Animated API for opacity; Reanimated `Animated.View` must be the component with `animatedStyle`.
**How to avoid:** Always use `Animated.View` (from Reanimated) + `Pressable` inside it:
```typescript
<Animated.View style={[styles.card, animatedStyle]}>
  <Pressable onPress={onPress} {...pressHandlers}>{children}</Pressable>
</Animated.View>
```
**Warning signs:** Scale animation doesn't play, or card flickers on press.

### Pitfall 4: useStaggeredList itemCount Must Be Stable
**What goes wrong:** Calling `useStaggeredList(items.length)` where `items.length` starts at 0 and grows — the hook pre-allocates MAX_STAGGER_ITEMS at call time, so `clampedCount = Math.min(0, 15) = 0` and `onLayout` triggers with no items to animate. When items load, the animation has already fired.
**Why it happens:** `hasAnimated.current` is set to true on first `onLayout` call, which fires when the container mounts — even before data loads.
**How to avoid:** Gate `useStaggeredList` at the data-loaded level, or pass a stable count. For lists where data loads async: call `useStaggeredList` with the actual item count only after data is available:
```typescript
// In list component that receives loaded data:
const { onLayout, getItemStyle } = useStaggeredList(items.length);
// Pass `onLayout` to the FlashList's ListHeaderComponent or wrapping View
// NOT to a container that mounts during loading
```
**Warning signs:** Items appear without animation even though data loaded correctly.

### Pitfall 5: Crown Glow Border via Reanimated
**What goes wrong:** Animating `borderColor` or `borderWidth` via Reanimated `useAnimatedStyle` — these are layout properties and may not animate smoothly on Android.
**Why it happens:** Some style properties don't support Reanimated's direct animation on all platforms.
**How to avoid:** Implement crown glow as an `Animated.View` with `position: 'absolute'` and a pulsing `opacity` value instead of animating the border itself. The glow view sits outside the card image, has `borderWidth`, `borderColor: '#e8b4f8'`, `borderRadius`, and its opacity pulses via `withRepeat(withTiming(0.3))`.
**Warning signs:** Crown border flickers or causes layout jank on Android.

### Pitfall 6: Rarity Shimmer Inside imageContainer with Overflow Hidden
**What goes wrong:** Attempting to use the `Shimmer` wrapper component inside `imageContainer` — the Shimmer component creates its own container View, which won't receive the correct width from the parent card's imageContainer because `Shimmer` measures itself via `onLayout`.
**Why it happens:** `Shimmer.tsx` is designed to wrap full-width content and measure itself. Inside a card imageContainer with `aspectRatio: 0.715`, it won't auto-size correctly.
**How to avoid:** Use `useShimmer(knownWidth)` hook directly in `CardThumbnail` and render the SVG gradient as a raw `Animated.View + Svg` overlay with `position: 'absolute'` and `StyleSheet.absoluteFillObject`. The `knownWidth` is the image container width — pass it via `onLayout` on the imageContainer.
**Warning signs:** Shimmer overlay either doesn't appear or covers more than the card image.

## Code Examples

### Button Primitive
```typescript
// apps/mobile/src/components/ui/Button.tsx
import Animated from 'react-native-reanimated';
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAnimatedPress } from '@/src/hooks/useAnimatedPress';
import { colors, borderRadius, spacing, typography } from '@/src/constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress: () => void;
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  Icon?: React.ComponentType<{ size: number; color: string; weight: string }>;
}

export function Button({ onPress, label, variant = 'primary', size = 'md', disabled, loading, Icon }: ButtonProps) {
  const { animatedStyle, pressHandlers } = useAnimatedPress({ haptic: true });
  const isDisabled = disabled || loading;

  return (
    <Animated.View style={[animatedStyle, { opacity: isDisabled ? 0.5 : 1 }]}>
      <Pressable
        onPress={isDisabled ? undefined : onPress}
        {...(isDisabled ? {} : pressHandlers)}
        style={[styles.base, styles[variant], styles[size]]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={variant === 'primary' ? '#000' : colors.primary} />
        ) : (
          <>
            {Icon && <Icon size={SIZE_ICON[size]} color={VARIANT_TEXT_COLOR[variant]} weight="regular" />}
            <Text style={[styles.label, styles[`label_${variant}` as keyof typeof styles], styles[`label_${size}` as keyof typeof styles]]}>
              {label}
            </Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}
```

### ToastOverlay Component Pattern
```typescript
// apps/mobile/src/components/ui/ToastOverlay.tsx
// Mounts at root inside GestureHandlerRootView, renders top of queue
import { useToastStore } from '@/src/stores/toast';

const VARIANT_CONFIG = {
  success: { icon: CheckCircle, accentColor: colors.success },
  error: { icon: XCircle, accentColor: colors.error },
  info: { icon: Info, accentColor: '#3498db' },
  warning: { icon: Warning, accentColor: colors.warning ?? '#e67e22' },
};

// In _layout.tsx, add alongside existing <Toast config={toastConfig} />:
// <ToastOverlay />
```

### Shimmer-Based CardGridSkeleton (replaces old SkeletonCard)
```typescript
// Note: ShimmerText takes width as number or string
import { ShimmerText } from '@/src/components/animation/ShimmerText';
// ShimmerText.tsx: renders View with height 10, borderRadius 4, backgroundColor '#1a1a2e'

// CardGridSkeleton renders inside Shimmer with auto-measured width
// 9 cards in 3-column grid, each matching real CardThumbnail layout
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Animated.Value loop for skeleton | Reanimated withRepeat + withTiming + SVG gradient (Shimmer system) | Phase 15 | Old SkeletonCard in CardGrid.tsx must be replaced |
| TouchableOpacity with activeOpacity={0.7} | Animated.View + Pressable + useAnimatedPress | Phase 15 | MyPostCard, ProposalCard, index.tsx preview cards still use old pattern |
| ActivityIndicator spinner for loading | ShimmerBox/Circle/Text skeleton compositions | Phase 15 (primitives) + Phase 16 (compositions) | Trades tab still shows ActivityIndicator for loading state |
| Plain Phosphor icon + text for empty state | EmptyState component with Button CTA | Phase 16 | trades.tsx has manual empty state markup — replace with shared component |
| Inline StyleSheet.create per component | Card/Text/Badge primitives with token values | Phase 16 | All 3 tabs still use inline styles for containers and typography |

**Deprecated/outdated within this phase:**
- `SkeletonCard` function in `CardGrid.tsx`: Uses `Animated.Value` opacity loop — replace with `CardGridSkeleton` using shimmer system
- `activeOpacity={0.7}` on `TouchableOpacity` in `MyPostCard.tsx`, `ProposalCard.tsx`: Replace with `useAnimatedPress` + `Animated.View` + `Pressable`
- `ActivityIndicator` loading state in `trades.tsx`: Replace with `PostListSkeleton` / `ProposalListSkeleton`
- Inline empty state markup in `trades.tsx` (lines 271-299): Replace with `EmptyState` component

## Open Questions

1. **Toast coexistence: custom system vs. react-native-toast-message**
   - What we know: `_layout.tsx` imports and uses `react-native-toast-message` for `matchNotification` push notification toasts. D-15 says "no external library" for CL-04.
   - What's unclear: Whether `react-native-toast-message` should be removed or kept alongside the new system. Removing it risks regressions in the push notification toast.
   - Recommendation: Plan for coexistence. New `ToastOverlay` handles CL-04 (success/error/info/warning). Existing `<Toast>` library handles `matchNotification`. Both mount in `_layout.tsx`. This is the safest approach — the planner should make this a explicit task decision.

2. **useStaggeredList integration with FlashList in Trades tab**
   - What we know: `useStaggeredList` uses `getItemStyle(index)` pattern expecting `Animated.View` wrapping. FlashList renders items via `renderItem` callback.
   - What's unclear: The optimal place to trigger `onLayout` for FlashList lists (no wrapping View around the list as a whole).
   - Recommendation: Apply `onLayout` to a `ListHeaderComponent` View, or to the `contentContainerStyle` parent. Alternatively, apply `getItemStyle` per renderItem and trigger `onLayout` via a wrapper View above the FlashList. The existing implementation in index.tsx (ScrollView) is simpler — use `onLayout` on the ScrollView's content container.

3. **Card thumbnail width for rarity shimmer**
   - What we know: Cards are in a 3-column FlashList grid. Width = (screenWidth - padding) / 3. `CardThumbnail` currently uses `flex: 1` so actual pixel width varies by device.
   - What's unclear: Whether to use `useWindowDimensions` in `CardThumbnail` to compute width, or pass width as a prop from `CardGrid`.
   - Recommendation: Use `onLayout` on the `imageContainer` View to measure actual rendered width. Set `containerWidth` state and use it for the shimmer SVG overlay. One-time measurement per card — no re-renders needed.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no test config files found in repository |
| Config file | None |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CL-01 | Button/Card/Text/Badge/Input/Divider render with correct token values | visual/manual | Manual — visual inspection in simulator | N/A |
| CL-02 | Skeleton shows while loading, disappears when data arrives | manual smoke | Manual — toggle network in simulator | N/A |
| CL-03 | Empty state with CTA appears when list is empty | manual smoke | Manual — clear data, observe | N/A |
| CL-04 | Toast appears bottom-of-screen, auto-dismisses after 3s, all 4 variants visible | manual smoke | Manual — trigger from REPL or test button | N/A |
| CL-05 | Scale-down animation and haptic on press for all tappable elements | manual smoke | Manual — physical device test | N/A |
| CL-06 | Gold tint on pull-to-refresh spinner (iOS: gold ring, Android: gold progress) | manual smoke | Manual — pull on physical device | N/A |
| SCR-01 | Home tab shows Card/Text primitives, staggered entrance, no layout regressions | manual smoke | Manual — visual comparison | N/A |
| SCR-02 | Cards tab: star cards have shimmer, crown cards have glow, grid skeleton works | manual smoke | Manual — filter to star/crown rarity | N/A |
| SCR-03 | Trades tab: MyPostCard/ProposalCard use animated press, skeleton/empty state correct | manual smoke | Manual — empty account + loaded account | N/A |

### Wave 0 Gaps
No test framework exists in this repository. All validation is manual/visual.
- No automated test suite to run
- No Wave 0 test file creation needed

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection — `apps/mobile/app/_layout.tsx` (existing toast library, GestureHandlerRootView)
- Direct codebase inspection — `apps/mobile/src/hooks/useAnimatedPress.ts` (confirmed API: `{ animatedStyle, pressHandlers }`, `options.haptic`)
- Direct codebase inspection — `apps/mobile/src/hooks/useStaggeredList.ts` (confirmed API: `{ onLayout, getItemStyle }`, MAX_STAGGER_ITEMS=15)
- Direct codebase inspection — `apps/mobile/src/components/animation/Shimmer.tsx` (confirmed SVG gradient, onLayout measurement, children composition)
- Direct codebase inspection — `apps/mobile/src/components/animation/ShimmerBox.tsx` (confirmed: base color `#1a1a2e`, width/height/borderRadius props)
- Direct codebase inspection — `apps/mobile/src/constants/springs.ts` (SPRING_PRESS: damping:15, stiffness:300, mass:0.8)
- Direct codebase inspection — `packages/shared/src/tokens/colors.ts` (rarityStar: gold[500]=#f0c040, rarityCrown: crown[500]=#e8b4f8)
- Direct codebase inspection — `packages/shared/src/tokens/elevation.ts` (low/medium/high elevation presets)
- Direct codebase inspection — `apps/mobile/src/components/cards/CardGrid.tsx` (existing Animated.Value SkeletonCard to replace)
- Direct codebase inspection — `apps/mobile/src/components/cards/CardThumbnail.tsx` (imageContainer with overflow:hidden, rarity via card.rarity string)
- Direct codebase inspection — `apps/mobile/src/components/cards/RarityBadge.tsx` (rarity string mapping: star1/2/3 → gold, crown → purple)
- Direct codebase inspection — `apps/mobile/app/(tabs)/index.tsx`, `cards.tsx`, `trades.tsx` (current screen patterns, TouchableOpacity usage)

### Secondary (MEDIUM confidence)
- React Native docs — RefreshControl tintColor (iOS) + colors (Android) must be passed via refreshControl prop to FlashList
- Reanimated docs — borderColor animation not reliably cross-platform; opacity-based glow preferred for crown effect

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified in codebase, no new installs needed
- Architecture: HIGH — based on direct codebase reading of Phase 15 primitives and existing screen patterns
- Pitfalls: HIGH — based on direct code inspection (e.g., Animated.Value SkeletonCard, TouchableOpacity usage, Shimmer.tsx implementation)
- Open questions: LOW — require planner decision (toast coexistence, useStaggeredList + FlashList integration)

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (stable — no fast-moving dependencies)
