# Domain Pitfalls

**Domain:** Pokemon TCG Pocket Trading/Matchmaking Platform
**Researched:** 2026-03-07
**Confidence:** MEDIUM (based on training data patterns from trading platforms, TCG ecosystems, React Native apps, and billing systems; web verification unavailable)

## Critical Pitfalls

Mistakes that cause rewrites, user exodus, or fundamental product failure.

---

### Pitfall 1: Trade Matching Becomes O(n^2) and Kills Your Server

**What goes wrong:** The naive approach to trade matching checks every user's "have" list against every other user's "want" list. At 1,000 users with 50 cards each, that is 2.5 billion comparisons. The matching engine either times out, eats all server memory, or produces stale results that frustrate users.

**Why it happens:** Developers build matching as a simple nested loop in early development when there are 10 test users. It works perfectly. Then real users arrive and the system collapses.

**Consequences:** Server costs explode. Matches take minutes instead of seconds. Users see "no matches found" because the job timed out before reaching them. Premium users paying for "priority matching" get the same slow experience.

**Prevention:**
- Use an inverted index approach: maintain a lookup table of `card_id -> [users_who_want_it]` and `card_id -> [users_who_have_it]`. Finding matches becomes set intersections, not brute-force scans.
- When a user updates their inventory or want list, only recompute matches for the changed cards, not the entire database.
- Pre-compute and cache match results. Invalidate only affected pairs when inventories change.
- Use database-level operations (SQL joins or indexed queries) instead of application-level loops.

**Detection:** Monitor matching job duration. If it grows linearly with user count, the algorithm is O(n^2). Set alerts at 5-second and 30-second thresholds.

**Phase:** Must be addressed in the initial trade matching engine design (Phase 1/2). Retrofitting an efficient algorithm onto a naive one requires a full rewrite of the matching layer.

---

### Pitfall 2: Card Data Rot and Set Release Chaos

**What goes wrong:** Pokemon TCG Pocket releases new card sets multiple times per year. Each release changes the trading landscape overnight. If the card database update process is manual, slow, or error-prone, users cannot trade new cards, the app feels abandoned, and users leave for competitors who update faster.

**Why it happens:** Teams underestimate the operational burden. The initial card database is treated as a one-time import. No pipeline exists for rapid updates. Card IDs or naming conventions change between sets. Variant cards (alternate art, full art, immersive) are modeled as the same card when they should be distinct tradeable items.

**Consequences:** Users cannot list newly released cards for days or weeks. Inventory data becomes inconsistent when card schema changes. Duplicate entries appear. Users lose trust in the platform's reliability.

**Prevention:**
- Design the card data model to handle variants from day one. Each unique tradeable item needs its own ID, not just each Pokemon. A "Pikachu" base card and "Pikachu Full Art" are different tradeable assets.
- Build an admin pipeline (JSON import tool as specified in PROJECT.md) that can ingest a new set in under an hour, not days.
- Version the card database schema. Include a `set_release_date` field to support filtering and to identify stale data.
- Include a `card_hash` or `external_id` field that maps to whatever source you use, so updates can be reconciled without duplicating.
- Plan for card errata and corrections (name changes, rarity reclassifications).

**Detection:** Track time-to-publish for each new set release. If it takes more than 24 hours after a set launches in-game, the pipeline is too slow.

**Phase:** Card data model design in Phase 1. Import pipeline in Phase 2. Must be solid before any real users arrive.

---

### Pitfall 3: Stale Inventory Leading to Failed Trades and User Frustration

**What goes wrong:** User A lists a card as available. User B gets matched and sends a trade proposal. By the time User B proposes, User A has already traded that card in-game or to another user on the platform. User B wasted time. This happens repeatedly and users stop trusting matches.

**Why it happens:** The app coordinates trades but cannot verify in-game state. There is no API from Pokemon TCG Pocket to confirm a user actually holds a card. Users forget to update their inventory after trading in-game.

**Consequences:** High proposal rejection rates. Users stop responding to proposals because "most are stale anyway." The matching engine's value proposition erodes. This is the single biggest trust problem for a coordination-only platform.

