# Phase 14: Navigation Shell and App Chrome - Research

**Researched:** 2026-03-21
**Domain:** React Native navigation chrome, animation, typography, icon systems
**Confidence:** HIGH

## Summary

Phase 14 replaces the default expo-router tab bar with a custom animated version, adds collapsible scroll headers, migrates all icons from Ionicons to Phosphor, integrates Inter font via the expo-font config plugin, and adds haptic feedback on tab switches. The project already uses expo-router with `<Tabs>` from React Navigation's bottom tab navigator, Reanimated 4.1.6, expo-haptics, and expo-font -- all dependencies are installed.

The core technical work is: (1) building a custom tab bar component passed via the `tabBar` prop on `<Tabs>`, using Reanimated for the sliding pill indicator and icon morphing; (2) creating a reusable collapsible header hook using `useAnimatedScrollHandler` with `interpolate` and `translateY`; (3) swapping all 50 files' worth of Ionicons to phosphor-react-native imports; (4) configuring Inter font at build time via the expo-font config plugin in app.json.

**Primary recommendation:** Tackle the phase in 4 waves -- font setup (foundation), icon migration (mechanical but broad), custom tab bar (animation-heavy), collapsible headers (scroll integration). Font and icons are prerequisites because the tab bar uses both.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Custom animated tab bar with a sliding pill indicator (gold-tinted background pill that slides between tabs using Reanimated)
- **D-02:** Icon morphing: inactive tabs show regular-weight outline icons, active tab shows fill-weight icon
- **D-03:** All 6 tab labels always visible (icon + label) -- not icon-only or active-only labels
- **D-04:** Trades badge replaced with a small gold dot indicator (no numeric count) when pending proposals exist
- **D-05:** Haptic feedback (light impact) on tab switch via expo-haptics (already installed)
- **D-06:** Collapsible scroll headers on scrollable list screens only: Cards, Market, Trades, Meta. Home and Profile keep static headers.
- **D-07:** Collapsed state shows just the tab title and notification bell -- search bars and filter chips scroll away
- **D-08:** Header re-expands when user scrolls back up (any amount), standard iOS/Android pattern
- **D-09:** Collapse/expand uses Reanimated smooth spring animation
- **D-10:** Use `phosphor-react-native` package (official React Native package, tree-shakable, typed)
- **D-11:** Default weight: regular for inactive state, fill for active/selected state
- **D-12:** Migrate ALL Ionicons references across all 50 files in this phase -- no mixed icon sets shipped
- **D-13:** Tab icon selection is Claude's discretion (pick closest Phosphor equivalents)
- **D-14:** Bundle Inter font with 4 weight variants: Regular (400), Medium (500), SemiBold (600), Bold (700)
- **D-15:** Load via expo-font config plugin (build-time loading, no flash of unstyled text)
- **D-16:** Add fontFamily to shared typography tokens in `packages/shared/tokens/` -- single source of truth
- **D-17:** Update typography token definitions to include fontFamily mapping (Inter-Regular, Inter-Medium, Inter-SemiBold, Inter-Bold)

### Claude's Discretion
- Specific Phosphor icon choices for each tab and throughout the app
- Whether to include a monospace font (e.g., JetBrains Mono) for numeric-heavy displays
- Collapsible header scroll threshold values
- Tab bar height and pill indicator dimensions
- Spring animation config values (damping, stiffness)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| NAV-01 | Custom animated tab bar with icon morphing and indicator slide | tabBar prop on expo-router Tabs, Reanimated shared values for pill position, useAnimatedStyle for translateX |
| NAV-02 | Custom collapsible scroll header | useAnimatedScrollHandler + interpolate + translateY pattern, spring config from motion tokens |
| NAV-03 | Inter font integration via expo-font config plugin | expo-font plugin in app.json with fontDefinitions, fontFamily in typography tokens |
| NAV-04 | Phosphor icon migration replacing Ionicons | phosphor-react-native v3.0.3, weight prop (regular/fill), 50 files / ~68 unique icon names to map |
| NAV-05 | Haptic feedback on tab switch | expo-haptics already installed, Haptics.impactAsync(Light) on tab press handler |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-router | ~6.0.23 | Tab navigation with `<Tabs>` component | Already installed, provides `tabBar` prop for custom tab bar |
| react-native-reanimated | 4.1.6 | All animations (pill slide, icon morph, header collapse) | Already installed, project decision to use exclusively |
| phosphor-react-native | 3.0.3 | Icon system replacing Ionicons | Tree-shakable, typed, 6 weight variants, SVG-based |
| expo-font | ~14.0.11 | Build-time font loading via config plugin | Already installed, eliminates FOUT |
| expo-haptics | ^55.0.8 | Tab switch haptic feedback | Already installed and used in CardThumbnail |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-native-svg | 15.12.1 | Peer dependency for phosphor-react-native | Already installed |
| @pocket-trade-hub/shared | workspace | Typography tokens, motion tokens, color tokens | All styling references |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| phosphor-react-native | @expo/vector-icons (Phosphor subset) | expo/vector-icons bundles all icons, no tree-shaking, limited weights |
| expo-font config plugin | useFonts hook | Runtime loading causes flash of unstyled text |
| Custom tab bar via tabBar prop | expo-router/ui headless Tabs | Headless API requires rewriting route definitions; tabBar prop preserves existing file-based routing |

