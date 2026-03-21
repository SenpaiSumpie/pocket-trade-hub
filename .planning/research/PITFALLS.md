# Pitfalls Research

**Domain:** UI/UX Overhaul for Existing React Native + Next.js Trading App (v3.0)
**Researched:** 2026-03-20
**Confidence:** HIGH (based on codebase analysis of 50+ mobile components, web companion, theme system, and established refactoring patterns)

## Critical Pitfalls

### Pitfall 1: Big-Bang Refactor Breaks Working Features

**What goes wrong:**
Attempting to refactor all 50+ mobile components and 30+ web components simultaneously creates a period where nothing works. Screens that depend on each other (e.g., MatchCard -> MatchDetailModal -> ProposalCreationModal) break when one is updated but its dependencies are not. The app becomes unusable for days or weeks during the transition, making it impossible to ship hotfixes for the working v2.0.

**Why it happens:**
The temptation in a "visual overhaul" is to redesign everything at once because piecemeal updates look inconsistent. Developers start with the design system foundation, then begin converting components, discover each component touches 3-4 others, and the blast radius expands until the entire app is in a broken intermediate state. This project has deep component nesting: tab screens -> list components -> card components -> modals -> sub-modals, all sharing `colors`/`spacing`/`borderRadius` from `theme.ts`.

**How to avoid:**
- Use a strangler fig pattern: create new design system tokens alongside the old `theme.ts`. New components import from the new system, old components keep working with the old one. Migrate screen-by-screen, not component-by-component.
- Define a migration order based on dependency depth: leaf components first (RarityBadge, PremiumBadge), then containers (MatchCard, PostCard), then screens (trades tab, market tab), then navigation shell (tab layout).
- Every PR must leave the app in a shippable state. No "WIP" commits that break existing flows.
- Keep `main` branch deployable at all times. Use a feature branch for the overhaul, but merge frequently with small, contained changes.

**Warning signs:**
- More than 20 files changed in a single PR.
- Component imports shifting between old and new systems in the same file.
- Manual QA finding regressions in features that were not intentionally touched.
- "I'll fix that after I finish this other component" comments accumulating.

**Phase to address:**
Phase 1 (Design System Foundation) must establish the coexistence strategy. Every subsequent phase must follow the incremental migration discipline.

---

### Pitfall 2: Design Token Explosion -- Over-Engineering the Token System

**What goes wrong:**
Creating hundreds of design tokens for every conceivable variant: `color-surface-card-hover-active`, `spacing-card-inner-horizontal-compact`, `border-radius-modal-header-left`. The token system becomes harder to learn than the old hardcoded values, slowing development to a crawl. New features take 3x longer because developers spend more time finding the right token than writing the component.

**Why it happens:**
Design system literature emphasizes tokens as the foundation. Developers, wanting to "do it right," create tokens for every value that appears in the codebase. The current `theme.ts` has 13 colors, 5 typography presets, 5 spacing values, and 4 border radii -- a total of ~27 tokens. Replacing this with 200+ semantic tokens is a net productivity loss for a 1-2 developer team.

**How to avoid:**
- Keep it simple: the current `theme.ts` structure (flat color palette, spacing scale, typography presets, border radius scale) is already a design token system. Extend it, do not replace it with an enterprise-grade token architecture.
- Cap at 3 layers maximum: primitive values -> semantic aliases -> component tokens. For this project, 2 layers (primitive + semantic) is sufficient.
- Target 40-60 total tokens, not 200+. If a token is used in only one component, it should be a local constant, not a design token.
- Measure: if adding a new screen requires looking up tokens more than twice, the system is too complex.

**Warning signs:**
- Token file exceeds 100 lines.
- Developers copy-pasting hex values because they cannot find the right token name.
- Token names requiring a naming convention document to understand.
- Debates about token naming taking longer than implementing the feature.

**Phase to address:**
Phase 1 (Design System Foundation) -- set a hard token count budget before writing code.

---

