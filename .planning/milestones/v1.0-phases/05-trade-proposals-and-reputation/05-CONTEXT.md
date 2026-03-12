# Phase 5: Trade Proposals and Reputation - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can negotiate specific trades through a proposal workflow (create, counter-offer, accept/reject, complete), evaluate trade fairness, rate trade partners after completion, and stay informed via a persistent in-app notification inbox with push notifications. Proposals start from existing matches only — freeform proposals to arbitrary users are out of scope. Premium features and analytics are Phase 6.

</domain>

<decisions>
## Implementation Decisions

### Proposal creation flow
- Proposals start from matches only — tap "Propose Trade" on a MatchDetailModal
- Pre-filled with matched card pairs from the match
- User can add and remove cards before sending (add from own collection / partner's wanted list)
- Fairness meter bar displayed live as cards are added/removed
- Fairness meter is advisory only — warns on unfair proposals but does not block sending
- Fairness meter shows horizontal bar from "Unfair" to "Fair" to "Great" based on rarity/demand balance

### Counter-offer mechanics
- Receiver sees Accept / Reject / Counter buttons on incoming proposals
- Counter opens the proposal editor pre-filled with original cards — user adjusts and resends
- Original proposal marked as "countered" with thread history visible
- Unlimited counter-offer rounds — negotiate until agreement or rejection
- Counter-offer creates a linked proposal in the thread (not a new standalone proposal)

### Trade completion
- After acceptance, either party can tap "Mark as Completed" to finalize (one confirmation sufficient)
- Accepted proposal shows partner's friend code prominently with tap-to-copy for in-game trading
- Friend code display is the bridge between the app and Pokemon TCG Pocket

### Notification inbox
- Bell icon in top-right of app header with unread badge count, accessible from any tab
- Tapping bell opens full-screen notification inbox
- All event types persisted: trade proposals, trade matches, completions/ratings, system announcements
- Tapping a notification deep-links to the relevant content (proposal detail, match detail, etc.)
- Notification marked as read on tap
- "Mark all as read" button at top of inbox
- Old notifications auto-archive after 30 days
- Push notifications for new proposals and proposal responses (accepted/rejected/countered)

### Rating & reputation
- 5-star rating scale (1-5 stars)
- Rating modal appears immediately after tapping "Mark as Completed" — skippable
- Stars only, no text comments (avoids moderation burden)
- Average rating and trade count displayed on: user profiles, match cards, and proposal views
- Rating is one-per-trade-per-user (each party rates independently)

### Claude's Discretion
- Proposal list UI layout within Trades tab (sub-tab vs combined list vs separate screen)
- Fairness algorithm specifics (rarity weights, demand scoring)
- Notification inbox empty state design
- Toast notification style for proposal events (extend existing match toast pattern)
- Animation/transitions for proposal editor modal
- Error handling for edge cases (proposing on stale match, race conditions)
- Database schema details (tables, indexes, constraints)
- How to handle proposals when underlying collection changes

</decisions>

<specifics>
## Specific Ideas

- Proposal editor should feel like a natural extension of the MatchDetailModal — same cards, same layout, just editable
- Friend code prominence after acceptance is critical — this is the moment users leave the app to trade in-game, make it frictionless
- Counter-offer thread should read like a conversation — chronological history of proposals and counters
- Bell icon notification pattern is familiar from most mobile apps — users know what it means
- Rating prompt right after completion captures honest feedback while the experience is fresh

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `MatchDetailModal.tsx`: "Propose Trade" button placeholder ready to wire — partner header, card pair layout, star rating all reusable
- `MatchCard.tsx`: Partner avatar, card thumbnails, star display — extend for proposal cards
- `useMatchSocket.ts`: Socket.IO real-time events — extend with proposal events (new-proposal, proposal-accepted, etc.)
- `notification.service.ts`: Push notification infrastructure with Expo Push SDK, chunked sending, stale token cleanup
- `trades.ts` Zustand store: Match state pattern — create proposals store following same structure
- `useApi.ts` / `apiFetch()`: Authenticated API calls with token refresh — use for proposal endpoints
- `CardThumbnail.tsx`: Card image rendering with overlays — reuse in proposal card selection
- Toast notification config in `_layout.tsx`: Custom toast types — add proposalNotification type
- Theme system: Dark theme with gold accent (#f0c040), typography, spacing constants

### Established Patterns
- Zustand store per domain with reset() on logout
- Service layer: routes validate with Zod, call service, return response
- Drizzle ORM with PostgreSQL (indexes on frequently-queried fields, unique constraints)
- Optimistic updates with revert-on-error
- Socket.IO transports ['polling', 'websocket'] for mobile compatibility
- Shared schemas in packages/shared for API/mobile type sharing
- BullMQ for background job processing with jobId deduplication

### Integration Points
- MatchDetailModal "Propose Trade" button → opens ProposalCreationModal
- partnerTradeCount (currently 0 placeholder) → wire to reputation system
- Trades tab → add proposals alongside matches
- App header (_layout.tsx) → add bell icon with badge
- Socket.IO server → emit proposal lifecycle events
- Push notification service → extend for proposal notifications
- User profile screen → display average rating and trade count

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-trade-proposals-and-reputation*
*Context gathered: 2026-03-09*
