# Feature Landscape

**Domain:** Pokemon TCG Pocket trade coordination platform -- v2.0 new features
**Researched:** 2026-03-11
**Primary competitor:** PokeHub (4.72 stars, 35k ratings, dominant PTCGP trading app)
**Secondary competitors:** PokeTrade, Poke Trade Party, PTCGP Tracker, ptcgpocket.gg

---

## Table Stakes

Features users now expect because PokeHub and other competitors have them. Missing these means users stay on PokeHub.

| Feature | Why Expected | Complexity | Dependencies on v1 | Notes |
|---------|--------------|------------|---------------------|-------|
| **Offering/Seeking trade posts** | PokeHub's core model. Users create posts with up to 9 cards they offer and 9 they seek. This is the standard PTCGP trading UX -- every competitor uses it. Our v1 automatic matching is good but users also want explicit posts they control. | High | Replaces/augments match engine, proposals. Requires new DB tables, post CRUD, feed UI. | Architecture overhaul -- this is the single most important v2 feature. Must coexist with existing matching engine, not replace it entirely. |
| **Multi-language card database** | Pokemon TCG Pocket supports 9 languages. Cards exist in specific languages and cannot change language after acquisition. PokeHub supports all card languages. Language mismatches are the #1 user complaint on PokeHub -- users get offers in wrong languages. | Medium | Extends existing card DB (TCGdex already supports 14 languages). Affects collection, wanted list, trade posts. | TCGdex API has full multi-language Pocket integration. Our advantage: solve the language mismatch problem PokeHub fails at. |
| **Card language selection in collection** | When users add cards to their collection, they need to specify the language of each card. Trading requires language-matched cards. PokeHub has this but users report it as clunky. | Medium | Extends collection schema (add language field per card entry). Affects matching, proposals. | Critical for accurate trade matching. Without this, language mismatches make trades fail in-game. |
| **OAuth login (Google/Apple)** | Standard mobile app expectation in 2026. Reduces friction of email/password signup. Both PokeHub and PokeTrade support social login. | Medium | Augments existing JWT auth system. Needs new OAuth provider integration, account linking. | Apple Sign-In is required by App Store if any social login is offered. Google Sign-In covers Android users. |
| **Image export / shareable collection images** | PokeHub offers "export and share images" of trades and collections. Users want to share their collection progress, trade offers, and pulls on social media. | Low | Uses existing card image assets and collection data. React Native ViewShot + react-native-share pattern. | Low complexity, high social virality. Capture any view as image, share via system share sheet. |
| **Luck calculator** | PokeHub has one. Multiple standalone web tools exist (porygonthree, mikstrix, PokeForge, ptcgpocket.gg). Users input packs opened and rare cards pulled, get a luck rating. Expected as a utility feature. | Low | Standalone feature, no dependency on existing systems. Needs pack pull rate constants. | Pure frontend calculation. Input: packs opened + star/crown card counts. Output: luck level on 9-point scale (Awful to Incredible) with percentile ranking. Well-defined formulas exist. |

## Differentiators

Features that set Pocket Trade Hub apart. Not every competitor has these, or competitors do them poorly. These are where we win users from PokeHub.

