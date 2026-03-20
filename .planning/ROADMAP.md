# Roadmap: Pocket Trade Hub

## Milestones

- ✅ **v1.0 MVP** -- Phases 1-6 (shipped 2011-03-11)
- 🚧 **v2.0 Full Platform** -- Phases 7-12 (in progress)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-6) -- SHIPPED 2011-03-11</summary>

- [x] Phase 1: Foundation and Auth (2/2 plans) -- completed 2011-03-08
- [x] Phase 2: Card Database (3/3 plans) -- completed 2011-03-09
- [x] Phase 3: Collection Management (3/3 plans) -- completed 2011-03-09
- [x] Phase 4: Trade Matching Engine (2/2 plans) -- completed 2011-03-09
- [x] Phase 5: Trade Proposals and Reputation (4/4 plans) -- completed 2011-03-11
- [x] Phase 6: Premium Tier (3/3 plans) -- completed 2011-03-11

Full details: `.planning/milestones/v1.0-ROADMAP.md`

</details>

### v2.0 Full Platform (In Progress)

**Milestone Goal:** Transform Pocket Trade Hub from MVP into a full-featured trading platform with competitive parity to PokeHub plus unique differentiators (deck meta, AI suggestions, fairness eval, local finder, structured proposals over chat).

**Phase Numbering:**
- Integer phases (7, 8, 9...): Planned milestone work
- Decimal phases (8.1, 8.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 7: Multi-Language Cards and OAuth** - Language-aware card database for 9 languages plus Google/Apple sign-in (completed 2011-03-14)
- [x] **Phase 8: Post-Based Trading** - Offering/Seeking trade posts replacing automatic-only matching (completed 2011-03-15)
- [ ] **Phase 9: Engagement Quick Wins** - Luck calculator, image export, and promo codes
- [x] **Phase 10: Internationalization** - App UI translated to 10 languages with user language selection (completed 2011-03-19)
- [ ] **Phase 11: Intelligence** - AI trade suggestions, deck meta analytics, and tier lists
- [ ] **Phase 12: Web App Companion** - Browser-based access to trading, collection, and meta features

## Phase Details

### Phase 7: Multi-Language Cards and OAuth
**Goal**: Users can manage cards in their actual language and sign in with Google or Apple accounts
**Depends on**: Phase 6 (v1.0 complete)
**Requirements**: CARD-01, CARD-02, CARD-03, CARD-04, AUTH-01, AUTH-02, AUTH-03, AUTH-04
**Success Criteria** (what must be TRUE):
  1. User can browse cards in any of the 9 supported languages and see translated names and images
  2. User can select a specific language when adding a card to their collection
  3. User can filter and search cards by language across the card database
  4. User can sign up and log in using their Google or Apple account
  5. Existing email user can link their Google or Apple account without losing data
**Plans**: 5 plans

Plans:
- [ ] 07-01-PLAN.md -- DB schema, shared types, and multi-language seed script
- [ ] 07-02-PLAN.md -- Card API language support and collection language tracking
- [ ] 07-03-PLAN.md -- OAuth API backend (Google + Apple token verification, account linking)
- [ ] 07-04-PLAN.md -- Mobile card language UI (browsing, detail, collection)
- [ ] 07-05-PLAN.md -- Mobile OAuth UI (sign-in buttons, linking modal, profile)

### Phase 8: Post-Based Trading
**Goal**: Users can create Offering and Seeking trade posts and get matched with complementary traders
**Depends on**: Phase 7 (language-aware cards required for language-accurate posts)
**Requirements**: TRAD-01, TRAD-02, TRAD-03, TRAD-04, TRAD-05, TRAD-06
**Success Criteria** (what must be TRUE):
  1. User can create an Offering post listing cards they want to trade away, including card language
  2. User can create a Seeking post listing cards they want to receive, including card language
  3. User can browse and search posts with filters for card, set, rarity, and language
  4. User receives notifications when someone posts a complementary match to their posts
  5. User can send a trade proposal directly from a matched post and complete the proposal workflow
**Plans**: 4 plans

Plans:
- [ ] 08-01-PLAN.md -- DB schema, shared types, post service, and REST API routes
- [ ] 08-02-PLAN.md -- Post matching worker, proposal adaptation, and auto-close
- [ ] 08-03-PLAN.md -- Mobile Market tab with post browsing, filtering, and creation
- [ ] 08-04-PLAN.md -- Trades tab refactor, real-time events, and end-to-end verification

### Phase 9: Engagement Quick Wins
**Goal**: Users get high-value utility features that drive engagement and social sharing
**Depends on**: Phase 8 (posts exist for image export context)
**Requirements**: INTL-05, DISC-03, DISC-04
**Success Criteria** (what must be TRUE):
  1. User can calculate pack opening probabilities for any specific card they want
  2. User can export their collection or trade posts as a shareable image
  3. User can redeem a gift or promo code to receive premium time or other benefits
**Plans**: 3 plans

Plans:
- [ ] 09-01-PLAN.md -- Luck calculator with pull rate math and CardDetailModal integration
- [ ] 09-02-PLAN.md -- Promo code system (DB, API, service, mobile redemption UI)
- [ ] 09-03-PLAN.md -- Image export with four templates and native share sheet

### Phase 10: Internationalization
**Goal**: Users can use the entire app UI in their preferred language
**Depends on**: Phase 8 (all UI strings from core features must exist before extraction)
**Requirements**: PLAT-03, PLAT-04
**Success Criteria** (what must be TRUE):
  1. User can select their preferred app language from 10 supported languages
  2. All app UI text (navigation, labels, messages, errors) displays in the selected language
  3. App defaults to the device language if supported, falling back to English
**Plans**: 3 plans

Plans:
- [ ] 10-01-PLAN.md -- i18n infrastructure, shared language constants, DB migration, en.json extraction
- [ ] 10-02-PLAN.md -- Mobile string replacement with t() calls and language selector UI
- [ ] 10-03-PLAN.md -- 9 non-English translation files and server-side i18n wiring

### Phase 11: Intelligence
**Goal**: Users get AI-powered trade guidance and competitive deck analytics
**Depends on**: Phase 8 (post and trade history data needed for meaningful suggestions)
**Requirements**: INTL-01, TRAD-07, INTL-02, INTL-03, INTL-04
**Success Criteria** (what must be TRUE):
  1. Premium user sees AI-generated trade suggestions with reasoning on app open
  2. User can browse the current competitive deck meta with top decks, win rates, and tournament results
  3. User can view curated tier lists ranking current meta decks
  4. User can create and share their own custom tier lists
**Plans**: 4 plans

Plans:
- [ ] 11-01-PLAN.md -- DB schema, shared types, meta scraper, and meta data service
- [ ] 11-02-PLAN.md -- Suggestion service, tier list service, API routes, and BullMQ workers
- [ ] 11-03-PLAN.md -- Mobile Meta tab with deck rankings and tier list browser
- [ ] 11-04-PLAN.md -- Smart Trades on Home tab, tier list creator, and i18n keys

### Phase 12: Web App Companion
**Goal**: Users can access core trading and collection features from a web browser
**Depends on**: Phase 10 (i18n should be in place so web app launches localized)
**Requirements**: PLAT-01, PLAT-02
**Success Criteria** (what must be TRUE):
  1. User can access the app via web browser and see the same cards, posts, and collection data
  2. User can browse, search, and create trade posts from the web app
  3. User can manage their collection and view deck meta content from the web app
**Plans**: TBD

Plans:
- [ ] 12-01: TBD
- [ ] 12-02: TBD
- [ ] 12-03: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 7 -> 8 -> 9 -> 10 -> 11 -> 12
(Decimal phases, if inserted, execute between their surrounding integers.)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation and Auth | v1.0 | 2/2 | Complete | 2011-03-08 |
| 2. Card Database | v1.0 | 3/3 | Complete | 2011-03-09 |
| 3. Collection Management | v1.0 | 3/3 | Complete | 2011-03-09 |
| 4. Trade Matching Engine | v1.0 | 2/2 | Complete | 2011-03-09 |
| 5. Trade Proposals and Reputation | v1.0 | 4/4 | Complete | 2011-03-11 |
| 6. Premium Tier | v1.0 | 3/3 | Complete | 2011-03-11 |
| 7. Multi-Language Cards and OAuth | 5/5 | Complete   | 2011-03-15 | - |
| 8. Post-Based Trading | 4/4 | Complete   | 2011-03-15 | - |
| 9. Engagement Quick Wins | v2.0 | 3/3 | Complete | 2011-03-15 |
| 10. Internationalization | 3/3 | Complete    | 2011-03-19 | - |
| 11. Intelligence | 2/5 | In Progress|  | - |
| 12. Web App Companion | v2.0 | 0/TBD | Not started | - |
