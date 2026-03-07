# Feature Landscape

**Domain:** Pokemon TCG Pocket trade coordination platform (mobile app)
**Researched:** 2026-03-07
**Confidence note:** Web research tools were unavailable. All findings are based on training data (through early 2025) covering TCGPlayer, PokeTrader, Pokemon TCG Pocket in-game trading, Discord trading bots (PokeTCG Bot, TradeBot), Reddit r/PTCGO and r/PokemonTCGPocket communities, and card collection apps like Pokellector. Confidence is MEDIUM overall -- the core feature patterns in card trading platforms are well-established, but specific competitor feature changes after early 2025 may be missed.

---

## Table Stakes

Features users expect. Missing any of these and users leave immediately or never adopt.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Card database with search** | Users need to find and reference specific cards. Every platform has this. | Medium | Must cover all PTCP sets. Need filters: name, set, rarity, type, pack. Must update with new set releases. |
| **User inventory management** | Core of any trading app -- users must track what they have. | Medium | Add/remove cards, track quantities, distinguish card variants (e.g., holo, full art, immersive). |
| **Wanted list / wishlist** | Users need to express what they're looking for. Standard in TCGPlayer, PokeTrader, Discord bots. | Low | Simple list of cards user wants. Priority levels are a differentiator (see below). |
| **Trade proposal system** | The core interaction. Users must be able to propose, accept, reject trades. | Medium | Must include: propose trade, view incoming/outgoing, accept/reject. Counter-offers elevate this. |
| **User profiles** | Identity and reputation are essential for trust in trading. | Low | Username, trade history count, join date. Rating system is a differentiator. |
| **Push notifications** | Users expect to be notified of trade proposals, matches, and responses. Without this, engagement dies. | Medium | New trade proposals, proposal accepted/rejected, new matches found. |
| **In-game friend code exchange** | Since actual trades happen in Pokemon TCG Pocket, users need to share friend codes to connect in-game. | Low | Display friend code on profile, copy-to-clipboard. This is the bridge between app and game. |
| **Basic card display with images** | Visual identification of cards is non-negotiable. Text-only card lists feel broken. | Low | Card images, name, set icon, rarity indicator. Source from community card databases. |
| **Set browsing** | Users browse by set to check collection completion and find trade targets. | Low | List all sets, filter cards within a set, show owned/missing indicators. |

## Differentiators

Features that set the product apart. Not expected, but highly valued. These are where Pocket Trade Hub wins.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Automatic trade matching engine** | THE killer feature. No major competitor does automated two-way matching well for PTCP. Discord bots do basic lookups. PokeTrader has some matching but friction is high. Background matching + notifications when a compatible partner is found eliminates hours of manual searching. | High | Match users where A has what B wants AND B has what A wants. Must handle partial matches, multi-card trades, and prioritize match quality. Background job + real-time notification pipeline. |
| **Trade fairness evaluation** | Users constantly ask "is this trade fair?" on Reddit/Discord. No tool gives a data-driven answer. Showing relative rarity, demand metrics, and community trade rates helps users make confident decisions. | High | Needs demand data (how many users want a card vs. how many offer it), rarity weighting, possibly community-driven value consensus. |
| **Priority levels on wanted cards** | Beyond a flat wishlist -- let users mark cards as "need desperately" vs "nice to have." Matching engine uses this to prioritize. No competitor does this well. | Low | Simple priority field (high/medium/low). Feeds into matching algorithm weighting. |
| **Demand metrics and analytics (premium)** | Show users which cards are most wanted, least available, trending. Content creators and competitive traders will pay for this. TCGPlayer has price data for physical cards but nothing like this for PTCP. | Medium | Aggregate wishlist data across users. Show demand/supply ratio per card. Premium feature. |
| **Priority listing placement (premium)** | Premium users' trade offers appear first in search results and matching. Standard monetization in marketplace apps. | Low | Boost flag on listings, sort priority in queries. |
| **Smart trade suggestions** | When a user opens the app, show pre-computed "suggested trades" based on their inventory + wishlist + available partners. Reduces friction to zero -- user just reviews and accepts. | High | Depends on matching engine. Pre-compute on schedule, show on app open. Key UX differentiator. |
| **Bulk inventory management** | Adding cards one-by-one is painful. Let users add by set (checklist UI), or eventually by screenshot/camera. Competitors largely ignore this pain point. | Medium | Set checklist view (tap to toggle owned), quantity adjustment, "mark all" for common cards. |
| **Counter-offer flow** | Instead of just accept/reject, let users counter-propose. Mirrors real negotiation. Discord trading lacks this entirely. | Medium | Modify a received proposal and send back. Conversation-like trade thread. |
| **Trade history and reputation** | Completed trade count, success rate, user ratings after trades. Builds trust. PokeTrader has basic ratings; Discord has none. | Medium | Post-trade rating prompt, aggregate score on profile, trade count badge. |
| **Real-time match notifications** | When a new user signs up or updates inventory and creates a match, notify immediately. Creates "magic moment" engagement hooks. | High | Requires event-driven architecture. New inventory/wishlist changes trigger match recalculation for affected users. |
| **Collection completion tracker** | Show progress per set (e.g., "87/120 cards"). Collectors love this. Pokellector does this but has no trading integration. | Low | Percentage per set, visual progress bar, highlight missing cards. Feeds naturally into wishlist. |
| **New set release alerts** | Notify users when new card sets are added to the database. Keeps users engaged through content cycles. | Low | Admin publishes new set, push notification to all users. |

