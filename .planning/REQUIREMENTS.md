# Requirements: Pocket Trade Hub

**Defined:** 2026-03-07
**Core Value:** Players can instantly find other players who have cards they want AND want cards they have, eliminating the friction of manual trade hunting.

## v1 Requirements

### Authentication

- [x] **AUTH-01**: User can create account with email and password
- [x] **AUTH-02**: User can log in and stay logged in across app sessions
- [x] **AUTH-03**: User can log out from any screen
- [x] **AUTH-04**: User can reset password via email link

### Profiles

- [x] **PROF-01**: User can set display name and avatar
- [x] **PROF-02**: User can add their Pokemon TCG Pocket friend code
- [x] **PROF-03**: User can view other users' profiles with trade history count
- [x] **PROF-04**: User can copy another user's friend code to clipboard

### Card Database

- [x] **CARD-01**: App contains complete Pokemon TCG Pocket card database
- [x] **CARD-02**: User can search cards by name, set, rarity, and type
- [x] **CARD-03**: User can browse cards by set with card images
- [x] **CARD-04**: Admin can import new card sets via JSON
- [x] **CARD-05**: Users receive push notification when new sets are added

### Inventory

- [x] **INV-01**: User can add cards to their inventory
- [x] **INV-02**: User can remove cards from inventory
- [x] **INV-03**: User can update card quantities
- [x] **INV-04**: User can bulk-add cards via set checklist UI
- [x] **INV-05**: User can view collection completion per set with progress bar

### Wanted List

- [x] **WANT-01**: User can add cards to their wanted list
- [x] **WANT-02**: User can remove cards from wanted list
- [x] **WANT-03**: User can set priority level (high/medium/low) on wanted cards

### Trade Matching

- [x] **MATCH-01**: System automatically finds two-way trade matches (A has what B wants AND B has what A wants)
- [x] **MATCH-02**: User sees pre-computed suggested trades when opening the app
- [x] **MATCH-03**: User receives push notification when a new match is found
- [x] **MATCH-04**: Matching engine uses wanted card priority to rank suggestions
- [x] **MATCH-05**: User receives real-time in-app notification for new matches

### Trade Proposals

- [ ] **TRADE-01**: User can create a trade proposal selecting cards to give and receive
- [ ] **TRADE-02**: User can accept or reject incoming trade proposals
- [ ] **TRADE-03**: User can send a counter-offer modifying a received proposal
- [ ] **TRADE-04**: User can view all pending incoming and outgoing proposals
- [ ] **TRADE-05**: User can mark a trade as completed (executed in-game)
- [ ] **TRADE-06**: System shows trade fairness evaluation (relative rarity/demand)

### Reputation

- [ ] **REP-01**: User can rate a trade partner after completing a trade
- [ ] **REP-02**: User profile shows trade count and average rating

### Premium

- [ ] **PREM-01**: User can subscribe to premium tier via in-app purchase ($5/month)
- [ ] **PREM-02**: Premium users see card demand analytics (most wanted, least available, trending)
- [ ] **PREM-03**: Premium users' trade offers appear first in search results
- [ ] **PREM-04**: Premium users receive advanced card alerts for wanted cards

### Notifications

- [ ] **NOTIF-01**: User receives push notifications for new trade proposals
- [ ] **NOTIF-02**: User receives push notifications for proposal responses (accepted/rejected)
- [ ] **NOTIF-03**: User has persistent in-app notification inbox

## v2 Requirements

### Deck Meta

- **DECK-01**: User can browse competitive deck archetypes with win rates
- **DECK-02**: User can see which cards they're missing for a deck
- **DECK-03**: System tracks tournament results and meta trends

### Convenience

- **CONV-01**: User can scan cards via camera to add to inventory
- **CONV-02**: OAuth login (Google/Apple)
- **CONV-03**: Multi-language support

### Advanced Trading

- **ADV-01**: AI-powered trade suggestions based on trading patterns
- **ADV-02**: Local trade finder (nearby players)

## Out of Scope

| Feature | Reason |
|---------|--------|
| In-app trade execution | Trades must happen in Pokemon TCG Pocket; coordination only |
| Real-money marketplace | Legal/ToS minefield for digital cards |
| Chat/messaging system | Moderation liability; structured proposals + Discord links sufficient |
| Card price tracking (dollar values) | PTCP cards don't have real-money prices; use demand metrics instead |
| Social feed / timeline | Scope bloat; users come to trade, not scroll |
| Gamification / badges / leaderboards | Encourages fake trades; simple reputation sufficient |
| Web app | Mobile-first; web deferred |
| Other TCGs (Magic, Yu-Gi-Oh) | Long-term expansion only |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| PROF-01 | Phase 1 | Complete |
| PROF-02 | Phase 1 | Complete |
| PROF-03 | Phase 1 | Complete |
| PROF-04 | Phase 1 | Complete |
| CARD-01 | Phase 2 | Complete |
| CARD-02 | Phase 2 | Complete |
| CARD-03 | Phase 2 | Complete |
| CARD-04 | Phase 2 | Complete |
| CARD-05 | Phase 2 | Complete |
| INV-01 | Phase 3 | Complete |
| INV-02 | Phase 3 | Complete |
| INV-03 | Phase 3 | Complete |
| INV-04 | Phase 3 | Complete |
| INV-05 | Phase 3 | Complete |
| WANT-01 | Phase 3 | Complete |
| WANT-02 | Phase 3 | Complete |
| WANT-03 | Phase 3 | Complete |
| MATCH-01 | Phase 4 | Complete |
| MATCH-02 | Phase 4 | Complete |
| MATCH-03 | Phase 4 | Complete |
| MATCH-04 | Phase 4 | Complete |
| MATCH-05 | Phase 4 | Complete |
| TRADE-01 | Phase 5 | Backend Complete |
| TRADE-02 | Phase 5 | Backend Complete |
| TRADE-03 | Phase 5 | Backend Complete |
| TRADE-04 | Phase 5 | Backend Complete |
| TRADE-05 | Phase 5 | Backend Complete |
| TRADE-06 | Phase 5 | Backend Complete |
| REP-01 | Phase 5 | Backend Complete |
| REP-02 | Phase 5 | Backend Complete |
| NOTIF-01 | Phase 5 | Backend Complete |
| NOTIF-02 | Phase 5 | Backend Complete |
| NOTIF-03 | Phase 5 | Backend Complete |
| PREM-01 | Phase 6 | Pending |
| PREM-02 | Phase 6 | Pending |
| PREM-03 | Phase 6 | Pending |
| PREM-04 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 41 total
- Mapped to phases: 41
- Unmapped: 0

---
*Requirements defined: 2026-03-07*
*Last updated: 2026-03-07 after roadmap creation*
