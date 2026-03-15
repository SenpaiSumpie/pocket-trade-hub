# Phase 9: Engagement Quick Wins - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Three independent utility features that drive engagement and social sharing: a luck calculator for pack opening probabilities, image export for shareable collection/post visuals, and a promo/gift code system for premium time distribution. All three are standalone features with no cross-dependencies.

</domain>

<decisions>
## Implementation Decisions

### Luck Calculator
- Entry point: "Calculate odds" button on CardDetailModal — opens bottom sheet or inline expansion
- No dedicated screen or new tab — lives in the existing card browsing flow
- Stats shown: pull rate per pack, expected packs to pull, cost estimate (pack tokens/currency), cumulative probability curve (visual chart)
- Data source: hardcoded rarity rate constants based on community-datamined Pokemon TCG Pocket pack slot distributions
- Update strategy: manual constant updates when new sets change rates
- Access: free for all users (no premium gating)

### Image Export
- Four export types: collection summary (per-set card grid with completion %), trade post card, wanted list, single card showcase
- Visual style: branded dark background with gold accent (#f0c040), app logo watermark, card thumbnails in grid, stats overlay
- Premium difference: free users get watermarked exports, premium users get clean exports without branding
- Share flow: generate image → native OS share sheet (iOS/Android). No auto-save to gallery.
- Button placement: context-specific share icons on collection set view, post detail, wanted list screen, card detail modal
- No dedicated export screen

### Promo Code System
- Reward type: premium subscription time only (e.g., "LAUNCH7" = 7 days premium). No cosmetics/avatars for now.
- Redemption UI: "Redeem Code" button in profile/settings screen. Simple text input + redeem button.
- Code management: admin-only API routes (create/list/deactivate). No admin dashboard UI — use curl/Postman. Existing admin middleware in place.
- Redemption limits: one use per user per code. Codes can optionally have a global max redemption count.
- Integration: extends existing RevenueCat premium tier — code grants premium time server-side

### Feature Access & Gating
- Luck calculator: fully free, no gating
- Image export: free with app watermark branding; premium removes watermark
- Promo codes: free to redeem, one per user per code

### Claude's Discretion
- Luck calculator bottom sheet vs inline expansion design
- Cumulative probability chart implementation (library choice, visual style)
- Image generation approach (react-native view capture vs canvas rendering)
- Exact watermark placement and style on exported images
- Promo code format and validation rules (length, charset, case sensitivity)
- How premium time from codes interacts with existing RevenueCat subscriptions
- DB schema design for promo codes and redemption tracking

</decisions>

<specifics>
## Specific Ideas

- Luck calculator solves the "how many packs do I need?" question every Pokemon TCG Pocket player asks
- Image export with branded watermark = free marketing when shared to Discord/Reddit trading communities
- Promo codes enable marketing campaigns, streamer partnerships, and new user onboarding without IAP friction
- All three features are engagement hooks — designed to increase app opens and sharing, not just utility

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CardDetailModal`: Already displays full card info — add "Calculate odds" button here
- `CollectionSummary`: Per-set completion data — basis for collection export
- `CardGrid`, `CardThumbnail`: Card display components reusable in export image composition
- `RarityBadge`: Rarity display component — reuse in luck calculator UI
- `RARITY_WEIGHTS` in `fairness.ts`: Existing rarity value mapping (diamond1=1 to crown=100)
- `rarityValues` in `card.ts`: Rarity enum already defined (diamond1-4, star1-3, crown)
- `premium.service.ts` + `isPremium` checks: Extend for watermark gating and code-granted premium
- `apps/api/src/middleware/admin.ts`: Admin auth middleware ready for promo code management routes
- `PaywallCard`, `LockedFeatureCard`, `PremiumBadge`: Premium UI components for gating display

### Established Patterns
- Service + Route separation in `apps/api/src/services/` + `apps/api/src/routes/`
- Shared Zod schemas in `packages/shared/src/schemas/`
- Zustand per-domain stores in `apps/mobile/src/stores/`
- Bottom sheet modals for detail views (PostDetailModal, CardDetailModal pattern)
- Drizzle ORM with pgTable in `apps/api/src/db/schema.ts`
- Existing admin routes pattern in `apps/api/src/routes/admin.ts`

### Integration Points
- `CardDetailModal`: Add luck calculator button
- Collection set view: Add share/export button
- Post detail views (PostDetailModal, MyPostDetailModal): Add share button
- Wanted list screen: Add share button
- Profile/Settings screen: Add "Redeem Code" section
- `premium.service.ts`: Extend to handle code-granted premium time alongside RevenueCat
- `apps/api/src/db/schema.ts`: New tables for promo codes and redemptions

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 09-engagement-quick-wins*
*Context gathered: 2026-03-15*
