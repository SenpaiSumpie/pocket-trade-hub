# Phase 3: Collection Management - Context

**Gathered:** 2026-03-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can track which cards they own (with quantities) and which cards they want (with priority levels). Includes per-set bulk-add checklist, collection completion tracking, and a summary on the Home tab. Trade matching and trade proposals are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Collection entry point
- Lives inside the Cards tab as a segmented control: Browse | My Collection | Wanted
- Reuses existing card grid, set picker, and search components
- No new tab — keeps the 4-tab navigation (Home, Cards, Trades, Profile)

### Collection view behavior
- Show all cards in a set — owned cards full color with quantity badge, unowned cards dimmed/greyed out
- Quantity badge: small gold circle in top-right corner of card thumbnail, only shows for qty > 1
- Set picker chips show progress bars with count (e.g., "42/286") and completion percentage

### Adding cards to collection
- Long-press card thumbnail to quick-add (adds x1, increments on repeated long-press)
- Brief haptic feedback + toast on quick-add
- Tap card opens detail modal for full quantity control
- Card detail modal is context-aware: shows different actions per mode
  - Browse: "Add to Collection" + "Add to Wanted"
  - My Collection: quantity stepper (+/-) + "Remove from Collection" + "Add to Wanted"
  - Wanted: priority picker (High/Medium/Low) + "Remove from Wanted" + "Add to Collection"

### Bulk-add checklist
- "Checklist Mode" toggle button in My Collection view
- In checklist mode: checkbox overlay on each card thumbnail, tap to check/uncheck
- Already-owned cards are pre-checked — uncheck to remove, check to add
- Checklist sets quantity to 1 (use detail modal or long-press for quantities > 1)
- "Select All" / "Deselect All" toggle at the top
- Cancel and Save buttons — Save applies the diff (additions and removals)

### Collection completion
- Per-set: progress bar inside set picker chips with "X/Y" count
- Overall: collection summary card on Home tab showing total unique cards, overall completion %, and sets in progress

### Wanted list
- Default priority: Medium (set automatically on add, changeable in detail view)
- Color-coded priority badges on card thumbnails: red (High), gold (Medium), grey (Low)
- Sort by priority (High > Medium > Low), with optional set filter
- Reuses set picker component for filtering
- Cards can exist in both collection AND wanted list simultaneously (user wants more copies)

### Claude's Discretion
- Loading states and optimistic update patterns
- Empty states for collection and wanted list
- API pagination for large collections
- Exact animation/transition for checklist mode toggle
- Error handling for failed bulk operations
- Whether to show a confirmation dialog when removing cards

</decisions>

<specifics>
## Specific Ideas

- Collection view should feel like a "card binder" — see all cards in a set, with gaps visible for cards you don't own yet
- Long-press quick-add makes it fast to build your collection while browsing
- Checklist mode is the power-user feature for initial collection setup — check everything you own in one batch
- Home tab summary card is motivational — shows progress at a glance when opening the app
- Priority badges use the app's established color language (gold accent for medium/default)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CardGrid.tsx` (FlashList, 3-column): reuse for collection/wanted views with overlay modifications
- `CardThumbnail.tsx`: extend with quantity badge and priority badge variants
- `CardDetailModal.tsx`: already has placeholder "Add to Collection" and "Add to Wanted" buttons — wire them up with context-aware actions
- `SetPicker.tsx`: extend chips to show progress bars and completion counts
- `SearchBar.tsx` + `FilterChips.tsx`: reuse in collection/wanted views
- `useApi` hook + `apiFetch`: authenticated API calls with token refresh
- Zustand store pattern (auth.ts, cards.ts): create collection.ts store following same pattern

### Established Patterns
- Drizzle ORM with PostgreSQL for DB tables (cards, sets pattern)
- Service layer: routes validate with Zod, call service, return response
- Shared schemas in `packages/shared/src/schemas/` for API/mobile type sharing
- Expo Router file-based routing for new screens
- Dark theme with gold accent (#f0c040)
- FlashList with estimatedItemSize for performant grids

### Integration Points
- Cards tab (`app/(tabs)/cards.tsx`): add segmented control for Browse/Collection/Wanted
- Card detail route (`app/card/[id].tsx`): wire action buttons based on context
- Home tab (`app/(tabs)/index.tsx`): add collection summary card
- API routes (`apps/api/src/routes/`): add collection and wanted endpoints
- DB schema (`apps/api/src/db/schema.ts`): add userCollectionItems and userWantedCards tables
- Shared schemas (`packages/shared/src/schemas/`): add collection/wanted Zod schemas

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-collection-management*
*Context gathered: 2026-03-08*
