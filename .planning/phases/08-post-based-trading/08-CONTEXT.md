# Phase 8: Post-Based Trading - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can create Offering and Seeking trade posts and get matched with complementary traders. Posts REPLACE the existing automatic collection/wanted-list matching as the primary trading mechanism. Collection and wanted lists remain for tracking inventory and feeding post creation, but matching only happens through posts. Proposals can be sent directly from any post without requiring a match record.

</domain>

<decisions>
## Implementation Decisions

### Post Structure
- Separate post types: Offering posts and Seeking posts (distinct, not combined)
- Card data only — no free-text descriptions (aligns with structured-proposals philosophy, no moderation needed)
- Posts auto-populate from collection (Offering) and wanted list (Seeking) — user selects which cards to post
- Card language included per TRAD-06 (leverages Phase 7 per-card language tracking)

### Architecture: Posts Replace Auto-Matching
- Posts become THE trading mechanism — existing match engine is retired
- Collection + wanted lists remain for inventory tracking and feeding post creation
- Complementary matching runs as a BullMQ background job after post creation (existing pattern)
- Proposals can be sent directly from any post — no match record required as gatekeeper

### Navigation & Discovery
- New "Market" bottom tab for browsing ALL posts (marketplace/discovery)
- Trades tab becomes: My Posts + Proposals (manage your trading activity)
- Marketplace uses filtered feed with filter chips (reuses FilterChips, SearchBar, SetPicker patterns)
- All four filters: post type (Offering/Seeking), card set & rarity, card language, card name search
- Posts matching user's wanted/collection list get a visual highlight indicator for relevance

### Post Lifecycle
- Posts stay active until manually closed or auto-closed by trade completion — no expiry timer
- Auto-close: when a trade completes and cards change hands, affected Offering/Seeking posts auto-close
- Free/Premium post limits: free users get a limited number of active posts, premium users get unlimited

### Notifications
- Complementary post match: "Someone posted a card you're seeking!" / "Someone is seeking a card you're offering!"
- Proposal on your post: uses existing proposal notification infra
- Post closed/fulfilled: "Your post was auto-closed because the card was traded"
- Proactive: new Offering posts for cards on your wanted list trigger notification (even without a Seeking post)

### Claude's Discretion
- Number of cards per post (single vs multi-card)
- Free tier post limit number (e.g., 10-20 active posts)
- Post card display layout and visual design
- Match highlight visual indicator style
- Marketplace sort options and default ordering
- Post creation flow UX details
- How to handle the migration/retirement of the old match engine code

</decisions>

<specifics>
## Specific Ideas

- PokeHub's #1 complaint is language mismatches — posts include card language to solve this (TRAD-06)
- "No chat" philosophy continues — posts are structured card data, proposals are structured offers
- Premium tier integration: post limits create monetization incentive (RevenueCat already handles subscriptions)
- Proactive notifications for wanted cards even without Seeking posts — reduces friction for casual users

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `FilterChips`, `SearchBar`, `SetPicker` components: reuse for marketplace browse UI
- `ProposalCard`, `ProposalDetailModal`, `ProposalCreationModal`: proposal UI stays largely intact
- `useProposals` hook: proposal CRUD operations reusable (needs matchId requirement relaxed)
- `useMatchSocket` hook: Socket.IO event handling pattern — extend for post events
- `BullMQ` job pattern: existing match recomputation job as template for post matching job
- `notification.service.ts`: push + in-app notification infra ready to extend with post types
- Card detail components: `CardThumbnail`, `CardGrid` for post card display

### Established Patterns
- Service + Route separation: `apps/api/src/services/` + `apps/api/src/routes/`
- Shared Zod schemas in `packages/shared/src/schemas/`
- Zustand per-domain stores: add posts store alongside trades store
- Optimistic updates with rollback for mutations
- Cursor-based pagination for lists
- Bidirectional data storage pattern (from match engine — may inform post matching)
- Transaction-based trade completion with conflict detection

### Integration Points
- `tradeMatches` table: will be retired/deprecated — posts table replaces it
- `tradeProposals` table: `matchId` column needs to become optional or reference post instead
- Bottom tab navigator: add Market tab, restructure Trades tab segments
- `trades.ts` store: refactor — remove match state, add post state
- `useMatches` hook: retire, replace with `usePosts` hook
- Premium check: extend `isPremium` checks for post limits
- Trade completion logic: extend to auto-close affected posts

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 08-post-based-trading*
*Context gathered: 2026-03-15*
