# Requirements: Pocket Trade Hub

**Defined:** 2026-03-07
**Core Value:** Players can instantly find other players who have cards they want AND want cards they have, eliminating the friction of manual trade hunting.

## v1 Requirements

### Authentication

- [ ] **AUTH-01**: User can create account with email and password
- [ ] **AUTH-02**: User can log in and stay logged in across app sessions
- [ ] **AUTH-03**: User can log out from any screen
- [ ] **AUTH-04**: User can reset password via email link

### Profiles

- [ ] **PROF-01**: User can set display name and avatar
- [ ] **PROF-02**: User can add their Pokemon TCG Pocket friend code
- [ ] **PROF-03**: User can view other users' profiles with trade history count
- [ ] **PROF-04**: User can copy another user's friend code to clipboard

### Card Database

- [ ] **CARD-01**: App contains complete Pokemon TCG Pocket card database
- [ ] **CARD-02**: User can search cards by name, set, rarity, and type
- [ ] **CARD-03**: User can browse cards by set with card images
- [ ] **CARD-04**: Admin can import new card sets via JSON
- [ ] **CARD-05**: Users receive push notification when new sets are added

### Inventory

- [ ] **INV-01**: User can add cards to their inventory
- [ ] **INV-02**: User can remove cards from inventory
- [ ] **INV-03**: User can update card quantities
- [ ] **INV-04**: User can bulk-add cards via set checklist UI
- [ ] **INV-05**: User can view collection completion per set with progress bar

### Wanted List

- [ ] **WANT-01**: User can add cards to their wanted list
- [ ] **WANT-02**: User can remove cards from wanted list
- [ ] **WANT-03**: User can set priority level (high/medium/low) on wanted cards

### Trade Matching

- [ ] **MATCH-01**: System automatically finds two-way trade matches (A has what B wants AND B has what A wants)
- [ ] **MATCH-02**: User sees pre-computed suggested trades when opening the app
- [ ] **MATCH-03**: User receives push notification when a new match is found
- [ ] **MATCH-04**: Matching engine uses wanted card priority to rank suggestions
- [ ] **MATCH-05**: User receives real-time in-app notification for new matches

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
| AUTH-01 | — | Pending |
| AUTH-02 | — | Pending |
| AUTH-03 | — | Pending |
| AUTH-04 | — | Pending |
| PROF-01 | — | Pending |
| PROF-02 | — | Pending |
| PROF-03 | — | Pending |
| PROF-04 | — | Pending |
| CARD-01 | — | Pending |
| CARD-02 | — | Pending |
| CARD-03 | — | Pending |
| CARD-04 | — | Pending |
| CARD-05 | — | Pending |
| INV-01 | — | Pending |
| INV-02 | — | Pending |
| INV-03 | — | Pending |
| INV-04 | — | Pending |
| INV-05 | — | Pending |
| WANT-01 | — | Pending |
| WANT-02 | — | Pending |
| WANT-03 | — | Pending |
| MATCH-01 | — | Pending |
| MATCH-02 | — | Pending |
| MATCH-03 | — | Pending |
| MATCH-04 | — | Pending |
| MATCH-05 | — | Pending |
| TRADE-01 | — | Pending |
| TRADE-02 | — | Pending |
| TRADE-03 | — | Pending |
| TRADE-04 | — | Pending |
| TRADE-05 | — | Pending |
| TRADE-06 | — | Pending |
| REP-01 | — | Pending |
| REP-02 | — | Pending |
| PREM-01 | — | Pending |
| PREM-02 | — | Pending |
| PREM-03 | — | Pending |
| PREM-04 | — | Pending |
| NOTIF-01 | — | Pending |
| NOTIF-02 | — | Pending |
| NOTIF-03 | — | Pending |

**Coverage:**
- v1 requirements: 41 total
- Mapped to phases: 0
- Unmapped: 41 ⚠️

---
*Requirements defined: 2026-03-07*
*Last updated: 2026-03-07 after initial definition*