## Anti-Features

Features to explicitly NOT build. These are traps that seem valuable but hurt the product.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **In-app trade execution** | Trades MUST happen in Pokemon TCG Pocket. Building execution would require game integration that doesn't exist and could violate ToS. Users understand this -- just coordinate. | Provide clear "go trade in-game" flow with friend code exchange and a "mark as completed" button. |
| **Real-money marketplace** | Selling digital Pokemon cards for real money is a legal and ToS minefield. TCGPlayer works for physical cards. Digital card trading for money invites account bans and legal issues. | Keep the platform as card-for-card trading only. Monetize through premium subscriptions, not transaction fees. |
| **Chat/messaging system** | Building a full chat system is a massive moderation liability (scams, harassment, minors). Discord already handles communication. Chat is not core to trade matching. | Provide structured trade proposals with counter-offers. Link to external communication (Discord username field on profile) if users want to discuss. |
| **Card price tracking / monetary valuation** | PTCP cards don't have real-money prices like physical TCG cards. Assigning dollar values to digital cards is misleading and invites marketplace behavior. | Use relative demand/rarity metrics instead. "High demand, low supply" is more useful than a fake price. |
| **Deck building tools (v1)** | Splits focus from core trading loop. Deck builders exist already. Per PROJECT.md, deferred to v2. | Stay focused on inventory + matching + trading. Deck meta is a v2 expansion. |
| **Social feed / timeline** | Social features bloat scope and require heavy moderation. Users come to trade, not to scroll a feed. | Keep interactions transactional: proposals, matches, notifications. |
| **Card scanning via camera (v1)** | OCR/image recognition for card import is technically complex, error-prone, and not essential for v1. Per PROJECT.md, deferred. | Provide manual entry with good UX (set checklist, search, bulk tools). Camera scan is a v2 convenience feature. |
| **Gamification / badges / leaderboards** | Seems engaging but can encourage fake trades (trade with friends to inflate stats) and distracts from core utility. | Simple trade count and rating is sufficient for trust. Avoid point systems. |
| **Multi-language support (v1)** | Internationalization adds significant complexity to v1. English-first is fine for initial launch. | Build with i18n-ready architecture (externalized strings) but ship English only. |

## Feature Dependencies

