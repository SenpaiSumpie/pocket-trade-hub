# Phase 15: Animation Utilities and Motion System - Research

**Researched:** 2026-03-21
**Domain:** React Native animations (Reanimated 4), gesture-driven bottom sheets, shimmer skeletons
**Confidence:** HIGH (core Reanimated patterns well-established), MEDIUM (@gorhom/bottom-sheet v5 Expo 54 edge cases)

## Summary

Phase 15 builds a reusable animation utility layer on top of react-native-reanimated 4.1.6 (already installed). The phase delivers five categories of primitives: press/stagger hooks, an animated counter component, card physics (flip/tilt/spring), gesture-driven bottom sheets via @gorhom/bottom-sheet v5, and shimmer skeleton primitives. All animations run on the UI thread. The shimmer system requires `expo-linear-gradient` (not yet installed) for the gradient sweep effect.

The primary risk is @gorhom/bottom-sheet v5 compatibility with Reanimated 4 and Expo 54. Multiple GitHub issues document crashes on close, backdrop tap issues, and component rendering errors. The library's v5 was written against Reanimated v3. A validation-first approach is essential -- install and test basic open/close/dismiss before building the DetailSheet wrapper. If v5 proves unstable, a custom bottom sheet using Reanimated 4 + Gesture Handler primitives is a viable fallback (the project already has gesture-handler 2.30.0 as a transitive dependency).

**Primary recommendation:** Validate @gorhom/bottom-sheet v5 immediately in the first wave before building any wrapper. Structure all other animation hooks as independent, composable utilities that follow the established `useCollapsibleHeader` pattern (shared values + animated styles + spring configs).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Convert 6 detail/browse modals to gesture-driven bottom sheets: CardDetailModal, PostDetailModal, DeckDetailModal, MatchDetailModal, MyPostDetailModal, ProposalDetailModal
- D-02: Creation modals (PostCreationModal, ProposalCreationModal) and small dialogs (RatingModal, AddToCollectionModal, LinkAccountModal) stay as React Native `<Modal>`
- D-03: Bottom sheets use @gorhom/bottom-sheet v5 with two snap points: ~60% height (peek) and near-full-screen (expanded)
- D-04: Dark semi-transparent overlay backdrop (no blur)
- D-05: Dismiss via drag-down past threshold OR tap backdrop area
- D-06: useAnimatedPress: subtle scale to ~0.97 with fast spring
- D-07: useStaggeredList: fade in + translate up 10-15px, staggered 50ms per item
- D-08: Stagger animations play on first mount only
- D-09: AnimatedCounter: slide-up digit transition (odometer style)
- D-10: 3D Y-axis card flip using Reanimated + perspective transform
- D-11: Card flip used in detail view only, not grid thumbnails
- D-12: Subtle tilt on press: card tilts 2-3 degrees toward touch point
- D-13: Gentle spring overshoot on card appear: scale 0.95 to 1.0 with slight overshoot to 1.02
- D-14: Linear sweep shimmer left-to-right
- D-15: Content-matched skeletons mirror real content shape
- D-16: Subtle dark gradient palette: base ~#1a1a2e, sweep ~#252540 (no gold accent)
- D-17: Build shimmer primitives only this phase; screen-specific compositions in Phases 16/17

