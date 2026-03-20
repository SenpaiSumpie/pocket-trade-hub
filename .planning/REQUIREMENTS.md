# Requirements: Pocket Trade Hub

**Defined:** 2026-03-11
**Core Value:** Players can instantly find other players who have cards they want AND want cards they have, eliminating the friction of manual trade hunting.

## v2.0 Requirements

Requirements for v2.0 Full Platform release. Each maps to roadmap phases.

### Trading

- [x] **TRAD-01**: User can create an Offering post with cards they want to trade away
- [x] **TRAD-02**: User can create a Seeking post with cards they want to receive
- [x] **TRAD-03**: User can browse/search Offering and Seeking posts with filters (card, set, rarity, language)
- [x] **TRAD-04**: User gets matched with complementary posts (my Offering matches their Seeking and vice versa)
- [x] **TRAD-05**: User can send a trade proposal directly from a matched post
- [x] **TRAD-06**: Posts include card language to prevent language mismatches
- [x] **TRAD-07**: User receives smart trade suggestions on app open based on their posts and activity (premium)

### Cards

- [x] **CARD-01**: Card database supports 9 languages (EN, DE, ES, FR, IT, JA, KO, PT, ZH)
- [x] **CARD-02**: User can select card language when adding to collection
- [x] **CARD-03**: User can filter/search cards by language
- [x] **CARD-04**: Card detail view shows available languages and translations

### Auth

- [x] **AUTH-01**: User can sign up/login with Google account
- [x] **AUTH-02**: User can sign up/login with Apple account
- [x] **AUTH-03**: Existing email users can link Google/Apple accounts
- [x] **AUTH-04**: OAuth accounts that match existing email prompt for account linking (no silent merge)

### Intelligence

- [x] **INTL-01**: User can view AI-powered trade suggestions with reasoning (premium)
- [x] **INTL-02**: User can browse competitive deck meta (top decks, win rates, tournament results)
- [x] **INTL-03**: User can view tier lists for current meta decks
- [x] **INTL-04**: User can create and share custom tier lists
- [ ] **INTL-05**: User can calculate pack opening probabilities for specific cards

### Discovery

- ~~**DISC-01**: User can opt-in to share approximate location for local trade finder~~ (Removed — not needed for virtual trades)
- ~~**DISC-02**: User can browse nearby traders within configurable distance~~ (Removed — not needed for virtual trades)
- [x] **DISC-03**: User can export collection or trade posts as shareable images
- [x] **DISC-04**: User can redeem gift/promo codes for premium time or benefits

### Platform

- [ ] **PLAT-01**: Users can access the app via web browser (companion web app)
- [ ] **PLAT-02**: Web app supports browse, search, and trading features
- [x] **PLAT-03**: App UI supports 10 languages via i18n
- [x] **PLAT-04**: User can select preferred app language

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
| CARD-01 | Phase 7 | Complete |
| CARD-02 | Phase 7 | Complete |
| CARD-03 | Phase 7 | Complete |
| CARD-04 | Phase 7 | Complete |
| AUTH-01 | Phase 7 | Complete |
| AUTH-02 | Phase 7 | Complete |
| AUTH-03 | Phase 7 | Complete |
| AUTH-04 | Phase 7 | Complete |
| TRAD-01 | Phase 8 | Complete |
| TRAD-02 | Phase 8 | Complete |
| TRAD-03 | Phase 8 | Complete |
| TRAD-04 | Phase 8 | Complete |
| TRAD-05 | Phase 8 | Complete |
| TRAD-06 | Phase 8 | Complete |
| INTL-05 | Phase 9 | Pending |
| DISC-03 | Phase 9 | Pending |
| DISC-04 | Phase 9 | Complete |
| PLAT-03 | Phase 10 | Complete |
| PLAT-04 | Phase 10 | Complete |
| DISC-01 | Removed | Removed (local trade finder not needed for virtual trades) |
| DISC-02 | Removed | Removed (local trade finder not needed for virtual trades) |
| INTL-01 | Phase 12 | Complete |
| TRAD-07 | Phase 12 | Complete |
| INTL-02 | Phase 12 | Complete |
| INTL-03 | Phase 12 | Complete |
| INTL-04 | Phase 12 | Complete |
| PLAT-01 | Phase 12 | Pending |
| PLAT-02 | Phase 12 | Pending |

**Coverage:**
- v2.0 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0

---
*Requirements defined: 2026-03-11*
*Last updated: 2026-03-11 after roadmap creation*
