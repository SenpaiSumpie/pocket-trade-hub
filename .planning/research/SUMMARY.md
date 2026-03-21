# Project Research Summary

**Project:** Pocket Trade Hub v3.0 UI/UX Overhaul
**Domain:** Mobile-first design system and visual refresh for existing React Native + Next.js trading app
**Researched:** 2026-03-20
**Confidence:** HIGH

## Executive Summary

Pocket Trade Hub v3.0 is a pure frontend visual overhaul of an existing 40K+ LOC Pokemon TCG Pocket trading app. The app already works -- 6-tab navigation, 50+ mobile components, 30+ web components, full trading/collection/meta features. The goal is to elevate from "functional" to "premium-feeling" without touching backend, state management, or navigation structure. Experts build this type of overhaul bottom-up: design tokens first, then shared primitive components, then screen-by-screen migration with old and new coexisting at every step.

The recommended approach avoids any new styling framework (NativeWind, Tamagui, Gluestack are all rejected for compatibility or migration cost reasons). Instead, extend the existing `StyleSheet.create` pattern with an expanded design token system in a shared monorepo package (`packages/shared/tokens/`), build platform-specific primitive components (`Button`, `Card`, `Text`, `Badge`, etc.) in each app's `design-system/` directory, and migrate screens incrementally. Five new dependencies are needed for mobile: `react-native-gesture-handler`, `expo-linear-gradient`, `phosphor-react-native`, `@expo-google-fonts/inter`, and `@gorhom/bottom-sheet`. The web app needs zero new dependencies -- Tailwind v4 + CSS custom properties generated from shared tokens handles everything.

The top risks are: (1) big-bang refactor breaking the working app -- mitigated by strict incremental migration with every PR leaving the app shippable; (2) scope creep turning a 3-week effort into 6+ weeks -- mitigated by hard time-boxes and binary done/not-done tracking per screen; (3) cross-platform token divergence -- mitigated by a single source of truth in `packages/shared/tokens/`; and (4) animation performance on low-end Android -- mitigated by using Reanimated 4 (UI thread) exclusively and profiling on a reference mid-range device.

## Key Findings

### Recommended Stack

No styling framework migration. Extend the existing `StyleSheet.create` + `theme.ts` approach with a proper design token system. All new styling capabilities come from lightweight, well-tested libraries already compatible with Expo 54 / RN 0.81 / Reanimated 4.

**Core technologies (new additions only):**
- **Enhanced design tokens** (`packages/shared/tokens/`): Platform-agnostic TS objects for colors, typography, spacing, shadows, motion -- replaces disconnected `theme.ts` and `globals.css`
- **react-native-gesture-handler** (~2.24.0): Swipe-to-dismiss, bottom sheet gestures, pull-to-refresh -- required by @gorhom/bottom-sheet
- **@gorhom/bottom-sheet** (^5.2.6): Replace modal-based detail views with native-feeling gesture-driven sheets -- MEDIUM confidence, has documented Expo 54 edge cases
- **expo-linear-gradient** (~14.0.x): Gradient backgrounds for premium cards, headers, CTAs -- first-party Expo module
- **phosphor-react-native** (^3.0.3): Replace inconsistent Ionicons with cohesive 9,000+ icon set supporting duotone weight for gold accents
- **@expo-google-fonts/inter**: Custom typography via variable font -- 300KB for all weights, build-time embedded via expo-font config plugin
- **Reanimated 4.1.6** (already installed): All animations -- entering/exiting presets, spring physics, layout transitions. No wrapper library needed (Moti is incompatible with Reanimated 4)

**Rejected alternatives:** NativeWind v5 (still preview, 51-file migration cost), NativeWind v4 (Reanimated 4 issues), Tamagui (replaces all primitives), Gluestack UI v3 (crashes with Expo 54), Moti (incompatible with Reanimated 4), Lottie for micro-interactions (heavy, Reanimated covers it), react-native-skia (overkill for gradients).

### Expected Features

**Must have (table stakes):**
- Expanded design token system (colors, typography, spacing, elevation, animation curves)
- Consistent component library (shared `Button`, `Card`, `Badge`, `Input`, `Text` primitives)
- Skeleton loading states (shimmer placeholders matching content layout)
- Empty states with illustrations and CTAs for all list/grid screens
- Proper typography scale (8-10 levels with Inter font)
- Touch feedback (animated Pressable with scale-down + haptic)
- Pull-to-refresh with branded gold tint
- Toast/snackbar system overhaul (unified success/error/info/warning variants)

