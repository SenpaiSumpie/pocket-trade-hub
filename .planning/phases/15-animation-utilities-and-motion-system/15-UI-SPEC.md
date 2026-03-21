---
phase: 15
slug: animation-utilities-and-motion-system
status: approved
reviewed_at: 2026-03-21
shadcn_initialized: false
preset: none
created: 2026-03-21
---

# Phase 15 UI-SPEC: Animation Utilities and Motion System

## 1. Overview

This phase delivers a library of reusable, performant animation primitives for React Native (Expo). Every animation runs on the UI thread via `react-native-reanimated` 4.1.6. There are no new screens or layouts -- this is a utility layer consumed by Phases 16-19.

**Platform:** React Native / Expo 54
**Animation engine:** react-native-reanimated 4.1.6 (already installed)
**Gesture engine:** react-native-gesture-handler (to be installed, required by @gorhom/bottom-sheet v5)
**Bottom sheet:** @gorhom/bottom-sheet v5 (to be installed)

---

## 2. Motion Contracts

### 2.1 Spring Configurations

All spring configs are defined as named presets consumed by `withSpring()`. Values tuned for 60fps on mid-range Android devices.

| Preset Name | damping | stiffness | mass | Use Case |
|---|---|---|---|---|
| `springSnappy` | 20 | 200 | 1 | Tab pill slide, header collapse (existing pattern) |
| `springPress` | 15 | 300 | 0.8 | Press scale-down/release (fast, responsive) |
| `springCardAppear` | 12 | 120 | 1 | Card entry with gentle overshoot |
| `springFlip` | 18 | 160 | 1 | Card flip rotation settle |
| `springTilt` | 14 | 250 | 0.8 | Card tilt on press, snaps back quickly |
| `springSheet` | 20 | 180 | 1 | Bottom sheet snap-to-point |

**Rationale:** `springSnappy` matches the existing `{ damping: 20, stiffness: 200 }` from `useCollapsibleHeader.ts` and `CustomTabBar.tsx`. All new presets branch from that baseline.

### 2.2 Timing Configurations

For non-spring animations where predictable duration matters over physical feel.

| Preset Name | duration (ms) | easing | Use Case |
|---|---|---|---|
| `timingCounter` | 400 | decelerate | AnimatedCounter digit slide |
| `timingShimmer` | 1200 | linear | Shimmer sweep across skeleton |
| `timingFadeIn` | 200 | decelerate | Stagger item fade-in |
| `timingStagger` | 50 (per item) | -- | Delay between staggered list items |

**Token alignment:** Durations reference `motion.duration` from `packages/shared/src/tokens/motion.ts`:
- `timingFadeIn` = `motion.duration.fast` (200ms)
- `timingCounter` ~ between `motion.duration.normal` (300) and `motion.duration.slow` (500)
- `timingShimmer` > `motion.duration.glacial` (800) for smooth, unhurried sweep

### 2.3 Gesture Thresholds

| Threshold | Value | Context |
|---|---|---|
| Dismiss velocity (bottom sheet) | > 500 pts/s downward | Fling-to-dismiss sheet |
| Dismiss distance (bottom sheet) | > 30% of sheet height below lowest snap point | Drag-to-dismiss sheet |
| Backdrop tap dismiss | single tap on overlay area | Tap-to-dismiss sheet |
| Press scale activation | immediate on `onPressIn` | No delay; scale begins instantly |

### 2.4 Animation Composition Rules

1. **Spring animations cancel previous springs** on the same shared value (call `cancelAnimation()` before applying new spring, per existing `useCollapsibleHeader` pattern).
2. **Stagger plays once on mount only.** Returning to a tab does NOT replay stagger (D-08). Use a `hasAnimated` ref to gate.
3. **Press and tilt compose independently.** `useAnimatedPress` controls `scale`; card tilt controls `rotateX`/`rotateY`. Both apply to the same `transform` array without conflict.
4. **Bottom sheet gestures are handled by @gorhom/bottom-sheet** internally -- no custom gesture composition needed for sheet drag. App code only provides snap points and callbacks.
5. **Shimmer loops continuously** until the component unmounts. Uses `withRepeat` + `withTiming` on a single translationX shared value.

---

## 3. Component and Hook Contracts

### 3.1 useAnimatedPress (MOT-01)

**Purpose:** Subtle scale feedback on any tappable element.

| Property | Value |
|---|---|
| Scale down | 0.97 |
| Scale up (rest) | 1.0 |
| Spring config | `springPress` (damping: 15, stiffness: 300, mass: 0.8) |
| Haptic feedback | Optional, via `expo-haptics` `ImpactFeedbackStyle.Light` |

