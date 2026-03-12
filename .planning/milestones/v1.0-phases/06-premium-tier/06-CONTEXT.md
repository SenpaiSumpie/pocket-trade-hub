# Phase 6: Premium Tier - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can subscribe to a premium tier ($5/month) via in-app purchase that provides card demand analytics, priority placement in match results, and advanced alerts when someone adds a wanted card to their collection. RevenueCat handles IAP billing. Free users see soft upsell prompts for locked premium features.

</domain>

<decisions>
## Implementation Decisions

### Paywall & subscription flow
- Premium section lives in Profile tab with "Go Premium" card showing features and price
- Soft upsells: locked premium features show lock icon + "Premium" label; tapping opens paywall
- No aggressive pop-ups or interruptions — users discover premium organically
- After subscribing: Profile premium section shows subscription status, manage/cancel link, and quick links to premium features (Analytics, Alert settings)
- RevenueCat SDK for IAP compliance on both iOS and Android (avoids App Store policy risk)

### Premium badge
- Gold crown icon next to premium users' display names on profiles and match cards
- Uses existing gold accent (#f0c040) for brand consistency
- Badge visible to other users viewing match cards — signals trust and serves as passive advertising

### Analytics dashboard
- Dedicated full-screen accessible from Home tab summary card + Profile premium quick link
- Free users see a locked card on Home tab with soft upsell
- Four data sections:
  1. **Most Wanted Cards** — Top 10 cards most users have on wanted lists, with demand count
  2. **Least Available Cards** — Top 10 cards fewest users have in collections, showing scarcity
  3. **Trending Cards** — Cards with biggest increase in wanted-list additions over past 7 days
  4. **Your Trade Power** — Personalized: cards in user's collection that are highly wanted by others
- Visual style: card lists with thumbnails, names, rarity, and stat numbers (no charts)
- Data refreshed daily via BullMQ background job (pre-computed, fast reads)

### Priority placement
- Premium users get a moderate score boost (~20-30% multiplier) on match ranking
- Quality still matters — a 3-star free match beats a 1-star premium match
- Applies to match ranking only, NOT to proposal ordering (proposals remain chronological)
- Gold crown badge visible on premium partner's match cards

### Advanced alerts
- Trigger: fires when any user adds a card from the premium user's wanted list to their collection
- Proactive — notifies before a two-way match even forms ("Someone just got a card you want!")
- Wanted list = alert list automatically — no extra configuration needed
- Frequency: batched digest every 2 hours max ("3 traders added cards you want")
- Alerts appear in both push notifications AND in-app notification inbox (consistent with existing dual-delivery pattern)

### Claude's Discretion
- RevenueCat SDK integration details and webhook setup
- Database schema for subscription status (users table field vs separate table)
- Analytics pre-computation job implementation (SQL aggregation queries)
- Score boost multiplier exact value within 20-30% range
- Alert batching job configuration and deduplication
- Paywall screen visual design and feature list copy
- Home tab analytics summary card design
- Error handling for subscription edge cases (expired, grace period, refunded)

</decisions>

<specifics>
## Specific Ideas

- Profile premium section should feel like Discord Nitro in settings — clean, not salesy
- Analytics dashboard should be scannable card lists, not chart-heavy — users want to quickly see "what's hot" and "what's my leverage"
- Soft upsells should feel like discovering a feature, not being blocked — lock icon + description of what they'd see
- Gold crown badge creates a subtle social signal that premium users are invested/trustworthy traders
- Advanced alerts are the "early warning system" — know about supply before matches form

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `notification.service.ts`: Push notification infrastructure (Expo Push SDK, batch sending, stale token cleanup) — extend for card alerts
- `match.service.ts`: Match scoring with score/starRating — add premium multiplier
- `CardThumbnail.tsx`: Card image rendering with overlays — reuse in analytics lists
- `trades.ts` Zustand store: Match/proposal state — extend for premium state
- `useApi.ts` / `apiFetch()`: Authenticated API calls — use for analytics and subscription endpoints
- `NotificationBell` component: In-app notification access — card alerts flow into existing inbox
- Theme system: Dark theme with gold accent (#f0c040) — use for premium badge and paywall styling
- BullMQ job queue infrastructure: Already set up for match recomputation — add analytics cron and alert batching jobs

### Established Patterns
- Zustand store per domain with reset() on logout
- Service layer: routes validate with Zod, call service, return response
- Drizzle ORM with PostgreSQL (indexes, unique constraints, upsert patterns)
- BullMQ for background job processing with jobId deduplication
- Dual-delivery notifications: push + in-app inbox persistence
- Shared schemas in packages/shared for API/mobile type sharing
- Optimistic updates with revert-on-error

### Integration Points
- Profile tab: Add premium section card (pre-sub: paywall, post-sub: manage + quick links)
- Home tab: Add analytics summary card (locked for free, linked for premium)
- Users table: Add subscription status field(s)
- Match service: Apply premium score boost during ranking
- Collection service: Trigger card alert check when cards are added
- Notification service: New card-alert notification type with batched digest
- Shared schemas: Add premium-related types (subscription status, analytics data)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-premium-tier*
*Context gathered: 2026-03-10*