**Should have (differentiators):**
- Micro-interaction system (card flip, spring physics, animated counters)
- Card visual effects (rarity-based holographic shimmer, crown glow)
- Bottom sheet navigation (replace 8 modal components with gesture-driven sheets)
- Animated tab bar (icon morphing, indicator slide, haptic on switch)
- Gesture interactions (swipe-to-dismiss, long-press context menus, pinch-to-zoom)
- Gradient and glassmorphism accents (premium sections, sheet backdrops)
- Parallax card headers on detail screens

**Defer (v4+):**
- Light mode / theme engine (dark+gold IS the brand identity)
- Storybook documentation (overkill for team size)
- 3D/AR card effects (massive scope, marginal value)
- Navigation restructuring (current 6-tab IA works well)
- Shared React component package between mobile and web (anti-pattern -- share tokens, not components)

### Architecture Approach

The overhaul introduces a design system foundation layer between existing Zustand stores and screen components. A new `packages/shared/tokens/` package becomes the single source of truth for all visual constants. Mobile consumes tokens as direct TS imports in `StyleSheet.create`. Web generates CSS custom properties from the same tokens for Tailwind v4's `@theme` directive. Each platform builds its own primitive components in `src/design-system/` -- no shared component JSX between platforms. A backward-compatible `theme.ts` shim re-exports new tokens with old property names so un-migrated components continue working during the transition.

**Major components:**
1. **`packages/shared/tokens/`** -- Platform-agnostic design tokens (colors, spacing, typography, shadows, radii, motion). Single source of truth for both platforms.
2. **`apps/mobile/src/design-system/`** -- Mobile primitive components (Button, Card, Input, Badge, Text, Modal, Skeleton, EmptyState) + navigation components (CustomTabBar, CustomHeader) + animation hooks (useAnimatedPress, useStaggeredList, useScrollHeader).
3. **`apps/web/src/design-system/`** -- Web primitive components using Tailwind v4 classes consuming tokens via CSS custom properties. Plus a `generate-tokens.ts` script for the build pipeline.
4. **`apps/mobile/src/constants/theme.ts`** (shim) -- Backward-compatible re-export from shared tokens. Allows incremental migration. Removed after full migration.

### Critical Pitfalls

1. **Big-bang refactor breaks working features** -- Use strangler fig pattern: new design system coexists with old `theme.ts`. Migrate screen-by-screen, leaf components first. Every PR must leave the app shippable. Max 20 files per PR.
2. **Scope creep / "just one more polish" infinite loop** -- Define binary done/not-done criteria per screen BEFORE starting. Hard time-box the entire milestone. Tier screens by traffic: Tier 1 (home, cards, trades) gets full treatment, Tier 2/3 gets token migration only. No separate open-ended "polish" phase.
3. **Cross-platform token divergence** -- Mobile uses `#0f0f1a` background, web uses `#0a0a0a`. Must resolve in Phase 1. Single token package eliminates drift. Update both platforms in lockstep, screen by screen.
4. **Animation performance on low-end Android** -- Use Reanimated 4 (UI thread) exclusively, never built-in `Animated`. Stick to `transform` and `opacity`. No entrance animations on FlatList items. Profile on a real mid-range Android device.
5. **Hardcoded values scattered across 71 files** -- ~1001 color/theme references found, many inline hex values. Run a comprehensive grep audit in Phase 1. Add ESLint rule to flag raw hex colors. Migrate hardcoded values to tokens per-screen BEFORE visual redesign.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Design System Foundation
**Rationale:** Every other phase depends on tokens and primitives. Architecture research is unanimous: tokens first, then primitives, then screens. This phase has zero risk of breaking the working app because it creates new files only.
**Delivers:** Shared token package, mobile design system primitives (Button, Card, Text, Badge, Input, Divider, Skeleton, EmptyState), theme.ts backward-compatible shim, expanded web CSS tokens, toast system overhaul.
**Addresses:** Design tokens, typography scale, touch feedback, toast system (table stakes from FEATURES.md)
**Avoids:** Token explosion pitfall (cap at 40-60 tokens, 2-layer hierarchy max), cross-platform divergence (single source of truth from day one)
**Effort:** ~3-4 days

### Phase 2: Navigation Shell and App Chrome
**Rationale:** Tab bar and header frame every screen. Upgrading them before screen migration means every migrated screen automatically looks better. Install gesture-handler and bottom-sheet here because they require root layout changes.
**Delivers:** Custom animated tab bar, custom collapsible header, GestureHandlerRootView wrapper, bottom sheet provider, Inter font loading, Phosphor icon setup.
**Uses:** react-native-gesture-handler, @gorhom/bottom-sheet, @expo-google-fonts/inter, phosphor-react-native, expo-linear-gradient (from STACK.md)
**Implements:** Navigation components from ARCHITECTURE.md (CustomTabBar, CustomHeader, TabBarIcon)
**Avoids:** Navigation restructuring pitfall (keep all routes, tabs, and deep links identical -- only change visual presentation)
**Effort:** ~2-3 days