**Installation:**
```bash
cd apps/mobile && npx expo install phosphor-react-native
```

Note: `react-native-svg`, `expo-font`, `expo-haptics`, and `react-native-reanimated` are already installed.

## Architecture Patterns

### Recommended Project Structure
```
apps/mobile/
├── assets/fonts/              # Inter-Regular.ttf, Inter-Medium.ttf, Inter-SemiBold.ttf, Inter-Bold.ttf
├── app/
│   ├── (tabs)/
│   │   └── _layout.tsx        # Updated: tabBar prop → CustomTabBar
│   └── _layout.tsx            # Root layout (no font loading code needed with config plugin)
├── src/
│   ├── components/
│   │   └── navigation/
│   │       ├── CustomTabBar.tsx          # Animated tab bar with pill indicator
│   │       ├── TabBarIcon.tsx            # Icon component with weight morphing
│   │       └── CollapsibleHeader.tsx     # Reusable collapsible header wrapper
│   └── hooks/
│       └── useCollapsibleHeader.ts       # Reanimated scroll tracking hook
packages/shared/
└── src/tokens/
    └── typography.ts           # Updated: fontFamily definitions added
```

### Pattern 1: Custom Tab Bar via tabBar Prop
**What:** expo-router's `<Tabs>` component (built on React Navigation Bottom Tabs) accepts a `tabBar` prop for complete tab bar replacement.
**When to use:** When you need full control over tab bar rendering while keeping file-based routing.
**Example:**
```typescript
// Source: React Navigation Bottom Tabs documentation
// apps/mobile/app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { CustomTabBar } from '@/src/components/navigation/CustomTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {/* Tab screens remain the same */}
    </Tabs>
  );
}
```

The custom component receives `{ state, descriptors, navigation }`:
- `state.index` -- currently active tab index
- `state.routes` -- array of route objects
- `descriptors[route.key].options` -- per-tab options (title, icon, etc.)
- `navigation.navigate(route.name)` -- programmatic navigation
- `navigation.emit({ type: 'tabPress', target: route.key })` -- event system

### Pattern 2: Sliding Pill Indicator with Reanimated
**What:** A shared value tracks the active tab index; the pill's translateX is derived via interpolation.
**When to use:** Animated indicator that slides between tab positions.
**Example:**
```typescript
// Reanimated 4 pattern
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const TAB_COUNT = 6;

function CustomTabBar({ state }: BottomTabBarProps) {
  const tabWidth = /* screen width / TAB_COUNT */;
  const pillPosition = useSharedValue(state.index * tabWidth);

  // Update pill position when tab changes
  React.useEffect(() => {
    pillPosition.value = withSpring(state.index * tabWidth, {
      damping: 20,
      stiffness: 200,
    });
  }, [state.index]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillPosition.value }],
  }));

  return (
    <View style={styles.tabBar}>
      <Animated.View style={[styles.pill, pillStyle]} />
      {/* Tab buttons */}
    </View>
  );
}
```

