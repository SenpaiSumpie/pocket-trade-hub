# Roadmap: Pocket Trade Hub

## Milestones

- ✅ **v1.0 MVP** -- Phases 1-6 (shipped 2026-03-11)
- ✅ **v2.0 Full Platform** -- Phases 7-12 (shipped 2026-03-20)
- **v3.0 UI/UX Overhaul** -- Phases 13-19 (in progress)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-6) -- SHIPPED 2026-03-11</summary>

- [x] Phase 1: Foundation and Auth (2/2 plans) -- completed 2026-03-08
- [x] Phase 2: Card Database (3/3 plans) -- completed 2026-03-09
- [x] Phase 3: Collection Management (3/3 plans) -- completed 2026-03-09
- [x] Phase 4: Trade Matching Engine (2/2 plans) -- completed 2026-03-09
- [x] Phase 5: Trade Proposals and Reputation (4/4 plans) -- completed 2026-03-11
- [x] Phase 6: Premium Tier (3/3 plans) -- completed 2026-03-11

Full details: `.planning/milestones/v1.0-ROADMAP.md`

</details>

<details>
<summary>v2.0 Full Platform (Phases 7-12) -- SHIPPED 2026-03-20</summary>

- [x] Phase 7: Multi-Language Cards and OAuth (5/5 plans) -- completed 2026-03-14
- [x] Phase 8: Post-Based Trading (4/4 plans) -- completed 2026-03-15
- [x] Phase 9: Engagement Quick Wins (3/3 plans) -- completed 2026-03-15
- [x] Phase 10: Internationalization (3/3 plans) -- completed 2026-03-19
- [x] Phase 11: Intelligence (5/5 plans) -- completed 2026-03-20
- [x] Phase 12: Web App Companion (7/7 plans) -- completed 2026-03-20

Full details: `.planning/milestones/v2.0-ROADMAP.md`

</details>

### v3.0 UI/UX Overhaul (In Progress)

**Milestone Goal:** Transform the app's visual identity and user experience from functional to premium -- cohesive design system, polished component library, restructured navigation chrome, motion system, and screen-by-screen visual refresh across mobile and web.

- [x] **Phase 13: Design System Foundation** - Shared token package, semantic colors, backward-compatible shim, cross-platform sync, hardcoded value audit (completed 2026-03-21)
- [ ] **Phase 14: Navigation Shell and App Chrome** - Custom tab bar, collapsible header, Inter font, Phosphor icons, haptic tab switching
- [ ] **Phase 15: Animation Utilities and Motion System** - Reusable animation hooks, animated counters, card physics, bottom sheets, shimmer system
- [ ] **Phase 16: Screen Migration Tier 1** - Home, Cards, Trades tabs with new primitives, component library, skeleton states, empty states
- [ ] **Phase 17: Screen Migration Tier 2** - Market, Meta, Profile tabs with gradient accents and glassmorphism
- [ ] **Phase 18: Web Companion Sync** - CSS token generation, web primitives, screen-by-screen web refresh
- [ ] **Phase 19: Premium Touches and Polish** - Branded splash, grid layout modes, parallax headers, haptic patterns, reduced-motion support

## Phase Details

### Phase 13: Design System Foundation
**Goal**: Every component across both platforms draws from a single source of visual truth, with zero regressions on existing screens
**Depends on**: Phase 12 (v2.0 complete)
**Requirements**: DS-01, DS-02, DS-03, DS-04, DS-05
**Success Criteria** (what must be TRUE):
  1. A shared token package exists in `packages/shared/tokens/` exporting colors, typography, spacing, elevation, and motion curve values
  2. All color references use semantic aliases (surface, onSurface, accent, error, success, warning) rather than raw hex values
  3. Existing screens render identically after migration -- the backward-compatible theme.ts shim keeps all un-migrated components working
  4. Web CSS custom properties are generated from the same TS token source, and both platforms show identical color/spacing values
  5. A hardcoded value audit has been completed across all 71+ theme-referencing files, with a migration tracking list produced