### Phase 3: Animation Utilities and Motion System
**Rationale:** Build reusable animation hooks BEFORE screen migration so every screen can use them from the start. This avoids the "add animations later" anti-pattern that causes performance problems.
**Delivers:** useAnimatedPress, useStaggeredList, useScrollHeader, AnimatedCounter component, shimmer animation for skeletons.
**Addresses:** Micro-interactions, animated number transitions, skeleton shimmer (differentiators from FEATURES.md)
**Avoids:** Animation performance pitfall (each hook is profiled individually before being used in screens)
**Effort:** ~1-2 days

### Phase 4: Screen-by-Screen Mobile Migration (Tier 1)
**Rationale:** High-traffic screens first for maximum user impact. Home, Cards, and Trades tabs are the most-used flows. Each screen gets: token adoption pass (replace hardcoded values), primitive component swap, skeleton loading states, empty states, and motion integration.
**Delivers:** Fully overhauled Home tab, Cards tab (including CardGrid, CardThumbnail with rarity effects, CardDetailModal as bottom sheet), Trades tab (ProposalCard, MatchCard with animations).
**Addresses:** Component library overhaul, skeleton loading, empty states, card visual effects, bottom sheet pattern, gesture interactions (from FEATURES.md)
**Avoids:** Big-bang refactor pitfall (one screen per PR, app always shippable), hardcoded value pitfall (grep audit per screen before redesign)
**Effort:** ~4-5 days

### Phase 5: Screen-by-Screen Mobile Migration (Tier 2)
**Rationale:** Medium-traffic screens. Market, Meta, and Profile tabs. These screens benefit from the primitives and patterns established in Phase 4.
**Delivers:** Overhauled Market tab (PostCard, PostBrowseModal as bottom sheet), Meta tab (DeckCard, TierListCard, DeckDetailModal), Profile tab (analytics, settings, premium features with gradient accents).
**Addresses:** Remaining component migration, gradient/glassmorphism accents on premium features (from FEATURES.md)
**Effort:** ~3-4 days

### Phase 6: Web Companion Sync
**Rationale:** Web must not fall behind mobile. By this point, shared tokens are stable and mobile patterns are proven. Web migration consumes the same tokens via CSS custom properties.
**Delivers:** Web design system primitives (Button, Input, Badge, Card, Modal, Skeleton, FilterChip), screen-by-screen web page refresh matching mobile visual language.
**Addresses:** Feature parity pitfall (web updated in dedicated phase, not "later")
**Avoids:** Cross-platform divergence (same token values, verified side-by-side)
**Effort:** ~3-4 days

### Phase 7: Premium Touches and Polish
**Rationale:** Last phase. Everything structural is stable. This phase adds delight without risking core functionality. Hard time-box: when time runs out, ship what is done. Remaining items go to backlog.
**Delivers:** Branded splash animation, card grid layout modes (grid/compact/list), parallax headers on detail screens, contextual haptic patterns, pull-to-refresh branded animation, reduced-motion support.
**Addresses:** Branded splash, card grid modes, parallax headers, contextual haptics (differentiators from FEATURES.md)
**Avoids:** Scope creep pitfall (hard time-box, binary completion tracking)
**Effort:** ~2-3 days

### Phase Ordering Rationale