### Pattern 3: Collapsible Header with useAnimatedScrollHandler
**What:** Track scroll offset, interpolate header translateY and opacity, re-expand on scroll-up.
**When to use:** List screens (Cards, Market, Trades, Meta) where filter/search content should collapse.
**Example:**
```typescript
// Reanimated 4 collapsible header pattern
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  withSpring,
  Extrapolation,
} from 'react-native-reanimated';

const HEADER_MAX = 120;
const HEADER_MIN = 50;
const SCROLL_THRESHOLD = HEADER_MAX - HEADER_MIN; // 70

function useCollapsibleHeader() {
  const scrollY = useSharedValue(0);
  const prevScrollY = useSharedValue(0);
  const headerTranslateY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const currentY = event.contentOffset.y;
      const diff = currentY - prevScrollY.value;

      if (diff > 0 && currentY > 0) {
        // Scrolling down -- collapse
        headerTranslateY.value = withSpring(
          Math.max(headerTranslateY.value - diff, -(HEADER_MAX - HEADER_MIN)),
          { damping: 20, stiffness: 200 }
        );
      } else {
        // Scrolling up -- expand
        headerTranslateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      }

      prevScrollY.value = currentY;
      scrollY.value = currentY;
    },
  });

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerTranslateY.value }],
  }));

  return { scrollHandler, headerStyle, scrollY };
}
```

### Pattern 4: expo-font Config Plugin (Build-Time Loading)
**What:** Font files are bundled at build time via app.json plugin config -- no runtime loading needed.
**When to use:** Always, for production apps. Eliminates flash of unstyled text.
**Example:**
```json
// app.json
{
  "expo": {
    "plugins": [
      [
        "expo-font",
        {
          "android": {
            "fonts": [
              {
                "fontFamily": "Inter",
                "fontDefinitions": [
                  { "path": "./assets/fonts/Inter-Regular.ttf", "weight": 400 },
                  { "path": "./assets/fonts/Inter-Medium.ttf", "weight": 500 },
                  { "path": "./assets/fonts/Inter-SemiBold.ttf", "weight": 600 },
                  { "path": "./assets/fonts/Inter-Bold.ttf", "weight": 700 }
                ]
              }
            ]
          },
          "ios": {
            "fonts": [
              "./assets/fonts/Inter-Regular.ttf",
              "./assets/fonts/Inter-Medium.ttf",
              "./assets/fonts/Inter-SemiBold.ttf",
              "./assets/fonts/Inter-Bold.ttf"
            ]
          }
        }
      ]
    ]
  }
}
```

Reference in styles:
```typescript
// Android: fontFamily + fontWeight
{ fontFamily: 'Inter', fontWeight: '700' }

// iOS: uses PostScript name
{ fontFamily: 'Inter-Bold' }

// Cross-platform: use Platform.select or a helper
```

### Anti-Patterns to Avoid
- **Using useFonts hook alongside config plugin:** Config plugin handles loading at build time. Adding useFonts causes double-loading and potential conflicts.
- **Animating layout properties for header collapse:** Use `translateY` instead of changing `height` or `marginTop`. Layout animations cause layout thrashing and dropped frames.
- **Mixed icon libraries:** After migration, no Ionicons imports should remain. Tree-shaking cannot remove `@expo/vector-icons` if even one import exists.
- **Hardcoding tab count in pill calculations:** Use `state.routes.length` from the navigator props to derive tab width dynamically.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Icon rendering | Custom SVG icon components | phosphor-react-native | 1500+ icons, 6 weights, accessibility labels, RTL support built in |
| Font loading | SplashScreen + useFonts async flow | expo-font config plugin | Build-time bundling eliminates entire async loading category |
| Haptic feedback | Custom native module | expo-haptics | Cross-platform, already installed, handles device capability detection |
| Tab navigation state | Custom state management | expo-router Tabs state/descriptors props | Navigator state is complex (deep links, back navigation, history) |
| Spring animation configs | Raw duration-based animations | Reanimated withSpring | Spring physics produce natural motion; duration animations feel artificial |

**Key insight:** The tab bar replacement is a UI shell swap, not a navigation rewrite. All routing, deep linking, and state management stays with expo-router -- only the visual layer changes.

## Common Pitfalls

### Pitfall 1: iOS vs Android Font Family Naming
**What goes wrong:** Android uses `fontFamily: 'Inter'` + `fontWeight: '700'` while iOS requires `fontFamily: 'Inter-Bold'` (PostScript name) when using config plugin build-time fonts.
**Why it happens:** Platform differences in how fonts are registered by the OS.
**How to avoid:** Create a cross-platform font family helper that uses `Platform.select` or maps fontWeight to the correct fontFamily string per platform.
**Warning signs:** Fonts render on one platform but fall back to system font on the other.

