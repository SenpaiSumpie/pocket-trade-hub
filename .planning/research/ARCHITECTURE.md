# Architecture Research: v3.0 UI/UX Overhaul Integration

**Domain:** Pokemon TCG Pocket trading platform -- UI/UX overhaul integration with existing Expo + Next.js architecture
**Researched:** 2026-03-20
**Confidence:** HIGH

## System Overview: Design System Integration Layer

The UI/UX overhaul introduces a **design system foundation layer** that sits between the existing Zustand stores and the current screen components. No backend changes are needed. This is entirely a client-side architecture change spanning both `apps/mobile` and `apps/web`.

```
                      CURRENT STATE
 ┌───────────────────────────────────────────────────────┐
 │  apps/mobile                  apps/web                │
 │  ┌─────────────────┐         ┌─────────────────┐     │
 │  │ Screen Components│         │ Page Components  │     │
 │  │ (inline styles + │         │ (Tailwind v4     │     │
 │  │  StyleSheet.create│        │  utility classes) │     │
 │  │  + theme.ts)     │         │  + globals.css)  │     │
 │  └────────┬────────┘         └────────┬────────┘     │
 │           │                           │              │
 │  ┌────────┴────────┐         ┌────────┴────────┐     │
 │  │ constants/       │         │ globals.css      │     │
 │  │ theme.ts         │         │ @theme { ... }   │     │
 │  │ (colors, spacing,│         │ (CSS vars for    │     │
 │  │  typography)     │         │  colors only)    │     │
 │  └─────────────────┘         └─────────────────┘     │
 └───────────────────────────────────────────────────────┘

                      TARGET STATE
 ┌───────────────────────────────────────────────────────┐
 │  apps/mobile                  apps/web                │
 │  ┌─────────────────┐         ┌─────────────────┐     │
 │  │ Screen Components│         │ Page Components  │     │
 │  │ (compose from    │         │ (compose from    │     │
 │  │  design system   │         │  design system   │     │
 │  │  primitives)     │         │  primitives)     │     │
 │  └────────┬────────┘         └────────┬────────┘     │
 │           │                           │              │
 │  ┌────────┴────────┐         ┌────────┴────────┐     │
 │  │ src/design-system│         │ src/design-system│     │
 │  │ /components/     │         │ /components/     │     │
 │  │ (Button, Card,   │         │ (Button, Card,   │     │
 │  │  Input, Modal,   │         │  Input, Modal,   │     │
 │  │  Badge, etc.)    │         │  Badge, etc.)    │     │
 │  └────────┬────────┘         └────────┬────────┘     │
 │           │                           │              │
 │  ┌────────┴──────────────────────────┴────────┐     │
 │  │         packages/shared/tokens/             │     │
 │  │  colors.ts  spacing.ts  typography.ts       │     │
 │  │  shadows.ts  radii.ts  motion.ts            │     │
 │  │  (Platform-agnostic JS objects)             │     │
 │  └─────────────────────────────────────────────┘     │
 └───────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | New vs Modified |
|-----------|----------------|-----------------|
| `packages/shared/tokens/` | Platform-agnostic design tokens (colors, spacing, typography scales, shadows, border radii, motion durations) | **NEW** -- replaces both `theme.ts` and `globals.css` @theme as the single source of truth |
| `apps/mobile/src/design-system/` | Mobile-native primitive components (Button, Card, Input, Modal, Badge, ProgressBar, etc.) built with React Native primitives + Reanimated | **NEW** -- extracted from inline styles scattered across 40+ components |
| `apps/web/src/design-system/` | Web primitive components using Tailwind v4 utility classes, consuming same token values via CSS custom properties | **NEW** -- replaces ad-hoc `ui/` components (Button, Input, Modal, Skeleton) |
| `apps/mobile/src/constants/theme.ts` | Currently the only token file (colors, typography, spacing, borderRadius) | **DEPRECATED** -- replaced by `packages/shared/tokens/` with re-export shim for migration |
| `apps/web/src/app/globals.css` | Currently defines 8 CSS custom properties for colors only | **MODIFIED** -- generated from shared tokens, expanded to full token set |
| `apps/mobile/app/_layout.tsx` | Root layout with toast config, hardcoded colors | **MODIFIED** -- wrap with ThemeProvider, use token references |
| `apps/mobile/app/(tabs)/_layout.tsx` | Tab bar with theme colors | **MODIFIED** -- use design system tab bar config |
| `apps/web/src/app/(app)/layout.tsx` | App shell with Sidebar | **MODIFIED** -- use design system layout primitives |
| All 40+ mobile screen/component files | Currently use `StyleSheet.create` with direct `colors.X` references | **MODIFIED** -- migrate to design system components, bottom-up |
| All 30+ web component files | Currently use inline Tailwind classes with `bg-surface`, `text-gold` etc. | **MODIFIED** -- migrate to design system components |

---

## 1. Design Token Architecture

### The Problem

The mobile app has `constants/theme.ts` with 15 color values, 5 typography presets, 4 spacing values, and 4 border radii. The web app has `globals.css` with 8 CSS custom properties (colors only). These are **completely disconnected** -- same color values duplicated across two files with slightly different names (`surface` vs `surfaceLight` on mobile, `surface-hover` on web has no mobile equivalent).

### The Solution: Shared Token Package

Create `packages/shared/tokens/` as a set of plain TypeScript objects. Both platforms consume these tokens but apply them differently -- React Native uses the JS objects directly in `StyleSheet.create`, the web app generates CSS custom properties from them.

```
packages/shared/
  src/
    tokens/
      index.ts          # barrel export
      colors.ts         # full color palette
      typography.ts     # font sizes, weights, line heights (no fontFamily -- platform-specific)
      spacing.ts        # spacing scale (4px base)
      radii.ts          # border radius scale
      shadows.ts        # elevation / shadow definitions
      motion.ts         # duration + easing tokens for animations
