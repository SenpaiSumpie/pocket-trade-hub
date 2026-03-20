# Phase 11: Intelligence - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

AI-powered trade suggestions for premium users, competitive deck meta browsing with scraped data, and a tier list system (curated + user-created). Trade suggestions appear on the Home tab; deck meta and tier lists live in a new "Meta" tab.

</domain>

<decisions>
## Implementation Decisions

### AI Trade Suggestions
- Rule-based heuristics, not LLM-powered — uses existing data signals: wanted list gaps, demand trends (from analytics service), fairness scores, available trader count, rarity tier matching
- Reasoning text is template-generated from data signals (e.g., "Pikachu EX demand up 32% this week. 4 traders are offering it.")
- Each suggestion shows a card pair: "Give: [Card A] → Get: [Card B]" with 1-2 sentence reasoning
- 3-5 suggestions shown at a time
- Computed on app open via BullMQ job, cached in Redis for the session
- Refreshed on pull-to-refresh or next app open
- Premium-only feature (TRAD-07, INTL-01)

### Deck Meta Display
- Data scraped from ptcgpocket.gg (or similar: Limitless TCG) via periodic cron job (daily/weekly)
- Full breakdown per deck: name, win rate, usage rate, trend, full card list with quantities, matchup data (good/bad against), tournament placement
- Default sort by win rate descending; user can toggle to usage rate or trending
- Free/premium split: everyone sees deck names + win rate + usage + top 3 cards; premium unlocks full card lists, matchup breakdown, win rate trends, tournament results

### Tier List System
- Curated + user-created tier lists (covers INTL-03 and INTL-04)
- One official tier list auto-generated from meta data, updated weekly
- Users create tier lists via drag-and-drop: pick decks, drag into S/A/B/C/D tier rows, add title + optional description
- User-created tier lists are public by default, browsable by all users
- Likes/upvotes on community tier lists (no comments — avoids moderation)
- Community lists sortable by most liked
- Users can delete their own lists

### Navigation & Placement
- New "Meta" tab added (6th tab): Houses deck rankings and tier lists
- Meta tab has top tabs/segmented control: "Rankings" | "Tier Lists"
- AI trade suggestions live on the Home tab as horizontally scrollable cards in a "Smart Trades" section
- Free users see blurred preview of suggestions with "Unlock Smart Trades" upgrade CTA
- Free users see deck meta summaries; premium details are blurred with premium badge

### Claude's Discretion
- Scraping implementation details (cheerio, puppeteer, or API if available)
- Drag-and-drop library choice for tier list creation on React Native
- Redis caching strategy for suggestions (TTL, invalidation)
- BullMQ job scheduling for meta data scraping frequency
- Exact template strings for suggestion reasoning
- How to handle missing/stale meta data gracefully

</decisions>

<specifics>
## Specific Ideas

- Suggestion format mirrors the existing trade proposal UX — "Give X, Get Y" with reasoning underneath
- Blurred premium teasers are a proven conversion pattern — show value before asking to pay
- Official tier list auto-generated from meta data keeps it always fresh without admin effort
- Community tier lists with upvotes create engagement and content without moderation overhead
- The "Meta" tab name is short and immediately clear to Pokemon TCG players

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/api/src/services/analytics.service.ts`: Already computes most-wanted, least-available, trending — extend for suggestion signals
- `apps/api/src/services/match.service.ts`: Rarity-based fairness scoring (diamond1=1 to crown=100) — reuse for suggestion fairness
- `apps/api/src/jobs/match-worker.ts`: BullMQ worker pattern — model for suggestion computation job
- `apps/mobile/src/stores/premium.ts`: Premium gating store — reuse for suggestion/meta access control
- `apps/mobile/src/components/premium/PaywallCard.tsx`: Paywall UI — reuse for blurred premium teasers

### Established Patterns
- Zustand per-domain stores: suggestions, meta, and tier lists likely get their own stores
- BullMQ for background jobs: suggestion computation and meta scraping follow existing pattern
- Redis caching: existing pattern for match results — extend for suggestions
- Service + route separation: new services (suggest.service, meta.service, tierlist.service) + routes
- RevenueCat premium checks: existing `isPremium` gating pattern

### Integration Points
- Home tab (`apps/mobile/app/(tabs)/index.tsx`): Add Smart Trades horizontal scroll section
- Tab layout (`apps/mobile/app/(tabs)/_layout.tsx`): Add 6th "Meta" tab
- DB schema (`apps/api/src/db/schema.ts`): New tables for decks, tier lists, tier list votes, suggestions
- BullMQ job registration (`apps/api/src/server.ts`): Register suggestion and meta scrape workers
- i18n locale files: Add translation keys for all new UI strings (10 languages)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 11-intelligence*
*Context gathered: 2026-03-19*