**Plans:** 3/3 plans complete
Plans:
- [x] 13-01-PLAN.md -- Token package (primitives + semantic) and backward-compatible theme.ts shim
- [x] 13-02-PLAN.md -- CSS token generation script and web app integration
- [x] 13-03-PLAN.md -- Hardcoded value audit script and migration tracking list

### Phase 14: Navigation Shell and App Chrome
**Goal**: The app frame (tab bar, headers, icons, typography) feels custom and polished before any screen content is touched
**Depends on**: Phase 13
**Requirements**: NAV-01, NAV-02, NAV-03, NAV-04, NAV-05
**Success Criteria** (what must be TRUE):
  1. A custom animated tab bar replaces the default, with icon morphing on selection and a sliding indicator between tabs
  2. Screen headers collapse smoothly on scroll and expand when scrolling back up
  3. All text throughout the app renders in Inter font (loaded at build time via expo-font config plugin)
  4. All icons use Phosphor icon set with consistent weight, replacing all Ionicons references
  5. Tab switches produce haptic feedback on supported devices
**Plans:** 2/4 plans executed
Plans:
- [x] 14-01-PLAN.md -- Inter font setup, expo-font config plugin, typography tokens, phosphor-react-native install
- [x] 14-02-PLAN.md -- Custom animated tab bar with sliding pill indicator and haptic feedback
- [ ] 14-03-PLAN.md -- Collapsible scroll header hook and integration into 4 tab screens
- [ ] 14-04-PLAN.md -- Bulk Ionicons-to-Phosphor migration across all 50 files

### Phase 15: Animation Utilities and Motion System
**Goal**: A library of reusable, performant animation primitives is ready for screen migration -- built once, used everywhere
**Depends on**: Phase 13
**Requirements**: MOT-01, MOT-02, MOT-03, MOT-04, MOT-05
**Success Criteria** (what must be TRUE):
  1. Reusable hooks (useAnimatedPress, useStaggeredList, useScrollHeader) work in isolation and can be composed into any screen
  2. Numeric values (counts, stats, percentages) animate smoothly between old and new values using an AnimatedCounter component
  3. Card elements support flip animations and spring physics micro-interactions driven by Reanimated on the UI thread
  4. Modal-based detail views have been replaced by gesture-driven bottom sheets with drag-to-dismiss
  5. Skeleton loading placeholders use a consistent shimmer animation that matches the content layout they replace
**Plans**: TBD

### Phase 16: Screen Migration Tier 1
**Goal**: The three highest-traffic tabs (Home, Cards, Trades) are fully refreshed with new primitives, loading states, empty states, and motion -- delivering visible impact to the most users
**Depends on**: Phase 14, Phase 15
**Requirements**: SCR-01, SCR-02, SCR-03, CL-01, CL-02, CL-03, CL-04, CL-05, CL-06
**Success Criteria** (what must be TRUE):
  1. Shared primitive components (Button, Card, Text, Badge, Input, Divider) are used consistently across Home, Cards, and Trades tabs
  2. Every list and grid screen shows skeleton shimmer placeholders while loading, matching the shape of the content that will appear
  3. Every list and grid screen shows an illustrated empty state with a clear call-to-action when no data exists
  4. A toast/snackbar system displays success, error, info, and warning messages with distinct visual treatments
  5. All tappable elements respond with scale-down animation and haptic touch feedback via Animated Pressable
  6. Pull-to-refresh uses a branded gold tint animation
  7. Cards tab displays rarity-based visual effects (holographic shimmer for stars, glow for crowns)
**Plans**: TBD

