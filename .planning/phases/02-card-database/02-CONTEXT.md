# Phase 2: Card Database - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete Pokemon TCG Pocket card catalog with browse-by-set, search across all sets, card detail view, and admin JSON import with push notifications. Collection management (inventory, wanted list) and trading are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Card browsing layout
- Card image grid, 3 cards per row
- Horizontal scrollable set picker at top to switch between sets
- Each card thumbnail shows: name, rarity (in-game symbols), and type icon
- Rarity uses Pokemon TCG Pocket's authentic symbol system: diamonds (1-4), stars (1-3), crown

### Search experience
- Persistent search bar above the set picker on the Cards tab
- Live search — results update as user types
- Search is global across all sets (ignores set picker selection)
- Filter chips below search bar for Set, Rarity, and Type — tap to open picker
- Active filters shown as dismissible chips
- Search results displayed as flat grid with small set badge on each card

### Card detail view
- Full-screen modal when tapping a card
- Large card image with all stats below: name, set, rarity (in-game symbols), type, HP, attacks with damage/energy cost, weakness, resistance, retreat cost, card number in set (e.g. "042/286")
- Swipe left/right to navigate between cards in the set
- Placeholder "Add to Collection" and "Add to Wanted" buttons — visible but disabled with "Coming in next update" text

### Card data source & import
- Ship with pre-built JSON seed file for all existing sets
- Admin API route (POST /admin/cards/import) protected by admin role check
- Each card in JSON includes imageUrl pointing to externally hosted card images (no self-hosted image storage)
- Automatic push notification to all users when a new set is imported: "New Set Available! [Set Name] — [X] new cards added"
- Research phase should identify best data source for Pokemon TCG Pocket card data

### Claude's Discretion
- Loading skeletons and placeholder states while card images load
- Image caching strategy for card thumbnails
- Exact JSON schema for card import (fields, validation rules)
- Admin role implementation (simple flag on user vs separate admin table)
- Push notification service choice (Expo Push, FCM, etc.)
- Database schema for cards and sets tables
- API pagination strategy for large sets
- Error states (network failure, missing images, empty search results)

</decisions>

<specifics>
## Specific Ideas

- Card grid should feel like browsing a real card binder — visual-first, card art is the star
- In-game rarity symbols (diamonds, stars, crown) keep the experience authentic to Pokemon TCG Pocket
- Set picker inspired by horizontal chip/tab patterns — quick switching without leaving the page
- Detail view is immersive — large card image for admiring art, swipe to browse like flipping through cards
- Placeholder action buttons ("Add to Collection", "Add to Wanted") set user expectations for Phase 3

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- Theme system (colors, typography, spacing, borderRadius) in `apps/mobile/src/constants/theme.ts` — dark theme with gold accent established
- Cards tab placeholder (`apps/mobile/app/(tabs)/cards.tsx`) — ready to be replaced with real content
- `useApi` hook (`apps/mobile/src/hooks/useApi.ts`) — for API calls to card endpoints
- Auth store (`apps/mobile/src/stores/auth.ts`) — for admin role checks
- Shared schemas (`packages/shared/src/schemas/`) — pattern for shared Zod validation between API and mobile

### Established Patterns
- Expo Router file-based routing — card detail would be `app/card/[id].tsx`
- Drizzle ORM with PostgreSQL — cards/sets tables follow existing schema pattern
- Service layer: routes validate with Zod, call service, return response
- Fastify plugin pattern for route registration (`apps/api/src/routes/`)
- Ionicons for icons (already used in cards placeholder)

### Integration Points
- Cards tab in bottom navigation — this phase replaces the placeholder
- API server at `apps/api/` — new routes for cards, sets, search, admin import
- Shared package — card schemas shared between API validation and mobile types
- Push notifications — new infrastructure (not yet in codebase)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-card-database*
*Context gathered: 2026-03-07*
