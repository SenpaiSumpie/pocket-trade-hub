# Project Research Summary

**Project:** Pocket Trade Hub v2.0
**Domain:** Pokemon TCG Pocket trading platform -- new features and platform expansion
**Researched:** 2026-03-11
**Confidence:** MEDIUM-HIGH

## Executive Summary

Pocket Trade Hub v2.0 transforms the app from an automatic-matching-only trading tool into a full-featured trading platform that competes directly with PokeHub (the dominant competitor with 35k ratings). The single most important architectural change is adding an Offering/Seeking post-based trading model alongside the existing automatic matching engine. This post model is what every competitor uses and what users expect -- it becomes the foundation that nearly every other v2 feature depends on. Equally critical is multi-language card support: Pokemon TCG Pocket operates in 9 languages, cards are language-locked, and language mismatches in trades are PokeHub's most-reported user complaint. Solving language-aware trading is the strongest competitive differentiator.

The recommended approach builds on the existing validated stack (Expo 54, Fastify 5, PostgreSQL, Redis, BullMQ, Drizzle ORM) with targeted additions rather than architectural rewrites. New dependencies are minimal and well-chosen: native OAuth modules for Google/Apple sign-in, PostGIS for geolocation queries, Google Cloud Vision for server-side card scanning, OpenAI GPT-4o-mini for trade suggestions, i18next for internationalization, and Expo Router web support for a companion web app. The monolith stays a monolith -- at sub-100K users, microservices would be premature complexity. Every new feature follows the established pattern of service file + route file + BullMQ worker.

The key risks are: (1) breaking the existing proposal chain during the post-model migration (use expand-contract pattern, keep both paths), (2) OAuth creating duplicate accounts without proper account-linking flows, (3) card scanning frustration from low accuracy killing user trust (always require confirmation, show top-3 candidates), and (4) AI suggestions feeling random without enough trade history data (start rule-based, label "Smart Suggestions" not "AI"). All critical pitfalls have concrete prevention strategies documented in detail.

## Key Findings

### Recommended Stack

The existing stack requires no changes. All new capabilities are additive. The key additions are native OAuth modules (`expo-apple-authentication`, `@react-native-google-signin/google-signin`), server-side image processing (Google Cloud Vision REST API via plain `fetch()`), LLM integration (`openai` npm package for GPT-4o-mini), geospatial queries (PostGIS extension + `expo-location`), internationalization (`i18next` + `react-i18next` + `expo-localization`), and image export (`react-native-view-shot` + `expo-sharing`). See STACK.md for full details.

**Core technology additions:**
- `expo-apple-authentication` + `@react-native-google-signin/google-signin`: Native OAuth -- required for growth, Apple Sign-In mandatory when any social login is offered
- PostGIS (PostgreSQL extension): Spatial queries for nearby traders -- no new database needed, sub-millisecond at scale
- Google Cloud Vision API: Server-side OCR for card scanning -- proven accuracy, cost-effective at ~$30/month for 10K users
- `openai` (GPT-4o-mini): AI trade suggestions with natural language reasoning -- ~$100/month at 10K DAU
- `i18next` + `react-i18next`: Industry-standard i18n -- officially recommended in Expo docs
- Expo Router web support: Web companion using existing codebase -- no Next.js needed, maximum code sharing

**Critical "do not add" decisions:**
- No Next.js (Expo Router handles web), no on-device ML (server-side is simpler and better), no Clerk/Auth0 (existing JWT infrastructure is sufficient), no `react-native-maps` (list-based nearby traders is better UX), no TensorFlow.js/ONNX (50-200MB app bloat for worse accuracy)

### Expected Features

**Must have (table stakes):**
- Offering/Seeking trade posts -- the standard PTCGP trading UX every competitor uses
- Multi-language card database -- 9 languages, cards are language-locked in-game
- Card language selection in collection -- required for accurate trade matching
- OAuth login (Google/Apple) -- standard mobile app expectation, reduces signup friction
- Image export / shareable collection images -- low effort, high social virality
- Luck calculator -- expected utility feature, pure frontend computation

**Should have (differentiators -- where we beat PokeHub):**
- Language-aware matching -- PokeHub's biggest user complaint, our biggest opportunity
- AI-powered trade suggestions -- no competitor does this
- Local trade finder -- no competitor offers nearby trader discovery
- Deck meta system -- competitive context on traded cards
- Tier list system -- social engagement driver
- Web app companion -- PokeHub is mobile-only

**Defer to v3+:**
- Full ML model for trade suggestions (rule-based is sufficient)
- Tournament bracket system (show external data only)
- Full deck builder (existing tools like ptcgpocket.gg cover this)
- Chat/messaging system (moderation liability; keep structured proposals)
- Background location tracking (battery drain, privacy nightmare)