| Feature | Value Proposition | Complexity | Dependencies on v1 | Notes |
|---------|-------------------|------------|---------------------|-------|
| **Language-aware matching (solve PokeHub's #1 problem)** | PokeHub's biggest complaint: users receive trade offers in wrong card languages, making trades useless. We can filter matches by card language, show language badges prominently, and warn on language mismatches. This is the single biggest competitive gap to exploit. | Medium | Requires multi-language card DB + card language in collection. Extends match engine. | PokeHub has the data but surfaces it poorly. We solve this with language as a first-class filter in matching and post browsing. |
| **AI-powered trade suggestions** | No competitor does this. Analyze user's collection gaps, market demand, card rarity, and available trade partners to suggest optimal trades. "You should trade away your extra Pikachu EX (EN) for Mewtwo EX (EN) -- 3 traders available, fair trade." | High | Requires collection data, wanted lists, trade post data, fairness scores. Could use LLM or rule-based engine. | Start rule-based (not ML): score trades by (fairness + demand + partner availability + priority). LLM integration is a v3 premium feature. The "smart trade suggestions" from v1 are pre-computed matches; this goes further with strategic advice. |
| **Local trade finder (nearby traders)** | No competitor offers this. Pokemon TCG Pocket requires friend codes to trade -- finding local players for in-person coordination is valuable. Location-based discovery with privacy controls. | High | New system: geolocation, privacy settings, proximity search. No v1 dependency. | Privacy-sensitive: opt-in only, approximate location (city/region, not exact), no background tracking. Use PostGIS or simple lat/lng distance. This is unique and highly engaging for community building. |
| **Deck meta system** | ptcgpocket.gg and Tacter track competitive decks with win rates and tier lists. No trading app integrates this. Showing "this card is in 3 S-tier decks" on trade posts adds context for competitive players. | High | New system. Card DB linkage needed. Separate data source from TCGdex (tournament results). | Tiers: S/A/B/C. Data: deck name, cards, win rate, matchups, usage rate, tournament results. Can start with manual/curated data, later scrape from Limitless TCG API. |
| **Tier list system (user-created)** | TierMaker is hugely popular for PTCGP card/deck tier lists. Let users create, share, and vote on tier lists within the app. Social engagement driver. | Medium | Card DB for card images. New system for tier list CRUD, sharing, voting. | Drag-and-drop tier builder (S/A/B/C/D/F rows), shareable as image or link. Community voting creates "consensus" tier lists. Premium feature: unlimited tier lists. |
| **Structured proposals over chat** | PokeTrade has DMs; PokeHub has "quick messages." Both lead to moderation nightmares. Our structured proposal system (offer cards, request cards, fairness score) is cleaner and safer. Already built in v1 -- just needs to integrate with new post-based model. | Low (already built) | Extends existing proposal system to work with trade posts. | This is already our differentiator from v1. In v2, proposals attach to trade posts instead of just match results. |
| **Gift/promo code system** | PokeHub has gift code redemption. Enables marketing campaigns, influencer partnerships, premium trial distribution. | Low | New system. RevenueCat supports offer codes for subscription trials. Custom codes for in-app rewards. | Two types: (1) Apple/Google offer codes via RevenueCat for premium trials, (2) custom app codes for cosmetics/rewards via backend validation. Keep it simple -- code table with type, value, expiry, max redemptions. |
| **Web app companion** | PokeHub is mobile-only. A web companion lets users manage collections and browse trades from desktop. Especially useful for bulk collection management. | High | Shares API with mobile app. New frontend (React/Next.js). Shared Zod schemas already exist. | Turborepo monorepo makes this natural -- add `apps/web`. Not a full PWA replacement for mobile; focused on collection management and trade browsing. |

## Anti-Features

Features to explicitly NOT build. These are traps.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Full chat/messaging system** | PokeTrade added DMs and faces moderation issues. PokeHub's "quick messages" are also problematic. Chat between strangers (including minors) is a liability minefield. | Keep structured proposals. Add pre-written quick responses ("I'm interested", "Can you add X?", "Let's trade!") without freeform text. |
| **Real-time card price tracking** | PTCGP cards have no real-money market. Assigning monetary values invites ToS violations and marketplace behavior. | Use demand/rarity metrics. "High demand, low supply" is more useful and legal than a fake price. |
| **Automated pack opening simulator** | Some apps simulate pack openings. Gambling-adjacent feature that may trigger App Store review issues and is off-brand for a trading platform. | Luck calculator analyzes real pulls only. No simulated gambling. |
| **Full ML model for trade suggestions** | Training and serving a custom ML model is massive infrastructure overhead for uncertain improvement over rule-based scoring. | Rule-based AI suggestions using existing fairness scores, demand data, and availability. Feels "smart" without ML infrastructure. |
| **Background location tracking** | Continuous GPS for "nearby traders" drains battery and raises privacy alarms. App Store will likely reject or require excessive justification. | Opt-in approximate location (city-level). User manually refreshes nearby traders. No background tracking. |
| **Deck builder / deck construction tool** | Full deck builders exist (ptcgpocket.gg, Limitless). Building one from scratch is scope bloat. | Show meta decks, win rates, and tier lists. Link to card detail from decks. Don't recreate deck construction. |
| **Tournament bracket system** | Scope creep into competitive platform territory. | Show tournament results from external sources (Limitless data). Don't run tournaments. |
| **Card grading / condition assessment** | Physical card concept. PTCGP digital cards have no condition variation. | Not applicable to digital cards. |

## Feature Dependencies

```
Multi-Language Card DB ──────────────────────────────────────┐
  │                                                          │
  ├──> Card Language in Collection                           │
  │     │                                                    │
  │     └──> Language-Aware Matching                         │
  │           │                                              │
  │           └──> Trade Post Language Filters                │
  │                                                          │
  └──> Multi-Language UI (i18n)                              │
       (independent of card language)                        │
                                                             │
Offering/Seeking Posts ──────────────────────────────────────┤
  │                                                          │
  ├──> Post Feed with Filters                                │
  │     │                                                    │
  │     └──> Language/Rarity/Set Filters                     │
  │                                                          │
  ├──> Post-based Proposals (extends v1 proposals)           │
  │                                                          │
  ├──> Smart Trade Suggestions (scan posts for matches)      │
  │                                                          │
  └──> AI Trade Suggestions (analyze posts + collections)    │
                                                             │
OAuth Login ─── (independent, no downstream dependencies)    │
                                                             │
Card Scanning ──> Collection Import (bulk add via scan)      │
  │                                                          │
  └──> Trade Post Creation (scan card to add to post)        │
                                                             │
Local Trade Finder ─── (independent, needs geolocation)      │
  │                                                          │
  └──> Trade Posts filtered by proximity                     │
                                                             │
Deck Meta System ────────────────────────────────────────────┘
  │
  ├──> Card-to-Deck Linkage ("in S-tier deck" badge)
  │
  ├──> Tier List System (user-created, references meta)
  │
  └──> Deck Win Rates / Tournament Data

Luck Calculator ─── (fully independent)

Image Export ─── (independent, uses existing card images)

Gift/Promo Codes ─── (independent, RevenueCat + custom)

Web App Companion ─── (shares API, no new backend features)
```

## Critical ordering constraints:
1. **Multi-language card DB must come before** offering/seeking posts (posts need language-aware cards)
2. **Offering/seeking posts must come before** AI trade suggestions (suggestions analyze post data)
3. **OAuth should come early** -- reduces signup friction for all subsequent features
4. **Card scanning benefits from** language-aware collection (scan must assign card language)

## MVP Recommendation for v2.0

### Phase 1: Foundation (must-build first)
1. **OAuth login (Google/Apple)** -- Reduces onboarding friction. Prerequisite for growth.
2. **Multi-language card database** -- TCGdex already supports this. Extend card schema, import language variants. Foundation for everything else.
3. **Card language selection in collection** -- Add language field to collection entries. Required for accurate trading.

### Phase 2: Core Trading Overhaul
4. **Offering/Seeking trade posts** -- The big architectural change. New post model, feed UI, filters. This is what makes v2 competitive with PokeHub.
5. **Language-aware matching** -- Our key differentiator over PokeHub. Filter posts/matches by card language.
6. **Post-based proposals** -- Extend existing proposal system to attach to trade posts.

### Phase 3: Engagement Features
7. **Luck calculator** -- Low effort, high engagement. Pure frontend calculation.
8. **Image export** -- Low effort, high virality. ViewShot + share.
9. **Gift/promo code system** -- Enables marketing. RevenueCat offer codes + custom codes.
10. **AI trade suggestions** -- Rule-based: score available trades by fairness + demand + availability.

### Phase 4: Advanced Features
11. **Card scanning** -- Camera-based card recognition. Use existing open-source approaches (CLIP + OCR hybrid). High complexity.
12. **Deck meta system** -- Curated competitive deck data. Win rates, tier rankings, card linkage.
13. **Tier list system** -- User-created tier lists with sharing and voting.
14. **Local trade finder** -- Geolocation-based nearby trader discovery.

### Phase 5: Platform Expansion
15. **Web app companion** -- React/Next.js web frontend sharing existing API.
16. **Multi-language UI** -- i18n with react-i18next. Translate all UI strings.
17. **Smart trade suggestions** -- Pre-computed on app open, enhanced with post data.

### Defer to v3:
- **ML-based trade suggestions** -- Rule-based is sufficient for v2
- **Tournament integration** -- Show external data only

## Complexity Budget

| Feature | Backend | Frontend | New Infrastructure | Total Estimate |
|---------|---------|----------|--------------------|----------------|
| OAuth login | Medium | Medium | OAuth provider setup | 1-2 days |
| Multi-language card DB | Medium | Low | TCGdex re-import | 1 day |
| Card language in collection | Medium | Medium | Schema migration | 1 day |
| Offering/Seeking posts | High | High | New tables, feed, filters | 3-4 days |
| Language-aware matching | Medium | Medium | Extend match engine | 1 day |
| Luck calculator | None | Medium | None | 0.5 day |
| Image export | None | Medium | ViewShot lib | 0.5 day |
| Gift/promo codes | Medium | Low | Code table | 1 day |
| AI trade suggestions | High | Medium | Scoring algorithm | 2 days |
| Card scanning | High | High | Image recognition pipeline | 3-4 days |
| Deck meta system | High | High | New data source, tables | 2-3 days |
| Tier list system | Medium | High | Drag-and-drop UI | 2 days |
| Local trade finder | High | Medium | Geolocation, PostGIS | 2-3 days |
| Web app companion | Low (shared) | High | New React app | 3-4 days |
| Multi-language UI | Low | High | i18n string extraction | 2-3 days |
| Smart trade suggestions | Medium | Medium | Cron job enhancement | 1 day |

**Total estimate: ~25-35 days of execution**

## Competitor Gap Analysis

### What PokeHub Does Well
- Large user base (35k ratings, dominant market position)
- Multi-language card database covering all 9 PTCGP languages
- Offering/Seeking post model that users understand
- Match Mode algorithm connecting compatible traders
- Utility tools (luck calculator, image export)
- Quick messages for basic communication

### What PokeHub Does Poorly (Our Opportunities)
- **Excessive ads** -- Ads interrupt post creation flow, sometimes crashing the app. Users hate this. We have NO ads.
- **Aggressive VIP upselling** -- Constant VIP popups degrade UX. Our premium is subtle and value-driven.
- **Language mismatch failures** -- Users receive trade offers in wrong card languages. Our language-aware matching solves this directly.
- **No fairness evaluation** -- Users have no way to assess if a trade is fair. Our rarity-based fairness scoring is unique.
- **No structured proposals** -- PokeHub uses chat-like messages. Our formal offer/counter-offer flow is cleaner.
- **Poor filtering** -- Limited search and filter options on trade posts. We can offer rarity, language, set, type, and priority filters.
- **No AI/smart suggestions** -- No proactive trade recommendations. Users must manually browse posts.
- **No local discovery** -- No way to find nearby traders for in-person coordination.
- **No deck meta integration** -- No competitive context on cards being traded.
- **Mobile-only** -- No web companion for desktop users.

### What PokeTrade Does Differently
- Has DMs (but faces moderation issues and ad-gating)
- Wishlist-centric matching (similar to our v1 approach)
- Also suffers from ad fatigue

## Sources

- [PokeHub official website](https://pokehub.app/)
- [PokeHub App Store listing](https://apps.apple.com/us/app/pokehub-for-tcg-pocket/id6740797484)
- [PokeHub Google Play listing](https://play.google.com/store/apps/details?id=com.mi.poketrade&hl=en)
- [PokeTrade app](https://pockettrade.app/)
- [TCGdex API - Multilingual Pokemon TCG API](https://tcgdex.dev)
- [TCGdex Pokemon TCG Pocket Integration](https://tcgdex.dev/tcg-pocket)
- [ptcgpocket.gg Tier List](https://ptcgpocket.gg/tier-list/)
- [Tacter PTCGP Meta Stats](https://www.tacter.com/pokemon-tcgp/stats)
- [Limitless TCG Decks](https://play.limitlesstcg.com/decks?game=POCKET)
- [PokeHub Luck Calculator](https://pokehub.app/pokemon-tcg-pocket-luck-calculator)
- [PTCGP Luck Calculator (porygonthree)](https://porygonthree.github.io/ptcgp-luck-calculator/)
- [Eyevo Pokemon Card Scanner](https://eyevotcg.com/blog/best-pokemon-card-scanner-apps-2026/)
- [PokeScope Card Scanner](https://pokescope.app/blog/how-i-built-pokemon-card-scanner-ai-50000-users/)
- [Apple Offer Codes Documentation](https://developer.apple.com/documentation/storekit/implementing-offer-codes-in-your-app)
- [RevenueCat Offer Codes](https://www.revenuecat.com/blog/engineering/create-and-track-offer-codes-ios-app/)
- [Google Play Promo Codes](https://developer.android.com/google/play/billing/promo)
- [React Native ViewShot + Share pattern](https://dev.to/majiyd/react-native-series-how-to-save-or-share-react-native-component-as-an-image-5gd3)
- [Pokemon TCG Pocket Language FAQ](https://app-ptcgp.pokemon-support.com/hc/en-us/articles/39077907007257-Which-languages-are-available)
