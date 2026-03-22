# Phase 17: Screen Migration Tier 2 - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Market, Meta, and Profile tabs receive the same visual refresh as Phase 16's Tier 1 screens. All three adopt the shared UI primitives (Button, Card, Text, Badge, Input, Divider, EmptyState), skeleton loading, toast feedback, staggered animations, and gold pull-to-refresh. Additionally: Market gets gradient accents on premium sections, Meta gets a refreshed deck/tier list visual language, and Profile gets glassmorphism backdrop effects plus a settings redesign. No structural or navigation changes.

</domain>

<decisions>
## Implementation Decisions

### Market Tab — Premium Gradient Accents (SCR-04)
- **D-01:** Premium-user posts get a subtle gold gradient left-border accent (3px vertical strip, linear gradient from `palette.gold[400]` to `palette.gold[600]`) on their PostCard — visible but not overwhelming
- **D-02:** The premium "boost" indicator on PostCard uses a Badge with a new `premium` variant (gold background, dark text) rather than a gradient fill on the entire card
- **D-03:** The Create Post FAB keeps its current position but adopts Button primitive styling with `primary` variant (gold fill) — no gradient on the FAB itself
- **D-04:** Market filter chips adopt Badge primitive styling, search bar adopts Input primitive focus ring
- **D-05:** PostCard migrates to Card primitive container with animated press; internal layout (image left, info right) stays the same
- **D-06:** Add MarketPostSkeleton composition (horizontal card shape with image placeholder + text lines) for loading state
- **D-07:** EmptyState for empty market with Package icon + "No posts yet" + "Create Post" CTA
- **D-08:** Gold pull-to-refresh on the FlashList, same pattern as Phase 16

### Meta Tab — Deck & Tier List Refresh (SCR-05)
- **D-09:** Deck ranking cards migrate to Card primitive; rank number stays as a circular Badge (numbered, `default` variant with bold text)
- **D-10:** Win rate and usage rate stats use Text primitive with `label` preset for the label and `body` preset for the value — no simplification of data density, preserve all stats
- **D-11:** Tier list cards migrate to Card primitive; tier preview pills (S/A/B/C/D) become Badge primitives with rarity-mapped colors: S=gold, A=purple, B=blue, C=green, D=gray
- **D-12:** Sort toggle pills at the top of both views use Button primitive with `ghost` variant for unselected and `secondary` variant for selected
- **D-13:** "Official" badge on tier lists uses Badge with `success` variant (green) + Shield icon
- **D-14:** Vote button uses Button `ghost` variant with Heart icon; voted state toggles to `primary` variant
- **D-15:** Add DeckRankingSkeleton (3 rows: circle + 2 text lines + stat boxes) and TierListSkeleton (3 rows: text + pill row + footer)
- **D-16:** EmptyState for empty rankings (Trophy icon) and empty tier lists (ListBullets icon)
- **D-17:** Preserve information density — all current data points remain visible. The refresh is visual consistency, not information reduction