### Architecture Approach

The v2.0 architecture extends the existing Fastify monolith with new service files, route files, and BullMQ workers per feature. The post-based trading model adds a `trade_posts` table and extends the proposal system to accept `postId` alongside `matchId`. The existing automatic matching engine is preserved as a secondary "Smart Suggestions" premium feature. All external API calls (Cloud Vision, OpenAI, web scraping) go through BullMQ jobs with retry logic. Redis-backed feature flags gate every new feature for incremental rollout. See ARCHITECTURE.md for full details.

**Major components:**
1. **Post service** (NEW) -- CRUD for Offering/Seeking trade posts, complementary post matching, feed with filters
2. **Scan service** (NEW) -- Server-side image processing: perceptual hash matching with Cloud Vision OCR fallback
3. **Suggest service** (NEW) -- LLM-powered trade suggestions with Redis caching (1-hour TTL)
4. **Geo service** (NEW) -- PostGIS spatial queries for nearby traders, privacy-preserving approximate location
5. **Deck meta service** (NEW) -- Imports competitive deck data from Limitless TCG via BullMQ cron
6. **Auth plugin** (MODIFIED) -- Add OAuth provider handling alongside existing JWT
7. **Proposal service** (MODIFIED) -- Accept `postId` as alternative to `matchId`
8. **Card translations table** (NEW) -- Per-language card names/images, fallback chain to English

### Critical Pitfalls

1. **Post-model migration breaks existing proposals** -- The `createProposalSchema` requires `matchId` as non-optional. Use expand-contract: add `postId` alongside `matchId`, make both optional with a refinement requiring at least one. Keep automatic matching running in parallel during transition.

2. **Card language mismatches make trades fail** -- PokeHub's top complaint. Language must be a first-class concern on EVERY card surface: collection, posts, proposals, search. Validate at proposal creation that both sides share the same card language. Ship multi-language cards BEFORE or WITH the post model.

3. **OAuth creates duplicate accounts** -- Add an `authProviders` junction table. On OAuth sign-in with matching email, prompt account linking (not silent merge). For Apple's hidden email, use Apple user ID as linking key. Never auto-merge.

4. **Card scanning low accuracy kills trust** -- Always show confirmation with top-3 candidates. Support screenshot import as primary flow (more reliable than camera). Gate as "Beta" at launch. Never auto-add to collection.

5. **AI suggestions feel random without data** -- Cold start problem. Start rule-based using existing card demand analytics. Label "Smart Suggestions" not "AI". Add dismiss/feedback mechanism. Graduate to ML only after 1000+ completed trades.

## Implications for Roadmap

Based on combined research, here is the suggested phase structure. The critical dependency chain is: Multi-language cards --> Post model --> everything else.

### Phase 1: Foundation -- Multi-Language Cards + OAuth
**Rationale:** Multi-language card support is the foundation for all trading features. Cards in Pokemon TCG Pocket are language-locked, making this a prerequisite for accurate trade matching. OAuth reduces signup friction for all subsequent user growth. These are independent of each other and can be built in parallel.
**Delivers:** `card_translations` table populated for 9 languages, card language field on collection items, language badges on all card surfaces, Google + Apple OAuth with account linking, `authProviders` junction table.
**Features addressed:** Multi-language card DB, card language in collection, OAuth login (Google/Apple)
**Pitfalls avoided:** Card language mismatch (Pitfall 2), OAuth duplicate accounts (Pitfall 3), TCGdex data gaps (Pitfall 9)

### Phase 2: Core Trading Overhaul -- Post-Based Model
**Rationale:** The Offering/Seeking post model is the single most important v2 feature and the primary architecture change. Every competitor uses this model. It must be built before AI suggestions, web app, and local finder because those features build on post data.
**Delivers:** `trade_posts` table, post CRUD API, post feed with language/rarity/set filters, complementary post notifications, proposal system extended to accept `postId`, existing matching preserved as "Smart Suggestions."
**Features addressed:** Offering/Seeking trade posts, language-aware matching, post-based proposals
**Pitfalls avoided:** Post migration breaks proposals (Pitfall 1), removing automatic matching without migration path (UX pitfall)

### Phase 3: Quick Wins -- Engagement Features
**Rationale:** Low-complexity, high-impact features that drive engagement and virality. All are independent of each other and have minimal dependencies on the post model. Ship these to keep momentum while planning heavier phases.
**Delivers:** Luck calculator (pure frontend), image export (ViewShot + share sheet), gift/promo code system (backend CRUD + RevenueCat offer codes).
**Features addressed:** Luck calculator, image export, gift/promo codes
**Pitfalls avoided:** None critical -- these are straightforward implementations.