### Phase 17: Screen Migration Tier 2
**Goal**: Market, Meta, and Profile tabs receive the same visual refresh treatment, completing the mobile-side overhaul
**Depends on**: Phase 16
**Requirements**: SCR-04, SCR-05, SCR-06
**Success Criteria** (what must be TRUE):
  1. Market tab uses the new primitives and design tokens, with gradient accents highlighting premium sections
  2. Meta tab deck cards and tier list views use the refreshed component library with consistent visual language
  3. Profile tab features glassmorphism backdrop effects and a redesigned settings screen using new primitives
  4. All six mobile tabs now share a unified visual language -- no screen looks like it belongs to a different app
**Plans**: TBD

### Phase 18: Web Companion Sync
**Goal**: The web companion matches the mobile app's refreshed visual identity, consuming the same design tokens
**Depends on**: Phase 13, Phase 17
**Requirements**: WEB-01, WEB-02, WEB-03
**Success Criteria** (what must be TRUE):
  1. A build script generates CSS custom properties from the shared TS token package, integrated into the Turborepo pipeline
  2. Web primitive components (Button, Input, Badge, Card, Modal, Skeleton) exist and consume tokens via CSS custom properties
  3. All web pages have been refreshed to match the mobile visual language -- same colors, spacing, typography scale, and component patterns
**Plans**: TBD

### Phase 19: Premium Touches and Polish
**Goal**: The app feels delightful and premium in every interaction, with accessibility respected for users who prefer reduced motion
**Depends on**: Phase 17
**Requirements**: POL-01, POL-02, POL-03, POL-04, POL-05
**Success Criteria** (what must be TRUE):
  1. App launch shows a branded splash animation before the main screen appears
  2. Card grid screens offer a toggle between grid, compact, and list layout modes that persists across sessions
  3. Card detail screens display a parallax scrolling header that responds to scroll position
  4. Haptic feedback patterns are contextual -- different haptic intensities for navigation, success, error, and destructive actions
  5. Users with reduced-motion accessibility settings see instant transitions instead of animations, with no loss of functionality
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 13 > 14 > 15 > 16 > 17 > 18 > 19
Note: Phases 14 and 15 both depend only on Phase 13 and could execute in either order. Phase 16 requires both 14 and 15. Phase 18 requires 13 and 17.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation and Auth | v1.0 | 2/2 | Complete | 2026-03-08 |
| 2. Card Database | v1.0 | 3/3 | Complete | 2026-03-09 |
| 3. Collection Management | v1.0 | 3/3 | Complete | 2026-03-09 |
| 4. Trade Matching Engine | v1.0 | 2/2 | Complete | 2026-03-09 |
| 5. Trade Proposals and Reputation | v1.0 | 4/4 | Complete | 2026-03-11 |
| 6. Premium Tier | v1.0 | 3/3 | Complete | 2026-03-11 |
| 7. Multi-Language Cards and OAuth | v2.0 | 5/5 | Complete | 2026-03-14 |
| 8. Post-Based Trading | v2.0 | 4/4 | Complete | 2026-03-15 |
| 9. Engagement Quick Wins | v2.0 | 3/3 | Complete | 2026-03-15 |
| 10. Internationalization | v2.0 | 3/3 | Complete | 2026-03-19 |
| 11. Intelligence | v2.0 | 5/5 | Complete | 2026-03-20 |
| 12. Web App Companion | v2.0 | 7/7 | Complete | 2026-03-20 |
| 13. Design System Foundation | v3.0 | 3/3 | Complete    | 2026-03-21 |
| 14. Navigation Shell and App Chrome | v3.0 | 2/4 | In Progress|  |
| 15. Animation Utilities and Motion System | v3.0 | 0/TBD | Not started | - |
| 16. Screen Migration Tier 1 | v3.0 | 0/TBD | Not started | - |
| 17. Screen Migration Tier 2 | v3.0 | 0/TBD | Not started | - |
| 18. Web Companion Sync | v3.0 | 0/TBD | Not started | - |
| 19. Premium Touches and Polish | v3.0 | 0/TBD | Not started | - |
