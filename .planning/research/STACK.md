# Technology Stack: v3.0 UI/UX Overhaul

**Project:** Pocket Trade Hub
**Researched:** 2026-03-20
**Confidence:** MEDIUM-HIGH (core libraries verified via npm/official docs; NativeWind v5 stability flagged)

> This document covers ONLY new technology additions/changes for the v3.0 UI/UX overhaul.
> Existing validated stack (Expo 54, RN 0.81, Reanimated 4.1.6, Fastify 5, PostgreSQL, Redis, BullMQ, Socket.IO, RevenueCat, Drizzle ORM, Zustand, Zod, Turborepo/pnpm) is NOT re-evaluated.

---

## Current Styling Baseline

The app currently uses:
- `StyleSheet.create` with inline theme imports across 51 component files
- A single `constants/theme.ts` file with `colors`, `typography`, `spacing`, and `borderRadius` tokens
- `@expo/vector-icons` (Ionicons) for all icons
- `react-native-reanimated` 4.1.6 (already installed, only basic `Animated.timing` usage)
- No gesture handler library installed
- No gradient library installed
- No custom fonts loaded (system fonts only)
- Hardcoded color values scattered in some components (e.g., `'#f0c040'`, `'rgba(0,0,0,0.55)'`)

**Key constraint:** 51 files use `StyleSheet.create` with the existing token system. Any styling approach must allow incremental migration, not a big-bang rewrite.

---

## Recommended Stack

### Core Styling: Keep StyleSheet.create + Enhanced Design Tokens

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Custom design token system | N/A | Centralized tokens for colors, typography, spacing, shadows, animations | Already have the foundation in `constants/theme.ts`; extend it rather than adopting a framework |

**Why NOT NativeWind (v4 or v5):**
- NativeWind v5 is still in preview (5.0.0-preview.3 as of March 2026) and not production-ready
- NativeWind v4 has Reanimated v4 compatibility issues with Expo 54 that require workarounds
- Adopting NativeWind means rewriting 51 component files from `StyleSheet.create` to className strings -- massive migration cost for a UI overhaul that should focus on visual output, not styling syntax
- The app already has a working token system; enhancing it is lower risk and zero migration cost
- NativeWind's value proposition (Tailwind muscle memory) is strongest for greenfield projects

**Why NOT Tamagui:**
- Tamagui is a full UI toolkit with its own component primitives, compiler, and build pipeline
- Adopting mid-project requires replacing `View`, `Text`, `Pressable` everywhere -- even more invasive than NativeWind
- Build complexity increases significantly (Tamagui compiler integration with Expo/Metro)
- Overkill for a dark-themed app that needs ONE cohesive theme, not a multi-theme system

**Why NOT Gluestack UI v3:**
- Gluestack v3 + Expo 54 has documented crash issues (Reanimated + Overlay components)
- Adds a component library dependency when the goal is a custom premium visual identity
- Pre-built component libraries push you toward their aesthetic; this overhaul needs a distinctive look

**Recommendation: Extend `constants/theme.ts` into a proper design token system with semantic tokens, shadows, elevation, and animation curves. Zero new dependencies. Full control.**

**Confidence:** HIGH -- this is the lowest-risk, highest-control approach for an existing 40K LOC codebase.

---

### Animation: react-native-reanimated 4 (Direct Usage)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `react-native-reanimated` | 4.1.6 (already installed) | All animations: layout transitions, entering/exiting, micro-interactions, spring physics | Already in the project; v4 has first-class layout animations, entering/exiting presets (FadeIn, SlideInRight, etc.), spring physics, and shared element transitions |

**Why NOT Moti:**
- Moti 0.30.0 (last published over a year ago) does NOT support Reanimated 4
- GitHub issue #391 (opened Sept 2025) requesting Reanimated 4 support remains open with no resolution
- Adding Moti would mean downgrading Reanimated to v3, which conflicts with Expo 54's bundled version
- Reanimated 4's built-in API is now comprehensive enough that Moti's declarative wrapper is unnecessary
- Moti was most valuable when Reanimated's API was harder to use; v4 has matured significantly

**What Reanimated 4 provides natively (no wrapper needed):**
- `FadeIn`, `FadeOut`, `SlideInRight`, `SlideOutLeft` -- entering/exiting presets with `.duration()`, `.delay()`, `.springify()`
- `Layout` transition animations for list reordering
- `useAnimatedStyle` + `useSharedValue` for custom micro-interactions
- `withSpring`, `withTiming`, `withSequence` for imperative animations
- `Animated.View` with `entering`/`exiting` props for declarative mount/unmount transitions

