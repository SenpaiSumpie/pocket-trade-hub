---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Full Platform
status: executing
stopped_at: Phase 12 context gathered
last_updated: "2026-03-20T22:18:18.071Z"
last_activity: 2026-03-20 -- Completed Phase 11 Plan 01 (data layer and scraping infrastructure)
progress:
  total_phases: 6
  completed_phases: 5
  total_plans: 20
  completed_plans: 20
  percent: 85
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-11)

**Core value:** Players can instantly find other players who have cards they want AND want cards they have, eliminating the friction of manual trade hunting.
**Current focus:** v2.0 Full Platform -- Phase 11 in progress

## Current Position

Phase: 11 of 12 (Intelligence)
Plan: 2 of 5 complete
Status: Executing Phase 11
Last activity: 2026-03-20 -- Completed Phase 11 Plan 01 (data layer and scraping infrastructure)

Progress: [████████▓░] 85%

## Performance Metrics

**v1.0 Velocity:**
- Total plans completed: 17
- Average duration: 7.1 min
- Total execution time: 2.0 hours
- Timeline: 5 days (2026-03-07 -> 2026-03-11)

**v2.0 Velocity:**
- Total plans completed: 12
- Average duration: 7.0 min
- Total execution time: 1.4 hours

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 08    | 01   | 6 min    | 2     | 9     |
| 08    | 02   | 8 min    | 2     | 10    |
| 08    | 03   | 8 min    | 2     | 9     |
| 08    | 04   | 6 min    | 2     | 9     |
| 09    | 01   | 7 min    | 2     | 8     |
| 09    | 02   | 8 min    | 2     | 11    |
| 09    | 03   | 8 min    | 3     | 10    |
| 10    | 01   | 9 min    | 2     | 16    |
| 10    | 02   | 12 min   | 2     | 16    |
| 10    | 03   | 25 min   | 2     | 28    |
| 11    | 00   | 2 min    | 2     | 5     |
| 11    | 01   | 3 min    | 2     | 10    |

## Accumulated Context

### Decisions

All v1.0 decisions documented in PROJECT.md Key Decisions table.
v2.0 roadmap decisions:
- Multi-language cards + OAuth in same phase (parallel work, both are foundations)
- Post-based trading depends on language-aware cards (avoid PokeHub's language mismatch problem)
- AI suggestions + deck meta + tier lists merged into single Intelligence phase (standard granularity)
- Web app last (benefits from all features being stable, i18n in place)
- Card scanning deferred to v3 (per REQUIREMENTS.md)

Phase 7 decisions:
- 9 languages in schema constant but only 6 seedable from TCGdex currently (ja, ko, zh return 404)
- Translation ID format: {cardId}-{lang} for deterministic IDs
- OAuth providers limited to Google and Apple
- jose ESM-only: OAuth routes registered per-test-file with mocks, excluded from shared test setup
- needs_linking returns 200 with { needsLinking: true } rather than error status
- Text codes (EN, DE) for language display, not flag emojis -- culturally neutral
- Composite key cardId:language for collection entries to support same card in multiple languages
- Tappable badges for translation switching in card detail (supports 9 languages)
- OAuth buttons below email/password form (email/password remains primary, OAuth is convenient alternative)
- Native OAuth over browser-based auth sessions for better UX and security

Phase 8 decisions:
- JSONB containment (@>) for language/rarity/setId filtering with GIN index
- Free user post limit set to 15 active posts
- isRelevant computed per-request from user wanted/collection in-memory sets
- Case-insensitive card name search via jsonb_array_elements with lower()
- Duplicated notification helpers in post-match service to avoid coupling with proposal service
- 5-second BullMQ delay for post matching (shorter than 30s match-recompute for interactivity)
- Per-user notification deduplication via Set-based grouping in processPostMatch
- PostDetailModal sends proposals using post.id as matchId bridge until proper post-based proposals
- MarketPost type extended with optional poster field for forward-compatible user profile display
- Old matches fetch removed from tab layout; marketplace loads on Market tab focus
- Kept useMatchSocket hook name to avoid breaking imports (minimal rename strategy)
- PostDetailModal uses postId instead of matchId bridge now that 08-02 supports it
- ProposalCreationModal dual mode via separate match/post props for backward compatibility

Phase 9 decisions:
- Offscreen positioning (left: -9999) instead of display:none for react-native-view-shot compatibility
- Fixed 1080px width for export templates for consistent resolution across devices
- file:// prefix on captureRef result for Android share compatibility
- Promo codes stored and compared in uppercase for case-insensitive matching
- db.transaction() for promo redemption to prevent race conditions
- Premium time stacks: promo days added to existing expiry if user already premium
- handleWebhookEvent EXPIRATION guarded to respect promo-granted premium time

Phase 10 decisions:
- 10 UI languages (adds Thai beyond the 9 card languages) for broader audience reach
- compatibilityJSON v4 for React Native pluralization support
- Optimistic language switching: UI changes immediately, server sync in background
- Email template translation keys included per CONTEXT.md locked decision
- Test DB requires separate drizzle-kit push (dev and test databases diverge)
- Locale-aware date formatting uses undefined locale parameter to respect system/i18n language
- ReputationStars t prop type widened to accept interpolation options for pluralization
- parseAcceptLanguage for route-level language detection rather than per-request DB lookups
- Per-user uiLanguage DB lookup for notification services (notifications are recipient-targeted)
- Expanded server notification keys from 13 to 28+ to cover all service notification types

Phase 11 decisions:
- Used beforeEach(cleanDb) pattern consistent with existing test files for wave 0 stubs
- randomUUID from crypto for ID generation (matches existing service pattern, no nanoid dep)
- Basis points (integer) for win/usage rates to avoid float precision issues
- Retry with exponential backoff (2 attempts, 3s base delay) for scraper network resilience

### Pending Todos

None.

### Blockers/Concerns

- App Store/Google Play IAP policies need verification before production launch
- Existing proposal/rating service tests have FK constraint failures needing seed data fixes
- TCGdex language completeness varies -- audit needed during Phase 7 card import
- ~~PostGIS support on production host~~ — resolved: Phase 11 (Local Trade Finder) removed

## Session Continuity

Last session: 2026-03-20T22:18:18.069Z
Stopped at: Phase 12 context gathered
Resume file: .planning/phases/12-web-app-companion/12-CONTEXT.md