**Prevention:**
- Implement a "card lock" system: when a user accepts a trade proposal, lock that card from appearing in other matches until the trade is confirmed or expires.
- Add a "confirm trade completed" flow with a timeout (e.g., 24 hours). If not confirmed, unlock the card and flag the trade as expired.
- Show "last inventory update" timestamps prominently. Matches against stale inventories (not updated in 7+ days) should be deprioritized or flagged.
- Nudge users to update inventory with periodic reminders ("Your inventory hasn't been updated in 5 days. Are these cards still available?").
- Track per-user trade completion rate. Users who frequently fail to complete trades should have their matches deprioritized (a soft reputation score).

**Detection:** Monitor trade proposal acceptance rate and completion rate. If acceptance drops below 40% or completion drops below 60%, stale inventory is the likely cause.

**Phase:** Core trade flow design (Phase 2). Reputation/staleness signals in Phase 3.

---

### Pitfall 4: Subscription Billing Edge Cases That Lose Money or Lose Users

**What goes wrong:** Subscription billing with Apple App Store and Google Play has dozens of edge cases: failed renewals, grace periods, refunds, family sharing, promotional offers, price changes, sandbox vs production environments. Teams implement the "happy path" and ship, then discover 15-20% of subscribers hit edge cases that either give them free access or wrongfully revoke paid access.

**Why it happens:** Apple and Google have different billing APIs, different webhook/notification systems, different grace period behaviors, and different refund policies. Testing is difficult because sandbox environments behave differently from production. The StoreKit 2 / Google Play Billing Library APIs change annually.

**Consequences:** Revenue leakage from users who cancel but retain access. User complaints from paid subscribers who lose access during a grace period. App store rejection for non-compliant subscription flows. Chargebacks and refund fraud.

**Prevention:**
- Use a subscription management SDK like RevenueCat or Adapty rather than implementing StoreKit 2 and Google Play Billing directly. These handle cross-platform receipt validation, grace periods, refund detection, and entitlement management. The cost (typically percentage of revenue) is vastly cheaper than building and maintaining this yourself.
- Implement server-side receipt validation. Never trust the client for entitlement status.
- Handle these specific states: active, expired, grace period, billing retry, paused, revoked, refunded. Each needs a distinct UX response.
- Test every state in sandbox before launch. Maintain a test matrix of subscription states.
- Store subscription status server-side with a webhook-driven update model. Do not poll.

**Detection:** Compare active subscriber count against expected revenue. If they diverge by more than 5%, there is a billing state bug. Monitor webhook delivery failures.

**Phase:** Subscription implementation phase (Phase 3 or whenever premium is built). Must be tested thoroughly before launch. Do not defer edge cases to "after launch."

---

### Pitfall 5: Push Notification Delivery Failures Breaking Real-Time Matching

**What goes wrong:** The "killer feature" is real-time match notifications. Users expect to be notified immediately when a compatible trade partner appears. But push notifications are unreliable: they can be delayed, throttled, dropped, or disabled by the OS. Building the core experience around push notifications means building on an unreliable foundation.

**Why it happens:** Developers test on their own devices with notifications enabled and assume that experience is universal. In reality, Android aggressively kills background processes and throttles notifications (especially on Chinese OEM devices like Xiaomi, Oppo, Huawei). iOS is more reliable but still throttles high-volume senders. Users disable notifications for apps they perceive as spammy.

**Consequences:** Users miss trade matches. They open the app and see nothing, not knowing a match was sent and dropped. They conclude the app "doesn't work" and leave. Premium users paying for alerts feel cheated.

**Prevention:**
- Design a dual-delivery system: push notifications for immediacy PLUS an in-app notification inbox that persists matches. When a user opens the app, always check the server for pending matches regardless of push notification state.
- Batch low-priority notifications. Do not send a push for every single match; instead, send "You have 3 new trade matches" periodically. Reserve individual pushes for high-priority events (someone accepted your proposal, a high-demand card match).
- Implement notification delivery tracking: send a push, log it server-side, confirm client receipt via a silent callback. If delivery rate drops below 70%, alert.
- Respect user preferences. Let users configure notification frequency and types. Users who feel spammed will disable all notifications, which is worse than fewer notifications.
- On Android, guide users through battery optimization exemptions for the app (with a non-intrusive prompt, not a blocking modal).

**Detection:** Track push delivery rate and in-app open rate after notification send. If delivery rate is below 80% on Android, battery optimization is likely killing your service.