```

### Token Structure

```typescript
// packages/shared/src/tokens/colors.ts
export const colors = {
  // Backgrounds
  bg: { DEFAULT: '#0a0a14', raised: '#12121f', elevated: '#1a1a2e', overlay: '#252540' },
  // Brand
  gold: { DEFAULT: '#f0c040', dim: '#c49a20', glow: '#f0c04030' },
  // Text
  text: { DEFAULT: '#ffffff', secondary: '#a0a0b8', muted: '#6c6c80', inverse: '#0a0a14' },
  // Semantic
  error: { DEFAULT: '#e74c3c', dim: '#e74c3c20' },
  success: { DEFAULT: '#2ecc71', dim: '#2ecc7120' },
  warning: { DEFAULT: '#f39c12', dim: '#f39c1220' },
  info: { DEFAULT: '#3498db', dim: '#3498db20' },
  // Borders
  border: { DEFAULT: '#2a2a45', light: '#3f3f56', strong: '#4a4a65' },
} as const;

// packages/shared/src/tokens/spacing.ts
export const spacing = {
  0: 0, 0.5: 2, 1: 4, 1.5: 6, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64,
} as const;

// packages/shared/src/tokens/typography.ts
export const fontSize = {
  xs: 11, sm: 13, base: 15, md: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 28, '4xl': 34,
} as const;

export const fontWeight = {
  normal: '400', medium: '500', semibold: '600', bold: '700', extrabold: '800',
} as const;

export const lineHeight = {
  tight: 1.2, normal: 1.4, relaxed: 1.6,
} as const;

// packages/shared/src/tokens/motion.ts
export const duration = {
  instant: 100, fast: 150, normal: 250, slow: 400, glacial: 600,
} as const;