### Phase 4: Internationalization
**Rationale:** Must happen BEFORE the web app so the web app is built i18n-first. Retrofitting i18n into two apps is harder than retrofitting into one. Translation files go in `packages/shared` so both apps consume them.
**Delivers:** i18next + react-i18next integration, `packages/shared/i18n/locales/` with 9 languages, user language preference, pseudo-localization testing, all existing UI strings extracted.
**Features addressed:** Multi-language UI
**Pitfalls avoided:** i18n retrofit breaks layouts (Pitfall 8)

### Phase 5: Card Scanning
**Rationale:** Independent feature with high complexity. Server-side perceptual hash matching with Cloud Vision fallback. Benefits from having language-aware collection already in place (scanned cards must be assigned a language).
**Delivers:** Screenshot import (primary) and camera capture, server-side image processing pipeline, confirmation UX with top-3 candidates, "Beta" label.
**Features addressed:** Card scanning, collection bulk import
**Pitfalls avoided:** Scanning frustration loop (Pitfall 5)

### Phase 6: Local Trade Finder
**Rationale:** Independent feature needing careful privacy design. PostGIS migration is low-risk but the privacy UX (opt-in, approximate location, distance ranges) must be designed thoroughly. Enhances post browsing with "nearby" filter.
**Delivers:** PostGIS extension + spatial indexes, `expo-location` integration, opt-in location sharing, nearby traders API, distance-based post filtering.
**Features addressed:** Local trade finder
**Pitfalls avoided:** Location privacy exposure (Pitfall 7)

### Phase 7: AI Trade Suggestions
**Rationale:** Benefits from existing post history and trade completion data. More meaningful with more users. Premium-only feature gated behind RevenueCat entitlement.
**Delivers:** GPT-4o-mini integration with structured prompts, Redis-cached suggestions (1-hour TTL), natural language reasoning for each suggestion, dismiss/feedback mechanism.
**Features addressed:** AI-powered trade suggestions
**Pitfalls avoided:** AI suggestions cold start (Pitfall 6)

### Phase 8: Deck Meta + Tier Lists
**Rationale:** Content feature requiring ongoing maintenance. Public pages on web app drive organic SEO traffic. Web scraping of Limitless TCG needs monitoring and admin fallback.
**Delivers:** `decks` + `deck_matchups` tables, BullMQ daily scraping worker, tier rankings, "in S-tier deck" card badges, user-created tier lists with sharing/voting.
**Features addressed:** Deck meta system, tier list system
**Pitfalls avoided:** Deck meta staleness (Pitfall 10)

### Phase 9: Web App Companion
**Rationale:** Placed later because it benefits from all previous features being stable (posts, i18n, multi-lang cards, deck meta for SEO pages). Uses Expo Router web support for maximum code sharing. Shared package must be refactored first to extract API client and business logic.
**Delivers:** Web app via Expo Router web export, collection management, post browsing, proposal handling, public deck meta/tier list pages.
**Features addressed:** Web app companion
**Pitfalls avoided:** Web/mobile code divergence (Pitfall 4)

### Phase Ordering Rationale

- **Multi-language cards first** because the post model needs language-aware cards to avoid PokeHub's biggest failure
- **Post model second** because it is the core architecture change that AI suggestions, web app, and local finder all depend on
- **Quick wins third** to maintain shipping momentum and user engagement during heavier development
- **i18n before web app** so the web app is built i18n-first rather than retrofitted
- **Card scanning and local finder are parallelizable** after the post model is stable
- **AI suggestions late** because they need trade history data to be useful
- **Deck meta late** because it is a content feature with ongoing maintenance burden
- **Web app last** because it benefits from all other features being stable

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Post Model):** Complex architecture migration -- needs careful expand-contract schema design and testing of backward compatibility with existing proposals
- **Phase 5 (Card Scanning):** Perceptual hash accuracy for Pokemon TCG Pocket cards specifically needs validation. The fuzzy matching logic against OCR output will need tuning. Flag for spike/prototype.
- **Phase 8 (Deck Meta):** Limitless TCG coverage of Pokemon TCG Pocket competitive data needs validation. Their API may not cover Pocket tournaments adequately. Scraping reliability is uncertain.
- **Phase 9 (Web App):** ARCHITECTURE.md recommends Next.js while STACK.md recommends Expo Router web -- this disagreement must be resolved during phase planning. Recommendation: start with Expo Router web for maximum code sharing, evaluate if SSR needs justify Next.js.