**API shape:**
```ts
function useAnimatedPress(options?: { haptic?: boolean }): {
  animatedStyle: AnimatedStyle;
  pressHandlers: { onPressIn: () => void; onPressOut: () => void };
};
```

**Behavior:**
- `onPressIn`: scale to 0.97 with `springPress`
- `onPressOut`: scale to 1.0 with `springPress`
- If `haptic: true`, triggers `Haptics.impactAsync(ImpactFeedbackStyle.Light)` on press-in

### 3.2 useStaggeredList (MOT-01)

**Purpose:** Fade-in + translate-up cascade for list items on first mount.

| Property | Value |
|---|---|
| Translate distance | 12px upward |
| Fade from/to | 0 to 1 |
| Per-item delay | 50ms |
| Duration per item | 200ms (`timingFadeIn`) |
| Easing | decelerate |
| Max stagger items | 15 (items beyond 15 appear instantly -- avoids long waits) |
| Replay on revisit | No (D-08) |

**API shape:**
```ts
function useStaggeredList(itemCount: number): {
  getItemStyle: (index: number) => AnimatedStyle;
  onLayout: () => void;  // triggers animation start
};
```

### 3.3 AnimatedCounter (MOT-02)

**Purpose:** Odometer-style digit transition for numeric values.

| Property | Value |
|---|---|
| Digit height | matches parent `fontSize` line-height |
| Transition | old value slides up + fades out, new value slides up from below |
| Duration | 400ms (`timingCounter`) |
| Easing | decelerate |
| Overflow | hidden (clips mid-transition digits) |

**API shape:**
```ts
interface AnimatedCounterProps {
  value: number;
  style?: TextStyle;
  formatFn?: (n: number) => string;  // e.g., toLocaleString
}
```

**Visual contract:**
- Container: `overflow: 'hidden'`, height = line-height of the text style
- Old digits translate Y from 0 to -lineHeight, opacity 1 to 0
- New digits translate Y from +lineHeight to 0, opacity 0 to 1
- Renders as inline element, fits within any row layout

### 3.4 Card Flip Animation (MOT-03)

**Purpose:** 3D Y-axis flip for card detail view (toggling between art and stats faces).

| Property | Value |
|---|---|
| Rotation axis | Y-axis (horizontal flip) |
| Rotation range | 0deg to 180deg |
| Perspective | 1000 |
| Spring config | `springFlip` (damping: 18, stiffness: 160, mass: 1) |
| Face swap threshold | 90deg (at midpoint, swap front/back content) |

**Behavior:**
- Flip forward: rotate 0 -> 180 on Y-axis
- At 90deg, front face opacity drops to 0, back face opacity goes to 1 (avoids mirrored text)
- Back face renders with `rotateY: 180deg` base transform so content appears non-mirrored
- Used in detail view only (D-11), never on grid thumbnails

### 3.5 Card Tilt on Press (MOT-03)

**Purpose:** Subtle physical tilt toward touch point on press.

| Property | Value |
|---|---|
| Max tilt angle | 3 degrees |
| Spring config | `springTilt` (damping: 14, stiffness: 250, mass: 0.8) |
| Touch point calculation | Normalize touch (x, y) to [-1, 1] range relative to card center |
| Tilt mapping | rotateX = -touchY * 3deg, rotateY = touchX * 3deg |
| Release behavior | Spring back to (0, 0) |

### 3.6 Card Appear Spring (MOT-03)

**Purpose:** Gentle overshoot on card entry for lively cascade effect.

| Property | Value |
|---|---|
| Scale range | 0.95 -> 1.0 (overshoots to ~1.02 then settles) |
| Spring config | `springCardAppear` (damping: 12, stiffness: 120, mass: 1) |
| Composes with | `useStaggeredList` (stagger delay + spring appear) |

### 3.7 Bottom Sheet (MOT-04)

**Purpose:** Replace 6 detail modals with gesture-driven bottom sheets.

