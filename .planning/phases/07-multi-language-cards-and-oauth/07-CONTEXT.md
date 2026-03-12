# Phase 7: Multi-Language Cards and OAuth - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Add multi-language card database support (9 languages from TCGdex) with per-card language tracking in collections, and Google/Apple OAuth sign-in with account linking. This is the foundation that Phase 8 (post-based trading) depends on for language-aware trade matching.

</domain>

<decisions>
## Implementation Decisions

### Card Language Model
- Per-card language in collection: each card entry has its own language (user can own 2 EN Pikachu + 1 JA Pikachu as separate entries)
- Same card in different languages = different collection entries with separate quantities
- Import all 9 language versions of every card from TCGdex upfront (full card_translations table)
- User profile has a "preferred card language" that pre-selects when adding cards, but user can override per-card
- Wanted list should also become language-aware (user specifies which language they want) — critical for Phase 8 language-aware post matching

### Language Display
- Claude's Discretion: Language switcher vs filter chip approach for card browsing
- Claude's Discretion: Card detail view language display (tabs vs single language)
- Claude's Discretion: Visual representation of languages (flags vs text codes)
- Claude's Discretion: Collection view language distinction (badge vs grouping)

### OAuth Flow & Linking
- Claude's Discretion: Login screen layout (social buttons position relative to email/password form)
- Claude's Discretion: Account linking approach when OAuth email matches existing account (recommend prompt-to-link with password verification for security)
- Claude's Discretion: Profile settings for linking/unlinking OAuth providers
- Claude's Discretion: Whether OAuth-only users can add a password later (recommend yes for account recovery)

### Collection Migration
- Claude's Discretion: How to handle existing language-agnostic collection items (recommend default to English with user notification)
- Claude's Discretion: Set completion tracking — per-language vs total vs both
- The `users.passwordHash` column is currently NOT NULL — must be made nullable for OAuth-only accounts

### Claude's Discretion
Language display, OAuth UX details, and migration strategy are all flexible. User trusts Claude to make good design decisions. Key constraints:
- Per-card language is non-negotiable (user decided)
- All 9 languages imported upfront (user decided)
- Preferred language on profile with per-card override (user decided)
- Same card in multiple languages = separate collection entries (user decided)

</decisions>

<specifics>
## Specific Ideas

- PokeHub's #1 user complaint is language mismatches in trades — solving this is the primary competitive differentiator
- TCGdex API supports 9 languages via URL-prefixed endpoints (`/v2/en/`, `/v2/ja/`, etc.)
- Current seed script is hardcoded to English (`https://api.tcgdex.net/v2/en`)
- Card images differ per language from TCGdex — each language version has its own image URL
- The 9 supported languages: English, German, Spanish, French, Italian, Japanese, Korean, Portuguese, Chinese (Simplified)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/api/src/db/seeds/seed-cards.ts`: TCGdex import script — needs to be extended for multi-language. Currently fetches from `/v2/en` only.
- `apps/api/src/services/card.service.ts`: Card search/browse — needs language parameter added to queries
- `apps/mobile/src/components/cards/`: Full card UI component suite (CardGrid, CardThumbnail, CardDetailModal, FilterChips, SearchBar, SetPicker) — all need language awareness
- `apps/mobile/src/stores/cards.ts` + `collection.ts`: Zustand stores — need language state
- `apps/api/src/plugins/auth.ts`: JWT auth plugin with `authenticate` decorator — needs OAuth provider verification added
- `packages/shared/src/schemas/auth.ts`: Zod schemas for signup/login — needs OAuth schemas added
- `packages/shared/src/schemas/card.ts`: Card schema has no language field — needs `language` added
- `packages/shared/src/schemas/collection.ts`: Collection schema — needs language field

### Established Patterns
- Service files in `apps/api/src/services/` with route files in `apps/api/src/routes/`
- Shared Zod schemas in `packages/shared/src/schemas/`
- Zustand per-domain stores in `apps/mobile/src/stores/`
- BullMQ workers in `apps/api/src/jobs/` for background tasks
- Drizzle ORM with pgTable definitions in `apps/api/src/db/schema.ts`

### Integration Points
- `users` table: `passwordHash` is NOT NULL — must change to nullable for OAuth-only users
- `userCollectionItems` table: unique index on (userId, cardId) — must add language to make (userId, cardId, language) unique
- `userWantedCards` table: similar unique index change needed for language-awareness
- `cards` table: Currently stores English-only data. Need a `cardTranslations` table or extend cards to be language-keyed
- Auth routes (`apps/api/src/routes/auth.ts`): Need new OAuth endpoints alongside existing email/password
- Card search endpoint: needs `language` query parameter

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 07-multi-language-cards-and-oauth*
*Context gathered: 2026-03-11*