**Usage pattern for the overhaul:**
```typescript
import Animated, { FadeIn, SlideInUp, Layout } from 'react-native-reanimated';

// Screen entrance
<Animated.View entering={FadeIn.duration(300).delay(100)}>

// List item layout changes
<Animated.View layout={Layout.springify().damping(15)}>

// Tab transition
<Animated.View entering={SlideInUp.springify()} exiting={FadeOut.duration(200)}>
```

**Confidence:** HIGH -- Reanimated 4 is already installed and its layout animation API is well-documented.

---

### Gesture Handling: react-native-gesture-handler

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `react-native-gesture-handler` | ~2.24.0 (Expo 54 compatible) | Swipe-to-dismiss, pull-to-refresh, pan gestures, bottom sheets | Required for premium-feeling interactions; dependency of @gorhom/bottom-sheet; NOT currently installed |

**Installation:**
```bash
npx expo install react-native-gesture-handler
```

**Root layout change required:**
```typescript
// app/_layout.tsx -- wrap entire app
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* existing layout */}
    </GestureHandlerRootView>
  );
}
```

**Confidence:** HIGH -- first-party Expo-compatible library, well-documented.

---

### Bottom Sheet: @gorhom/bottom-sheet

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `@gorhom/bottom-sheet` | ^5.2.6 | Replace Modal components with native-feeling bottom sheets | Standard RN bottom sheet library; gesture-driven; snapping; backdrop; used by the majority of production RN apps |

**Caution:** There are reported issues with v5 + Reanimated 4 + Expo 54 (crashes on close, backdrop tap issues). Test thoroughly during implementation. If v5 proves unstable, fall back to building custom bottom sheets with Reanimated 4's `useAnimatedStyle` + gesture-handler -- the primitives are there.

**Installation:**
```bash
pnpm add @gorhom/bottom-sheet@^5.2.6 --filter mobile
```

**Confidence:** MEDIUM -- widely used but has documented Expo 54/Reanimated 4 edge cases. Flag for validation during implementation.

---

### Gradients: expo-linear-gradient

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `expo-linear-gradient` | ~14.0.x (SDK 54) | Gradient backgrounds for premium cards, headers, CTAs, premium badge effects | First-party Expo module; lightweight; covers 90% of gradient needs |

**Installation:**
```bash
npx expo install expo-linear-gradient
```

**Why NOT @shopify/react-native-skia for gradients:**
- Skia is a 2D rendering engine (heavy dependency) best for custom drawing, shaders, and complex visual effects
- For gradient backgrounds on Views, `expo-linear-gradient` is dramatically simpler and lighter
- Only consider Skia if the overhaul needs custom shader effects, particle systems, or GPU-rendered patterns
- Adding Skia increases bundle size significantly (~2-5MB native binary)

**Confidence:** HIGH -- first-party Expo module, trivial to add.

---

### Icons: Phosphor Icons (Replace Ionicons)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `phosphor-react-native` | ^3.0.3 | Replace Ionicons with a more cohesive, modern icon set | 9,000+ icons in 6 weights (thin, light, regular, bold, fill, duotone); consistent stroke widths; better visual cohesion than Ionicons' mixed styles; duotone variant enables premium accent effects |