### Claude's Discretion
- Exact spring config values for all animations (damping, stiffness, mass)
- Bottom sheet snap point exact percentages
- Tilt angle calculation from touch point position
- AnimatedCounter digit height and timing
- Shimmer gradient width and animation duration
- Whether to create a shared AnimatedCard component or keep flip/tilt as composable hooks

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MOT-01 | Reusable animation hooks (useAnimatedPress, useStaggeredList, useScrollHeader) | Reanimated 4 useSharedValue + useAnimatedStyle + withSpring pattern established in useCollapsibleHeader.ts. useScrollHeader already exists. Spring presets defined in UI-SPEC. |
| MOT-02 | Animated counter component for numeric transitions | Reanimated 4 interpolate + withTiming for digit slide. overflow: hidden container with translateY animation. |
| MOT-03 | Card flip and spring physics micro-interactions | Official Reanimated flip card example uses interpolate for rotateY 0-180/180-360 with perspective. Tilt uses normalized touch coordinates mapped to rotateX/rotateY. |
| MOT-04 | Bottom sheet gesture interactions replacing modal components | @gorhom/bottom-sheet v5 (5.2.8 latest). Requires react-native-gesture-handler (2.30.0 available as transitive dep) + GestureHandlerRootView wrapping app root. Known Expo 54 edge cases need early validation. |
| MOT-05 | Shimmer animation system for skeleton loading | expo-linear-gradient for gradient rendering + Reanimated withRepeat(withTiming()) for infinite horizontal sweep. No MaskedView needed if using absolute-positioned gradient overlay with opacity. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native-reanimated | 4.1.6 (installed) | All animations: springs, timing, interpolation | Project decision: Reanimated 4 exclusively. Already used in useCollapsibleHeader and CustomTabBar |
| @gorhom/bottom-sheet | ^5.2.8 | Gesture-driven bottom sheets replacing modals | Locked decision D-03. Standard RN bottom sheet library with snapping, backdrop, keyboard avoidance |
| react-native-gesture-handler | ^2.30.0 | Peer dependency for bottom-sheet, future gesture work | Available as transitive dep (via react-native-draggable-flatlist). Must be added as direct dependency |
| expo-linear-gradient | ~14.0.x | Shimmer gradient sweep rendering | First-party Expo module for linear gradients. Lightweight, no native rebuild needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-haptics | ^55.0.8 (installed) | Haptic feedback on press interactions | Already used in CustomTabBar. useAnimatedPress can optionally trigger it |
| react-native-svg | 15.12.1 (installed) | Potential shimmer masking alternative | Already installed. Only needed if LinearGradient approach proves insufficient |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @gorhom/bottom-sheet | Custom Reanimated bottom sheet | Higher dev cost but avoids v5 Expo 54 edge cases. Keep as fallback if v5 validation fails |
| expo-linear-gradient | react-native-svg LinearGradient | SVG already installed but expo-linear-gradient is simpler for View-based gradients |
| MaskedView shimmer | Absolute-positioned gradient overlay | MaskedView adds another native dependency; overlay approach simpler with overflow:hidden |

**Installation:**
```bash
pnpm add @gorhom/bottom-sheet@^5 react-native-gesture-handler@^2 --filter mobile
npx expo install expo-linear-gradient --filter mobile
```

## Architecture Patterns

### Recommended Project Structure
```
apps/mobile/src/
  constants/
    springs.ts              # Named spring/timing presets
  hooks/
    useAnimatedPress.ts     # MOT-01: press scale + haptic
    useStaggeredList.ts     # MOT-01: mount-once stagger
    useCardFlip.ts          # MOT-03: 3D Y-axis flip
    useCardTilt.ts          # MOT-03: tilt toward touch point
    useShimmer.ts           # MOT-05: shared shimmer driver
  components/
    animation/
      AnimatedCounter.tsx   # MOT-02: odometer digits
      DetailSheet.tsx       # MOT-04: bottom sheet wrapper
      ShimmerBox.tsx        # MOT-05: rectangle placeholder
      ShimmerCircle.tsx     # MOT-05: circle placeholder
      ShimmerText.tsx       # MOT-05: text-line placeholder
      Shimmer.tsx           # MOT-05: gradient wrapper
```

### Pattern 1: Reanimated Hook Convention (established)
**What:** Hooks return shared values + animated styles. Consumers apply styles to `Animated.View`.
**When to use:** All animation hooks in this phase.
**Example:**
```typescript
// Source: existing useCollapsibleHeader.ts pattern
import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

export function useAnimatedPress(options?: { haptic?: boolean }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pressHandlers = {
    onPressIn: () => {
      scale.value = withSpring(0.97, SPRING_PRESS);
      if (options?.haptic) {
        runOnJS(triggerHaptic)();
      }
    },
    onPressOut: () => {
      scale.value = withSpring(1, SPRING_PRESS);
    },
  };

  return { animatedStyle, pressHandlers };
}
```

