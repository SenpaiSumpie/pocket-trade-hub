# Roadmap: Pocket Trade Hub

## Milestones

- ✅ **v1.0 MVP** -- Phases 1-6 (shipped 2026-03-11)
- 🚧 **v2.0 Full Platform** -- Phases 7-13 (in progress)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-6) -- SHIPPED 2026-03-11</summary>

- [x] Phase 1: Foundation and Auth (2/2 plans) -- completed 2026-03-08
- [x] Phase 2: Card Database (3/3 plans) -- completed 2026-03-09
- [x] Phase 3: Collection Management (3/3 plans) -- completed 2026-03-09
- [x] Phase 4: Trade Matching Engine (2/2 plans) -- completed 2026-03-09
- [x] Phase 5: Trade Proposals and Reputation (4/4 plans) -- completed 2026-03-11
- [x] Phase 6: Premium Tier (3/3 plans) -- completed 2026-03-11

Full details: `.planning/milestones/v1.0-ROADMAP.md`

</details>

### v2.0 Full Platform (In Progress)

**Milestone Goal:** Transform Pocket Trade Hub from MVP into a full-featured trading platform with competitive parity to PokeHub plus unique differentiators (deck meta, AI suggestions, fairness eval, local finder, structured proposals over chat).

**Phase Numbering:**
- Integer phases (7, 8, 9...): Planned milestone work
- Decimal phases (8.1, 8.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 7: Multi-Language Cards and OAuth** - Language-aware card database for 9 languages plus Google/Apple sign-in
- [ ] **Phase 8: Post-Based Trading** - Offering/Seeking trade posts replacing automatic-only matching
- [ ] **Phase 9: Engagement Quick Wins** - Luck calculator, image export, and promo codes
- [ ] **Phase 10: Internationalization** - App UI translated to 10 languages with user language selection
- [ ] **Phase 11: Local Trade Finder** - Nearby trader discovery with privacy-preserving location sharing
- [ ] **Phase 12: Intelligence** - AI trade suggestions, deck meta analytics, and tier lists
- [ ] **Phase 13: Web App Companion** - Browser-based access to trading, collection, and meta features

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
**Plans**: TBD

Plans:
- [ ] 08-01: TBD
- [ ] 08-02: TBD
- [ ] 08-03: TBD

### Phase 9: Engagement Quick Wins
**Goal**: Users get high-value utility features that drive engagement and social sharing
**Depends on**: Phase 8 (posts exist for image export context)
**Requirements**: INTL-05, DISC-03, DISC-04
**Success Criteria** (what must be TRUE):
  1. User can calculate pack opening probabilities for any specific card they want
  2. User can export their collection or trade posts as a shareable image
  3. User can redeem a gift or promo code to receive premium time or other benefits
**Plans**: TBD

Plans:
- [ ] 09-01: TBD
- [ ] 09-02: TBD

### Phase 10: Internationalization
**Goal**: Users can use the entire app UI in their preferred language
**Depends on**: Phase 8 (all UI strings from core features must exist before extraction)
**Requirements**: PLAT-03, PLAT-04
**Success Criteria** (what must be TRUE):
  1. User can select their preferred app language from 10 supported languages
  2. All app UI text (navigation, labels, messages, errors) displays in the selected language
  3. App defaults to the device language if supported, falling back to English
**Plans**: TBD

Plans:
- [ ] 10-01: TBD
- [ ] 10-02: TBD

### Phase 11: Local Trade Finder
**Goal**: Users can discover nearby traders for convenient local trading
**Depends on**: Phase 8 (posts provide content for local discovery)
**Requirements**: DISC-01, DISC-02
**Success Criteria** (what must be TRUE):
  1. User can opt in to share their approximate location for local trade discovery
  2. User can browse nearby traders within a configurable distance range
  3. User can disable location sharing at any time and their location data is removed
**Plans**: TBD

Plans:
- [ ] 11-01: TBD
- [ ] 11-02: TBD

### Phase 12: Intelligence
**Goal**: Users get AI-powered trade guidance and competitive deck analytics
**Depends on**: Phase 8 (post and trade history data needed for meaningful suggestions)
**Requirements**: INTL-01, TRAD-07, INTL-02, INTL-03, INTL-04
**Success Criteria** (what must be TRUE):
  1. Premium user sees AI-generated trade suggestions with reasoning on app open
  2. User can browse the current competitive deck meta with top decks, win rates, and tournament results
  3. User can view curated tier lists ranking current meta decks
  4. User can create and share their own custom tier lists
**Plans**: TBD

Plans:
- [ ] 12-01: TBD
- [ ] 12-02: TBD
- [ ] 12-03: TBD

### Phase 13: Web App Companion
**Goal**: Users can access core trading and collection features from a web browser
**Depends on**: Phase 10 (i18n should be in place so web app launches localized)
**Requirements**: PLAT-01, PLAT-02
**Success Criteria** (what must be TRUE):
  1. User can access the app via web browser and see the same cards, posts, and collection data
  2. User can browse, search, and create trade posts from the web app
  3. User can manage their collection and view deck meta content from the web app
**Plans**: TBD

Plans:
- [ ] 13-01: TBD
- [ ] 13-02: TBD
- [ ] 13-03: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 7 -> 8 -> 9 -> 10 -> 11 -> 12 -> 13
(Decimal phases, if inserted, execute between their surrounding integers.)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation and Auth | v1.0 | 2/2 | Complete | 2026-03-08 |
| 2. Card Database | v1.0 | 3/3 | Complete | 2026-03-09 |
| 3. Collection Management | v1.0 | 3/3 | Complete | 2026-03-09 |
| 4. Trade Matching Engine | v1.0 | 2/2 | Complete | 2026-03-09 |
| 5. Trade Proposals and Reputation | v1.0 | 4/4 | Complete | 2026-03-11 |
| 6. Premium Tier | v1.0 | 3/3 | Complete | 2026-03-11 |
| 7. Multi-Language Cards and OAuth | v2.0 | 0/5 | Not started | - |
| 8. Post-Based Trading | v2.0 | 0/TBD | Not started | - |
| 9. Engagement Quick Wins | v2.0 | 0/TBD | Not started | - |
| 10. Internationalization | v2.0 | 0/TBD | Not started | - |
| 11. Local Trade Finder | v2.0 | 0/TBD | Not started | - |
| 12. Intelligence | v2.0 | 0/TBD | Not started | - |
| 13. Web App Companion | v2.0 | 0/TBD | Not started | - |
