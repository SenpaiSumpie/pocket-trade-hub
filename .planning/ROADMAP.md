# Roadmap: Pocket Trade Hub

## Overview

Pocket Trade Hub goes from zero to a complete trade coordination platform in 6 phases. We start with project scaffolding and user accounts, build the card database, add collection management, implement the automated trade matching engine (the killer feature), layer on manual trade proposals with reputation, and finish with premium subscription features. Each phase delivers a complete, testable capability that unlocks the next.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation and Auth** - Project scaffolding, user accounts, and profiles (completed 2026-03-08)
- [ ] **Phase 2: Card Database** - Pokemon TCG Pocket card data, search, browse, and import system
- [x] **Phase 3: Collection Management** - User inventory and wanted card lists (completed 2026-03-09)
- [ ] **Phase 4: Trade Matching Engine** - Automated two-way match detection with notifications
- [ ] **Phase 5: Trade Proposals and Reputation** - Manual trade workflow, fairness evaluation, ratings, and notification inbox
- [ ] **Phase 6: Premium Tier** - Subscription billing, analytics, priority listings, and advanced alerts

## Phase Details

### Phase 1: Foundation and Auth
**Goal**: Users can create accounts, manage their profiles, and view other traders' profiles
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, PROF-01, PROF-02, PROF-03, PROF-04
**Success Criteria** (what must be TRUE):
  1. User can sign up with email/password, log in, and remain logged in across app restarts
  2. User can log out from any screen in the app
  3. User can reset a forgotten password via email
  4. User can set their display name, avatar, and Pokemon TCG Pocket friend code
  5. User can view another user's profile and copy their friend code
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — Monorepo scaffolding, shared schemas, API server, DB schema, auth and profile endpoints
- [x] 01-02-PLAN.md — Expo mobile app with auth screens, tab navigation, profile management, and onboarding

### Phase 2: Card Database
**Goal**: Users can browse and search the complete Pokemon TCG Pocket card catalog
**Depends on**: Phase 1
**Requirements**: CARD-01, CARD-02, CARD-03, CARD-04, CARD-05
**Success Criteria** (what must be TRUE):
  1. App displays the complete Pokemon TCG Pocket card database with card images organized by set
  2. User can search cards by name, set, rarity, and type with results updating as they type
  3. Admin can import a new card set by uploading a JSON file and users see the new cards immediately
  4. Users receive a push notification when a new card set is added to the database
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — Shared card schemas, DB tables, card/set API routes, admin import, and TCGdex seed script
- [ ] 02-02-PLAN.md — Push notification infrastructure (token storage, Expo Push SDK, admin import notification wiring)
- [ ] 02-03-PLAN.md — Mobile card browsing UI (FlashList grid, set picker, live search, filter chips, card detail modal)

### Phase 3: Collection Management
**Goal**: Users can track which cards they own and which cards they want
**Depends on**: Phase 2
**Requirements**: INV-01, INV-02, INV-03, INV-04, INV-05, WANT-01, WANT-02, WANT-03
**Success Criteria** (what must be TRUE):
  1. User can add, remove, and update quantities of cards in their inventory
  2. User can bulk-add cards using a per-set checklist interface
  3. User can view collection completion percentage per set with a progress bar
  4. User can add and remove cards from their wanted list with priority levels (high/medium/low)
**Plans**: 3 plans

Plans:
- [ ] 03-01-PLAN.md — Backend API: shared schemas, DB tables, collection/wanted services and routes with integration tests
- [ ] 03-02-PLAN.md — Mobile state and UI: Zustand store, API hooks, segmented Cards tab, card overlays, checklist mode, detail modal actions
- [ ] 03-03-PLAN.md — Home tab collection summary card and end-to-end verification

### Phase 4: Trade Matching Engine
**Goal**: Users are automatically matched with compatible trade partners who have what they want and want what they have
**Depends on**: Phase 3
**Requirements**: MATCH-01, MATCH-02, MATCH-03, MATCH-04, MATCH-05
**Success Criteria** (what must be TRUE):
  1. System detects two-way matches where user A has what B wants and B has what A wants
  2. User sees pre-computed suggested trades ranked by wanted card priority when opening the app
  3. User receives a push notification when a new trade match is found
  4. User receives a real-time in-app notification when a new match appears while using the app
**Plans**: 2 plans

Plans:
- [ ] 04-01-PLAN.md — Backend matching engine: shared schemas, trade_matches DB table, Redis/Socket.IO infrastructure, two-way matching algorithm, BullMQ debounced recomputation, match API routes, push notifications
- [ ] 04-02-PLAN.md — Mobile trades experience: Zustand store, Socket.IO real-time hook, Trades tab UI with match cards, detail modal, sort toggle, tab badge, toast notifications

### Phase 5: Trade Proposals and Reputation
**Goal**: Users can negotiate specific trades, track proposals, rate trade partners, and stay informed via notifications
**Depends on**: Phase 4
**Requirements**: TRADE-01, TRADE-02, TRADE-03, TRADE-04, TRADE-05, TRADE-06, REP-01, REP-02, NOTIF-01, NOTIF-02, NOTIF-03
**Success Criteria** (what must be TRUE):
  1. User can create a trade proposal selecting specific cards to give and receive, and the system shows a fairness evaluation
  2. User can accept, reject, or counter-offer on incoming trade proposals
  3. User can view all pending incoming and outgoing proposals and mark trades as completed
  4. User can rate a trade partner after completing a trade, and ratings appear on profiles with trade count
  5. User receives push notifications for new proposals and proposal responses, with a persistent in-app notification inbox
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD
- [ ] 05-03: TBD

### Phase 6: Premium Tier
**Goal**: Users can subscribe to a premium tier that provides analytics, priority placement, and advanced alerts
**Depends on**: Phase 5
**Requirements**: PREM-01, PREM-02, PREM-03, PREM-04
**Success Criteria** (what must be TRUE):
  1. User can subscribe to premium ($5/month) via in-app purchase on iOS and Android
  2. Premium user can view card demand analytics showing most wanted, least available, and trending cards
  3. Premium user's trade offers appear before free-tier offers in search results
  4. Premium user receives advanced alerts when someone lists a card on their wanted list
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation and Auth | 2/2 | Complete   | 2026-03-08 |
| 2. Card Database | 2/3 | In Progress|  |
| 3. Collection Management | 3/3 | Complete   | 2026-03-09 |
| 4. Trade Matching Engine | 0/2 | Not started | - |
| 5. Trade Proposals and Reputation | 0/3 | Not started | - |
| 6. Premium Tier | 0/2 | Not started | - |