**Phase:** Notification architecture must be designed in Phase 1 (dual-delivery model). Push notification implementation in Phase 2. Delivery monitoring in Phase 3.

---

### Pitfall 6: Trade Fairness Evaluation That Angers the Community

**What goes wrong:** The app includes a "trade fairness evaluation system." Any attempt to assign value to cards will be controversial. If the system says a trade is "unfair" and blocks or warns against it, users who want to make that trade will be angry. If the system says nothing about unfair trades, new users will get scammed.

**Why it happens:** Card value in TCG Pocket is subjective and contextual. A card that is "worth less" by rarity metrics might be the last card someone needs for a set completion, making it highly valuable to them personally. Community-driven pricing is volatile. Any static valuation model becomes wrong within weeks of a new set release.

**Consequences:** If too aggressive: power users leave because the app is "telling them what their cards are worth." If too passive: new users get exploited and leave. Either way, the fairness system becomes the most complained-about feature.

**Prevention:**
- Make fairness evaluation informational, never blocking. Show a "trade analysis" with data points (rarity comparison, community demand, recent trade activity) but never prevent a user from making a trade they want to make.
- Use relative signals, not absolute values. "This card is wanted by 5x more users than the card you're receiving" is more useful and less controversial than "This card is worth $2 and that card is worth $0.50."
- Let users dismiss fairness warnings permanently for specific trades. Power users will opt out; new users will appreciate the guidance.
- Update fairness signals based on actual trade data on the platform (what trades are being accepted vs rejected), not external price guides.
- Display fairness as a spectrum ("You're giving more" / "Roughly even" / "You're receiving more") rather than a binary "fair/unfair."

**Detection:** If more than 20% of trades are flagged as "unfair" by the system, the threshold is miscalibrated. Monitor user complaints about the fairness system specifically.

**Phase:** Design the fairness model philosophy in Phase 1. Implement basic rarity comparison in Phase 2. Add demand-based signals in Phase 3 once trade data exists.

---

## Moderate Pitfalls

---

### Pitfall 7: React Native List Performance with Large Card Collections

**What goes wrong:** Users with 200+ cards in their inventory experience janky scrolling, slow search filtering, and UI freezes when rendering card grids with images. The app feels sluggish compared to native apps.

**Why it happens:** FlatList in React Native re-renders visible items on scroll. Card images are typically high-resolution. Without proper optimization (image caching, virtualization tuning, memoization), the JavaScript thread bottlenecks and frames drop.

**Prevention:**
- Use FlashList (by Shopify) instead of FlatList. It is a drop-in replacement with significantly better performance for large lists.
- Implement aggressive image caching with a library like react-native-fast-image (or expo-image if using Expo). Serve card images in WebP format at multiple resolutions. Load thumbnails in lists, full images on detail views.
- Use `React.memo` on card list items. Pass primitive props, not objects, to avoid unnecessary re-renders.
- Implement search filtering with debouncing (300ms) so the list does not re-render on every keystroke.
- For bulk add operations (adding 50+ cards at once), use a batch update pattern that updates state once, not 50 times.

**Detection:** Profile with React Native Performance Monitor. If JS thread drops below 40fps during scrolling, optimization is needed.

**Phase:** Must be considered from Phase 1 when building card list components. Much harder to retrofit.

---

### Pitfall 8: No Rate Limiting on Trade Proposals Enables Spam

**What goes wrong:** Without rate limiting, a single user can spam hundreds of trade proposals, flooding other users' inboxes with low-quality offers. Bots scrape the platform and send automated proposals.

**Why it happens:** Rate limiting is not glamorous and gets deprioritized. The initial assumption is "our users are nice TCG players."

**Consequences:** Users get buried in spam proposals. They stop checking proposals. Legitimate matches get lost. The platform becomes unusable for popular card holders.

**Prevention:**
- Rate limit trade proposals: free tier gets 10 proposals per day, premium gets 50 (or similar tiered limits). This also creates a natural premium upsell.
- Implement a cooldown between proposals to the same user (e.g., cannot propose to the same person within 24 hours of a rejection).
- Add basic bot detection: IP-based rate limiting, device fingerprinting, account age requirements before proposing.
- Allow users to block specific users from sending proposals.

**Detection:** Monitor proposals-per-user distribution. If the top 1% of users send more than 20% of all proposals, spam is occurring.