Phases with standard patterns (skip research-phase):
- **Phase 1 (OAuth + Multi-Lang Cards):** Well-documented patterns. Expo has official OAuth guides. TCGdex multi-language is a core API feature.
- **Phase 3 (Quick Wins):** Luck calculator is pure math. Image export uses documented ViewShot + sharing pattern. Promo codes are standard CRUD.
- **Phase 4 (i18n):** expo-localization + i18next is the officially recommended Expo approach.
- **Phase 6 (Local Finder):** PostGIS is 20+ years mature. Drizzle has official PostGIS guide. Privacy patterns are well-established.
- **Phase 7 (AI Suggestions):** OpenAI SDK is mature. GPT-4o-mini JSON mode is well-documented.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Most libraries verified via official docs and npm. Expo first-party modules dominate. Only card scanning accuracy is uncertain. |
| Features | HIGH | Extensive competitor analysis (PokeHub, PokeTrade, ptcgpocket.gg). Clear table stakes vs. differentiators. Feature dependencies well-mapped. |
| Architecture | MEDIUM-HIGH | Post model migration path is well-designed. Web app approach has a disagreement between research files (Next.js vs Expo Router). Deck meta scraping reliability is uncertain. |
| Pitfalls | HIGH | Pitfalls grounded in codebase analysis and real competitor failures. Prevention strategies are concrete. Recovery plans included. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Web app framework decision:** STACK.md recommends Expo Router web; ARCHITECTURE.md recommends Next.js. Resolve during Phase 9 planning. Lean toward Expo Router web for simplicity unless SSR requirements (deck meta SEO pages) prove compelling enough for Next.js.
- **Card scanning accuracy:** Perceptual hash matching against Pokemon TCG Pocket card images has not been validated. Need a spike/prototype early to confirm the approach before committing to Phase 5.
- **Limitless TCG Pocket coverage:** The Limitless TCG API may not have sufficient Pokemon TCG Pocket tournament data. Validate during Phase 8 planning; prepare admin manual entry as fallback.
- **TCGdex language completeness:** While TCGdex supports 9 languages for Pocket, completion rates vary. Run a data completeness audit during Phase 1 card import to identify gaps.
- **PostGIS on hosting provider:** Verify the production PostgreSQL host supports PostGIS extension before Phase 6 planning.
- **drizzle-postgis `box2d` bug:** Known quoting bug in drizzle-kit with PostGIS `box2d` type. Points work fine but verify during implementation.

## Sources

### Primary (HIGH confidence)
- [Expo Authentication Docs](https://docs.expo.dev/develop/authentication/)
- [Expo Apple Authentication](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)
- [Expo Google Authentication Guide](https://docs.expo.dev/guides/google-authentication/)
- [Expo Localization Guide](https://docs.expo.dev/guides/localization/)
- [Expo Camera Docs](https://docs.expo.dev/versions/latest/sdk/camera/)
- [Expo Location Docs](https://docs.expo.dev/versions/latest/sdk/location/)
- [Expo Web Development](https://docs.expo.dev/workflow/web/)
- [Drizzle ORM PostGIS Guide](https://orm.drizzle.team/docs/guides/postgis-geometry-point)
- [TCGdex API](https://tcgdex.dev) -- Multi-language Pokemon TCG data
- [OpenAI Node.js SDK](https://platform.openai.com/docs/libraries/node-js-library)
- [PostGIS Documentation](https://postgis.net/workshops/postgis-intro/knn.html)

### Secondary (MEDIUM confidence)
- [PokeHub App Store listing](https://apps.apple.com/us/app/pokehub-for-tcg-pocket/id6740797484) -- Competitor analysis, user reviews
- [PokeHub Google Play listing](https://play.google.com/store/apps/details?id=com.mi.poketrade&hl=en) -- User complaints about language mismatches
- [Limitless TCG Pocket Decks](https://play.limitlesstcg.com/decks?game=POCKET) -- Deck meta data source
- [PokemonMeta Top Decks](https://www.pokemonmeta.com/top-decks) -- Meta rankings
- [PokeScope Card Scanner](https://pokescope.app/blog/how-i-built-pokemon-card-scanner-ai-50000-users/) -- Card scanning approach comparison
- [@react-native-google-signin Expo Setup](https://react-native-google-signin.github.io/docs/setting-up/expo)

### Tertiary (LOW confidence)
- [drizzle-postgis GitHub](https://github.com/Schmavery/drizzle-postgis) -- Community plugin, known `box2d` bug
- [Pokemon-TCGP-Card-Scanner](https://github.com/1vcian/Pokemon-TCGP-Card-Scanner) -- Open-source card scanner using image hashing
- [Turborepo + Next.js + Expo Monorepo pattern](https://medium.com/@beenakumawat002/turborepo-monorepo-in-2025-next-js-react-native-shared-ui-type-safe-api-%EF%B8%8F-6194c83adff9) -- Monorepo setup reference

---
*Research completed: 2026-03-11*
*Ready for roadmap: yes*