### Pitfall 2: Reanimated Shared Value Updates in useEffect
**What goes wrong:** Updating shared values from `useEffect` without `withSpring`/`withTiming` causes instant jumps instead of animations.
**Why it happens:** `useEffect` runs on the JS thread; the assignment is synchronous without an animation wrapper.
**How to avoid:** Always wrap shared value assignments with animation functions: `pillPosition.value = withSpring(newValue, config)`.
**Warning signs:** Pill indicator "teleports" between tabs instead of sliding.

### Pitfall 3: Collapsible Header Scroll Jank
**What goes wrong:** Header collapse animation stutters when user scrolls fast.
**Why it happens:** Computing translateY on every scroll event with spring animations creates competing spring instances.
**How to avoid:** Use `cancelAnimation(headerTranslateY)` before starting a new spring, or use `interpolate` with clamp instead of springs during active scrolling. Apply springs only on scroll end.
**Warning signs:** Header "bounces" or stutters during fast scrolling.

### Pitfall 4: Large Icon Migration Breaks
**What goes wrong:** Missed Ionicons references cause runtime crashes (component not found) or TypeScript errors.
**Why it happens:** 50 files with 67+ unique icon names is a large migration surface. String-based icon names in Ionicons map to named imports in Phosphor.
**How to avoid:** Create a complete Ionicons-to-Phosphor mapping table before starting. After migration, search for any remaining `Ionicons` or `@expo/vector-icons` imports. The app should have ZERO such imports.
**Warning signs:** `grep -r "Ionicons\|@expo/vector-icons" apps/mobile/` returns results after migration.

### Pitfall 5: Tab Bar Safe Area
**What goes wrong:** Custom tab bar overlaps the home indicator on iPhone or navigation bar on Android.
**Why it happens:** The default tab bar handles safe areas automatically; a custom one does not.
**How to avoid:** Wrap custom tab bar in `<SafeAreaView edges={['bottom']}>` or use `useSafeAreaInsets()` to add bottom padding.
**Warning signs:** Tab labels clipped by home indicator on iPhone X+ devices.

### Pitfall 6: Dev Build Required After Config Plugin Change
**What goes wrong:** expo-font config plugin changes don't take effect.
**Why it happens:** Config plugins modify native code. `expo start` alone does not rebuild native modules.
**How to avoid:** After adding the expo-font plugin to app.json, run `npx expo prebuild --clean` and create a new dev build.
**Warning signs:** Fonts not loading despite correct config; only system font renders.

## Code Examples

### Ionicons to Phosphor Icon Mapping (Tab Bar)

```typescript
// Recommended Phosphor equivalents for tab icons
// Source: phosphoricons.com icon catalog
import {
  House, HouseFill,
  Cards, CardsFill,           // or Stack, StackFill
  Storefront, StorefrontFill,
  ArrowsLeftRight, ArrowsLeftRightFill,  // or Swap
  Trophy, TrophyFill,
  User, UserFill,
} from 'phosphor-react-native';

const TAB_ICONS = {
  index:   { regular: House,            fill: HouseFill },           // was: home
  cards:   { regular: Cards,            fill: CardsFill },           // was: albums
  market:  { regular: Storefront,       fill: StorefrontFill },      // was: storefront
  trades:  { regular: ArrowsLeftRight,  fill: ArrowsLeftRightFill }, // was: swap-horizontal
  meta:    { regular: Trophy,           fill: TrophyFill },          // was: trophy
  profile: { regular: User,             fill: UserFill },            // was: person
};
```

Note: Phosphor does NOT use separate `Fill` named exports. Instead, use the `weight` prop:
```typescript
import { House, Storefront, Trophy, User, ArrowsLeftRight, Stack } from 'phosphor-react-native';

// Regular weight (inactive)
<House size={24} color={color} weight="regular" />

// Fill weight (active)
<House size={24} color={color} weight="fill" />
```

### Complete Ionicons-to-Phosphor Mapping Reference