### Pitfall 3: Cross-Platform Style Divergence Worsens During Overhaul

**What goes wrong:**
The mobile app uses `StyleSheet.create` with a `theme.ts` constants file. The web app uses Tailwind v4 with CSS `@theme` variables. The two already have divergent color values -- mobile background is `#0f0f1a`, web is `#0a0a0a`. During the overhaul, the gap widens because designers/developers work on mobile first (it is the primary platform), and web updates lag behind or use different visual decisions. Users who switch between platforms see two different apps.

**Why it happens:**
React Native and CSS have fundamentally different styling models. There is no shared stylesheet format. The current project has zero shared design tokens between `apps/mobile/src/constants/theme.ts` and `apps/web/src/app/globals.css`. Without a single source of truth, each platform drifts independently, especially under time pressure where "we'll sync it later" becomes permanent.

**How to avoid:**
- Create a single source of truth: `packages/shared/src/tokens.ts` that exports platform-agnostic token values (plain objects/numbers). Mobile imports and maps to StyleSheet values. Web has a build step (or manual sync) that generates the `@theme` CSS variables from the same source.
- Alternatively (simpler): maintain a `TOKENS.md` spec document and manually keep both platforms in sync. Less elegant but realistic for a small team.
- Pick one: standardize both platforms on the same hex values NOW. The `#0f0f1a` vs `#0a0a0a` background discrepancy should be resolved in Phase 1 before any further visual work.
- Review both platforms side-by-side after every screen refactor, not just the platform being worked on.

**Warning signs:**
- Mobile and web use different hex values for the same semantic color.
- PRs that only touch `apps/mobile` for visual changes with no corresponding web update.
- Users or testers noting "the web looks different" without anyone having intentionally changed it.

**Phase to address:**
Phase 1 (Design System Foundation) -- token unification must happen before any screen-level visual work begins.

---

### Pitfall 4: Navigation Restructuring Breaks Deep Links, Back Stacks, and State

**What goes wrong:**
Restructuring the information architecture -- e.g., moving from 6 tabs to 4 tabs, adding drawer navigation, restructuring modal flows -- breaks Expo Router's file-based routing paths. Existing deep links (push notifications linking to `/card/[id]` or `/notifications`) stop working. The Zustand stores that load data based on which screen is mounted (e.g., `useMatchSocket` in tab layout, `fetchUnreadCount` on login) lose their mounting points if the layout tree changes. Users pressing back get unexpected behavior because the new stack does not match the old mental model.

**Why it happens:**
Expo Router ties navigation to the filesystem (`app/(tabs)/`, `app/(auth)/`, `app/card/[id].tsx`). Renaming or restructuring these directories changes the URL paths. The current tab layout at `app/(tabs)/_layout.tsx` mounts Socket.IO, fetches notification counts, and manages premium status. Moving these responsibilities to a different layout level or splitting tabs means these side effects need new homes. Developers focus on the visual layout change and forget the invisible state management wired into the navigation tree.

**How to avoid:**
- Map every current route and its side effects before restructuring. Document: route path, what loads on mount, what stores are affected, which push notification actions link to it.
- If renaming routes, add redirect aliases from old paths to new paths so deep links and push notifications continue working during the transition.
- Move side effects (Socket.IO connection, notification polling, premium status fetch) out of the tab layout into a dedicated provider component that lives above the navigation tree. This decouples state management from navigation structure.
- Test push notification deep links explicitly after every navigation change -- they are the most commonly broken flow.

**Warning signs:**
- Push notification taps opening the wrong screen or the home screen.
- Back button behavior feeling "wrong" (extra screens in the stack, or jumping to unexpected places).
- Socket.IO disconnecting when switching between certain screens.
- "White flash" between screens because layout mounts changed.

**Phase to address:**
Dedicated navigation restructuring phase -- do NOT mix navigation changes with visual component changes. Navigation restructuring should be its own phase, completed and verified before visual updates begin on the new screen structure.