### Pattern 2: Spring Preset Constants
**What:** Named spring configurations as plain objects consumed by `withSpring()`.
**When to use:** Every animation in this phase references a named preset instead of inline config.
**Example:**
```typescript
// Source: UI-SPEC Section 2.1, aligned with existing { damping: 20, stiffness: 200 }
export const SPRING_SNAPPY = { damping: 20, stiffness: 200, mass: 1 };
export const SPRING_PRESS = { damping: 15, stiffness: 300, mass: 0.8 };
export const SPRING_CARD_APPEAR = { damping: 12, stiffness: 120, mass: 1 };
export const SPRING_FLIP = { damping: 18, stiffness: 160, mass: 1 };
export const SPRING_TILT = { damping: 14, stiffness: 250, mass: 0.8 };
export const SPRING_SHEET = { damping: 20, stiffness: 180, mass: 1 };
```

### Pattern 3: 3D Card Flip with Interpolation
**What:** Use `interpolate` to map a single shared value (0 or 1) to rotation degrees. Front face: 0-180deg. Back face: 180-360deg.
**When to use:** Card detail flip (MOT-03, D-10).
**Example:**
```typescript
// Source: Reanimated official flip card example
const isFlipped = useSharedValue(false);
const rotation = useSharedValue(0);

const frontStyle = useAnimatedStyle(() => {
  const rotateY = interpolate(rotation.value, [0, 1], [0, 180]);
  return {
    transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
    backfaceVisibility: 'hidden',
  };
});

const backStyle = useAnimatedStyle(() => {
  const rotateY = interpolate(rotation.value, [0, 1], [180, 360]);
  return {
    transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
    backfaceVisibility: 'hidden',
  };
});
```

### Pattern 4: Shimmer with withRepeat
**What:** Animate a translateX shared value infinitely using `withRepeat(withTiming())`. Gradient band sweeps across placeholder.
**When to use:** All shimmer primitives (MOT-05).
**Example:**
```typescript
// Source: Reanimated withRepeat docs
const translateX = useSharedValue(-width);

useEffect(() => {
  translateX.value = withRepeat(
    withTiming(width, { duration: 1200, easing: Easing.linear }),
    -1, // infinite
    false // no reverse
  );
}, []);
```

### Pattern 5: GestureHandlerRootView at App Root
**What:** Wrap the entire app tree with `GestureHandlerRootView` from `react-native-gesture-handler`.
**When to use:** Required for @gorhom/bottom-sheet v5. Must be added to `app/_layout.tsx`.
**Example:**
```typescript
// Source: @gorhom/bottom-sheet docs
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* existing layout */}
    </GestureHandlerRootView>
  );
}
```

### Anti-Patterns to Avoid
- **Inline spring configs:** Never use `withSpring(value, { damping: 20, stiffness: 200 })` directly. Always reference named presets from `springs.ts`.
- **Replaying mount animations:** Stagger MUST NOT replay when user returns to a tab. Use a `useRef(false)` flag to gate first-mount-only behavior.
- **Using backfaceVisibility alone for flip:** On Android, `backfaceVisibility: 'hidden'` is unreliable without `perspective` in the transform array. Always include `{ perspective: 1000 }` as the first transform.
- **Nesting GestureHandlerRootView:** Only ONE at the app root. Never wrap individual bottom sheets with another GestureHandlerRootView.
- **Shimmer without overflow:hidden:** The gradient band will be visible outside placeholder bounds without `overflow: 'hidden'` on the container.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bottom sheet | Custom pan gesture + snap logic | @gorhom/bottom-sheet v5 | Keyboard avoidance, scroll interop, snap physics, backdrop, accessibility -- dozens of edge cases |
| Shimmer gradient | Custom canvas/shader | expo-linear-gradient + Reanimated withRepeat | expo-linear-gradient is first-party, lightweight, handles platform differences |
| Reduced motion detection | Custom AccessibilityInfo listener | Reanimated 4 `useReducedMotion` hook | Built into Reanimated 4. Returns boolean synchronously. Reanimated also auto-disables animations when system reduce-motion is enabled via `ReducedMotionConfig` |
| Spring physics | Custom physics engine | Reanimated `withSpring` | Reanimated springs run on UI thread, handle interruption, and follow native animation conventions |

**Key insight:** Reanimated 4 has built-in reduced motion support via `useReducedMotion` hook and `ReducedMotionConfig` component. No need to manually listen to `AccessibilityInfo.isReduceMotionEnabled`. Animations are disabled automatically by default when the device setting is on.