```
Card Database ──────────────────────────────┐
  │                                          │
  ├──> Card Search                           │
  │                                          │
  ├──> Set Browsing                          │
  │     │                                    │
  │     └──> Collection Completion Tracker   │
  │                                          │
  └──> Card Display (images)                 │
                                             │
User Accounts ─────────────────────────┐     │
  │                                    │     │
  ├──> User Profiles                   │     │
  │     │                              │     │
  │     └──> Friend Code Exchange      │     │
  │     │                              │     │
  │     └──> Trade History / Reputation│     │
  │                                    │     │
  ├──> Inventory Management ───────────┼─────┤
  │     │                              │     │
  │     └──> Bulk Inventory Mgmt       │     │
  │                                    │     │
  └──> Wanted List ────────────────────┘     │
        │                                    │
        └──> Priority Levels                 │
                                             │
Inventory + Wanted List + Card DB ───────────┘
  │
  ├──> Trade Matching Engine
  │     │
  │     ├──> Smart Trade Suggestions
  │     │
  │     ├──> Real-time Match Notifications
  │     │
  │     └──> Priority Listing (premium)
  │
  ├──> Trade Proposal System
  │     │
  │     ├──> Counter-offer Flow
  │     │
  │     └──> Trade Fairness Evaluation
  │
  └──> Demand Metrics / Analytics (premium)
        │
        └──> Trade Fairness Evaluation (enhanced)

Push Notifications ──> Match Notifications
                  ──> Trade Proposal Alerts
                  ──> New Set Release Alerts
```

## MVP Recommendation

**Prioritize (Phase 1 -- Core Loop):**

1. **Card database with search** -- Foundation. Nothing works without it.
2. **User accounts and profiles** -- Identity layer.
3. **Inventory management** -- Users must be able to say what they have.
4. **Wanted list** -- Users must be able to say what they want.
5. **Trade matching engine** -- The killer feature. This is the entire value proposition.
6. **Trade proposal system** -- The action loop. Match found, propose trade, accept/reject.
7. **Push notifications** -- Engagement driver. Without notifications, users forget the app exists.
8. **Friend code exchange** -- The bridge to in-game execution.

**Prioritize (Phase 2 -- Engagement and Polish):**

1. **Trade fairness evaluation** -- Builds user confidence.
2. **Counter-offer flow** -- Reduces friction in negotiations.
3. **Bulk inventory management** -- Reduces onboarding pain.
4. **Collection completion tracker** -- Retention hook for collectors.
5. **Trade history and reputation** -- Trust layer.

**Prioritize (Phase 3 -- Monetization and Growth):**

1. **Premium subscription tier** -- Revenue.
2. **Demand metrics and analytics** -- Premium feature that drives subscriptions.
3. **Priority listing placement** -- Premium feature, low complexity.
4. **Smart trade suggestions** -- Premium or free, major UX improvement.
5. **Real-time match notifications** -- Engagement driver requiring event architecture.

**Defer:**

- **Deck meta system**: v2 expansion per PROJECT.md.
- **Card scanning**: v2 convenience per PROJECT.md.
- **AI trade suggestions**: v2 per PROJECT.md.
- **Multi-language**: v2, but build i18n-ready.

## Competitor Landscape (Training Data, MEDIUM Confidence)

### TCGPlayer
- Physical card marketplace with real-money transactions
- Strong card database and search
- Price tracking, market data, collection management
- NOT a digital trade matching platform -- different model but sets UX expectations for card search and collection tracking

### PokeTrader
- Closer competitor: trade matching for Pokemon TCG (physical and some digital)
- Has inventory, wishlist, trade matching, user ratings
- Mobile app exists but UX is often criticized as clunky
- Trade matching is present but not deeply automated -- still requires manual browsing

### Discord Trading Bots / Communities
- r/PokemonTCGPocket and Pokemon trading Discords are the current dominant channels
- Bots offer basic listing (post what you have/want) and keyword search
- No automated two-way matching
- No structured proposals -- just text-based negotiation
- High friction, trust issues, scam risk
- This is the primary competitor to displace

### Pokellector
- Collection tracking app, not a trading platform
- Strong set browsing and completion tracking UI
- No trading features
- Sets the bar for collection UX

### Key Gaps in Existing Ecosystem
1. **No automated two-way matching** -- This is the biggest gap and the core opportunity
2. **No trade fairness data** -- Users rely on gut feel and Reddit posts
3. **No structured proposal flow** -- Everything is freeform text negotiation
4. **Fragmented across platforms** -- No single destination for PTCP trading
5. **No demand/supply data** -- Nobody aggregates what's wanted vs. available

## Sources

- Training data knowledge of TCGPlayer, PokeTrader, Pokellector, Pokemon TCG Pocket trading communities (Reddit, Discord) through early 2025
- Note: Web research tools were unavailable during this research session. Findings should be validated against current state of competitors, especially any new PTCP-specific trading apps that may have launched after early 2025.