---

### Pitfall 5: Animation Performance Tanks on Low-End Android Devices

**What goes wrong:**
Adding micro-interactions, transitions, and polish animations (card flip effects, skeleton loading shimmer, spring-based tab transitions, parallax scrolling) works beautifully on an iPhone 15 or Pixel 8 but causes visible jank, dropped frames, or complete freezes on budget Android devices (Samsung Galaxy A series, Xiaomi Redmi). The app feels worse after the "polish" phase than before it.

**Why it happens:**
The current app uses `Animated` from react-native in only 3 files (CardGrid, CardThumbnail, FairnessMeter) -- it is essentially animation-free. Adding animations in a concentrated "polish" phase means adding dozens of animated components at once without incremental performance testing. React Native's `Animated` API runs on the JS thread by default. Even `useNativeDriver: true` only offloads opacity/transform -- layout animations still block the JS thread. Budget Android devices have 2-3GB RAM and slow CPUs that cannot handle 60fps animations alongside FlatList rendering and data fetching.

**How to avoid:**
- Use `react-native-reanimated` (worklet-based, runs on UI thread) instead of the built-in `Animated` API for any non-trivial animation. This is the single biggest performance lever.
- Set a performance budget: animations must hit 60fps on a mid-range device (define the reference device -- e.g., Samsung Galaxy A14 or equivalent). Test on a real low-end device, not just the simulator.
- Avoid animating layout properties (`width`, `height`, `top`, `left`). Stick to `transform` and `opacity` which can use the native driver.
- Add animations incrementally per-component, not in a "polish all the things" batch phase. Measure before and after each addition.
- For FlatList-heavy screens (cards tab with potentially hundreds of items), keep row rendering dead simple. No enter/exit animations on list items.
- Use `LayoutAnimation` sparingly -- it is simple but animates the entire layout tree and can cause jank on complex screens.

**Warning signs:**
- FPS drops below 50 during any transition (use React Native Perf Monitor).
- Visible "stutter" when opening modals that have entrance animations.
- Animations looking smooth on iOS but janky on Android (classic symptom of JS-thread animations).
- Memory usage climbing during animation-heavy screens (leak from animated values not being cleaned up).

**Phase to address:**
Motion/animation should be the LAST visual phase, after all structural and component changes are stable. Each animation must be profiled individually on a reference device.

---

### Pitfall 6: Scope Creep -- "Just One More Polish" Infinite Loop

**What goes wrong:**
The UI/UX overhaul becomes an endless project. After completing the design system and component library, there is always one more screen that "needs a little more work," one more micro-interaction that would "really elevate the experience," one more edge case layout that looks slightly off. The milestone that was supposed to take 2 weeks takes 6 weeks, and v3.0 never ships because the team is perpetually polishing.

**Why it happens:**
Visual work has no natural completion boundary -- there is always a way to make something look better. Unlike feature development where "the API returns the right data" is a clear done-state, "the button looks good" is subjective and infinitely refinable. The project has 7 tab screens, 50+ components, and ~20 modals. If each gets 3 rounds of polish, that is 200+ design iterations.

**How to avoid:**
- Define explicit "done" criteria for each screen BEFORE starting work. "Done" means: uses new design tokens, matches approved mockup within reason, passes accessibility check, tested on iOS and Android. NOT "looks perfect."
- Set a hard time-box for the entire overhaul milestone. When time runs out, ship what is done. Remaining polish goes to a follow-up milestone.
- Batch screens into tiers: Tier 1 (high-traffic: home, cards, trades) gets full treatment. Tier 2 (medium: market, meta, profile) gets token migration and basic refresh. Tier 3 (low: onboarding, edit-profile, settings) gets token migration only.
- No "polish" phase. Polish happens within each screen's phase, not as a separate open-ended phase.
- Track progress as "screens converted / total screens" not "percentage complete" (which is subjective).