- **Tokens before everything** because every component, screen, and animation depends on them. Changing tokens after components are built causes cascading rework.
- **Primitives before screens** because screens compose primitives. Without shared Button/Card/Text, each screen reinvents the wheel.
- **Navigation shell before screen migration** because the tab bar and header frame every screen. Upgrading the shell first means every screen refresh inherits the new chrome automatically.
- **Animation hooks before screen migration** so screens use motion from the start instead of bolting it on later (which causes the performance pitfall).
- **Mobile Tier 1 before Tier 2** because high-traffic screens deliver the most user value per day of effort.
- **Web after mobile** because mobile is the primary platform with 3x more components. But web is a dedicated phase, not an afterthought.
- **Polish last** because it requires stable foundations and has the highest scope-creep risk.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Navigation Shell):** @gorhom/bottom-sheet v5 has documented Expo 54 / Reanimated 4 edge cases (crash on close, backdrop tap issues). Must validate during implementation. Have fallback plan: custom bottom sheets with Reanimated primitives.
- **Phase 4 (Tier 1 Migration):** Card visual effects (holographic shimmer) need performance validation on Android. No established pattern -- will require prototyping with Reanimated + LinearGradient.
- **Phase 6 (Web Sync):** CSS token generation from shared TS objects needs a build script integrated into Turborepo pipeline. Pattern is straightforward but requires wiring.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Design token systems are well-documented. Extending `theme.ts` with semantic tokens is mechanical work.
- **Phase 3 (Animation Utilities):** Reanimated 4 layout animations and spring physics are well-documented with official examples.
- **Phase 5 (Tier 2 Migration):** Same patterns as Phase 4, just applied to different screens.
- **Phase 7 (Polish):** All techniques (parallax, haptics, splash animation) have established RN patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All recommended libraries verified against Expo 54 / RN 0.81 compatibility. Only @gorhom/bottom-sheet v5 has known edge cases (MEDIUM for that specific lib). |
| Features | HIGH | Feature list grounded in codebase analysis of 50+ existing components. Table stakes vs differentiators well-defined. Effort estimates provided per feature. |
| Architecture | HIGH | Architecture builds on existing monorepo structure (Turborepo, packages/shared). Token sharing pattern is proven. Bottom-up migration strategy has clear dependency ordering. |
| Pitfalls | HIGH | Pitfalls derived from actual codebase analysis (grep of 71 files, store coupling audit, hardcoded value count). Not hypothetical -- these are real risks in this specific codebase. |

**Overall confidence:** HIGH

### Gaps to Address

- **@gorhom/bottom-sheet v5 stability with Reanimated 4:** Test early in Phase 2. If unstable, fall back to custom bottom sheets using Reanimated primitives (the API is sufficient). Budget 0.5 days for this validation.
- **Inter variable font on Android:** Variable font rendering can differ between Android versions. Test on Android 10+ early. Fallback: use static weight files instead of variable font (~1.5MB increase).
- **Hardcoded value audit scope:** Research found ~1001 color/theme references across 71 files. The exact count of inline hex values (vs proper token references) needs a systematic grep before Phase 1 work begins.
- **Web token generation pipeline:** The `generate-tokens.ts` script that converts shared TS tokens to CSS custom properties needs to be integrated into Turborepo's build pipeline. Pattern is clear but not yet implemented.
- **Phosphor icon coverage:** Verify that Phosphor has equivalents for all currently-used Ionicons before starting the migration. Create a mapping table in Phase 2.

## Sources

### Primary (HIGH confidence)
- [Expo SDK 54 Beta Changelog](https://expo.dev/changelog/sdk-54-beta) -- Reanimated 4.1 bundled, gesture-handler compatibility
- [Reanimated 4 Migration Guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/migration-from-3.x/) -- API changes, entering/exiting animations, layout transitions
- [Expo Font Documentation](https://docs.expo.dev/develop/user-interface/fonts/) -- config plugin approach for build-time font embedding
- [Expo Linear Gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/) -- API reference
- [React Native Gesture Handler (Expo)](https://docs.expo.dev/versions/latest/sdk/gesture-handler/) -- Expo-compatible version
- [Phosphor React Native](https://www.npmjs.com/package/phosphor-react-native) -- v3.0.3, published Feb 2026

### Secondary (MEDIUM confidence)
- [NativeWind v5 Installation](https://www.nativewind.dev/v5/getting-started/installation) -- confirmed pre-release status (5.0.0-preview.3)
- [@gorhom/bottom-sheet GitHub Issues](https://github.com/gorhom/react-native-bottom-sheet/issues/2528) -- Expo 54 / Reanimated 4 compatibility reports
- [Moti GitHub Issue #391](https://github.com/nandorojo/moti/issues/391) -- confirmed Reanimated 4 incompatibility
- [Gluestack UI GitHub Issue #3200](https://github.com/gluestack/gluestack-ui/issues/3200) -- confirmed Expo 54 crashes
- [Design Tokens That Scale with Tailwind v4](https://www.maviklabs.com/blog/design-tokens-tailwind-v4-2026) -- CSS-first token architecture
- [Cross-Platform Design System (Bit.dev)](https://bit.dev/blog/creating-a-cross-platform-design-system-for-react-and-react-native-with-bit-l7i3qgmw/) -- Token sharing patterns
- [Extending Design Systems (Skyscanner)](https://medium.com/@SkyscannerEng/extending-our-design-system-to-multiple-platforms-1bc3735cf3a5)

### Tertiary (LOW confidence)
- Effort estimates (15-22 days total from FEATURES.md) -- based on single-developer assumption, actual velocity will vary
- Card holographic effect implementation -- no production reference found, will need prototyping

---
*Research completed: 2026-03-20*
*Ready for roadmap: yes*
