# Phase 10: Internationalization - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Translate all app UI text to 10 languages with user language selection. Users can pick their preferred app language, and all navigation, labels, messages, errors, notifications, and email templates display in that language. This is a from-scratch i18n setup — no i18n library exists yet in the codebase.

</domain>

<decisions>
## Implementation Decisions

### Language List & Defaults
- 10 supported UI languages: EN, DE, ES, FR, IT, JA, KO, PT, ZH, TH
- Thai (TH) is the 10th language, extending beyond the 9 card database languages
- Default language: device locale with English fallback (read device locale, match to closest supported, fall back to EN)
- Language preference synced to user profile server-side (persists across devices, survives reinstall, ready for Phase 13 web app)
- UI language and card language are independent settings (user can browse app in Thai but view cards in English — common for Pokemon players)

### Language Switcher UX
- Placement: Profile/Settings screen, under a "Language" section (alongside existing "Redeem Code")
- Selector: scrollable list (bottom sheet or full-screen) showing native names with text codes: "English (EN)", "Deutsch (DE)", "日本語 (JA)", "한국어 (KO)", "ไทย (TH)", etc.
- Language changes apply instantly via hot-swap (no app restart required — reactive i18n architecture)
- Text code convention consistent with Phase 7 card language display

### Translation Coverage
- All static UI text: navigation tabs, labels, buttons, headings, placeholder text, empty states
- API error messages: translated server-side so non-English users see errors in their language
- Push notification text: translated server-side based on user's stored language preference
- Date/number formatting: localized date formats (DD/MM vs MM/DD), number separators
- Email templates: password reset, welcome emails translated based on user language preference
- Phase 9 features: luck calculator labels, export template text, promo code messages — all translated
- User-generated content (display names, post data) left as-is — not auto-translated
- RTL layout: skipped — none of the 10 languages are RTL

### Translation Source & Format
- Initial translations: AI/machine translated from English source strings (Claude or GPT)
- File format: one JSON file per language (en.json, de.json, ja.json...) with nested keys by screen/feature
- Delivery: bundled in app binary, no server-fetch — translations are stable UI strings
- No user translation reporting mechanism for v2.0 — fix bad translations via app updates
- Translation refinement can happen post-launch via professional review or community input

### Claude's Discretion
- i18n library choice (i18next, react-intl, or lighter alternative for React Native/Expo)
- Translation key naming convention and namespace structure
- How to extract existing hardcoded strings across ~20+ components and 5 tab screens
- Server-side i18n approach for API errors, notifications, and emails
- Pluralization and interpolation patterns
- How to integrate expo-localization for device locale detection

</decisions>

<specifics>
## Specific Ideas

- Pokemon players commonly want Japanese/Korean cards but English UI — independent language settings are essential
- Phase 13 (Web App) will consume the same server-synced language preference
- AI translations are fast and free for bootstrapping — can be professionally refined later
- The app already uses text codes (EN, DE) not flags for languages (Phase 7 decision) — maintain consistency

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/mobile/src/stores/auth.ts`: User auth store — extend with language preference state
- `apps/mobile/app/(tabs)/profile.tsx`: Profile screen — add language selector section
- Phase 7 card language constants: 9 language codes already defined in shared schemas
- `packages/shared/src/schemas/`: Shared Zod schemas — add language preference to user schema

### Established Patterns
- Zustand per-domain stores: language/i18n state likely gets its own store or extends auth store
- Service + Route separation: server-side i18n for errors/notifications follows same pattern
- Shared schemas in `packages/shared/`: translation types can live here
- Profile screen already has sections (avatar, friend code, redeem code) — language selector fits naturally

### Integration Points
- `users` table: add `uiLanguage` column (varchar, default 'en')
- All component files with hardcoded strings: extraction pass needed across entire mobile app
- `apps/api/src/services/notification.service.ts`: notification text needs language-aware templating
- `apps/api/src/routes/auth.ts`: email templates need language parameter
- Export templates (Phase 9): text in CardExport, CollectionExport, PostExport, WantedExport needs i18n
- LuckCalculator (Phase 9): labels need i18n

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 10-internationalization*
*Context gathered: 2026-03-17*
