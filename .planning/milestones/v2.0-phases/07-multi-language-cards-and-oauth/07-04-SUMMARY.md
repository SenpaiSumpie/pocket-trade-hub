---
phase: 07-multi-language-cards-and-oauth
plan: 04
subsystem: ui
tags: [react-native, expo, zustand, language-filter, translations, collection, i18n]

# Dependency graph
requires:
  - phase: 07-multi-language-cards-and-oauth
    provides: "Card API language endpoints (GET /cards?language, GET /cards/:id/translations)"
provides:
  - "Language filter chip in card browsing UI"
  - "Card detail translation switching with tappable language badges"
  - "Language picker in add-to-collection and wanted list flows"
  - "Language badges on collection items"
  - "Preferred language pre-selection from user profile"
affects: [07-05-oauth-mobile-ui, 08-post-based-trading]

# Tech tracking
tech-stack:
  added: []
  patterns: [language-filter-chip, translation-badge-switching, composite-key-collection]

key-files:
  created:
    - apps/mobile/src/components/collection/AddToCollectionModal.tsx
  modified:
    - apps/mobile/src/stores/cards.ts
    - apps/mobile/src/stores/collection.ts
    - apps/mobile/src/stores/auth.ts
    - apps/mobile/src/components/cards/FilterChips.tsx
    - apps/mobile/src/components/cards/CardDetailModal.tsx
    - apps/mobile/app/(tabs)/cards.tsx
    - apps/mobile/src/hooks/useCards.ts
    - apps/mobile/src/hooks/useCollection.ts
    - apps/mobile/src/hooks/useWanted.ts

key-decisions:
  - "Text codes (EN, DE, FR) for language display instead of flag emojis -- culturally neutral"
  - "Tappable badges for translation switching in card detail (not tabs, supports 9 languages)"
  - "Composite key cardId:language for collection entries to support same card in multiple languages"
  - "User preferred language pre-selects in add-to-collection but can be overridden per-card"

patterns-established:
  - "Language filter chip pattern: filter chip with dropdown, 'All Languages' clears filter"
  - "Translation badge pattern: tappable 2-letter code badges that switch displayed content"
  - "Composite collection key: cardId:language for language-specific entries"

requirements-completed: [CARD-02, CARD-03, CARD-04]

# Metrics
duration: 8min
completed: 2026-03-14
---

# Phase 7 Plan 4: Language-Aware Card Browsing and Collection UI Summary

**Language filter chip, card detail translation switching, and language picker for collection/wanted flows using text-code badges and composite keys**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-14T00:00:00Z
- **Completed:** 2026-03-14T00:08:00Z
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 10

## Accomplishments
- Language filter chip on cards tab filters card browsing by language with 9 supported languages
- Card detail modal fetches and displays translations with tappable language badges for switching
- AddToCollectionModal created with language picker pre-set to user's preferred language
- Collection entries use cardId:language composite key allowing same card in multiple languages
- Wanted list also made language-aware with same language selection pattern

## Task Commits

Each task was committed atomically:

1. **Task 1: Add language filter to card browsing and card detail translations** - `8619bb6` (feat)
2. **Task 2: Add language selection to collection and wanted list flows** - `8e65299` (feat)
3. **Task 3: Verify language-aware card browsing and collection UI** - checkpoint approved by user

## Files Created/Modified
- `apps/mobile/src/stores/cards.ts` - Added selectedLanguage state, setSelectedLanguage action, fetchTranslations action
- `apps/mobile/src/components/cards/FilterChips.tsx` - Added language filter chip with 9-language dropdown
- `apps/mobile/src/components/cards/CardDetailModal.tsx` - Translation display with tappable language badges
- `apps/mobile/app/(tabs)/cards.tsx` - Wired language filter chip into filter bar
- `apps/mobile/src/hooks/useCards.ts` - Updated to pass language param to API
- `apps/mobile/src/stores/collection.ts` - Language-aware add/remove with cardId:language composite keys
- `apps/mobile/src/stores/auth.ts` - Added preferredCardLanguage to user state
- `apps/mobile/src/components/collection/AddToCollectionModal.tsx` - New modal with language picker
- `apps/mobile/src/hooks/useCollection.ts` - Updated for language-aware collection operations
- `apps/mobile/src/hooks/useWanted.ts` - Updated for language-aware wanted list operations

## Decisions Made
- Text codes (EN, DE, FR) used for language display instead of flag emojis -- flags are politically complex and don't map 1:1 to languages
- Tappable badges for translation switching in card detail rather than tabs (supports up to 9 languages cleanly)
- Composite key cardId:language for collection entries ensures same card in different languages appears as separate entries
- User's preferred language pre-selects in add-to-collection modal but can be overridden per card

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Language-aware card browsing and collection UI complete, consuming Plan 02 API endpoints
- OAuth mobile UI (Plan 05) can proceed independently
- Post-based trading (Phase 08) can build on language-aware collection entries

## Self-Check: PASSED

All files verified present. All commits verified in git log.

---
*Phase: 07-multi-language-cards-and-oauth*
*Completed: 2026-03-14*