## Common Pitfalls

### Pitfall 1: @gorhom/bottom-sheet v5 + Reanimated 4 + Expo 54 Crashes
**What goes wrong:** Bottom sheet won't open, crashes on close, backdrop tap fails, or "Cannot read property 'level' of undefined" errors.
**Why it happens:** v5 was written against Reanimated v3. Reanimated 4 changed internal APIs.
**How to avoid:** Validate basic open/close/dismiss in an isolated test screen FIRST, before building the full DetailSheet wrapper. Pin to @gorhom/bottom-sheet@5.2.8 (latest). If crashes persist, fall back to a custom Reanimated-based bottom sheet using `Gesture.Pan` from react-native-gesture-handler.
**Warning signs:** Console warnings about "scrollable node handle IDs", render errors mentioning "ReactComponent".

### Pitfall 2: Android Transform Ordering
**What goes wrong:** 3D transforms (rotateY, perspective) render differently or not at all on Android.
**Why it happens:** Android requires `perspective` as the FIRST item in the transform array. iOS is more forgiving.
**How to avoid:** Always put `{ perspective: 1000 }` before any rotation transforms.
**Warning signs:** Flip animation works on iOS simulator but appears flat or broken on Android.

### Pitfall 3: Stagger Animation Replay on Tab Switch
**What goes wrong:** List items re-animate every time the user switches tabs and comes back.
**Why it happens:** React Navigation keeps tab screens mounted but re-triggers effects on focus.
**How to avoid:** Use `useRef(false)` as a `hasAnimated` flag. Set to `true` after first animation. Skip animation when flag is true.
**Warning signs:** Users see cascading animations repeatedly when navigating between tabs.

### Pitfall 4: Shimmer Memory Leak
**What goes wrong:** `withRepeat` animation continues running after component unmounts, causing performance degradation.
**Why it happens:** Infinite animations (-1 repeat) don't auto-cancel in all scenarios.
**How to avoid:** Call `cancelAnimation(sharedValue)` in the cleanup function of the `useEffect` that starts the shimmer.
**Warning signs:** App becomes sluggish after navigating away from loading screens.

### Pitfall 5: GestureHandlerRootView Missing
**What goes wrong:** Bottom sheet gestures don't work, pan gestures fail silently, or crash with "PanGestureHandler must be used as a descendant of GestureHandlerRootView".
**Why it happens:** @gorhom/bottom-sheet v5 requires gesture-handler v2 which needs the root view wrapper.
**How to avoid:** Add `GestureHandlerRootView` in `app/_layout.tsx` wrapping the entire tree. Currently NOT present in the project.
**Warning signs:** Bottom sheet renders but doesn't respond to drag gestures.

### Pitfall 6: AnimatedCounter Layout Shift
**What goes wrong:** Counter component changes width during animation, causing adjacent content to jump.
**Why it happens:** Digit count changes (e.g., 9 -> 10) alter the text width.
**How to avoid:** Use a fixed-width approach: measure the formatted string width at the maximum expected value, or use `minWidth` styling. Alternatively, accept minor shifts for simplicity since this is cosmetic.
**Warning signs:** Stats rows jitter when counters cross digit boundaries.

## Code Examples

### Bottom Sheet Basic Setup (from @gorhom/bottom-sheet docs)
```typescript
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { useCallback, useMemo, useRef } from 'react';

function DetailSheet({ visible, onDismiss, children }: DetailSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['60%', '92%'], []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.6}
        pressBehavior="close"
      />
    ),
    [],
  );

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onClose={onDismiss}
      backgroundStyle={{ backgroundColor: '#1a1a2e' }}
      handleIndicatorStyle={{
        backgroundColor: '#3a3a55',
        width: 36,
        height: 4,
      }}
      style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
    >
      <BottomSheetView>{children}</BottomSheetView>
    </BottomSheet>
  );
}
```