**Why replace Ionicons:**
- Ionicons mixes filled, outlined, and sharp styles inconsistently (visible in current tab bar: some use `name`/`name-outline` toggle, some don't)
- Phosphor provides 6 weight variants per icon with consistent geometry
- Duotone weight allows gold (#f0c040) accent on icon secondary layers -- perfect for premium visual identity
- Still SVG-based via react-native-svg (already installed at 15.12.1)

**Installation:**
```bash
pnpm add phosphor-react-native@^3.0.3 --filter mobile
```

**Migration approach:** Incremental. Replace Ionicons per-component during the screen-by-screen refresh. Keep `@expo/vector-icons` installed until full migration is complete, then remove.

**Confidence:** HIGH -- phosphor-react-native 3.0.3 published recently, react-native-svg already installed.

---

### Typography: Custom Font via expo-font

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `expo-font` | ~14.0.11 (already installed) | Load custom typeface | Already in the project but not actively used for custom fonts |
| `@expo-google-fonts/inter` | latest | Inter typeface -- clean, modern, excellent readability at small sizes | Free; designed for screens; variable font support reduces bundle vs loading 6 static weights |

**Why Inter:**
- Designed specifically for computer screens with tall x-height for readability
- Supports all Latin scripts needed for 10 UI languages
- Variable font: single file covers all weights (300-900) -- ~300KB vs ~1.5MB for 6 static weight files
- Neutral enough not to compete with Pokemon card imagery
- Industry standard for modern mobile apps (used by GitHub, Linear, Vercel)

**Installation:**
```bash
pnpm add @expo-google-fonts/inter --filter mobile
```

**Loading pattern (using config plugin for build-time embedding):**
```json
// app.json
{
  "expo": {
    "plugins": [
      ["expo-font", {
        "fonts": ["node_modules/@expo-google-fonts/inter/Inter-Variable.ttf"]
      }]
    ]
  }
}
```

**Typography scale update for `constants/theme.ts`:**
```typescript
export const fontFamily = {
  regular: 'Inter-Variable',    // weight 400
  medium: 'Inter-Variable',     // weight 500
  semibold: 'Inter-Variable',   // weight 600
  bold: 'Inter-Variable',       // weight 700
};

export const typography = {
  // Display: splash screens, empty states
  displayLg: { fontFamily: fontFamily.bold, fontSize: 32, lineHeight: 40, letterSpacing: -0.5 },
  displaySm: { fontFamily: fontFamily.bold, fontSize: 28, lineHeight: 36, letterSpacing: -0.3 },
  // Headings: screen titles, section headers
  headingLg: { fontFamily: fontFamily.semibold, fontSize: 22, lineHeight: 28 },
  headingSm: { fontFamily: fontFamily.semibold, fontSize: 18, lineHeight: 24 },
  // Body: primary content
  bodyLg: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 24 },
  bodySm: { fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 20 },
  // Labels: buttons, tabs, badges
  labelLg: { fontFamily: fontFamily.medium, fontSize: 16, lineHeight: 20 },
  labelSm: { fontFamily: fontFamily.medium, fontSize: 13, lineHeight: 16 },
  // Captions: metadata, timestamps
  caption: { fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 16 },
};
```

**Confidence:** HIGH -- expo-font config plugin is the recommended approach in Expo docs; Inter is widely used and well-tested.

---

### Haptics: expo-haptics (Already Installed)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `expo-haptics` | ^55.0.8 (already installed) | Tactile feedback on interactions | Already in the project (used in CardThumbnail); extend usage to buttons, toggles, swipe completions, and navigation transitions |

**No new dependency.** Just expand usage patterns during the overhaul.

**Confidence:** HIGH -- already working in the codebase.

---

## Enhanced Design Token System

The existing `constants/theme.ts` needs significant expansion. Here is the target token architecture:

```typescript
// constants/theme.ts -- expanded for v3.0

// === PRIMITIVE TOKENS (raw values, never use directly in components) ===
const palette = {
  gold: { 50: '#fef9e7', 100: '#fdeebb', 400: '#f0c040', 500: '#c49a20', 900: '#5a4510' },
  navy: { 50: '#e8e8f0', 100: '#b8b8d0', 800: '#1a1a2e', 900: '#0f0f1a', 950: '#0a0a14' },
  red: { 400: '#e74c3c', 500: '#c0392b' },
  green: { 400: '#2ecc71', 500: '#27ae60' },
  neutral: { 0: '#ffffff', 100: '#f5f5f5', 400: '#a0a0b8', 600: '#6c6c80', 900: '#1a1a2e' },
};

// === SEMANTIC TOKENS (use these in components) ===
export const colors = {
  // Backgrounds
  bg: palette.navy[900],
  bgElevated: palette.navy[800],
  bgElevated2: '#252540',
  bgInput: '#1e1e35',

  // Surfaces (cards, modals, sheets)
  surface: palette.navy[800],
  surfaceHover: '#252540',
  surfacePressed: '#2a2a45',

  // Brand
  accent: palette.gold[400],
  accentMuted: palette.gold[500],
  accentSubtle: 'rgba(240, 192, 64, 0.12)',

  // Text
  textPrimary: palette.neutral[0],
  textSecondary: palette.neutral[400],
  textMuted: palette.neutral[600],
  textAccent: palette.gold[400],

  // Semantic
  success: palette.green[400],
  error: palette.red[400],
  warning: palette.gold[400],

  // Borders
  border: '#2a2a45',
  borderSubtle: 'rgba(255,255,255,0.06)',
  borderAccent: palette.gold[400],

  // Navigation
  tabBar: '#12121f',
  tabActive: palette.gold[400],
  tabInactive: palette.neutral[600],
};

// === ELEVATION (shadows) ===
export const elevation = {
  none: {},
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 2 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  glow: { shadowColor: palette.gold[400], shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 0 },
};

// === ANIMATION CURVES ===
export const animation = {
  fast: 150,
  normal: 250,
  slow: 400,
  spring: { damping: 15, stiffness: 150, mass: 1 },
  springBouncy: { damping: 10, stiffness: 200, mass: 0.8 },
  springGentle: { damping: 20, stiffness: 100, mass: 1.2 },
};
```

**Confidence:** HIGH -- no dependencies, just TypeScript constants.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Styling | Enhanced StyleSheet.create + tokens | NativeWind v5 | Still in preview (5.0.0-preview.3); rewriting 51 files is high-risk for a milestone focused on visual output |
| Styling | Enhanced StyleSheet.create + tokens | NativeWind v4 | Reanimated v4 compatibility issues with Expo 54; requires workarounds |
| Styling | Enhanced StyleSheet.create + tokens | Tamagui | Replaces all primitives (View/Text/Pressable); invasive migration; complex compiler setup |
| Styling | Enhanced StyleSheet.create + tokens | Gluestack UI v3 | Documented crashes with Expo 54 + Reanimated 4; pre-built aesthetic conflicts with custom identity |
| Animation | Reanimated 4 direct | Moti | Moti 0.30.0 incompatible with Reanimated 4; no update in over a year; GitHub issue open since Sept 2025 |
| Animation | Reanimated 4 direct | react-native-animatable | Older library, uses Animated API not Reanimated; worse performance |
| Animation | Reanimated 4 direct | Motion (framer-motion for RN) | Experimental React Native support; not production-proven |
| Icons | Phosphor React Native | Keep Ionicons | Inconsistent styles; no duotone; limited customization |
| Icons | Phosphor React Native | Lucide React Native | Fewer icons; no duotone weight; Phosphor has better coverage |
| Icons | Phosphor React Native | HugeIcons | Commercial license required for full set; smaller community |
| Gradients | expo-linear-gradient | @shopify/react-native-skia | 2-5MB binary size increase; overkill for gradient backgrounds |
| Gradients | expo-linear-gradient | react-native-linear-gradient | Abandoned; compatibility issues with Expo; expo-linear-gradient is the maintained replacement |
| Font | Inter (via @expo-google-fonts) | System font (San Francisco/Roboto) | System fonts vary by platform; inconsistent brand identity; no weight control |
| Font | Inter (via @expo-google-fonts) | Space Grotesk / Plus Jakarta Sans | More distinctive but less readable at small sizes; Inter optimized for screen UI |
| Bottom Sheet | @gorhom/bottom-sheet | Custom with Reanimated | Higher dev cost; gorhom handles edge cases (keyboard avoidance, scroll, snapping) |
| Bottom Sheet | @gorhom/bottom-sheet | react-native-raw-bottom-sheet | Less feature-rich; no gesture-driven snapping |

---

## Complete Installation Commands

```bash
# New dependencies for mobile app
cd apps/mobile

# Gesture handling (required for bottom sheets + swipe interactions)
npx expo install react-native-gesture-handler

# Gradients
npx expo install expo-linear-gradient

# Icons (incremental migration from Ionicons)
pnpm add phosphor-react-native@^3.0.3

# Typography
pnpm add @expo-google-fonts/inter

# Bottom sheet
pnpm add @gorhom/bottom-sheet@^5.2.6
```

**Total new dependencies: 5 packages. Everything else is extension of existing libraries or pure TypeScript.**

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| NativeWind v4 or v5 | v5 not stable; v4 has Reanimated 4 issues; 51-file migration cost | Enhanced StyleSheet.create with expanded design tokens |
| Tamagui | Invasive migration (replaces View/Text primitives); complex build setup | Custom component library with StyleSheet.create |
| Gluestack UI v3 | Documented crashes with Expo 54; pre-built aesthetic limits custom identity | Custom components |
| Moti | Incompatible with Reanimated 4 (your installed version); abandoned | Reanimated 4 direct API (FadeIn, SlideIn, Layout, springs) |
| @shopify/react-native-skia | 2-5MB binary increase; overkill for gradients and basic effects | expo-linear-gradient for gradients; Reanimated for animations |
| styled-components / emotion | Runtime CSS-in-JS overhead; no benefit over StyleSheet.create in RN | StyleSheet.create (zero runtime cost, already used everywhere) |
| react-native-paper / RNUILib | Pre-built component libraries impose their design language; conflicts with custom premium identity | Custom component library |
| Lottie (lottie-react-native) | Heavy for micro-interactions; best for complex illustrative animations not needed here | Reanimated 4 for all motion (springs, fades, slides) |
| react-native-svg-transformer | Already have react-native-svg; transformer only needed for importing .svg files as components; Phosphor handles icons | Phosphor React Native for icons; expo-image for any SVG assets |

---

## Version Compatibility Matrix

| Package | Version | Compatible With | Notes |
|---------|---------|-----------------|-------|
| `react-native-reanimated` | 4.1.6 | Expo 54, RN 0.81 | Already installed; requires New Architecture |
| `react-native-gesture-handler` | ~2.24.0 | Expo 54, RN 0.81 | Use `npx expo install` to get Expo-compatible version |
| `@gorhom/bottom-sheet` | ^5.2.6 | Reanimated 4, Gesture Handler 2 | Test for Expo 54 edge cases (crash on close reported) |
| `expo-linear-gradient` | ~14.0.x | Expo 54 | First-party; auto-versioned by `npx expo install` |
| `phosphor-react-native` | ^3.0.3 | react-native-svg 15.x | Already have react-native-svg 15.12.1 |
| `@expo-google-fonts/inter` | latest | expo-font ~14.0.11 | expo-font already installed; use config plugin for build-time embedding |
| `expo-haptics` | ^55.0.8 | Expo 54 | Already installed; extend usage |

---

## Migration Strategy

The overhaul does NOT require a big-bang migration. The recommended approach:

1. **Phase 1:** Expand `constants/theme.ts` with semantic tokens, elevation, animation curves. Zero component changes needed.
2. **Phase 2:** Install new dependencies (gesture-handler, linear-gradient, phosphor, Inter font, bottom-sheet). Wire up in `_layout.tsx`.
3. **Phase 3:** Build new shared components (Button, Card, Input, Badge, Sheet) using new tokens. These are NEW files, no existing code touched.
4. **Phase 4:** Screen-by-screen refresh -- swap old inline styles for new components and tokens. One screen at a time. Old and new coexist.
5. **Phase 5:** Icon migration -- replace `<Ionicons>` with `<PhosphorIcon>` per component during screen refresh. Remove `@expo/vector-icons` when done.

**This approach means the app is never broken during the overhaul.** Each commit leaves the app in a working state.

---

## Sources

- [NativeWind v5 Installation](https://www.nativewind.dev/v5/getting-started/installation) -- preview status, Expo 54 setup
- [NativeWind v5 Overview](https://www.nativewind.dev/v5) -- pre-release disclaimer
- [Expo SDK 54 Beta Changelog](https://expo.dev/changelog/sdk-54-beta) -- Reanimated 4.1 bundled
- [Reanimated 4 Migration Guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/migration-from-3.x/) -- API changes, New Architecture requirement
- [Reanimated Entering/Exiting Animations](https://docs.swmansion.com/react-native-reanimated/docs/layout-animations/entering-exiting-animations/) -- FadeIn, SlideIn, Layout presets
- [Moti GitHub Issue #391](https://github.com/nandorojo/moti/issues/391) -- Reanimated 4 incompatibility, open since Sept 2025
- [Gluestack UI + Expo 54 Crash Issue #3200](https://github.com/gluestack/gluestack-ui/issues/3200) -- documented crashes
- [@gorhom/bottom-sheet Expo 54 Issues](https://github.com/gorhom/react-native-bottom-sheet/issues/2528) -- Reanimated 4 compatibility reports
- [Phosphor React Native npm](https://www.npmjs.com/package/phosphor-react-native) -- v3.0.3, published Feb 2026
- [Expo Font Documentation](https://docs.expo.dev/develop/user-interface/fonts/) -- config plugin approach, build-time embedding
- [Expo Linear Gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/) -- API reference
- [React Native Gesture Handler](https://docs.expo.dev/versions/latest/sdk/gesture-handler/) -- Expo-compatible version
- [LogRocket: Best RN UI Libraries 2026](https://blog.logrocket.com/best-react-native-ui-component-libraries/) -- NativeWind, Tamagui, Gluestack comparison
- [Lineicons: Best RN Icon Libraries 2026](https://lineicons.com/blog/best-react-native-icons-libraries) -- Phosphor, Ionicons, Lucide comparison

---
*Stack research for: Pocket Trade Hub v3.0 UI/UX Overhaul*
*Researched: 2026-03-20*