**Phase:** Rate limiting infrastructure in Phase 2 alongside trade proposals. Block/report features in Phase 3.

---

### Pitfall 9: Card Search That Does Not Handle Pokemon Naming Quirks

**What goes wrong:** Pokemon names have special characters (Nidoran male/female symbols, accented e in Pokemon itself, Mr. Mime, Farfetch'd, Type: Null, Ho-Oh). Search that relies on exact string matching fails for real users who type "nidoran" or "farfetchd" or "mr mime."

**Why it happens:** Developers use simple `LIKE '%query%'` SQL or basic string matching without considering the actual data.

**Consequences:** Users cannot find cards they know exist. They assume the card is not in the database and report bugs or leave.

**Prevention:**
- Store a normalized search field alongside the display name. Strip accents, special characters, and punctuation. Convert to lowercase.
- Implement fuzzy search (Levenshtein distance or trigram matching) for typo tolerance. "Charzard" should find "Charizard."
- Support common abbreviations and alternate names where applicable.
- Index search fields properly in the database. Full-text search with PostgreSQL `tsvector` or similar.

**Detection:** Log search queries with zero results. If more than 10% of searches return nothing, search normalization is insufficient.

**Phase:** Card data model and search implementation in Phase 1/2.

---

### Pitfall 10: Ignoring Time Zones in Trade Coordination

**What goes wrong:** User A in Tokyo matches with User B in New York. A sends a proposal at their morning (B's evening). B accepts the next morning (A's evening). They need to be online simultaneously in Pokemon TCG Pocket to execute the trade, but their windows barely overlap.

**Why it happens:** Trade matching only considers card compatibility, not practical executability. The coordination aspect of "coordination platform" is ignored.

**Consequences:** Matched trades that are technically valid but practically impossible to execute. Users get frustrated by matches they cannot act on.

**Prevention:**
- Optionally collect user time zone (or infer from device).
- Show "likely online hours" overlap when presenting matches. Surface matches with better overlap first.
- Include a "preferred trading times" profile field.
- For Phase 1, at minimum display the matched user's general time zone so users can self-coordinate.

**Detection:** If trade completion rates are significantly lower for cross-timezone matches (more than 12 hours apart), this is a factor.

**Phase:** Basic time zone awareness in Phase 2 (display). Smart matching factoring in Phase 3.

---

### Pitfall 11: Database Schema That Cannot Evolve with Game Updates

**What goes wrong:** Pokemon TCG Pocket adds new mechanics: new card types, new rarities, new trade restrictions (e.g., certain cards become untradeable, trade costs change). A rigid database schema requires migrations that break existing data or require downtime.

**Why it happens:** The schema is designed around the current game state without considering that the game will change.

**Consequences:** Emergency database migrations when the game updates. Potential data loss or corruption. Extended downtime during critical update periods (when users want the app most).

**Prevention:**
- Use a flexible attributes pattern for card properties that might change. Core fields (id, name, set) are columns; variable properties (rarity tier, trade cost, tradeable status) can use a JSON column or EAV pattern for extensibility.
- Version your card data. Do not mutate historical records; create new versions.
- Design migrations to be backward-compatible and runnable without downtime (add columns before removing old ones, use feature flags).
- Maintain a staging environment where game updates can be tested before hitting production.

**Detection:** If a game update requires more than 2 hours of development to reflect in the app, the schema is too rigid.

**Phase:** Database design in Phase 1. This is foundational and very costly to fix later.

---

### Pitfall 12: Building Social Features Before Core Trading Works

**What goes wrong:** Teams get excited about community features (chat, friend lists, user profiles, reviews, forums) before the core trade matching and proposal flow is robust. Social features consume development time but do not contribute to the core value proposition.

**Why it happens:** Social features are fun to build and feel like progress. They also seem like they increase retention. But users come for trade matching, not for another social platform.

**Consequences:** Core trading is buggy or incomplete while social features work perfectly. Users leave because the app does not solve their actual problem. Development velocity on the core product slows.

**Prevention:**
- Define a strict MVP: inventory management, trade matching, trade proposals, trade completion tracking. Nothing else until these work reliably.
- Social features (friend lists, messaging, reviews) belong in Phase 3 or later.
- The PROJECT.md already has good scope boundaries. Enforce them ruthlessly.

**Detection:** If more than 30% of development time in Phase 1-2 goes to non-core features, scope creep is occurring.

**Phase:** This is a meta-pitfall about Phase 1-2 planning discipline.

---

## Minor Pitfalls

---

### Pitfall 13: Not Handling App Store Review Rejection for "Marketplace" Classification

**What goes wrong:** Apple and Google may classify the app as a "marketplace" or "trading platform" which triggers additional review requirements, especially around user safety, age verification (Pokemon audience includes minors), and in-app purchase requirements.

**Prevention:**
- Frame the app as a "collection tracker with trade coordination" in store listings, not a "marketplace."
- Ensure all premium features use in-app purchases (not external payment links). This is mandatory for App Store compliance.
- Include content moderation capabilities before submission.
- Review Apple's App Store Review Guidelines Section 3 (Business) and Google's Families Policy if targeting users under 13.

**Phase:** Pre-launch compliance review. Plan for 1-2 rejection cycles on first submission.

---

### Pitfall 14: Underestimating the Need for Onboarding and Initial Inventory Population

**What goes wrong:** New users download the app, see an empty inventory, realize they need to manually add 50-200 cards one by one, and uninstall.

**Prevention:**
- Build a "quick add" flow: show all cards in a set as a visual grid, let users tap to add. Much faster than search-and-add.
- Support bulk operations from the start: "add all commons from this set" with one tap.
- Consider a checklist-style set completion view where users simply check off cards they own.
- Show value immediately: even before inventory is complete, show partial matches ("based on what you've added so far, here are 3 potential trades").

**Phase:** UX design in Phase 1. Bulk add tooling in Phase 2.

---

### Pitfall 15: Treating Free and Premium as Separate Codepaths

**What goes wrong:** Premium features are implemented as entirely separate screens, APIs, and database queries rather than as feature flags on shared infrastructure. This doubles maintenance burden and creates divergent user experiences.

**Prevention:**
- Use a feature flag / entitlement check system. One codebase, one API, with conditional access based on subscription state.
- Design the free experience as a natural subset of premium, not a separate product.
- Make the upgrade path contextual: when a free user hits a premium feature, show what they would see with a "Upgrade to unlock" CTA, not a generic paywall.

**Phase:** Architecture decision in Phase 1. Premium implementation in Phase 3.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Card database design | Rigid schema that cannot handle game updates (Pitfall 11) | Use flexible attributes pattern, version card data |
| Card database design | Poor variant modeling (Pitfall 2) | Each tradeable variant gets its own ID from day one |
| Trade matching engine | O(n^2) algorithm (Pitfall 1) | Inverted index with incremental updates |
| Trade matching engine | Stale inventory matches (Pitfall 3) | Card locking, staleness signals, completion tracking |
| Trade proposals | Spam and abuse (Pitfall 8) | Rate limiting, tiered limits, cooldowns |
| Trade fairness | Community backlash (Pitfall 6) | Informational only, never blocking, relative signals |
| Real-time notifications | Delivery unreliability (Pitfall 5) | Dual-delivery: push + in-app inbox |
| Subscription billing | Edge case revenue leakage (Pitfall 4) | Use RevenueCat, server-side validation |
| Card search | Pokemon naming quirks (Pitfall 9) | Normalized search field, fuzzy matching |
| React Native UI | List performance (Pitfall 7) | FlashList, image caching, memoization |
| User onboarding | Empty state abandonment (Pitfall 14) | Visual grid bulk-add, partial matching |
| App store submission | Marketplace classification (Pitfall 13) | "Collection tracker" framing, compliance review |
| Scope management | Feature creep into social features (Pitfall 12) | Enforce MVP scope ruthlessly |

## Sources

- Training data knowledge of trading platform architecture patterns (MEDIUM confidence)
- React Native performance optimization patterns from Shopify FlashList documentation, React Native core docs (MEDIUM confidence)
- Apple App Store Review Guidelines and Google Play policies (MEDIUM confidence -- guidelines may have updated since training cutoff)
- RevenueCat subscription management patterns (MEDIUM confidence)
- Pokemon TCG naming conventions and game mechanics (HIGH confidence -- well-documented in training data)
- Note: Web search was unavailable for this research session. All findings are based on training data through May 2025. Recommend verifying subscription billing and app store policy details against current documentation before implementation.