| Property | Value |
|---|---|
| Library | @gorhom/bottom-sheet v5 |
| Snap points | ['60%', '92%'] (peek and expanded) |
| Initial snap | 0 (60% peek) |
| Backdrop | Dark semi-transparent overlay, `rgba(0, 0, 0, 0.6)` (D-04, no blur) |
| Dismiss: drag | Drag below lowest snap point past 30% threshold |
| Dismiss: backdrop tap | Tap outside sheet content area (D-05) |
| Handle indicator | Pill-shaped, 36px wide x 4px tall, `palette.gray[500]` (#3a3a55) |
| Background | `colors.surface` (#1a1a2e) |
| Border radius (top) | `borderRadius.xl` (24) |
| Spring config | `springSheet` (damping: 20, stiffness: 180, mass: 1) |

**Modals to convert (D-01):**
1. CardDetailModal
2. PostDetailModal
3. DeckDetailModal
4. MatchDetailModal
5. MyPostDetailModal
6. ProposalDetailModal

**Modals that stay as `<Modal>` (D-02):**
- PostCreationModal, ProposalCreationModal (full-screen form focus)
- RatingModal, AddToCollectionModal, LinkAccountModal (small dialogs)

**Wrapper API shape:**
```ts
interface DetailSheetProps {
  visible: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
  initialSnap?: number;  // default 0
}
```

### 3.8 Shimmer Primitives (MOT-05)

**Purpose:** Skeleton loading placeholders with linear sweep shimmer.

| Property | Value |
|---|---|
| Base color | `palette.gray[800]` (#1a1a2e) -- matches `colors.surface` (D-16) |
| Highlight color | `palette.gray[700]` (#252540) (D-16) |
| Sweep duration | 1200ms (`timingShimmer`) |
| Sweep direction | left-to-right |
| Gradient width | 40% of component width |
| Loop | Infinite (`withRepeat`, -1) |
| Easing | linear (constant velocity sweep) |

**Primitive components (D-17):**

| Component | Props | Default Size |
|---|---|---|
| `ShimmerBox` | `width`, `height`, `borderRadius?` | 100% x 100px, `borderRadius.md` (12) |
| `ShimmerCircle` | `size` | 48px diameter |
| `ShimmerText` | `width?`, `lines?`, `fontSize?` | 100% width, line-height from typography token |
| `Shimmer` (wrapper) | `children` | Applies shimmer gradient to any child shape |

**Implementation approach:**
- Single `Animated.View` with a `LinearGradient` (via `react-native-svg` or masked view) translating horizontally
- Shared `useShimmer` hook provides the animated translateX value; all primitives consume it
- One shimmer animation drives all primitives in a skeleton group (synchronized sweep)

**Note:** Screen-specific skeleton compositions (e.g., CardListSkeleton, TradeRowSkeleton) are NOT built in Phase 15 -- those belong to Phases 16/17 (D-17).

---

## 4. Design Token References

All visual values come from the existing shared token package at `packages/shared/src/tokens/`.

### 4.1 Spacing

Uses existing scale from `spacing.ts`:

| Token | Value | Usage in this phase |
|---|---|---|
| `spacing.xs` | 4px | Handle indicator vertical margin |
| `spacing.sm` | 8px | Shimmer primitive gaps |
| `spacing.md` | 16px | Bottom sheet content padding |
| `spacing.lg` | 24px | Bottom sheet top padding |

### 4.2 Typography

Uses existing scale from `typography.ts`. Animation components inherit text styles from consumers:

| Token | Usage |
|---|---|
| `typography.body` (16/22) | AnimatedCounter default size |
| `typography.heading` (28/34) | AnimatedCounter for large stat displays |
| `typography.caption` (13/18) | AnimatedCounter for small labels |
| `typography.fontFamily.regular` | All animated text components |

### 4.3 Colors

Uses existing semantic colors from `colors.ts`:

| Token | Hex | Usage |
|---|---|---|
| `colors.surface` | #1a1a2e | Bottom sheet background, shimmer base |
| `colors.surfaceLight` | #252540 | Shimmer highlight |
| `colors.border` | #2a2a45 | Bottom sheet top border hint |
| `colors.onSurface` | #ffffff | AnimatedCounter text default |
| `colors.onSurfaceMuted` | #6c6c80 | Handle indicator alternative |

Palette direct references (for shimmer only):
| Token | Hex | Usage |
|---|---|---|
| `palette.gray[800]` | #1a1a2e | Shimmer base (D-16) |
| `palette.gray[700]` | #252540 | Shimmer sweep highlight (D-16) |
| `palette.gray[500]` | #3a3a55 | Bottom sheet handle indicator |

### 4.4 Elevation

| Token | Usage |
|---|---|
| `elevation.high` | Bottom sheet shadow |

### 4.5 Border Radius

| Token | Value | Usage |
|---|---|---|
| `borderRadius.md` | 12 | ShimmerBox default, card corners |
| `borderRadius.xl` | 24 | Bottom sheet top corners |
| `borderRadius.full` | 9999 | ShimmerCircle, handle indicator |

---

## 5. Copywriting

Minimal for a utility library phase. No user-facing copy is introduced.

| Element | Text | Notes |
|---|---|---|
| Bottom sheet a11y label | "Detail sheet" | AccessibilityLabel for sheet container |
| Handle indicator a11y hint | "Drag down to dismiss" | AccessibilityHint on handle |

Total copywriting elements: **2**

---

## 6. Accessibility Contracts

| Concern | Contract |
|---|---|
| Reduced motion | All animations respect `AccessibilityInfo.isReduceMotionEnabled`. When true: springs become instant (`duration: 0`), stagger shows all items immediately, shimmer stops sweeping (static placeholder), counter updates instantly. Full reduced-motion system deferred to Phase 19 (POL-05), but hooks include the guard now. |
| Bottom sheet focus | When sheet opens, focus moves to sheet content. When dismissed, focus returns to trigger element. |
| Press feedback | `useAnimatedPress` does not replace `accessibilityRole="button"` -- consumers must set roles themselves. |
| AnimatedCounter | Uses `accessibilityLiveRegion="polite"` so screen readers announce value changes. |

---

## 7. New Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@gorhom/bottom-sheet` | ^5 | Gesture-driven bottom sheets (D-03) |
| `react-native-gesture-handler` | ^2.x | Required peer dep for bottom-sheet and future gesture work |

**Already installed (no changes):**
- `react-native-reanimated` 4.1.6
- `expo-haptics` ^55.0.8
- `react-native-svg` 15.12.1

---

## 8. File Structure

All new files live under the mobile app's existing directory conventions:

```
apps/mobile/src/
  constants/
    springs.ts              # Named spring/timing presets (Section 2.1, 2.2)
  hooks/
    useAnimatedPress.ts     # MOT-01: press scale + optional haptic
    useStaggeredList.ts     # MOT-01: mount-once stagger cascade
    useCardFlip.ts          # MOT-03: 3D Y-axis flip
    useCardTilt.ts          # MOT-03: press tilt toward touch point
    useShimmer.ts           # MOT-05: shared shimmer translateX driver
  components/
    animation/
      AnimatedCounter.tsx   # MOT-02: odometer digit transition
      DetailSheet.tsx       # MOT-04: bottom sheet wrapper
      ShimmerBox.tsx        # MOT-05: rectangular shimmer placeholder
      ShimmerCircle.tsx     # MOT-05: circular shimmer placeholder
      ShimmerText.tsx       # MOT-05: text-line shimmer placeholder
      Shimmer.tsx           # MOT-05: gradient wrapper driving child shapes
```

---

## 9. Requirement Traceability

| Requirement | Deliverable | Section |
|---|---|---|
| MOT-01 | useAnimatedPress, useStaggeredList, useScrollHeader (existing) | 3.1, 3.2 |
| MOT-02 | AnimatedCounter component | 3.3 |
| MOT-03 | useCardFlip, useCardTilt, card appear spring | 3.4, 3.5, 3.6 |
| MOT-04 | DetailSheet wrapper + 6 modal conversions | 3.7 |
| MOT-05 | Shimmer, ShimmerBox, ShimmerCircle, ShimmerText, useShimmer | 3.8 |

---

## 10. Decision Traceability

| Decision | Section | How Applied |
|---|---|---|
| D-01 | 3.7 | 6 detail modals listed for conversion |
| D-02 | 3.7 | Creation and small dialog modals excluded |
| D-03 | 3.7 | @gorhom/bottom-sheet v5, two snap points |
| D-04 | 3.7 | Dark overlay backdrop, no blur |
| D-05 | 3.7 | Drag-down + tap-backdrop dismiss |
| D-06 | 3.1 | Scale 0.97, fast spring, iOS feel |
| D-07 | 3.2 | Fade + translate 12px, 50ms stagger |
| D-08 | 3.2 | Mount-once, no replay on tab revisit |
| D-09 | 3.3 | Slide-up digit transition, odometer style |
| D-10 | 3.4 | 3D Y-axis flip, perspective 1000 |
| D-11 | 3.4 | Detail view only, not grid thumbnails |
| D-12 | 3.5 | 2-3 degree tilt toward touch, spring back |
| D-13 | 3.6 | Scale 0.95 to 1.0, overshoot to ~1.02 |
| D-14 | 3.8 | Linear sweep shimmer left-to-right |
| D-15 | 3.8 | Content-matched skeleton shapes |
| D-16 | 3.8 | Surface-color base, slightly lighter sweep |
| D-17 | 3.8 | Primitives only; compositions in Phase 16/17 |