| Ionicons Name | Phosphor Component | Notes |
|---------------|-------------------|-------|
| home | House | |
| albums | Stack | or Cards |
| storefront / storefront-outline | Storefront | use weight prop |
| swap-horizontal | ArrowsLeftRight | |
| trophy / trophy-outline | Trophy | use weight prop |
| person | User | |
| close | X | |
| checkmark | Check | |
| checkmark-circle | CheckCircle | |
| chevron-forward | CaretRight | |
| chevron-back | CaretLeft | |
| chevron-down | CaretDown | |
| star / star-half / star-outline | Star / StarHalf | |
| heart / heart-outline | Heart | use weight prop |
| heart-dislike-outline | HeartBreak | weight="regular" |
| trash / trash-outline | Trash | use weight prop |
| add | Plus | |
| add-circle / add-circle-outline | PlusCircle | use weight prop |
| remove | Minus | |
| close-circle / close-circle-outline | XCircle | use weight prop |
| search | MagnifyingGlass | |
| copy-outline | Copy | |
| share-outline | ShareNetwork | or Export |
| flag | Flag | |
| calculator-outline | Calculator | |
| calendar-outline | Calendar | |
| flash | Lightning | |
| diamond | Diamond | or Gem |
| shield-checkmark | ShieldCheck | |
| lock-closed | Lock | |
| arrow-back / arrow-back-outline | ArrowLeft | |
| arrow-up-circle | ArrowCircleUp | |
| arrow-down-circle | ArrowCircleDown | |
| layers / layers-outline | Stack | use weight prop |
| language-outline | Globe | |
| gift-outline | Gift | |
| bulb-outline | Lightbulb | |
| newspaper-outline | Newspaper | |
| document-text-outline | FileText | |
| log-out-outline | SignOut | |
| time-outline | Clock | |
| link-outline | Link | |
| person-remove-outline | UserMinus | |
| paper-plane | PaperPlaneTilt | |
| alert-circle / alert-circle-outline | WarningCircle | |
| information-circle / information-circle-outline | Info | |
| notifications-outline | Bell | |
| notifications-off-outline | BellSlash | |
| settings-outline | Gear | or GearSix |
| create-outline | PencilSimple | or NotePencil |
| list-outline | List | |
| analytics | ChartBar | or ChartLine |
| return-up-back | ArrowUUpLeft | |
| logo-google | GoogleLogo | |
| logo-apple | AppleLogo | |

### Typography Token Update

```typescript
// packages/shared/src/tokens/typography.ts -- updated
import { Platform } from 'react-native';

const fontFamily = {
  regular: Platform.select({ ios: 'Inter-Regular', android: 'Inter', default: 'Inter' }),
  medium: Platform.select({ ios: 'Inter-Medium', android: 'Inter', default: 'Inter' }),
  semiBold: Platform.select({ ios: 'Inter-SemiBold', android: 'Inter', default: 'Inter' }),
  bold: Platform.select({ ios: 'Inter-Bold', android: 'Inter', default: 'Inter' }),
} as const;

// NOTE: shared tokens package should NOT import react-native directly.
// Instead, define font family names as strings and let the mobile shim
// apply Platform.select. See Architecture Patterns for the recommended approach.

export const typography = {
  fontFamily: {
    regular: 'Inter-Regular',    // maps to fontWeight 400
    medium: 'Inter-Medium',      // maps to fontWeight 500
    semiBold: 'Inter-SemiBold',  // maps to fontWeight 600
    bold: 'Inter-Bold',          // maps to fontWeight 700
  },
  heading: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
  },
  subheading: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 26,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
} as const;
```

### Haptic Feedback on Tab Press

