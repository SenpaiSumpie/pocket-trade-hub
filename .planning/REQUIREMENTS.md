# Requirements: Pocket Trade Hub

**Defined:** 2026-03-11
**Core Value:** Players can instantly find other players who have cards they want AND want cards they have, eliminating the friction of manual trade hunting.

## v2.0 Requirements

Requirements for v2.0 Full Platform release. Each maps to roadmap phases.

### Trading

- [ ] **TRAD-01**: User can create an Offering post with cards they want to trade away
- [ ] **TRAD-02**: User can create a Seeking post with cards they want to receive
- [ ] **TRAD-03**: User can browse/search Offering and Seeking posts with filters (card, set, rarity, language)
- [ ] **TRAD-04**: User gets matched with complementary posts (my Offering matches their Seeking and vice versa)
- [ ] **TRAD-05**: User can send a trade proposal directly from a matched post
- [ ] **TRAD-06**: Posts include card language to prevent language mismatches
- [ ] **TRAD-07**: User receives smart trade suggestions on app open based on their posts and activity (premium)

### Cards

- [ ] **CARD-01**: Card database supports 9 languages (EN, DE, ES, FR, IT, JA, KO, PT, ZH)
- [ ] **CARD-02**: User can select card language when adding to collection
- [ ] **CARD-03**: User can filter/search cards by language
- [ ] **CARD-04**: Card detail view shows available languages and translations

### Auth

- [ ] **AUTH-01**: User can sign up/login with Google account
- [ ] **AUTH-02**: User can sign up/login with Apple account
- [ ] **AUTH-03**: Existing email users can link Google/Apple accounts
- [ ] **AUTH-04**: OAuth accounts that match existing email prompt for account linking (no silent merge)

### Intelligence

- [ ] **INTL-01**: User can view AI-powered trade suggestions with reasoning (premium)
- [ ] **INTL-02**: User can browse competitive deck meta (top decks, win rates, tournament results)
- [ ] **INTL-03**: User can view tier lists for current meta decks
- [ ] **INTL-04**: User can create and share custom tier lists
- [ ] **INTL-05**: User can calculate pack opening probabilities for specific cards

### Discovery

- [ ] **DISC-01**: User can opt-in to share approximate location for local trade finder
- [ ] **DISC-02**: User can browse nearby traders within configurable distance
- [ ] **DISC-03**: User can export collection or trade posts as shareable images
- [ ] **DISC-04**: User can redeem gift/promo codes for premium time or benefits

### Platform

- [ ] **PLAT-01**: Users can access the app via web browser (companion web app)
- [ ] **PLAT-02**: Web app supports browse, search, and trading features
- [ ] **PLAT-03**: App UI supports 10 languages via i18n
- [ ] **PLAT-04**: User can select preferred app language

## Future Requirements

Deferred to v3+. Tracked but not in current roadmap.

### Card Scanning

- **SCAN-01**: User can import cards by scanning screenshots
- **SCAN-02**: User can import cards via camera capture
- **SCAN-03**: Scanned cards show top-3 candidates for user confirmation

### Advanced AI

- **AI-01**: Full ML model for personalized trade suggestions (beyond rule-based)
- **AI-02**: AI-powered collection completion strategy recommendations

### Competitive

- **COMP-01**: Tournament bracket system with live results
- **COMP-02**: Full deck builder with card previews

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| In-game trade execution | App coordinates trades, players execute in Pokemon TCG Pocket |
| Chat/messaging system | Moderation liability; structured proposals are the differentiator vs PokeHub |
| Real-money marketplace | Legal/ToS minefield for digital cards |
| Social feed / timeline | Scope bloat; users come to trade, not scroll |
| Gamification / badges / leaderboards | Encourages fake trades; simple reputation sufficient |
| Other TCGs (Magic, Yu-Gi-Oh) | Long-term expansion only |
| Background location tracking | Battery drain, privacy nightmare; on-demand only |
| On-device ML for card scanning | 50-200MB app bloat for worse accuracy than server-side |
| Full deck builder | Existing tools (ptcgpocket.gg) cover this |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CARD-01 | Phase 7 | Pending |
| CARD-02 | Phase 7 | Pending |
| CARD-03 | Phase 7 | Pending |
| CARD-04 | Phase 7 | Pending |
| AUTH-01 | Phase 7 | Pending |
| AUTH-02 | Phase 7 | Pending |
| AUTH-03 | Phase 7 | Pending |
| AUTH-04 | Phase 7 | Pending |
| TRAD-01 | Phase 8 | Pending |
| TRAD-02 | Phase 8 | Pending |
| TRAD-03 | Phase 8 | Pending |
| TRAD-04 | Phase 8 | Pending |
| TRAD-05 | Phase 8 | Pending |
| TRAD-06 | Phase 8 | Pending |
| INTL-05 | Phase 9 | Pending |
| DISC-03 | Phase 9 | Pending |
| DISC-04 | Phase 9 | Pending |
| PLAT-03 | Phase 10 | Pending |
| PLAT-04 | Phase 10 | Pending |
| DISC-01 | Phase 11 | Pending |
| DISC-02 | Phase 11 | Pending |
| INTL-01 | Phase 12 | Pending |
| TRAD-07 | Phase 12 | Pending |
| INTL-02 | Phase 12 | Pending |
| INTL-03 | Phase 12 | Pending |
| INTL-04 | Phase 12 | Pending |
| PLAT-01 | Phase 13 | Pending |
| PLAT-02 | Phase 13 | Pending |

**Coverage:**
- v2.0 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0

---
*Requirements defined: 2026-03-11*
*Last updated: 2026-03-11 after roadmap creation*