### Stagger with Mount-Once Gate
```typescript
import { useEffect, useRef } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

const MAX_STAGGER_ITEMS = 15;
const STAGGER_DELAY = 50;
const FADE_DURATION = 200;
const TRANSLATE_DISTANCE = 12;

export function useStaggeredList(itemCount: number) {
  const hasAnimated = useRef(false);
  const animationValues = Array.from({ length: Math.min(itemCount, MAX_STAGGER_ITEMS) }, () =>
    useSharedValue(hasAnimated.current ? 1 : 0),
  );

  const triggerAnimation = () => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    animationValues.forEach((val, i) => {
      val.value = withDelay(
        i * STAGGER_DELAY,
        withTiming(1, { duration: FADE_DURATION, easing: Easing.out(Easing.quad) }),
      );
    });
  };

  const getItemStyle = (index: number) => {
    if (index >= MAX_STAGGER_ITEMS) {
      return {}; // items beyond cap appear instantly
    }
    const val = animationValues[index];
    return useAnimatedStyle(() => ({
      opacity: val.value,
      transform: [{ translateY: (1 - val.value) * TRANSLATE_DISTANCE }],
    }));
  };

  return { getItemStyle, onLayout: triggerAnimation };
}
```

### Reduced Motion Guard
```typescript
import { useReducedMotion } from 'react-native-reanimated';

// Inside any animation hook:
const reducedMotion = useReducedMotion();

// When reducedMotion is true, skip spring animations:
if (reducedMotion) {
  scale.value = targetValue; // instant, no animation
} else {
  scale.value = withSpring(targetValue, SPRING_PRESS);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Animated API from RN core | Reanimated 4 worklets on UI thread | Reanimated 4 (2024) | All animations run at 60fps without JS thread bottleneck |
| AccessibilityInfo.isReduceMotionEnabled() | Reanimated useReducedMotion + ReducedMotionConfig | Reanimated 3+ | Built-in, synchronous, auto-disables animations |
| Custom Modal + Animated.View for sheets | @gorhom/bottom-sheet v5 | 2023-2024 | Snap points, keyboard avoidance, scroll interop out of the box |
| MaskedView + LinearGradient for shimmer | Direct LinearGradient overlay with overflow:hidden | 2024-2025 | Simpler, fewer native deps, same visual result |
| Moti for declarative animations | Direct Reanimated 4 (Moti incompatible) | Reanimated 4 | Project decision: Moti incompatible with Reanimated 4 |

**Deprecated/outdated:**
- Moti: Incompatible with Reanimated 4 (project decision documented in STATE.md)
- Lottie: Too heavy for micro-interactions (project decision)
- `react-native-shimmer`: Native module, not maintained, conflicts with Expo managed workflow

## Open Questions

1. **@gorhom/bottom-sheet v5 stability with Reanimated 4**
   - What we know: Multiple GitHub issues (2528, 2471, 2507, 2476) document crashes. Latest version is 5.2.8.
   - What's unclear: Whether 5.2.8 has fixes for the Reanimated 4 issues or if workarounds exist.
   - Recommendation: First task in Wave 1 must be an isolated validation test. Budget time for a custom fallback implementation.

2. **expo-linear-gradient vs react-native-svg for shimmer gradient**
   - What we know: expo-linear-gradient is simpler and first-party. react-native-svg is already installed and has LinearGradient.
   - What's unclear: Whether expo-linear-gradient works well inside Animated.View transforms.
   - Recommendation: Use expo-linear-gradient (cleaner API for View-based gradients). Fall back to react-native-svg LinearGradient if needed.

3. **BottomSheetScrollView vs regular ScrollView in detail sheets**
   - What we know: @gorhom/bottom-sheet provides BottomSheetScrollView for scroll interop.
   - What's unclear: Whether existing detail modal content (e.g., CardDetailModal at ~650 lines) needs BottomSheetScrollView or if BottomSheetView suffices.
   - Recommendation: Use BottomSheetScrollView for all detail sheets since they have scrollable content.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (configured in packages/shared and apps/api) |
| Config file | No jest config in apps/mobile -- Wave 0 gap |
| Quick run command | N/A (no mobile test infrastructure) |
| Full suite command | N/A |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MOT-01 | useAnimatedPress returns correct animatedStyle and pressHandlers | manual-only | N/A -- Reanimated hooks require native runtime | N/A |
| MOT-01 | useStaggeredList triggers animation on layout, respects mount-once gate | manual-only | N/A -- Reanimated hooks require native runtime | N/A |
| MOT-02 | AnimatedCounter renders and animates between values | manual-only | N/A -- requires native rendering | N/A |
| MOT-03 | useCardFlip interpolates rotateY correctly | manual-only | N/A -- requires native rendering | N/A |
| MOT-04 | DetailSheet opens, snaps, dismisses via drag and backdrop tap | manual-only | N/A -- requires native runtime + gesture handler | N/A |
| MOT-05 | Shimmer gradient sweeps continuously, stops on unmount | manual-only | N/A -- requires native rendering | N/A |

**Note:** All phase requirements involve Reanimated animations which require a native runtime. Unit testing Reanimated hooks is not practical without `react-native-reanimated/mock` and a full jest-expo setup. The primary validation method for this phase is visual/manual testing on device or simulator. Spring preset constants (pure JS objects) can be trivially unit tested but provide minimal value.

### Sampling Rate
- **Per task commit:** Manual visual verification on iOS simulator + Android emulator
- **Per wave merge:** Full walkthrough of all animation primitives on both platforms
- **Phase gate:** All animations render correctly, no crashes, reduced motion guard works

### Wave 0 Gaps
- No mobile test infrastructure exists (no jest.config in apps/mobile)
- Reanimated animation testing requires native runtime -- standard unit tests are not applicable
- Recommendation: Skip automated test setup for this phase; validate via manual testing protocol. Automated tests for animation utilities would require react-native-testing-library + jest-expo + reanimated mocks -- significant setup for limited value on a utility-only phase

## Sources

### Primary (HIGH confidence)
- `apps/mobile/src/hooks/useCollapsibleHeader.ts` -- Established Reanimated hook pattern with spring configs
- `apps/mobile/src/components/navigation/CustomTabBar.tsx` -- Existing withSpring animation pattern
- `apps/mobile/app/_layout.tsx` -- Current root layout (no GestureHandlerRootView)
- `packages/shared/src/tokens/motion.ts` -- Motion token values
- `.planning/phases/15-animation-utilities-and-motion-system/15-UI-SPEC.md` -- Approved UI specification with all contracts
- [Reanimated Flip Card Example](https://docs.swmansion.com/react-native-reanimated/examples/flipCard/) -- Official 3D flip implementation
- [Reanimated withRepeat docs](https://docs.swmansion.com/react-native-reanimated/docs/animations/withRepeat/) -- Infinite loop animation pattern
- [Reanimated useReducedMotion](https://docs.swmansion.com/react-native-reanimated/docs/device/useReducedMotion/) -- Built-in reduced motion hook
- [Reanimated ReducedMotionConfig](https://docs.swmansion.com/react-native-reanimated/docs/device/ReducedMotionConfig/) -- Global reduced motion configuration

### Secondary (MEDIUM confidence)
- [@gorhom/bottom-sheet docs](https://gorhom.dev/react-native-bottom-sheet/) -- Setup and API reference
- [@gorhom/bottom-sheet npm](https://www.npmjs.com/package/@gorhom/bottom-sheet) -- v5.2.8 latest, published ~Nov 2025
- [Callstack shimmer guide](https://www.callstack.com/blog/performant-and-cross-platform-shimmers-in-react-native-apps) -- Shimmer implementation patterns

### Tertiary (LOW confidence)
- [GitHub Issue #2528](https://github.com/gorhom/react-native-bottom-sheet/issues/2528) -- Bottom sheet v5 + Reanimated 4 compatibility reports
- [GitHub Issue #2471](https://github.com/gorhom/react-native-bottom-sheet/issues/2471) -- Expo 54 TypeError
- [GitHub Issue #2507](https://github.com/gorhom/react-native-bottom-sheet/issues/2507) -- RN 0.81.4 + Reanimated v4 render error
- [GitHub Issue #2476](https://github.com/gorhom/react-native-bottom-sheet/issues/2476) -- App crash on close

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Reanimated 4.1.6 already in use, patterns established; MEDIUM for @gorhom/bottom-sheet due to documented edge cases
- Architecture: HIGH -- File structure matches existing conventions, hook patterns follow useCollapsibleHeader precedent
- Pitfalls: HIGH -- Multiple GitHub issues document bottom-sheet problems, Android transform ordering is well-known, stagger replay is a classic RN navigation issue

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (30 days -- Reanimated 4 is stable, bottom-sheet v5 may get patches)
