# Phase 15: Animation Utilities and Motion System - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

A library of reusable, performant animation primitives ready for screen migration in Phases 16-19. Includes animation hooks (press, stagger, counter), card physics (flip, tilt, spring), gesture-driven bottom sheets replacing detail-view modals, and a shimmer skeleton system. Built on Reanimated 4 exclusively, consuming motion tokens from the shared token package.

</domain>

<decisions>
## Implementation Decisions

### Bottom Sheet Migration
- **D-01:** Convert 6 detail/browse modals to gesture-driven bottom sheets: CardDetailModal, PostDetailModal, DeckDetailModal, MatchDetailModal, MyPostDetailModal, ProposalDetailModal
- **D-02:** Creation modals (PostCreationModal, ProposalCreationModal) and small dialogs (RatingModal, AddToCollectionModal, LinkAccountModal) stay as React Native `<Modal>` — forms benefit from full-screen focus
- **D-03:** Bottom sheets use @gorhom/bottom-sheet v5 with two snap points: ~60% height (peek) and near-full-screen (expanded). Standard pattern (Apple Maps, Uber)
- **D-04:** Dark semi-transparent overlay backdrop (no blur — avoids expo-blur dependency and Android perf concerns)
- **D-05:** Dismiss via drag-down past threshold OR tap backdrop area — both supported

### Animation Hooks
- **D-06:** useAnimatedPress: subtle scale to ~0.97 with fast spring, springs back on release. iOS native feel. Used on cards, buttons, list items
- **D-07:** useStaggeredList: fade in + translate up 10-15px, staggered 50ms per item. Clean modern cascade (Linear, Notion style)
- **D-08:** Stagger animations play on first mount only — returning to a tab shows content instantly, no repeated animations
- **D-09:** AnimatedCounter: slide-up digit transition (old slides up and fades out, new slides up from below). Odometer style for stats, counts, percentages

### Card Physics & Micro-interactions
- **D-10:** 3D Y-axis card flip using Reanimated + perspective transform. Classic TCG card-flipping feel
- **D-11:** Card flip used in detail view only (opening card detail or toggling art/stats) — not in grid thumbnails
- **D-12:** Subtle tilt on press: card tilts 2-3 degrees toward touch point on press-in, springs back on release. Premium physical feel
- **D-13:** Gentle spring overshoot on card appear: scale 0.95 to 1.0 with slight overshoot to 1.02 then settle. Combined with stagger for lively cascade

### Shimmer System
- **D-14:** Linear sweep shimmer: bright gradient band sweeps left-to-right across dark placeholder shapes (Facebook/YouTube/Linear pattern)
- **D-15:** Content-matched skeletons: each skeleton mirrors real content shape (card rectangles, row bars) for smooth perceived loading transition
- **D-16:** Subtle dark gradient palette: base at surface color (~#1a1a2e), sweep highlight slightly lighter (~#252540). No gold accent in shimmer
- **D-17:** Build shimmer primitives only this phase (ShimmerBox, ShimmerCircle, ShimmerText + Shimmer wrapper). Screen-specific skeleton compositions assembled in Phases 16/17

### Claude's Discretion
- Exact spring config values for all animations (damping, stiffness, mass)
- Bottom sheet snap point exact percentages
- Tilt angle calculation from touch point position
- AnimatedCounter digit height and timing
- Shimmer gradient width and animation duration
- Whether to create a shared AnimatedCard component or keep flip/tilt as composable hooks

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Motion Requirements
- `.planning/REQUIREMENTS.md` §Motion — MOT-01 through MOT-05 define hooks, counter, card physics, bottom sheets, shimmer
- `.planning/ROADMAP.md` §Phase 15 — Success criteria with 5 verification points

### Motion Token Infrastructure (Phase 13)
- `packages/shared/src/tokens/motion.ts` — Easing curves (standard, accelerate, decelerate, spring) and durations (instant, fast, normal, slow, glacial)

### Existing Reanimated Patterns (Phase 14)
- `apps/mobile/src/hooks/useCollapsibleHeader.ts` — Established Reanimated hook pattern with useAnimatedScrollHandler + spring physics
- `apps/mobile/src/components/navigation/CustomTabBar.tsx` — Reanimated withSpring usage, animation config values

### Modal Components to Migrate
- `apps/mobile/src/components/cards/CardDetailModal.tsx` — Largest modal (~650 lines), uses React Native Modal + ScrollView
- `apps/mobile/src/components/market/PostDetailModal.tsx` — Detail view modal pattern
- `apps/mobile/src/components/meta/DeckDetailModal.tsx` — Detail view modal pattern
- `apps/mobile/src/components/trades/MatchDetailModal.tsx` — Detail view modal pattern
- `apps/mobile/src/components/trades/MyPostDetailModal.tsx` — Detail view modal pattern
- `apps/mobile/src/components/trades/ProposalDetailModal.tsx` — Detail view modal pattern

### Prior Decisions
- `.planning/phases/13-design-system-foundation/13-CONTEXT.md` — D-07: motion tokens, D-14: token package exports raw values
- `.planning/STATE.md` §Accumulated Context — Reanimated 4 exclusively, @gorhom/bottom-sheet v5

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useCollapsibleHeader.ts`: Reanimated hook with useAnimatedScrollHandler, useSharedValue, withSpring, cancelAnimation — pattern template for new hooks
- `CustomTabBar.tsx`: withSpring animation with `useAnimatedStyle` — established animation config pattern
- `expo-haptics`: Already installed, used in tab bar — available for press feedback in useAnimatedPress
- `packages/shared/src/tokens/motion.ts`: Easing curves and duration values ready to consume

### Established Patterns
- Reanimated hooks export shared values + animated styles — new hooks follow same convention
- `StyleSheet.create` with token imports — animation components follow existing styling pattern
- Zustand stores for state management — no new state patterns needed for animations

### Integration Points
- 6 detail modal components need `<Modal>` replaced with bottom sheet wrapper
- All tappable components (cards, buttons, list items) are candidates for useAnimatedPress in Phases 16/17
- List/grid screens will wrap items with useStaggeredList in Phases 16/17
- AnimatedCounter used wherever numeric stats display (collection counts, match counts, deck stats)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for spring configs, shimmer implementation, and bottom sheet integration.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 15-animation-utilities-and-motion-system*
*Context gathered: 2026-03-21*