### Profile Tab — Glassmorphism & Settings Redesign (SCR-06)
- **D-18:** Glassmorphism applied to the avatar/header section only — a blurred backdrop behind the avatar circle and name area using `expo-blur` BlurView with `intensity={40}` and `tint="dark"`. Not applied to every card on the page
- **D-19:** The glassmorphism header has a subtle gold gradient overlay at 8% opacity to tie it to the brand palette
- **D-20:** Below the header, all info sections (friend code, linked accounts, member since, language) use Card primitive — standard surface cards, not glass
- **D-21:** Edit Profile button uses Button `primary` variant, Logout uses Button `destructive` variant
- **D-22:** Link/Unlink account buttons use Button `secondary` variant (outline)
- **D-23:** Premium badge next to display name uses Badge `premium` variant (same gold treatment as Market)
- **D-24:** PaywallCard adopts Card primitive with a gold gradient top-border accent (similar to Market's premium border but horizontal, 2px at top)
- **D-25:** Reputation stars keep their current visual (5-point filled/half star system) — no changes to the rating display
- **D-26:** Replace ActivityIndicator loading states with inline shimmer (ShimmerText for text fields loading)
- **D-27:** Add ProfileHeaderSkeleton for the initial load (avatar circle shimmer + name text shimmer + badge shimmer)
- **D-28:** Settings are not restructured — same sections, same order, just migrated to primitives

### Shared Patterns (all three tabs)
- **D-29:** All three tabs get gold pull-to-refresh (RefreshControl tintColor="#f0c040")
- **D-30:** All three tabs get useStaggeredList for entrance animations on their list/section content
- **D-31:** Toast notifications for user actions: Market (post created/deleted), Meta (vote cast, tier list created), Profile (profile updated, account linked/unlinked)
- **D-32:** All modals that are currently plain Modal components stay as-is for now (DetailSheet migration is not in scope for this phase)

### Claude's Discretion
- Exact skeleton item counts and dimensions
- Toast message copy for each action
- EmptyState subtitle copy and icon weights
- Staggered animation item grouping
- Whether to extract PostCard into its own component file or keep inline
- Glassmorphism blur intensity fine-tuning
- Gradient color stops and opacity values

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Screen Migration Requirements
- `.planning/REQUIREMENTS.md` §Screen Migration — SCR-04, SCR-05, SCR-06 define Market, Meta, Profile tab refresh
- `.planning/ROADMAP.md` §Phase 17 — Success criteria with 4 verification points

### Phase 16 Primitives (built and available)
- `apps/mobile/src/components/ui/Button.tsx` — 4 variants (primary/secondary/ghost/destructive), 3 sizes, animated press
- `apps/mobile/src/components/ui/Card.tsx` — Surface container with optional animated press on onPress
- `apps/mobile/src/components/ui/Text.tsx` — Typography presets (heading/subheading/body/caption/label)
- `apps/mobile/src/components/ui/Badge.tsx` — 7 variants (default/success/warning/error/diamond/star/crown)
- `apps/mobile/src/components/ui/Input.tsx` — TextInput with gold focus ring
- `apps/mobile/src/components/ui/Divider.tsx` — Hairline horizontal rule
- `apps/mobile/src/components/ui/EmptyState.tsx` — Icon + title + subtitle + CTA
- `apps/mobile/src/components/ui/ToastOverlay.tsx` — Animated toast with 4 variants
- `apps/mobile/src/stores/toast.ts` — Zustand toast store
- `apps/mobile/src/hooks/useToast.ts` — Toast convenience hook

### Phase 16 Skeleton Compositions (reference patterns)
- `apps/mobile/src/components/skeleton/CardGridSkeleton.tsx` — 9-card grid skeleton
- `apps/mobile/src/components/skeleton/PostListSkeleton.tsx` — 3-row list skeleton
- `apps/mobile/src/components/skeleton/ProposalListSkeleton.tsx` — 3-row list with card preview skeleton

### Animation Infrastructure (Phase 15)
- `apps/mobile/src/hooks/useAnimatedPress.ts` — Scale 0.97 + haptic
- `apps/mobile/src/hooks/useStaggeredList.ts` — Staggered fade-in
- `apps/mobile/src/hooks/useShimmer.ts` — Shimmer sweep driver
- `apps/mobile/src/components/animation/Shimmer.tsx` — SVG gradient shimmer wrapper
- `apps/mobile/src/components/animation/ShimmerBox.tsx` — Rectangular skeleton
- `apps/mobile/src/components/animation/ShimmerText.tsx` — Text line skeleton
- `apps/mobile/src/components/animation/ShimmerCircle.tsx` — Circular skeleton

### Design Tokens (Phase 13)
- `packages/shared/src/tokens/` — Color, typography, spacing, elevation, motion tokens
- `apps/mobile/src/constants/theme.ts` — Backward-compatible shim

### Current Screen Implementations (migration targets)
- `apps/mobile/app/(tabs)/market.tsx` — Market tab: FlashList, MarketFilters, PostCard, FAB, pagination
- `apps/mobile/app/(tabs)/meta.tsx` — Meta tab: DeckRankingList, TierListBrowser, sort toggles, FAB
- `apps/mobile/app/(tabs)/profile.tsx` — Profile tab: ScrollView, avatar, reputation, linked accounts, settings
- `apps/mobile/src/components/market/` — MarketFilters.tsx, PostCard.tsx, PostDetailModal.tsx, PostCreationModal.tsx
- `apps/mobile/src/components/meta/` — DeckRankingList.tsx, TierListBrowser.tsx, TierListCard.tsx, DeckDetailModal.tsx

### Prior Phase Context
- `.planning/phases/16-screen-migration-tier-1/16-CONTEXT.md` — Phase 16 decisions (same migration playbook)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- All Phase 16 UI primitives — direct imports from `@/components/ui`
- Phase 16 skeleton compositions — reference patterns for new skeletons
- `useAnimatedPress`, `useStaggeredList`, `useShimmer` — same hooks, same usage
- `useToast` hook — ready for Market/Meta/Profile action feedback
- `useCollapsibleHeader` — already integrated in Market and Meta tabs
- `RefreshControl` gold pattern — copy from Phase 16 tabs

### Established Patterns
- Card primitive adoption: wrap container View → Card, add onPress for press feedback
- Text primitive adoption: replace `<Text style={styles.title}>` → `<Text variant="heading">`
- Badge adoption: replace manual pill styling → Badge with appropriate variant
- Skeleton composition: compose ShimmerBox/Text/Circle inside Shimmer wrapper
- EmptyState: icon + title + subtitle + optional CTA button

### Integration Points
- 3 tab screen files (market.tsx, meta.tsx, profile.tsx) — primary migration targets
- ~6 component files (MarketFilters, PostCard, DeckRankingList, TierListBrowser, TierListCard, DeckDetailModal)
- Badge component needs a new `premium` variant (gold background) for Market/Profile
- Profile tab needs `expo-blur` dependency for glassmorphism (check if already installed)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — all gray areas deferred to Claude's discretion for standard, polished approaches.

</specifics>

<deferred>
## Deferred Ideas

- Modal → DetailSheet migration for Market/Meta modals — separate polish phase or future work
- Profile tab restructuring (reordering sections, adding new settings) — out of scope, visual refresh only

</deferred>

---

*Phase: 17-screen-migration-tier-2*
*Context gathered: 2026-03-21*