**Warning signs:**
- Same screen being revisited more than twice for visual changes.
- Milestone timeline extending without adding scope.
- Discussing pixel-level adjustments in reviews instead of structural correctness.
- "This is almost done, just need to tweak..." repeated for more than 3 days.

**Phase to address:**
Every phase -- this is a process discipline pitfall, not a technical one. Must be enforced from Phase 1 onward with clear exit criteria per screen.

---

### Pitfall 7: Accessibility Regressions During Visual Refresh

**What goes wrong:**
The visual refresh introduces new color combinations that fail WCAG contrast ratios, removes or breaks existing touch targets, or introduces animations that cause issues for users with vestibular disorders. Custom-styled components that previously used React Native's built-in accessibility props (from `TouchableOpacity`, `Pressable`) lose those props when wrapped in custom animated containers or replaced with styled alternatives.

**Why it happens:**
The current gold-on-dark theme (`#f0c040` on `#0f0f1a`) has a contrast ratio of about 9.5:1 -- excellent. But refining the palette (lighter backgrounds, muted golds, new accent colors) can easily drop below 4.5:1 without anyone noticing until an accessibility audit. Additionally, the existing components use `TouchableOpacity` and `Pressable` which provide built-in `accessibilityRole`, `accessibilityLabel` support. If the overhaul replaces these with custom `View` + gesture handlers for fancier tap interactions, accessibility props get lost.