export const easing = {
  ease: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  easeIn: 'cubic-bezier(0.42, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.58, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;
```

### How Each Platform Consumes Tokens

**Mobile (React Native):** Import tokens directly. Used in `StyleSheet.create` and Reanimated shared values.

```typescript
import { colors, spacing, fontSize } from '@pocket-trade-hub/shared/tokens';
// Used directly: backgroundColor: colors.bg.raised, padding: spacing[4]
```

**Web (Next.js + Tailwind v4):** A build script or small utility generates `globals.css` @theme block from the token objects. Tailwind classes like `bg-bg-raised` and `p-4` map to the same values.

```typescript
// scripts/generate-css-tokens.ts -- runs at build time
import { colors, spacing } from '@pocket-trade-hub/shared/tokens';

function flattenTokens(obj: Record<string, any>, prefix = ''): Record<string, string> {
  return Object.entries(obj).reduce((acc, [key, val]) => {
    const name = prefix ? `${prefix}-${key}` : key;
    if (typeof val === 'object' && !Array.isArray(val)) {
      return { ...acc, ...flattenTokens(val, name) };
    }
    return { ...acc, [name]: String(val) };
  }, {} as Record<string, string>);
}
// Output: @theme { --color-bg-DEFAULT: #0a0a14; --color-bg-raised: #12121f; ... }
```

### Why Not NativeWind

NativeWind (Tailwind for React Native) is the most obvious "share styling" choice. Do not adopt it for this project because:

1. **Migration cost is enormous.** 40K+ LOC using `StyleSheet.create` patterns. NativeWind requires rewriting every component's styling approach. The overhaul already changes every component -- adding a styling framework migration on top doubles the scope.
2. **Existing web Tailwind v4 works well.** The web app already uses Tailwind v4 CSS-first config correctly. NativeWind v5 (pre-release) aligns with Tailwind v4 but is not stable.
3. **Shared tokens solve the actual problem.** The real issue is color/spacing/typography drift between platforms, not the styling API. A shared token package gives consistency without a framework migration.
4. **StyleSheet.create is performant.** React Native's `StyleSheet.create` produces optimized native style objects. NativeWind adds a runtime CSS-to-native translation layer.

Revisit NativeWind only if starting a new project or if NativeWind v5 reaches stable release and the team wants utility-class DX on mobile.

---

## 2. Component Refactoring Strategy: Bottom-Up

### Why Bottom-Up, Not Top-Down

Top-down (screens first) breaks everything at once. You cannot test a screen redesign if the buttons, cards, inputs, and modals it composes are still the old versions. Bottom-up means:

1. Build primitive components with new design
2. Compose feature components from primitives
3. Swap screen implementations one at a time

Each step produces immediately testable results. Old screens continue working until explicitly migrated.

### Component Inventory and Migration Plan

**Layer 1 -- Primitives (no dependencies, build first):**

| Component | Mobile Status | Web Status | Effort |
|-----------|--------------|------------|--------|
| Button | Extract from inline `TouchableOpacity` + styles in 15+ files | Replace `ui/Button.tsx` | Low |
| Text variants (Heading, Body, Caption, Label) | Extract from repeated typography spread patterns | Replace inline `className` patterns | Low |
| Input / TextInput | Extract from 8+ inline patterns | Replace `ui/Input.tsx` | Low |
| Badge (rarity, status, count) | Extract from 6+ inline implementations | New | Low |
| Icon wrapper | Standardize Ionicons usage (mobile) / Lucide usage (web) | Already partially exists | Low |
| Divider / Separator | Repeated `View` with `borderBottom` | New | Trivial |
| Skeleton / Placeholder | New for mobile | Replace `ui/Skeleton.tsx` | Low |

**Layer 2 -- Composites (depend on primitives):**

| Component | Mobile Status | Web Status | Effort |
|-----------|--------------|------------|--------|
| Card container (surface) | `View` with `backgroundColor: colors.surface` repeated 30+ times | `div` with `bg-surface rounded-lg` | Low |
| Modal / BottomSheet | 6 different modal patterns (DeckDetailModal, PostBrowseModal, etc.) | `ui/Modal.tsx` | Medium |
| List item | 5+ inline list row implementations | Varies by feature | Medium |
| Progress bar | 3 inline implementations (collection, set progress) | 0 (not on web yet) | Low |
| Tab bar / Segment control | None (uses Expo Router tabs only) | None | Medium |
| Empty state | Repeated empty-state patterns across 5+ screens | None | Low |
| Toast / Notification banner | Custom toast in `_layout.tsx` | `NotificationToast.tsx` | Low |
| Stat card (number + label) | Repeated in CollectionSummary, analytics | New | Low |
| Filter bar / Chip group | 4+ inline implementations (card filters, post filters) | `CardFilters.tsx`, `PostFilters.tsx` | Medium |

**Layer 3 -- Feature components (depend on composites):**

| Component | Mobile Status | Web Status | Effort |
|-----------|--------------|------------|--------|
| CardThumbnail | `cards/CardThumbnail.tsx` | `cards/CardThumbnail.tsx` | Medium |
| PostCard | `market/PostCard.tsx` | `trading/PostCard.tsx` | Medium |
| ProposalCard | `trades/ProposalCard.tsx` | `trading/ProposalCard.tsx` | Medium |
| DeckCard | `meta/DeckCard.tsx` | `meta/DeckRankings.tsx` | Medium |
| TierListCard | `meta/TierListCard.tsx` | `meta/TierListBrowser.tsx` | Medium |
| CollectionSummary | `cards/CollectionSummary.tsx` | None | Medium |
| SetupChecklist | `SetupChecklist.tsx` | None | Low |
| PaywallCard | `premium/PaywallCard.tsx` | None | Low |

### Migration Path (Coexistence Period)

During migration, old and new components coexist. The pattern:

```typescript
// Step 1: Create new design system component
// apps/mobile/src/design-system/components/Button.tsx

// Step 2: Add backward-compatible re-export shim for theme.ts
// apps/mobile/src/constants/theme.ts
export { colors, spacing } from '@pocket-trade-hub/shared/tokens';
// ...plus computed values that map old names to new structure

// Step 3: Migrate screens one at a time
// Each PR replaces one screen's inline styles with design system components
// Old screens remain functional until their turn
```

---

## 3. Theme Provider Pattern

### Mobile: Lightweight Context Provider

React Native does not need a full CSS variable system. The design tokens are static JS imports. However, a ThemeProvider is useful for:

- Future dark/light mode toggle (currently hardcoded dark)
- Providing computed theme values (e.g., `colors.gold.glow` which is derived)
- Centralizing Reanimated shared values for animated theme transitions

```typescript
// apps/mobile/src/design-system/ThemeProvider.tsx
import { createContext, useContext, useMemo } from 'react';
import { colors, spacing, fontSize, radii } from '@pocket-trade-hub/shared/tokens';

interface Theme {
  colors: typeof colors;
  spacing: typeof spacing;
  fontSize: typeof fontSize;
  radii: typeof radii;
}

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useMemo(() => ({ colors, spacing, fontSize, radii }), []);
  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
```

In practice, most components will import tokens directly for static styles (`StyleSheet.create`) and use `useTheme()` only for dynamic/conditional styling. This avoids unnecessary re-renders -- `StyleSheet.create` is evaluated once at module load time and does not re-render when context changes.

### Web: CSS Custom Properties (Already Works)

The web app already uses Tailwind v4 `@theme` directive with CSS custom properties. Expand the current 8 variables to the full token set. No React context needed -- CSS variables cascade naturally through the DOM.

```css
/* Generated from packages/shared/tokens/ */
@import "tailwindcss";

@theme {
  /* Backgrounds */
  --color-bg: #0a0a14;
  --color-bg-raised: #12121f;
  --color-bg-elevated: #1a1a2e;
  --color-bg-overlay: #252540;
  /* Brand */
  --color-gold: #f0c040;
  --color-gold-dim: #c49a20;
  --color-gold-glow: #f0c04030;
  /* Text */
  --color-text: #ffffff;
  --color-text-secondary: #a0a0b8;
  --color-text-muted: #6c6c80;
  /* Semantic */
  --color-error: #e74c3c;
  --color-success: #2ecc71;
  --color-warning: #f39c12;
  --color-info: #3498db;
  /* Borders */
  --color-border: #2a2a45;
  --color-border-light: #3f3f56;
  /* Spacing is handled by Tailwind's default scale -- matches our tokens */
  /* Radii */
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
}
```

---

## 4. Navigation Restructuring Without Breaking Existing Flows

### Current Navigation Structure

**Mobile (Expo Router):**
```
app/
  _layout.tsx              # Root: Stack with auth guards
  (auth)/                  # Login, signup, forgot-password
  (tabs)/                  # Bottom tab navigator
    _layout.tsx            # 6 tabs: Home, Cards, Market, Trades, Meta, Profile
    index.tsx              # Home
    cards.tsx              # Card browser + collection
    market.tsx             # Marketplace (posts)
    trades.tsx             # Proposals
    meta.tsx               # Deck meta + tier lists
    profile.tsx            # User profile + settings + premium
  onboarding.tsx           # Modal
  edit-profile.tsx         # Stack screen
  notifications.tsx        # Stack screen
  analytics.tsx            # Stack screen
  card/[id].tsx            # Card detail
  user/[id].tsx            # User profile
  create-tier-list.tsx     # Stack screen
```

**Web (Next.js App Router):**
```
app/
  (auth)/                  # Login, signup
  (app)/                   # Sidebar layout
    cards/page.tsx
    collection/page.tsx
    market/page.tsx
    proposals/page.tsx
    meta/page.tsx
    tierlists/page.tsx
```

### Navigation Changes for the Overhaul

The 6-tab mobile layout is already solid. Do **not** restructure the tab order or add/remove tabs during the overhaul -- that is a feature change, not a UI/UX change. The overhaul focuses on:

1. **Tab bar visual redesign:** Custom tab bar component replacing the default Expo Router tab bar. Animated indicator, custom icons, haptic feedback.

2. **Screen transition animations:** Add `react-native-reanimated` shared element transitions between list views and detail views (card grid -> card detail, deck list -> deck detail). This is purely additive -- no routing changes.

3. **Header redesign:** Replace default Expo Router header with custom header component. Consistent across all stack screens. Supports animated collapse on scroll.

4. **Modal presentation:** Standardize all modals to use a shared `BottomSheet` component (for mobile) instead of the current mix of `presentation: 'modal'` and inline modal components. This does NOT change the Expo Router modal routes -- only the visual presentation within existing routes.

5. **Web sidebar enhancement:** Add collapsible state, user avatar, active section indicator animation. No structural route changes.

### What NOT to Change

- Tab count (6 tabs -- do not add or remove)
- Route file names and paths (keep Expo Router file-based routing intact)
- Auth guard pattern (`Stack.Protected` in `_layout.tsx` -- works, keep it)
- Deep link URLs (any external links or push notification targets must continue working)
- Web route structure (`(auth)/` and `(app)/` groups -- working correctly)

### Safe Migration Pattern for Navigation

```typescript
// Step 1: Create CustomTabBar component
// apps/mobile/src/design-system/navigation/CustomTabBar.tsx
// Reads tab config from Expo Router, renders custom UI

// Step 2: Swap in (tabs)/_layout.tsx without changing tab definitions
// Only change: tabBar prop on <Tabs> component
<Tabs
  tabBar={(props) => <CustomTabBar {...props} />}
  screenOptions={{ /* keep existing options */ }}
>
  {/* All Tabs.Screen definitions stay identical */}
</Tabs>

// Step 3: Create CustomHeader component
// apps/mobile/src/design-system/navigation/CustomHeader.tsx

// Step 4: Swap in _layout.tsx Stack screenOptions
// Only change: header prop
<Stack
  screenOptions={{
    header: (props) => <CustomHeader {...props} />,
    headerShown: true,
  }}
>
  {/* All Stack.Screen definitions stay identical */}
</Stack>
```

---

## 5. Cross-Platform Consistency Strategy

### What to Share vs. What to Keep Platform-Specific

| Concern | Shared | Platform-Specific |
|---------|--------|-------------------|
| Color values | YES -- single token source | NO |
| Spacing scale | YES -- same numeric values | NO |
| Typography scale | YES -- font sizes + weights | Font families (system fonts differ) |
| Border radii | YES -- same values | NO |
| Shadow/elevation | Token values shared | Implementation differs (RN shadow props vs CSS box-shadow) |
| Animation durations | YES -- same duration values | Easing implementation (Reanimated vs CSS transitions) |
| Component API surface | Similar prop names | Different rendering (RN Views vs HTML divs) |
| Layout patterns | Design specs shared | Implementation differs (Flexbox defaults differ between RN and CSS) |
| Icons | Shared icon names | Ionicons (mobile) vs Lucide (web) -- map by name |

### The "Design Spec" Approach

Rather than sharing React component code across platforms (which produces lowest-common-denominator UI), share **design specs** through tokens and let each platform implement idiomatically.

A mobile `Button` uses `TouchableOpacity` + `Reanimated` press animation + haptic feedback.
A web `Button` uses `<button>` + CSS transitions + `:hover` states.

Both use `colors.gold.DEFAULT` as background color, `spacing[4]` as horizontal padding, and `fontSize.sm` as text size. The visual result is consistent. The interaction model is platform-native.

### Icon Mapping

Create a shared icon name registry to ensure both platforms use semantically identical icons:

```typescript
// packages/shared/src/tokens/icons.ts
export const iconNames = {
  home: { mobile: 'home', web: 'LayoutGrid' },
  cards: { mobile: 'albums', web: 'Library' },
  market: { mobile: 'storefront', web: 'Store' },
  trades: { mobile: 'swap-horizontal', web: 'ArrowLeftRight' },
  meta: { mobile: 'trophy', web: 'BarChart3' },
  profile: { mobile: 'person', web: 'User' },
  notification: { mobile: 'notifications', web: 'Bell' },
  search: { mobile: 'search', web: 'Search' },
  filter: { mobile: 'filter', web: 'Filter' },
  close: { mobile: 'close', web: 'X' },
  chevronRight: { mobile: 'chevron-forward', web: 'ChevronRight' },
} as const;
```

---

## 6. Motion and Micro-Interaction Architecture

### Library Choice: react-native-reanimated

Use `react-native-reanimated` (already compatible with Expo SDK) for all mobile animations. Do NOT use React Native's built-in `Animated` API -- Reanimated runs animations on the UI thread, avoiding JS thread bottlenecks.

For web, use CSS transitions and `framer-motion` only if complex orchestrated animations are needed. Most web animations will be CSS-only (transition on hover, opacity fade on mount).

### Animation Token Integration

Shared motion tokens ensure consistent timing:

```typescript
// Used in Reanimated (mobile)
withTiming(1, { duration: duration.fast, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })

// Used in CSS (web)
// transition: opacity 150ms cubic-bezier(0.25, 0.1, 0.25, 1);
// Tailwind: transition-all duration-150 ease-out
```

### Recommended Animation Patterns

| Interaction | Mobile Implementation | Web Implementation |
|------------|----------------------|-------------------|
| Button press | `useAnimatedStyle` scale to 0.97 + opacity 0.8, spring back | `active:scale-[0.97]` CSS transform |
| Screen mount | `FadeInDown` entering animation (Reanimated layout animation) | CSS `@keyframes fadeIn` or `animate-in` |
| List item appear | Staggered `FadeInUp` with 50ms delay per item | CSS `animation-delay` with stagger |
| Tab switch | Shared element transition for content, indicator slide | CSS `transform: translateX()` for indicator |
| Modal open | `SlideInUp` + backdrop opacity | `animate-in slide-in-from-bottom` |
| Pull to refresh | Custom Reanimated gesture handler | N/A (web uses standard scroll) |
| Card flip/expand | `withSpring` rotation + scale | CSS `perspective` + `rotateY` transition |
| Skeleton shimmer | Reanimated `LinearGradient` translation | CSS gradient animation (already standard) |

### What NOT to Animate

- Data-heavy list scrolling (FlatList/VirtualizedList must remain lightweight)
- Form validation feedback (use color changes, not motion)
- Navigation between unrelated screens (simple crossfade, no elaborate transitions)
- Anything that blocks user progress (keep animations under 300ms for interactive elements)

---

## Recommended Project Structure (Post-Overhaul)

### Shared Token Package

```
packages/shared/
  src/
    tokens/
      index.ts              # barrel: export * from './colors' etc.
      colors.ts             # full color palette
      typography.ts         # fontSize, fontWeight, lineHeight scales
      spacing.ts            # 4px-base spacing scale
      radii.ts              # border radius scale
      shadows.ts            # shadow/elevation definitions
      motion.ts             # duration + easing curves
      icons.ts              # cross-platform icon name mapping
    schemas/                # (existing -- unchanged)
    index.ts                # (existing -- add tokens export)
```

### Mobile Design System

```
apps/mobile/src/
  design-system/
    index.ts                  # barrel export
    ThemeProvider.tsx          # React context wrapping token values
    components/
      Button.tsx              # Touchable + Reanimated press
      Text.tsx                # Heading, Body, Caption, Label variants
      Input.tsx               # TextInput with label, error, icon slots
      Badge.tsx               # Rarity, status, count badges
      Card.tsx                # Surface container with elevation variants
      Modal.tsx               # Standardized bottom sheet / centered modal
      ProgressBar.tsx         # Animated progress with Reanimated
      Skeleton.tsx            # Shimmer placeholder
      Divider.tsx             # Horizontal / vertical separator
      EmptyState.tsx          # Icon + title + description + optional CTA
      StatCard.tsx            # Number + label stat display
      FilterChip.tsx          # Selectable chip for filter bars
      Avatar.tsx              # User avatar with fallback
      IconButton.tsx          # Icon-only touchable
      Toast.tsx               # Notification toast (replaces inline in _layout)
    navigation/
      CustomTabBar.tsx        # Animated bottom tab bar
      CustomHeader.tsx        # Collapsible header with search slot
      TabBarIcon.tsx          # Animated tab icon with badge support
    hooks/
      useAnimatedPress.ts     # Shared press animation for any touchable
      useStaggeredList.ts     # Staggered entrance animation for FlatList items
      useScrollHeader.ts      # Header collapse on scroll
  constants/
    theme.ts                  # SHIM: re-exports from @pocket-trade-hub/shared/tokens
                              # with backward-compatible property names during migration
  components/                 # (existing feature components -- migrate over time)
    cards/
    collection/
    trade/
    meta/
    ...
```

### Web Design System

```
apps/web/src/
  design-system/
    index.ts                  # barrel export
    components/
      Button.tsx              # HTML button with Tailwind variants
      Input.tsx               # HTML input with label, error
      Badge.tsx               # Span with variant classes
      Card.tsx                # Div with surface styling
      Modal.tsx               # Dialog element with backdrop
      Skeleton.tsx            # Animated shimmer div
      EmptyState.tsx          # Centered empty state
      FilterChip.tsx          # Selectable filter chip
      Avatar.tsx              # Image with fallback
    generate-tokens.ts        # Script: token objects -> globals.css @theme block
  components/                 # (existing feature components -- migrate over time)
    cards/
    collection/
    trading/
    meta/
    layout/
```

### Structure Rationale

- **`design-system/` separate from `components/`:** Design system primitives are domain-agnostic (a Button does not know about Pokemon cards). Feature components in `components/` compose design system primitives with domain logic. This separation makes the design system testable and reusable independently.
- **No `packages/ui` shared component package:** Mobile uses React Native primitives, web uses HTML elements. Sharing component JSX between them produces abstractions that serve neither platform well (this was identified as an anti-pattern in v2.0 research). Share tokens and types, not rendered components.
- **`constants/theme.ts` kept as shim:** During migration, existing components that import from `@/src/constants/theme` continue working. The shim re-exports token values with backward-compatible property names. Remove the shim only after all components are migrated.

---

## Data Flow: Theme and Styling

### Current Flow (Fragile)

```
Component file
    ↓
import { colors, typography, spacing } from '@/src/constants/theme'
    ↓
StyleSheet.create({ container: { backgroundColor: colors.surface, padding: spacing.md } })
    ↓
<View style={styles.container}>
```

Problems: No type enforcement on which token to use. Developers mix token references with hardcoded values (e.g., `'#f0c04020'` appears 4+ times in the codebase as an inline alpha variant). No motion tokens. No shadow tokens.

### Target Flow (Structured)

```
Design system component (e.g., <Card variant="elevated">)
    ↓
Internally uses: import { colors, spacing, shadows, radii } from '@pocket-trade-hub/shared/tokens'
    ↓
Applies correct token combination for the variant
    ↓
Screen component composes: <Card variant="elevated"><StatCard value={42} label="Cards" /></Card>
```

Benefits: Screen components declare intent ("elevated card containing a stat"), not implementation ("backgroundColor #1a1a2e, borderRadius 16, padding 24, shadowOffset..."). Token changes propagate automatically. Consistency enforced by component API.

### State Management: No Changes

Zustand stores are unaffected. The overhaul does not change data fetching, state shape, or store boundaries. The only new state is:

- **Optional:** Theme preference in a small `useThemeStore` if dark/light mode toggle is added (currently not planned, but the ThemeProvider supports it)
- **Animation state** lives in Reanimated shared values (outside React state tree), not in Zustand

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Big Bang Screen Rewrite

**What people do:** Rewrite all screens simultaneously to use the new design system.
**Why it's wrong:** Introduces bugs across every screen at once. Cannot ship incrementally. Testing surface is the entire app.
**Do this instead:** Migrate one screen per PR. Home screen first (highest visibility, simplest layout). Each PR is shippable and testable. Keep the `theme.ts` shim so un-migrated screens continue working.

### Anti-Pattern 2: Shared React Component Package Between Mobile and Web

**What people do:** Create `packages/ui` with React components that render on both React Native and web via react-native-web.
**Why it's wrong:** React Native and web have fundamentally different component primitives (View/Text/TouchableOpacity vs div/span/button), different event models (press vs click/hover), different animation APIs (Reanimated vs CSS), and different layout defaults (RN flexbox column-first vs CSS flexbox row-first). Abstraction layers that paper over these differences produce components that feel wrong on both platforms.
**Do this instead:** Share tokens (plain JS objects). Build platform-idiomatic components in each app's `design-system/` directory. Shared type interfaces for prop APIs are fine (e.g., `ButtonProps` type in shared), but not the component implementations.

### Anti-Pattern 3: Over-Abstracting Tokens into a "Theme Object"

**What people do:** Create a deeply nested theme object: `theme.components.button.variants.primary.background`.
**Why it's wrong:** Adds indirection without value. Developers cannot remember the path. IDE autocomplete becomes useless with 5 levels of nesting. Token changes require updating both the token AND the theme mapping.
**Do this instead:** Flat token objects organized by concern (colors, spacing, typography). Component variants are defined IN the component, consuming flat tokens. Two levels of nesting maximum: `colors.gold.DEFAULT`.

### Anti-Pattern 4: Animating Everything

**What people do:** Add entrance animations to every component, spring physics to every state change, parallax to every scroll.
**Why it's wrong:** Distracts from content. Causes jank on lower-end Android devices. Makes the app feel sluggish because users wait for animations to complete. Increases bundle size with animation dependencies.
**Do this instead:** Animate transitions between states (pressed, hovered, loading, empty, populated). Use instant feedback for direct manipulation (< 100ms). Reserve 200-400ms animations for significant state changes (screen transitions, modal open/close). No animation should ever block user input.

### Anti-Pattern 5: Migrating Web to Use React Native Primitives

**What people do:** Install react-native-web to make the Next.js app use `<View>` and `<Text>` so components can be "shared."
**Why it's wrong:** The web app is 14 days old with clean Tailwind v4 styling. react-native-web adds 50KB+ to the bundle, requires Webpack/Metro config changes, and produces `<div role="none">` semantically incorrect HTML. Tailwind utility classes are more expressive and performant on web than react-native-web style objects.
**Do this instead:** Keep the web app as a standard Next.js + Tailwind app. Share tokens via CSS custom properties generated from the same source as mobile tokens.

---

## Suggested Build Order (Dependency-Driven)

| Phase | What | Depends On | Produces | Effort |
|-------|------|-----------|----------|--------|
| 1 | Design tokens in `packages/shared/tokens/` + `theme.ts` shim + web CSS generation script | Nothing | Token foundation both platforms consume | Small |
| 2 | Mobile primitive components (Button, Text, Input, Badge, Card, Divider, Skeleton, EmptyState) | Phase 1 tokens | Composable building blocks | Medium |
| 3 | Web primitive components (Button, Input, Badge, Card, Modal, Skeleton, EmptyState, FilterChip) | Phase 1 tokens | Web design system | Medium |
| 4 | Mobile navigation components (CustomTabBar, CustomHeader) + ThemeProvider integration in `_layout.tsx` | Phase 2 primitives | App shell redesign without breaking routes | Medium |
| 5 | Mobile animation hooks (useAnimatedPress, useStaggeredList, useScrollHeader) + Reanimated setup | Phase 2 primitives | Motion layer ready for screen migration | Small-Medium |
| 6 | Screen-by-screen mobile migration: Home -> Cards -> Collection -> Market -> Trades -> Meta -> Profile | Phases 2, 4, 5 | Incrementally refreshed screens | Large (bulk of work) |
| 7 | Screen-by-screen web migration: Cards -> Collection -> Market -> Proposals -> Meta -> TierLists | Phase 3 | Incrementally refreshed pages | Medium-Large |
| 8 | Cross-platform polish: shared transitions, skeleton loading states, error states, haptic feedback | Phases 6, 7 | Production-quality finish | Medium |

**Phase ordering rationale:**
- Tokens first because every component depends on them.
- Primitives before screens because screens compose primitives.
- Mobile nav before screen migration because the tab bar and header frame every screen.
- Animation hooks before screen migration so screens can use them from the start.
- Mobile before web because mobile is the primary platform and has 3x more components.
- Polish last because it requires both platforms to be migrated.

**Parallelizable:** Phases 2 and 3 (mobile and web primitives) can run in parallel. Phases 6 and 7 (mobile and web screen migration) can partially overlap.

---

## Integration Points

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `packages/shared/tokens/` -> `apps/mobile` | Direct TS import via monorepo workspace | Turborepo handles dependency resolution. Token changes trigger mobile rebuild. |
| `packages/shared/tokens/` -> `apps/web` | Build script generates CSS, then Tailwind v4 consumes `@theme` | Token changes require running `generate-tokens` (add to Turborepo pipeline). |
| `design-system/` -> feature `components/` | Feature components import from `@/src/design-system` | Clear dependency direction: features depend on design system, never reverse. |
| `constants/theme.ts` shim -> existing components | Re-export with backward-compatible names | Remove shim only after full migration. Lint rule can warn on direct `theme.ts` imports once migration starts. |
| Zustand stores -> UI components | No change. Stores provide data, components render with new design system. | Design system components are stateless/presentational. Store access stays in screen/page components. |
| Expo Router -> CustomTabBar/CustomHeader | Expo Router passes navigation state to custom components via `tabBar` and `header` render props | Standard Expo Router API. No custom navigation state management needed. |

### External Dependencies (New)

| Dependency | Purpose | Version Constraint |
|------------|---------|-------------------|
| `react-native-reanimated` | UI thread animations for mobile | v3.x (compatible with Expo SDK 53+) |
| `react-native-gesture-handler` | Gesture-driven interactions (bottom sheet swipe, pull-to-refresh) | v2.x (likely already installed via Expo) |
| `expo-haptics` | Haptic feedback on button press, tab switch | Any Expo SDK-compatible version |
| No new web dependencies | CSS transitions + Tailwind v4 handle all web animations | -- |

### What Stays Unchanged

- All Zustand stores (auth, cards, collection, trades, notifications, premium, meta, posts, suggestions, tierlists, language, promo)
- All API hooks (useApi, useCards, useCollection, usePosts, useProposals, usePremium, etc.)
- All Expo Router routes and file structure
- All Next.js App Router routes and file structure
- All `packages/shared/schemas/` (Zod schemas)
- Backend (`apps/api/`) -- zero changes
- i18n setup and translation files

---

## Sources

- [React Native UI Design Best Practices 2025](https://reactnativeexample.com/react-native-ui-design-best-practices-guide-2025/) -- Component organization and theming patterns
- [Cross-Platform Design System with Bit](https://bit.dev/blog/creating-a-cross-platform-design-system-for-react-and-react-native-with-bit-l7i3qgmw/) -- Token sharing pattern between React and React Native (design-token base + platform extensions)
- [NativeWind v5 Theme Documentation](https://www.nativewind.dev/v5/customization/theme) -- NativeWind's approach to Tailwind v4 integration (evaluated, not recommended for this project)
- [NativeWind Themes Guide](https://www.nativewind.dev/docs/guides/themes) -- CSS variable-based theming in NativeWind
- [Design Tokens That Scale in 2026 with Tailwind v4](https://www.maviklabs.com/blog/design-tokens-tailwind-v4-2026) -- CSS-first token architecture with @theme directive
- [Tailwind CSS 4 @theme Guide](https://medium.com/@sureshdotariya/tailwind-css-4-theme-the-future-of-design-tokens-at-2025-guide-48305a26af06) -- @theme directive as design token source
- [React Native Reanimated 3 Guide](https://dev.to/erenelagz/react-native-reanimated-3-the-ultimate-guide-to-high-performance-animations-in-2025-4ae4) -- UI thread animation patterns
- [React Native Reanimated Official Docs](https://docs.swmansion.com/react-native-reanimated/) -- API reference for shared values, withTiming, withSpring
- [Expo New Architecture Guide](https://docs.expo.dev/guides/new-architecture/) -- Compatibility requirements for Reanimated and Gesture Handler
- [State of React Native 2025 - Component Libraries](https://results.stateofreactnative.com/en-US/component-libraries/) -- Ecosystem survey on component library adoption
- [Obytes Expo Starter - UI and Theme](https://starter.obytes.com/ui-and-theme/components/) -- Production starter template showing design system organization pattern
- [NativeWind with Design Tokens and Dark Mode](https://willcodefor.beer/posts/rntw) -- Design token + dark mode integration approach

---
*Architecture research for: Pocket Trade Hub v3.0 UI/UX Overhaul*
*Researched: 2026-03-20*