```typescript
// Source: existing pattern from CardThumbnail.tsx
import * as Haptics from 'expo-haptics';

// In custom tab bar onPress handler:
const onPress = () => {
  const event = navigation.emit({
    type: 'tabPress',
    target: route.key,
    canPreventDefault: true,
  });

  if (!isFocused && !event.defaultPrevented) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate(route.name, route.params);
  }
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| useFonts hook + SplashScreen | expo-font config plugin (build-time) | Expo SDK 50+ | No async font loading code, no FOUT |
| Ionicons from @expo/vector-icons | phosphor-react-native with weight prop | 2024+ trend | Single component per icon, weight prop for variants vs separate icon names |
| Animated API header collapse | Reanimated useAnimatedScrollHandler | Reanimated 3+ | UI thread animation, no bridge crossing, 60fps guaranteed |
| Fixed height tab bars | Custom tabBar prop + safe area aware | React Navigation 6+ | Full control over tab bar layout and animation |

**Deprecated/outdated:**
- `Animated.event` for scroll tracking: Use Reanimated `useAnimatedScrollHandler` instead
- `@expo/vector-icons` Ionicons: Being replaced by phosphor-react-native per project decision
- Runtime font loading via `Font.loadAsync`: Config plugin handles this at build time

## Open Questions

1. **Platform.select in shared tokens package**
   - What we know: Shared tokens package is used by both mobile and web. `Platform` from react-native is not available in web context.
   - What's unclear: Whether fontFamily token should use PostScript names (Inter-Bold) or generic names (Inter + fontWeight)
   - Recommendation: Define PostScript names in shared tokens (Inter-Regular, Inter-Medium, etc.) and let the mobile theme shim handle Platform.select mapping. Web uses CSS `font-family: 'Inter'` with `font-weight` natively.

2. **Monospace font for numeric displays**
   - What we know: App has numeric-heavy displays (trade values, card counts, pull rates)
   - What's unclear: Whether tabular/monospace figures improve the UX enough to justify a second font
   - Recommendation: Skip for now. Inter has tabular number support via OpenType features (`fontVariant: ['tabular-nums']` in React Native). Add JetBrains Mono only if Inter's numeric rendering proves insufficient in later phases.

3. **Phosphor icon name accuracy**
   - What we know: The mapping table above is based on training data knowledge of Phosphor's icon catalog
   - What's unclear: Some icon names may have changed in phosphor-react-native v3
   - Recommendation: After installing phosphor-react-native, verify each import compiles. TypeScript will catch any incorrect names at build time. LOW confidence on exact names for: `ArrowsLeftRight`, `PaperPlaneTilt`, `ArrowUUpLeft`.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | No test framework configured for mobile app |
| Config file | none |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NAV-01 | Custom tab bar renders with pill indicator, slides on tab change | manual-only | Visual inspection on device/simulator | N/A |
| NAV-02 | Headers collapse on scroll down, expand on scroll up | manual-only | Visual inspection on device/simulator | N/A |
| NAV-03 | Inter font renders throughout app, no system font fallback | manual-only | Visual inspection + check no useFonts calls | N/A |
| NAV-04 | Zero Ionicons imports remain after migration | unit | `grep -r "Ionicons\|@expo/vector-icons" apps/mobile/ --include="*.tsx" --include="*.ts"` | N/A |
| NAV-05 | Haptic fires on tab switch | manual-only | Physical device test | N/A |

**Justification for manual-only:** Animation behavior, font rendering, and haptic feedback require physical device or simulator verification. No Jest/testing-library infrastructure exists in the mobile app. NAV-04 can be verified with a grep command as a smoke test.

### Sampling Rate
- **Per task commit:** TypeScript compilation (`npx tsc --noEmit` from apps/mobile)
- **Per wave merge:** Full app launch on simulator, navigate all tabs
- **Phase gate:** Zero Ionicons references + visual verification of all 5 requirements

### Wave 0 Gaps
- No test framework for mobile app -- all verification is manual or grep-based
- Font files (Inter-Regular.ttf etc.) need to be downloaded and placed in assets/fonts/

## Sources

### Primary (HIGH confidence)
- Expo Fonts documentation (https://docs.expo.dev/develop/user-interface/fonts/) -- config plugin setup, app.json format
- React Navigation Bottom Tabs (https://reactnavigation.org/docs/bottom-tab-navigator/#tabbar) -- tabBar prop, BottomTabBarProps type
- Expo Router JavaScript Tabs (https://docs.expo.dev/router/advanced/tabs/) -- confirms tabBar prop support
- phosphor-react-native README (https://github.com/duongdev/phosphor-react-native) -- v3.0.3, weights, IconContext, props

### Secondary (MEDIUM confidence)
- Reanimated collapsible header patterns (multiple verified sources) -- useAnimatedScrollHandler + interpolate pattern
- Phosphor icon catalog (https://phosphoricons.com/) -- icon name browsing

### Tertiary (LOW confidence)
- Ionicons-to-Phosphor mapping table -- based on training data knowledge of both icon libraries, needs verification after install

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed except phosphor-react-native, versions verified from package.json
- Architecture: HIGH -- tabBar prop pattern well-documented in React Navigation, collapsible header is standard Reanimated pattern
- Pitfalls: HIGH -- iOS/Android font naming, safe area, dev build requirement are well-known issues
- Icon mapping: LOW -- exact Phosphor component names need verification after package install

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (stable ecosystem, no fast-moving dependencies)