**How to avoid:**
- Run a contrast ratio check on every new color pairing BEFORE implementing. Use the APCA or WCAG 2.1 AA standard (4.5:1 for normal text, 3:1 for large text).
- Keep using `Pressable` or `TouchableOpacity` as the touchable base -- do not replace with raw `View` + `onPress` patterns for styling convenience.
- Maintain minimum touch target sizes: 44x44 points (Apple HIG) / 48x48 dp (Material Design). The overhaul should increase these if anything, not decrease them.
- If adding `prefers-reduced-motion` support on web (Tailwind's `motion-reduce:` prefix), also implement `AccessibilityInfo.isReduceMotionEnabled()` check on mobile.
- Add a simple accessibility check to the screen completion checklist: all interactive elements have `accessibilityLabel`, color contrast passes, touch targets meet minimums.

**Warning signs:**
- New color combinations with gold text on lighter surfaces (contrast drops fast).
- Interactive elements styled as `View` with no `accessibilityRole="button"`.
- Touch targets smaller than 44x44 points for "sleeker" visual design.
- No `accessibilityLabel` on icon-only buttons (the notification bell, share button, etc.).

**Phase to address:**
Phase 1 (Design System Foundation) must verify all new palette colors pass contrast requirements. Every subsequent phase's screen checklist must include accessibility verification.

---

### Pitfall 8: Feature Parity Loss -- Mobile Gets the Overhaul, Web Gets Forgotten

**What goes wrong:**
The overhaul focuses primarily on the mobile app (50+ components, primary platform) and the web companion (31 components, secondary platform) falls behind. After the mobile overhaul ships, the web app still looks like v2.0 -- different typography, different component styles, different spacing. Worse, if navigation restructuring changes what is visible where on mobile, the web app's page structure no longer corresponds, and features available on one platform are not on the other.

**Why it happens:**
Mobile is the primary platform for a Pokemon TCG Pocket trading app -- players are on their phones. The web companion was built as a secondary experience. During the overhaul, mobile naturally gets priority. Web components use a completely different styling system (Tailwind CSS classes vs StyleSheet.create), so every visual change requires reimplementation, not just porting.

**How to avoid:**
- Update both platforms in lockstep, screen by screen. When the mobile Cards tab is overhauled, the web Cards page gets updated in the same phase.
- Create platform-specific component specs that share the same visual language: identical colors, equivalent spacing, comparable typography scales -- even though the implementation differs.
- If a feature or screen does not exist on web yet and the overhaul adds it to mobile, explicitly document it as "mobile-only" to avoid confusion, or add it to web in the same phase.
- Track progress with a matrix: rows = screens, columns = mobile/web, cells = status (not started / tokens migrated / fully overhauled).

**Warning signs:**
- Web app's `globals.css` not updated when mobile's `theme.ts` changes.
- Users reporting "the app looks different on my phone vs my computer."
- Web pages still using old color values while mobile has new ones.
- No web testing happening during "visual refresh" phases.

**Phase to address:**
Every phase that touches visual components. The screen-by-screen migration plan must have both platform columns.

---

### Pitfall 9: Hardcoded Values Scattered Across 70+ Files Resist Migration

**What goes wrong:**
The migration from old theme values to new design tokens stalls because hardcoded hex colors, magic number spacing, and inline font sizes are scattered throughout the codebase. The `theme.ts` constants are used in most components, but there are also inline values -- for example, `'#f0c040'` appears as a raw string in MatchCard (lines 36, 78), `'#e53e3e'` is hardcoded in the tab badge style, and inline numeric values like `fontSize: 10`, `marginTop: 4`, `width: 40` appear throughout. A grep shows ~1001 occurrences of color/theme references across 71 files.

**Why it happens:**
When building features under time pressure, developers use the theme constants for primary values but fall back to inline literals for one-off adjustments, edge cases, or values that do not quite match the token scale. Over 242 commits and 40K LOC, these accumulate. During the overhaul, every one of these needs to be found and migrated, or they create visual inconsistencies where some parts of a screen use the new palette and others still show old colors.

**How to avoid:**
- Before starting any visual changes, run a comprehensive audit: grep for all hex color literals, all `fontSize:` values, all `padding:`/`margin:` values not using `spacing.*`. Create a spreadsheet of every hardcoded value and which token it should map to.
- Add an ESLint rule (or a custom script) that flags raw hex colors and magic numbers in style objects. This catches new instances during the overhaul.
- Migrate hardcoded values to tokens in a dedicated "token adoption" pass per screen BEFORE doing any visual redesign. This separates "using the system" from "redesigning the visuals."
- Accept that 100% token coverage is not required. Some one-off values (like the avatar size `40x40`) are genuinely local and do not need tokens.

**Warning signs:**
- After "completing" a screen's overhaul, opening it on a device reveals old colors or sizes that were not migrated.
- Grep for old hex values (like `#1a1a2e` or `#f0c040`) still returning hits after a screen is supposedly migrated.
- Inconsistent spacing within the same screen (some elements use new tokens, others use old magic numbers).

**Phase to address:**
Phase 1 (Design System Foundation) should include the audit. Each subsequent screen phase starts with token adoption before visual redesign.

---

### Pitfall 10: Zustand Store Coupling to Component Structure Creates Hidden Breakage

**What goes wrong:**
The app has 12 Zustand stores that are deeply integrated with specific components and screen lifecycles. Restructuring components -- splitting, merging, or reorganizing them -- breaks the assumptions stores make about when and where they are consumed. For example, `useTradesStore` is consumed in the tab layout to compute `pendingProposals` for the badge count. If the trades tab is restructured (e.g., split into sub-tabs for posts vs proposals), the badge logic may not receive updates because the component that triggers fetches has moved.

**Why it happens:**
Zustand stores in this codebase serve as both data caches and implicit controller layers. Components call `fetchStatus()`, `reset()`, and other side effects on mount/unmount. When the visual overhaul restructures which components mount where, these side effects fire at different times or not at all. The coupling is invisible in the code -- stores look independent, but their behavior depends on component tree structure.

**How to avoid:**
- Before restructuring any screen, map its store dependencies: which stores are read, which actions are called on mount, what data is fetched.
- Move data-fetching side effects out of components and into a centralized initialization flow (e.g., an `AppDataProvider` that runs after auth). The current pattern of fetching in `TabLayout`'s `useEffect` is fragile.
- If splitting or merging screens, verify that all store subscriptions still receive updates. Use Zustand's `subscribe` API to test in isolation.
- Do not change component structure and store logic in the same PR. Restructure components first, verify stores still work, then iterate.

**Warning signs:**
- Badge counts (notification bell, trade tab badge) showing stale data after navigation restructuring.
- Data not loading on screens that previously worked (because the component that triggered the fetch no longer mounts at the right time).
- `useEffect` cleanup functions firing unexpectedly due to new mount/unmount patterns.
- Premium status not updating because `usePremiumStore.getState().fetchStatus()` no longer gets called.

**Phase to address:**
Pre-navigation-restructuring audit. Must map store-component coupling before touching the navigation tree.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Keeping old `theme.ts` alongside new tokens during migration | Components keep working during incremental migration | Two theme systems to maintain, risk of using wrong one | During migration only (must fully remove old system by end of overhaul) |
| Migrating mobile only, syncing web "later" | Faster mobile delivery | Web falls permanently behind, doubling visual debt | Never -- sync per-screen, not per-milestone |
| Using inline styles for "quick fixes" during overhaul | Unblocks current screen conversion | Creates new hardcoded values while migrating old ones | Never -- defeats the purpose of the overhaul |
| Skipping animation performance testing | Faster development iteration | Ship jank on low-end Android, reputation damage | Only for non-visible animations (opacity-only transitions) |
| Converting components to new design but not updating accessibility | Faster visual delivery | Accessibility regression, potential legal exposure (ADA/EAA) | Never -- check contrast and labels as part of conversion |
| Copy-pasting component styling instead of extracting shared patterns | Faster individual screen delivery | Style inconsistencies accumulate, same bug fixed in multiple places | Only for genuinely unique one-off components |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Expo Router (file-based routing) | Renaming route files without updating deep links and push notification handlers | Create a route mapping document; add redirect aliases for old paths; test all push notification actions after every route change |
| Tailwind v4 (web) | Changing `@theme` variables without verifying all utility class combinations still work | After any `@theme` change, visually scan all web pages -- Tailwind utilities are compile-time and silently render wrong colors |
| React Native StyleSheet | Using `StyleSheet.create` with dynamic values (theme switching) -- StyleSheet is static by design | For dynamic theming, use inline objects or a style-factory function. `StyleSheet.create` is for static styles only |
| expo-image / Image components | Changing image container sizes without updating `contentFit` -- images stretch or crop incorrectly | Always verify `contentFit` (cover/contain/fill) matches the new container aspect ratio after resizing |
| Ionicons (current icon library) | Swapping to a different icon library and missing icon name mappings -- icons silently render nothing | If switching icon libraries, create a migration script that maps old icon names to new ones; verify every icon renders |
| i18next (translations) | Adding new UI text during overhaul without adding translation keys | All new text strings (labels, button text, empty states) must go through `t()` from day one, even before translations exist |
| Socket.IO connection lifecycle | Navigation restructuring unmounts the component that holds the Socket.IO connection | Move Socket.IO connection to a context provider above the navigation tree, not inside a layout component |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Adding entrance animations to FlatList items | Scroll stuttering, frame drops, items "popping in" during fast scroll | Never animate FlatList item mounting. Use `LayoutAnimation` on the container at most, or skip list animations entirely | Lists with 50+ items on mid-range Android |
| Excessive re-renders from theme context | All components re-render when any theme value changes | Use Zustand for theme tokens (atomic selectors) instead of React Context, or ensure theme context value is stable (memoized) | Any theme context change triggers full-app re-render |
| Shadow/elevation overuse in new card designs | GPU overdraw on Android, visible frame drops during scroll | Limit shadows to 1-2 levels (card surface and modal). Use `borderWidth`/`borderColor` for secondary depth, not additional shadows | Scrolling lists with 20+ shadowed cards on Android |
| Shimmer/skeleton loading animations running continuously | High CPU usage when screen is idle, battery drain | Stop shimmer animation when data loads. Use `cancelAnimation` in cleanup. Do not run shimmer off-screen | Multiple skeletons visible simultaneously |
| Heavy gradient backgrounds | Paint thrashing on Android, especially with `LinearGradient` behind scrolling content | Use solid colors for backgrounds. If gradients are needed, limit to static headers, not full-screen behind scroll | Any gradient behind a FlatList |
| Custom fonts not loaded before first render | Flash of unstyled text (FOUT), layout shifts as metrics change | Use `expo-font` with `SplashScreen.preventAutoHideAsync()` to ensure fonts load before app renders | Always -- this is a day-one concern |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing internal component state in accessibility labels | Screen readers read internal data (user IDs, debug info) aloud | Audit all `accessibilityLabel` values -- they should contain user-facing text only |
| New web components missing CSRF protection on forms | Cross-site request forgery on authenticated actions | Ensure all web form submissions use the existing cookie auth with CSRF token validation |
| Adding client-side feature flags for premium UI | Users inspect/modify feature flags to bypass paywall | Premium gating must remain server-side (`isPremium` middleware). Client-side flags are for layout only, never data access |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Changing navigation structure without user communication | Users cannot find features they used daily, feel lost | If tabs change, show a one-time "What's new" walkthrough highlighting where things moved |
| Removing visual affordances for "cleaner" design | Users do not realize elements are tappable, miss interactive features | Maintain clear tap state feedback (opacity change, scale). Flat design still needs interaction cues |
| Inconsistent transition speeds across screens | App feels jittery -- some transitions snap, others float | Define 2-3 standard durations (fast: 150ms, normal: 250ms, slow: 350ms) and use them globally |
| Redesigning the home tab without preserving information density | Users previously saw matches + collection progress at a glance, now need extra taps | Audit current screen's information hierarchy. The overhaul should maintain or improve information density, not sacrifice it for aesthetics |
| Changing the gold accent color even slightly | Users associate the gold with the brand. Subtle shifts (warmer, cooler) feel "off" without being identifiable | Keep `#f0c040` as the primary gold. Add new accent colors alongside it, do not replace it |
| Modal-heavy flow becoming even more modal-heavy | Users feel trapped in modal stacks (card detail -> proposal -> confirmation -> rating) | Consider replacing some modals with full-screen pages for complex flows. Modals for quick actions only |

## "Looks Done But Isn't" Checklist

- [ ] **Design tokens:** Often missing web sync -- verify `globals.css` @theme variables match `theme.ts` values exactly
- [ ] **Component migration:** Often missing inline hardcoded values -- verify grep for old hex colors returns zero hits in migrated files
- [ ] **Navigation restructuring:** Often missing deep link testing -- verify every push notification type opens the correct screen
- [ ] **Typography:** Often missing dynamic type / font scaling support -- verify app renders correctly with system font size set to largest
- [ ] **Dark theme refinement:** Often missing state-specific colors -- verify error states, success states, disabled states, and loading states all use appropriate new tokens
- [ ] **Animations:** Often missing Android testing -- verify all animations at 60fps on a mid-range Android device, not just iOS simulator
- [ ] **Accessibility:** Often missing icon buttons -- verify every icon-only button (NotificationBell, share, filter) has an `accessibilityLabel`
- [ ] **Web companion:** Often missing responsive breakpoints -- verify web pages at mobile (375px), tablet (768px), and desktop (1280px) widths
- [ ] **Screen migration:** Often missing empty states and error states -- verify empty lists, network errors, and loading states use new design system
- [ ] **i18n integration:** Often missing new strings -- verify all text added during overhaul has translation keys, not hardcoded English

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Big-bang refactor leaves app broken | HIGH | Revert to last working commit. Adopt incremental migration. Lose all in-progress work |
| Token explosion slowing development | MEDIUM | Flatten token hierarchy. Delete unused tokens. Set a token count budget and enforce it |
| Cross-platform divergence | MEDIUM | Audit both platforms side-by-side. Create a difference report. Batch-fix web to match mobile |
| Navigation restructuring breaks deep links | LOW | Add redirect aliases. Update push notification payload handlers. One-time fix |
| Animation jank on low-end devices | LOW | Add `isReduceMotionEnabled` check. Disable animations conditionally. Can be hotfixed |
| Scope creep / never-shipping | HIGH | Hard deadline. Ship what is done. Create "polish backlog" for remaining items. Requires discipline, not code |
| Accessibility regression | MEDIUM | Run automated contrast checker. Add `accessibilityLabel` audit script. Batch-fix missing labels |
| Feature parity loss (web behind) | HIGH | Dedicated web catch-up sprint. The longer it is delayed, the more expensive it gets |
| Hardcoded values missed in migration | LOW | Grep-based audit script. Batch-replace. Mechanical work, just tedious |
| Store coupling breakage | MEDIUM | Restore old component mounting order if possible. Move side effects to centralized provider |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Big-bang refactor | Phase 1 (Foundation) | App remains functional at every PR merge. CI passes, no screen regressions |
| Token explosion | Phase 1 (Foundation) | Token file under 80 lines. New screen development does not require token lookup documentation |
| Cross-platform divergence | Phase 1 (Foundation) | Mobile and web background/surface/accent colors identical (same hex values) |
| Navigation restructuring breakage | Dedicated Navigation Phase | All push notification types tested. Back navigation correct on every screen. Socket.IO stays connected |
| Animation performance | Final Animation Phase | 60fps on reference mid-range Android device for all transitions |
| Scope creep | Every phase | Hard time-box per phase. Screen conversion tracked as done/not-done (binary, not percentage) |
| Accessibility regression | Every phase (per-screen checklist) | All color pairings pass WCAG AA (4.5:1). All interactive elements have accessibility labels. Touch targets 44pt minimum |
| Feature parity (web) | Every screen phase | Platform matrix shows both columns green for each completed screen |
| Hardcoded value migration | Phase 1 audit + every screen phase | Grep for old hex values returns zero hits in migrated files |
| Zustand store coupling | Pre-navigation audit | Badge counts, data loading, and premium status work correctly after restructuring |

## Sources

- Codebase analysis: `apps/mobile/src/constants/theme.ts` (27 tokens, flat structure), `apps/mobile/app/(tabs)/_layout.tsx` (store coupling in navigation), `apps/web/src/app/globals.css` (divergent color values), 50+ mobile components with `StyleSheet.create`, 31 web components with Tailwind
- [Common Pitfalls in React Native Custom Component Development](https://moldstud.com/articles/p-common-pitfalls-in-react-native-custom-component-development-and-how-to-avoid-them)
- [React Native UI Design Best Practices Guide 2025](https://reactnativeexample.com/react-native-ui-design-best-practices-guide-2025/)
- [10 React Native Best Practices for Flawless Apps in 2026](https://www.applighter.com/blog/react-native-best-practices)
- [Visual Regression Testing for React Native](https://rafizimraanarjunawijaya.medium.com/i-tired-of-fixing-ghost-ui-bugs-why-your-react-native-app-needs-visual-regression-testing-0c072ec0728b)
- [Design Tokens & Cross-Platform Consistency in Mobile UI](https://ititans.com/blog/cross-platform-mobile-ui-with-design-tokens/)
- [Creating a Cross-Platform Design System for React and React Native](https://bit.dev/blog/creating-a-cross-platform-design-system-for-react-and-react-native-with-bit-l7i3qgmw/)
- [Extending Design Systems to Multiple Platforms - Skyscanner](https://medium.com/@SkyscannerEng/extending-our-design-system-to-multiple-platforms-1bc3735cf3a5)
- [Stop Making These Mistakes in Your React Native App](https://dev.to/aneeqakhan/stop-making-these-mistakes-in-your-react-native-app-2gmf)

---
*Pitfalls research for: UI/UX Overhaul of Pokemon TCG Pocket Trading Platform v3.0*
*Researched: 2026-03-20*
