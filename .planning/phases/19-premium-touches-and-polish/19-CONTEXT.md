# Phase 19: Premium Touches and Polish - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

The app feels delightful and premium in every interaction. A branded splash animation plays on launch. Card grid screens offer layout mode switching (grid/compact/list) that persists across sessions. Card detail screens display parallax scrolling headers. Haptic feedback varies by interaction context (navigation, success, error, destructive). Users with reduced-motion accessibility settings see instant transitions with no loss of functionality.

</domain>

<decisions>
## Implementation Decisions

### Branded Splash Animation (POL-01)
- **D-01:** Animated logo reveal using Reanimated — no new dependencies. Native static splash (expo-splash-screen with existing splash-icon.png on #0f0f1a) displays during load, then a React-rendered animated overlay plays before transitioning to main screen
- **D-02:** Logo fades/scales in (0.8→1.0 with spring), then app name ("Pocket Trade Hub") fades in below the logo
- **D-03:** Gold shimmer sweep across both logo and app name — one continuous sweep for premium feel. Reuses shimmer animation pattern from Phase 15
- **D-04:** Total animated overlay duration ~1.5s after app load, then fade out to main screen

### Card Grid Layout Modes (POL-02)
- **D-05:** Three layout modes: Grid (3 columns, card art only), Compact (2 columns, art + name + set), List (full-width rows with art + name + set + rarity + price)
- **D-06:** Toggle lives in the collapsible header bar as a small icon button (next to filter icon). Tap cycles through modes or shows a popover
- **D-07:** Layout preference persists across sessions (AsyncStorage or Zustand with persistence)
- **D-08:** Cards tab only — Market posts and trades screens do not get layout toggle (they're list-based, not grid-based)

### Parallax Card Headers (POL-03)
- **D-09:** Classic parallax — card art image translates at ~50% of scroll speed. As user scrolls up, the image shrinks/fades and content slides over it
- **D-10:** Card details open as a full-screen view (push/modal navigation) with parallax header, replacing the bottom sheet for tap interactions. Long-press on a card still opens the bottom sheet for quick-peek
- **D-11:** Parallax applies to card detail screens only. Other detail screens (decks, posts, matches) stay as bottom sheets — they're text/data-heavy without natural hero images
- **D-12:** Built with Reanimated useAnimatedScrollHandler + interpolation, consistent with existing useCollapsibleHeader pattern

### Contextual Haptic Patterns (POL-04)
- **D-13:** Four contextual haptic levels:
  - Navigation → Light impact (tab switch, card tap, button press, scroll interactions)
  - Success → Medium impact (trade accepted, card added to collection, proposal sent)
  - Error → Heavy impact (validation failure, network error, rejected action)
  - Destructive → notificationError (delete, cancel trade, remove card)
- **D-14:** Centralized useHaptics() hook with named methods (haptics.navigation(), haptics.success(), haptics.error(), haptics.destructive()). Single place to maintain the pattern map
- **D-15:** Migrate all existing direct expo-haptics calls to use the centralized hook

### Reduced-Motion Accessibility (POL-05)
- **D-16:** useReducedMotion from Reanimated already integrated in 5 animation hooks (useAnimatedPress, useShimmer, useCardFlip, useCardTilt, AnimatedCounter). Audit all animation code to ensure complete coverage — any animation using withSpring/withTiming must have a reduced-motion fallback (instant value set)
- **D-17:** Haptic feedback remains active for reduced-motion users — iOS treats motion and haptics as independent accessibility concerns. Reduced-motion only disables visual animations
- **D-18:** Splash animation respects reduced-motion — skip to instant logo display, then fade to main screen

### Claude's Discretion
- Exact spring config values for splash animation
- Parallax header height and scroll interpolation ranges
- Layout mode icon choices (Phosphor icon variants for grid/compact/list)
- Grid/Compact/List item exact dimensions and spacing
- Whether layout toggle cycles on tap or shows a popover menu
- Full-screen card detail navigation type (stack push vs modal presentation)
- Order of implementation across the five requirements

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Polish Requirements
- `.planning/REQUIREMENTS.md` §Polish — POL-01 through POL-05 define splash, grid modes, parallax, haptics, reduced-motion
- `.planning/ROADMAP.md` §Phase 19 — Success criteria with 5 verification points

### Animation Infrastructure (Phase 15)
- `apps/mobile/src/hooks/useAnimatedPress.ts` — Existing reduced-motion pattern (useReducedMotion + conditional withSpring)
- `apps/mobile/src/hooks/useShimmer.ts` — Shimmer animation with reduced-motion check
- `apps/mobile/src/hooks/useCardFlip.ts` — Card flip with reduced-motion check
- `apps/mobile/src/hooks/useCardTilt.ts` — Card tilt with reduced-motion check
- `apps/mobile/src/components/animation/AnimatedCounter.tsx` — Counter with reduced-motion check
- `apps/mobile/src/constants/springs.ts` — Spring presets (reuse for splash/parallax)
- `apps/mobile/src/hooks/useCollapsibleHeader.ts` — Scroll-linked animation pattern (template for parallax)

### Splash Screen Infrastructure
- `apps/mobile/app/_layout.tsx` — SplashScreen.preventAutoHideAsync() + hideAsync() already wired
- `apps/mobile/app.json` — Splash config (image, backgroundColor #0f0f1a)
- `apps/mobile/assets/images/splash-icon.png` — Existing splash icon asset

### Card Grid Components
- `apps/mobile/src/components/cards/CardGrid.tsx` — Current grid implementation with FlashList
- `apps/mobile/src/components/cards/CardThumbnail.tsx` — Card image container with rarity effects
- `apps/mobile/app/(tabs)/cards.tsx` — Cards tab with search, filters, grid

### Card Detail Components
- `apps/mobile/src/components/cards/CardDetailModal.tsx` — Current card detail (bottom sheet from Phase 15)

### Haptic Infrastructure
- `apps/mobile/src/hooks/useAnimatedPress.ts` — Current haptic usage (Light impact via expo-haptics)
- `apps/mobile/src/components/navigation/CustomTabBar.tsx` — Tab bar haptic usage
- `apps/mobile/src/components/cards/CardThumbnail.tsx` — Card tap haptic usage

### Prior Phase Decisions
- `.planning/phases/15-animation-utilities-and-motion-system/15-CONTEXT.md` — D-06: useAnimatedPress scale 0.97, D-08: stagger mount-once
- `.planning/phases/16-screen-migration-tier-1/16-CONTEXT.md` — D-20/D-21: animated press on all tappable elements

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useCollapsibleHeader`: Reanimated scroll handler pattern — template for parallax implementation
- `useShimmer` + `Shimmer` component: Shimmer sweep animation — reusable for splash gold shimmer
- `useReducedMotion`: Already in 5 hooks — pattern established for reduced-motion checks
- `expo-splash-screen`: Installed, configured, prevent/hide lifecycle already wired in _layout.tsx
- `expo-haptics`: Installed, used in 3 locations — migrate to centralized hook
- `springs.ts`: Spring presets for consistent animation feel
- `CardGrid` + `FlashList`: Grid rendering infrastructure for layout mode integration
- `toast.ts` Zustand store: Pattern for centralized Zustand stores

### Established Patterns
- Reanimated hooks: useSharedValue + useAnimatedStyle + withSpring/withTiming
- Reduced motion: useReducedMotion() → conditional instant vs spring animation
- Haptics: runOnJS(triggerHaptic)() from Reanimated worklets
- State persistence: Zustand stores per domain

### Integration Points
- `app/_layout.tsx`: Splash overlay mounts here, replaces current SplashScreen.hideAsync() timing
- `app/(tabs)/cards.tsx`: Layout mode toggle integrates in header, CardGrid receives mode prop
- `CardDetailModal.tsx`: Becomes full-screen CardDetailScreen with parallax header
- Tab navigator: New card detail screen route added
- All files with direct `Haptics.impactAsync()` calls: Migrate to useHaptics() hook

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for spring configs, parallax interpolation, and layout mode implementation details.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 19-premium-touches-and-polish*
*Context gathered: 2026-03-23*
