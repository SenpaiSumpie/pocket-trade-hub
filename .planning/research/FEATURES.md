# Feature Landscape

**Domain:** UI/UX overhaul for Pokemon TCG Pocket trade coordination app (v3.0)
**Researched:** 2026-03-20
**Context:** Existing 40k+ LOC app with functional features but ad-hoc visual identity. Dark theme (#0f0f1a background, #f0c040 gold accent). 50+ components, 6-tab navigation, StyleSheet-based styling with basic design tokens. React Native 0.81 / Expo 54 / Reanimated 4.

---

## Table Stakes

Features that premium mobile apps in 2025-2026 universally have. Without these, the app feels unfinished regardless of functionality.

| Feature | Why Expected | Complexity | Dependencies on Existing Code | Notes |
|---------|--------------|------------|-------------------------------|-------|
| **Design token system (colors, typography, spacing, radius, elevation)** | Every polished app uses centralized design tokens. Current `theme.ts` has basics but lacks elevation system, semantic naming, opacity tokens, and gradient definitions. Without a complete token system, visual consistency is impossible to maintain. | Medium | Refactor `src/constants/theme.ts`. All 50+ components import from here already -- token expansion propagates through existing imports. | Foundation for everything else. Must be phase 1. Current tokens: 14 colors, 5 typography styles, 6 spacing values, 5 border radii. Need: semantic color aliases (e.g., `card.background`, `button.primary`), elevation shadows, gradient tokens, opacity scale. |
| **Consistent component library (buttons, inputs, cards, badges, modals)** | Current components use inline StyleSheet with inconsistent padding, radii, font sizes, and touch targets. Each component reinvents card containers, button styles, text hierarchies. Users perceive this as "amateur." | High | Touches every component in `src/components/`. ~50 component files need updating. Create shared primitives (`<Card>`, `<Button>`, `<Badge>`, `<Input>`, `<Text>`) that all screens consume. | Biggest single effort. Current state: `MatchCard`, `PostCard`, `ProposalCard`, `TierListCard`, `SuggestionCard` all define their own card container styles independently. Unify into composable `<Card>` primitive. |
| **Skeleton loading states** | Spinners and blank screens feel dated. Every modern app (YouTube, Twitter, Instagram) uses shimmer/skeleton placeholders that match content layout. Current app likely shows `ActivityIndicator` or blank space during loads. | Medium | Add skeleton variants to card grids (`CardGrid`), list views (proposals, notifications, market posts), and detail modals. Reanimated already installed for shimmer animation. | Use `moti` (builds on Reanimated 3) for declarative skeleton components, or build custom shimmer with `react-native-reanimated` LinearGradient animation. Moti is the lighter path. |
| **Empty states with illustrations** | When a user has no trades, no notifications, no collection items -- a blank screen with "No items" text is table stakes failure. Every polished app shows illustrated empty states with CTAs. | Low | Every list/grid screen needs an empty state: notifications, proposals, marketplace, collection, wanted list, match results, tier lists. ~10-12 screens affected. | Use simple SVG illustrations or Lottie animations. Keep them themed (dark background, gold accents). Each empty state needs: illustration, heading, subtext, primary CTA button. |
| **Proper typography scale** | Current typography has 5 levels (heading/subheading/body/caption/label). Premium apps use 8-10 levels with consistent line heights, letter spacing, and font weight hierarchy. Without this, text feels flat and unstructured. | Low | Expand `typography` object in `theme.ts`. All components already use `typography.*` -- add missing levels and enforce through shared `<Text>` component. | Add: `display` (36px), `title` (24px), `bodyLarge` (18px), `bodySmall` (14px), `overline` (11px, uppercase, tracked). Every level needs: fontSize, fontWeight, lineHeight, letterSpacing. |
| **Touch feedback and press states** | Current components use `TouchableOpacity` with `activeOpacity={0.7}` uniformly. No scale animation, no background color shift, no ripple. Feels static. | Low | Replace `TouchableOpacity` with animated `Pressable` wrapper that uses Reanimated for scale-down + opacity shift. Apply to all interactive elements. | Create `<Pressable>` wrapper: `onPressIn` scales to 0.97, `onPressOut` springs back. Add expo-haptics on significant actions (already installed). ~15 min to build, touches all interactive components. |
| **Pull-to-refresh with branded animation** | Standard mobile pattern. Users expect to pull down to refresh any list. Current implementation likely uses default `RefreshControl`. | Low | Add to all scrollable screens: marketplace, trades, notifications, card browser, meta. Custom `RefreshControl` tint color (gold). | Use gold-tinted refresh indicator. Optional: custom Lottie animation (Pokeball spin) for branded feel. |
| **Toast/snackbar system overhaul** | Current `react-native-toast-message` has a custom `matchNotification` toast but no unified toast system for success/error/info states across the app. | Low | Replace ad-hoc alerts with consistent toast system. Already using `react-native-toast-message` -- extend config with success/error/info/warning variants matching design system. | Current toast styles use hardcoded colors (#1a1a2e, #f0c040). Migrate to design tokens. Add slide-in animation, auto-dismiss with progress bar. |
| **Safe area and status bar consistency** | Headers use hardcoded `backgroundColor: '#0f0f1a'` in `_layout.tsx`. Need consistent safe area handling across all screen types. | Low | Audit all `Stack.Screen` options in `_layout.tsx` and `(tabs)/_layout.tsx`. Centralize header style config. | Already using `expo-status-bar` and `react-native-safe-area-context`. Just needs consistent application. |

## Differentiators

Features that elevate beyond "competent" to "premium." These make users notice the quality difference vs PokeHub and other trading apps.

| Feature | Value Proposition | Complexity | Dependencies on Existing Code | Notes |
|---------|-------------------|------------|-------------------------------|-------|
| **Micro-interactions and motion system** | Small animations that make the app feel alive: card flip on detail open, swap icon animates on match, fairness meter fills with spring physics, badge pops on earn, counter animates on change. Apps with motion log 15-20% longer sessions. No trading app competitor invests here. | High | Needs Reanimated-based animation primitives. Touches: `CardThumbnail` (press scale), `FairnessMeter` (animated fill), `MatchCard` (enter animation), `NotificationItem` (slide-in), `ProposalCard` (status transitions). | Build an animation utility layer: `useAnimatedMount()`, `useSpringPress()`, `useCounterAnimation()`. Already have Reanimated 4.1.6 installed. Use `entering`/`exiting` layout animations for list items. Keep all animations under 300ms. |
| **Card visual effects (holographic, rarity glow)** | Pokemon cards have holographic patterns IRL. Adding subtle rarity-based visual effects to card thumbnails makes the collection feel precious. Crown cards glow gold, Star cards shimmer, Diamond cards have subtle sheen. No trading app does this. | Medium | Extends `CardThumbnail` component. Needs Reanimated + SVG (already have `react-native-svg`). Apply conditional effects based on `card.rarity` field. | Implementation: animated LinearGradient overlay with shifting angle for holo effect. Gold border glow for crown rarity using shadow + animated opacity. Performance-critical: only animate visible cards, use `recyclingKey` on FlashList items. |
| **Bottom sheet navigation pattern** | Replace current modal-based detail views (`CardDetailModal`, `PostDetailModal`, `ProposalDetailModal`, `MatchDetailModal`, `DeckDetailModal`) with gesture-driven bottom sheets. Feels more native and premium than full-screen modals. Standard pattern in premium apps (Apple Maps, Apple Music, Spotify). | Medium | Refactor all `*Modal` components (~8 modals) to use `@gorhom/bottom-sheet`. New dependency but built on Reanimated + Gesture Handler which are already installed. | `@gorhom/bottom-sheet` v5 is the standard. Supports snap points, nested scrolling, keyboard handling. Replace modal pattern with sheet that snaps to 50% and 90% height. Card detail at 50%, full trade flow at 90%. |
| **Animated tab bar** | Current tab bar is stock Expo Router tabs with Ionicons. A custom animated tab bar with icon morphing (outline to filled), indicator dot/line animation, and subtle haptic on switch creates premium feel. | Medium | Replace default tab bar in `(tabs)/_layout.tsx` with custom `tabBar` component. Expo Router supports `tabBar` prop on `<Tabs>`. | Already partially doing filled/outline icons for Market and Meta tabs. Extend to all tabs. Add animated indicator line that slides between tabs. Scale animation on active icon. Use `expo-haptics` light impact on tab switch. |
| **Parallax card headers** | On screen scroll, card images in headers (card detail, post detail, user profile) shift with parallax effect. Creates depth. Used by premium apps like Airbnb, Spotify album view. | Low | Apply to `CardDetailModal` header image, `PostDetailModal`, `user/[id]` profile header. Reanimated `useAnimatedScrollHandler` + `interpolate`. | ~50 lines of animation code per screen. High visual impact, low engineering cost. |
| **Gesture-based interactions** | Swipe-to-dismiss on proposals/notifications, long-press context menus on cards, pinch-to-zoom on card images. These feel native and reduce tap-count for common actions. | Medium | Needs `react-native-gesture-handler` (already included via Expo). Add swipe gestures to `ProposalCard`, `NotificationItem`, `PostCard`. Add pinch-zoom to card detail image. | Swipe left to reject proposal, swipe right to accept. Swipe notification to dismiss. Long-press card for quick actions (add to collection, add to wanted, add to post). |
| **Animated number transitions** | When counts change (collection count, trade count, match count, notification badge), numbers roll/animate to new value instead of instantly switching. Feels satisfying and draws attention to changes. | Low | Apply to: notification badge count, collection progress numbers, match count, proposal count badge on tab bar. | Reanimated `useSharedValue` + `useAnimatedStyle` with spring-based text interpolation. Or use a `<AnimatedCounter>` component. |
| **Contextual haptic feedback** | Go beyond basic press haptics. Different haptic patterns for different outcomes: success (notification), warning (unfair trade), error (failed action), selection (light). Creates subconscious quality perception. | Low | Already have `expo-haptics` installed and used in `CardThumbnail` for long-press. Extend to: proposal accept/reject, trade match found, tab switches, pull-to-refresh complete, rating submission. | Mapping: `impactLight` for selection, `impactMedium` for confirmation, `notificationSuccess` for trade completed, `notificationWarning` for unfair trade alert, `notificationError` for failures. |
| **Branded splash/onboarding animation** | Current splash screen is likely static. An animated splash with logo reveal + gold particle effect, transitioning into onboarding, creates a memorable first impression. | Low | Replace static `expo-splash-screen` with animated sequence. Modify `_layout.tsx` splash hide logic to trigger animation first. | Lottie animation or Reanimated sequence: logo scales up from center, gold particles emanate, transitions to app. 1.5-2 seconds max. |
| **Card grid layout modes** | Current `CardGrid` likely has one layout. Offer toggle between: grid (3-col thumbnails), compact grid (4-col, no labels), list (full-width cards with details). Users have preferences for browse vs. manage modes. | Low | Extend `CardGrid` component with layout mode state. Animate transition between layouts using `LayoutAnimation` or Reanimated layout transitions. | Three modes: `grid` (current default), `compact` (smaller thumbnails, more visible at once, good for collection checking), `list` (one card per row with full stats, good for trading decisions). |
| **Gradient and glassmorphism accents** | Subtle gradient backgrounds on premium features, frosted glass effect on overlays and bottom sheets. Creates visual depth hierarchy. Current surfaces are all flat solid colors. | Medium | Add `expo-linear-gradient` for gradient backgrounds. Apply to: premium feature cards, paywall card, header backgrounds, bottom sheet handles. Glassmorphism via `backdrop-filter` equivalent (BlurView from expo-blur). | Use sparingly. Gold-to-transparent gradient on premium sections. Subtle blur on bottom sheet backdrop. Dark gradient fade on card image overlays. Avoid overdoing it -- accent, not everywhere. |

## Anti-Features

Features to explicitly NOT build during this UI/UX overhaul. These are tempting but wrong.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Full theme engine (light mode, custom themes)** | The dark-with-gold brand identity IS the product identity. Adding light mode doubles the design surface area for zero user value in a gaming app context. 82% of mobile users use dark mode. Custom themes add complexity with no ROI for a trading app. | Keep dark theme only. Invest in making the dark theme excellent: proper elevation hierarchy, color contrast ratios, refined surface colors. |
| **Design system documentation site (Storybook)** | Storybook for React Native requires significant setup (Storybook 8 + React Native add-on). For a 50-component app maintained by a small team, the overhead of maintaining stories exceeds the benefit. | Document components inline with TypeScript props. Use the app itself as the component showcase. Create a hidden "design system" screen in dev mode if needed. |
| **Lottie animations everywhere** | Lottie files add bundle size (each animation 10-100KB). Overuse creates visual noise and performance issues on lower-end Android devices. | Use Lottie for 2-3 key moments only: splash/onboarding, empty states, celebration (trade completed). Use Reanimated for all other motion. |
| **3D card effects / AR card viewer** | Three.js/React Three Fiber in React Native is experimental and heavy. AR requires camera permissions and ARKit/ARCore integration. Massive scope for marginal wow factor. | Use 2D holographic shimmer effects with Reanimated + LinearGradient. Achieves 80% of the visual impact at 5% of the complexity. |
| **Custom font family** | Custom fonts in Expo require careful loading, affect bundle size, and can cause layout shift. The system font (San Francisco on iOS, Roboto on Android) is already optimized for readability at all sizes. | Use system fonts with carefully tuned weights and sizes. The typography SCALE matters more than the font family. If a custom font is ever needed, limit to headings only (one weight). |
| **Pixel-perfect cross-platform parity** | iOS and Android have different design languages (SF Symbols vs Material Icons, different shadow rendering, different font metrics). Forcing identical appearance fights the platform. | Use platform-appropriate affordances: iOS-style bottom sheets on iOS, Material-style on Android where sensible. Use Expo Router's native tabs option for platform-native tab bars. Accept minor visual differences. |
| **Complex page transition animations** | Shared element transitions between screens are fragile in React Navigation and cause performance issues. Custom stack transitions can break gesture navigation. | Use standard push/modal transitions. Focus animation budget on within-screen micro-interactions which are more reliable and more impactful. |
| **Redesigned navigation structure** | The current 6-tab layout (Home, Cards, Market, Trades, Meta, Profile) maps well to user mental models. Changing navigation structure risks confusing existing users and is not a visual overhaul -- it is an information architecture overhaul. | Keep the 6-tab structure. Polish each tab's visual presentation. Add animated tab bar as a differentiator. If any IA changes are needed, limit to within-tab reorganization only. |

## Feature Dependencies

```
Design Tokens (expanded theme.ts)
  |
  +--> Typography Scale (uses token values)
  |     |
  |     +--> Shared <Text> component (enforces scale)
  |
  +--> Color System (semantic aliases)
  |     |
  |     +--> Gradient tokens
  |     |
  |     +--> Elevation/shadow tokens
  |
  +--> Shared Primitives (<Card>, <Button>, <Badge>, <Input>)
        |
        +--> Touch feedback (animated Pressable)
        |     |
        |     +--> Haptic feedback layer
        |
        +--> Component library overhaul (all 50+ components)
              |
              +--> Skeleton loading states (match component layouts)
              |
              +--> Empty states (use shared primitives)
              |
              +--> Card visual effects (extends CardThumbnail)
              |
              +--> Animated tab bar (custom tab bar component)
              |
              +--> Bottom sheet pattern (replaces modal components)

Micro-interaction system (Reanimated utilities)
  |
  +--> Animated number transitions
  |
  +--> Parallax headers
  |
  +--> Gesture interactions
  |
  +--> List item enter/exit animations
  |
  +--> Card grid layout transitions

Splash/onboarding animation (independent, but uses design tokens)

Toast system overhaul (independent, uses design tokens)

Pull-to-refresh (independent, uses design tokens for color)
```

### Critical ordering constraints:

1. **Design tokens MUST come first** -- every other feature consumes token values. Changing tokens after components are built causes cascading rework.
2. **Shared primitives before component overhaul** -- build `<Card>`, `<Button>`, `<Badge>`, `<Text>` before touching the 50+ existing components, or each component reinvents the wheel.
3. **Micro-interaction utilities before individual component animation** -- build `useSpringPress()`, `useAnimatedMount()` once, apply everywhere.
4. **Bottom sheet library before modal refactors** -- install and configure `@gorhom/bottom-sheet` before converting existing modals.
5. **Skeleton components after shared primitives** -- skeletons must match the layout of the components they're replacing.

## MVP Recommendation for v3.0 UI/UX Overhaul

### Phase 1: Design System Foundation
1. **Expanded design tokens** -- colors (semantic), typography (8+ levels), spacing, elevation, gradients, opacity
2. **Shared primitives** -- `<Text>`, `<Card>`, `<Button>`, `<Badge>`, `<Input>`, `<Divider>`
3. **Animated Pressable wrapper** -- touch feedback + haptics for all interactive elements
4. **Toast system overhaul** -- unified success/error/info/warning variants

### Phase 2: Component Library Overhaul
5. **Bottom sheet setup** -- install `@gorhom/bottom-sheet`, configure with Reanimated/Gesture Handler
6. **Screen-by-screen component refresh** -- apply new primitives to all existing components, one screen group at a time (Cards -> Market -> Trades -> Meta -> Profile -> Auth)
7. **Skeleton loading states** -- shimmer placeholders for all data-loading screens
8. **Empty states** -- illustrated empty states with CTAs for all list/grid screens

### Phase 3: Motion and Polish
9. **Micro-interaction system** -- Reanimated utility hooks for mount animations, spring press, counter animation
10. **Card visual effects** -- rarity-based holographic shimmer on card thumbnails
11. **Animated tab bar** -- custom tab bar with indicator animation and icon morphing
12. **Parallax headers** -- scroll-driven parallax on detail screens

### Phase 4: Premium Touches
13. **Gesture interactions** -- swipe-to-dismiss, long-press context menus, pinch-to-zoom
14. **Animated number transitions** -- rolling number animations on badges and counters
15. **Branded splash animation** -- animated logo reveal with gold particles
16. **Card grid layout modes** -- toggle between grid/compact/list views
17. **Gradient and glassmorphism accents** -- premium feature highlights, sheet backdrops

### Defer:
- **Light theme** -- brand is dark+gold, not needed
- **Storybook** -- overkill for team size
- **3D/AR effects** -- scope vs impact too unfavorable
- **Navigation restructure** -- current 6-tab IA works well

## Complexity Budget

| Feature | Effort | Risk | Reanimated Required | New Dependencies |
|---------|--------|------|---------------------|------------------|
| Design tokens expansion | 0.5 day | Low | No | None |
| Typography scale | 0.5 day | Low | No | None |
| Shared primitives | 1-2 days | Low | Pressable only | None |
| Toast system overhaul | 0.5 day | Low | No | None (extends existing) |
| Bottom sheet setup | 0.5 day | Medium | Yes (already installed) | `@gorhom/bottom-sheet` |
| Component library overhaul | 3-5 days | Medium | Minimal | None |
| Skeleton loading states | 1 day | Low | Yes | `moti` (optional) |
| Empty states | 1 day | Low | No | SVG illustrations |
| Micro-interaction utilities | 1 day | Medium | Yes | None |
| Card visual effects | 1 day | Medium | Yes | `expo-linear-gradient` |
| Animated tab bar | 1 day | Medium | Yes | None |
| Parallax headers | 0.5 day | Low | Yes | None |
| Gesture interactions | 1-2 days | Medium | Yes + Gesture Handler | None |
| Animated number transitions | 0.5 day | Low | Yes | None |
| Branded splash animation | 0.5 day | Low | Yes or Lottie | `lottie-react-native` (optional) |
| Card grid layout modes | 0.5 day | Low | Layout animation | None |
| Gradient/glassmorphism accents | 1 day | Low | No | `expo-linear-gradient`, `expo-blur` |

**Total estimate: ~15-22 days of execution**

## Existing Code Impact Assessment

### High-Touch Files (will be heavily modified)
- `src/constants/theme.ts` -- complete rewrite to expanded token system
- `src/components/cards/CardThumbnail.tsx` -- visual effects, press animation, layout modes
- `src/components/cards/CardGrid.tsx` -- layout modes, skeleton states
- `app/(tabs)/_layout.tsx` -- custom animated tab bar
- `app/_layout.tsx` -- splash animation, bottom sheet provider
- All `*Modal` components (~8 files) -- bottom sheet conversion

### Medium-Touch Files (updated to use new primitives)
- All card/list components (~30 files) -- swap inline styles for shared primitives
- All screen files (~15 files) -- add skeleton states, empty states, pull-to-refresh

### Low-Touch Files (token import path unchanged)
- Hooks, stores, services -- no visual layer changes
- API routes, backend -- zero changes (pure frontend overhaul)

## Sources

- [React Native UI Design Best Practices 2025](https://reactnativeexample.com/react-native-ui-design-best-practices-guide-2025/)
- [Motion UI Trends 2025: Micro-Interactions](https://www.betasofttechnology.com/motion-ui-trends-and-micro-interactions/)
- [Motion Design & Micro-Interactions 2026](https://www.techqware.com/blog/motion-design-micro-interactions-what-users-expect)
- [UI/UX Evolution 2026: Micro-Interactions & Motion](https://primotech.com/ui-ux-evolution-2026-why-micro-interactions-and-motion-matter-more-than-ever/)
- [React Native Reanimated 3 Guide](https://dev.to/erenelagz/react-native-reanimated-3-the-ultimate-guide-to-high-performance-animations-in-2025-4ae4)
- [Moti Animation Library](https://moti.fyi/)
- [@gorhom/bottom-sheet](https://gorhom.dev/react-native-bottom-sheet/)
- [Expo Animation Documentation](https://docs.expo.dev/develop/user-interface/animation/)
- [React Native Haptic Feedback](https://enzomanuelmangano.medium.com/the-secret-ingredient-react-native-haptic-feedback-338f0cdd21e4)
- [Supercharging Pressables in React Native](https://www.guisantos.dev/blog/supercharging-your-pressables-in-react-native)
- [Dark Mode Design Best Practices 2025](https://www.mindinventory.com/blog/how-to-design-dark-mode-for-mobile-apps/)
- [Dark Theme Principles - Toptal](https://www.toptal.com/designers/ui/dark-ui-design)
- [Skeleton Loading in React Native](https://oneuptime.com/blog/post/2026-01-15-react-native-skeleton-loading/view)
- [Performant Shimmer Effects - Callstack](https://www.callstack.com/blog/performant-and-cross-platform-shimmers-in-react-native-apps)
- [Common Navigation Patterns - Expo Docs](https://docs.expo.dev/router/basics/common-navigation-patterns/)
- [Custom Tab Layouts - Expo Docs](https://docs.expo.dev/router/advanced/custom-tabs/)
- [Card UI Design Best Practices](https://www.eleken.co/blog-posts/card-ui-examples-and-best-practices-for-product-owners)
- [Financial App Design: Data-Dense UX](https://www.netguru.com/blog/financial-app-design)
- [PokeHub Design Review (competitor)](https://apps.apple.com/us/app/pokehub-for-tcg-pocket/id6740797484)
- [Pokemon TCG Pocket UI Critique](https://www.thegamer.com/why-is-pokemon-tcg-pockets-ui-so-annoying/)
- [Design Critique: Pokemon TCG Pocket - Pratt IXD](https://ixd.prattsi.org/2025/09/design-critique-pokemon-tcg-pocket-android-app/)
