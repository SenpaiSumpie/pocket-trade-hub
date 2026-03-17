# Phase 10: Internationalization - Research

**Researched:** 2026-03-17
**Domain:** React Native / Expo i18n with i18next, server-side Fastify i18n
**Confidence:** HIGH

## Summary

Internationalization for this Expo/React Native + Fastify monorepo follows the well-established i18next ecosystem. The mobile app uses `react-i18next` with `expo-localization` for device locale detection, while the API uses plain `i18next` for translating error messages, notifications, and email templates. This is the de facto standard stack -- Expo's own documentation recommends this exact combination.

The main implementation work divides into: (1) setting up i18n infrastructure and extracting ~138 mobile source files worth of hardcoded strings into translation JSON files, (2) building the language selector UI on the profile screen, (3) adding server-side i18n for API errors, push notifications, and email templates, and (4) generating translations for 9 non-English languages. The `users` table needs a `uiLanguage` column (distinct from the existing `preferredCardLanguage`).

**Primary recommendation:** Use i18next + react-i18next + expo-localization on mobile, plain i18next on the API server, with one JSON file per language using nested keys organized by screen/feature.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- 10 supported UI languages: EN, DE, ES, FR, IT, JA, KO, PT, ZH, TH
- Thai (TH) is the 10th language, extending beyond the 9 card database languages
- Default language: device locale with English fallback
- Language preference synced to user profile server-side (persists across devices)
- UI language and card language are independent settings
- Language selector on Profile/Settings screen under a "Language" section
- Scrollable list showing native names with text codes: "English (EN)", "Deutsch (DE)", etc.
- Language changes apply instantly via hot-swap (no app restart)
- All static UI text, API error messages, push notifications, date/number formatting, email templates translated
- User-generated content left as-is (not auto-translated)
- RTL layout skipped (none of the 10 languages are RTL)
- AI/machine translated initially from English source strings
- File format: one JSON file per language with nested keys by screen/feature
- Translations bundled in app binary, no server-fetch
- No user translation reporting mechanism for v2.0

### Claude's Discretion
- i18n library choice (i18next, react-intl, or lighter alternative)
- Translation key naming convention and namespace structure
- How to extract existing hardcoded strings across ~20+ components and 5 tab screens
- Server-side i18n approach for API errors, notifications, and emails
- Pluralization and interpolation patterns
- How to integrate expo-localization for device locale detection

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PLAT-03 | App UI supports 10 languages via i18n | i18next + react-i18next provides reactive translation with hot-swap; 10 JSON translation files bundled in binary; server-side i18n for API errors/notifications |
| PLAT-04 | User can select preferred app language | Language selector component on profile screen; `uiLanguage` column on users table; expo-localization for device locale auto-detect; Zustand store for reactive language state |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| i18next | ^25.8 | Core i18n framework | De facto standard for JS i18n; used by both client and server; 7M+ weekly npm downloads |
| react-i18next | ^16.5 | React bindings for i18next | Official React integration; useTranslation hook for reactive translations; hot-swap support |
| expo-localization | ~16.0 (SDK 54) | Device locale detection | Expo's official localization package; getLocales() returns device language preferences |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| intl-pluralrules | ^2.0 | Polyfill for Intl.PluralRules | Needed for Hermes engine (React Native) to support i18next pluralization |

### Not Needed (already in project)
| Library | Already Installed | Purpose |
|---------|------------------|---------|
| @react-native-async-storage/async-storage | Yes (2.2.0) | Could persist language preference locally, but server sync is primary |
| zod | Yes (^3.24) | Schema validation for language preference |
| zustand | Yes (^5.0) | State management for current language |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| i18next | react-intl (FormatJS) | react-intl is React-only; i18next works on both client AND server (Fastify API), which this project needs |
| i18next | i18n-js | Lighter but lacks server-side support and plugin ecosystem; no pluralization rules built-in |
| i18next | lingui | Excellent for compile-time extraction but more complex setup; overkill for JSON-based translations |

**Recommendation:** i18next is the clear winner because the project needs i18n on BOTH mobile (React Native) and server (Fastify). Using the same framework on both sides means shared translation key conventions and consistent behavior.

**Installation:**
```bash
# Mobile app
cd apps/mobile
npx expo install expo-localization
pnpm add i18next react-i18next intl-pluralrules

# API server
cd apps/api
pnpm add i18next
```

## Architecture Patterns

### Recommended Project Structure
```
packages/shared/src/
  i18n/
    languages.ts             # Language constants, supported languages list, native names
apps/mobile/src/
  i18n/
    index.ts                 # i18next init config
    locales/
      en.json                # English (source language)
      de.json                # Deutsch
      es.json                # Espanol
      fr.json                # Francais
      it.json                # Italiano
      ja.json                # Japanese
      ko.json                # Korean
      pt.json                # Portugues
      zh.json                # Chinese
      th.json                # Thai
  stores/
    language.ts              # Zustand store for language preference (or extend auth.ts)
  components/
    LanguageSelector.tsx      # Language picker bottom sheet/screen
apps/api/src/
  i18n/
    index.ts                 # Server-side i18next init
    locales/
      en.json                # English API messages
      de.json                # ... (10 language files)
```

### Pattern 1: Translation Key Naming Convention
**What:** Nested keys organized by screen/feature with dot notation
**When to use:** All translation keys
**Example:**
```json
{
  "common": {
    "ok": "OK",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "loading": "Loading...",
    "error": "Something went wrong",
    "retry": "Retry"
  },
  "tabs": {
    "home": "Home",
    "cards": "Cards",
    "market": "Market",
    "trades": "Trades",
    "profile": "Profile"
  },
  "profile": {
    "title": "Profile",
    "editProfile": "Edit Profile",
    "logOut": "Log Out",
    "logOutConfirm": "Are you sure you want to log out?",
    "memberSince": "Member Since",
    "friendCode": "Friend Code",
    "friendCodeNotSet": "Not set",
    "noRatings": "No ratings yet",
    "linkedAccounts": "Linked Accounts",
    "linkFailed": "Link Failed",
    "language": "Language",
    "selectLanguage": "Select Language"
  },
  "auth": {
    "login": "Log In",
    "signUp": "Sign Up",
    "email": "Email",
    "password": "Password"
  },
  "market": {
    "title": "Market",
    "noResults": "No posts found",
    "filters": "Filters"
  },
  "trades": {
    "pending": "Pending",
    "accepted": "Accepted",
    "tradeCount_one": "{{count}} trade",
    "tradeCount_other": "{{count}} trades"
  }
}
```

### Pattern 2: i18next Initialization (Mobile)
**What:** Configure i18next with expo-localization for device locale detection
**Example:**
```typescript
// apps/mobile/src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import 'intl-pluralrules';

import en from './locales/en.json';
import de from './locales/de.json';
// ... other imports

const SUPPORTED_LANGUAGES = ['en', 'de', 'es', 'fr', 'it', 'ja', 'ko', 'pt', 'zh', 'th'];

function getDeviceLanguage(): string {
  const locales = getLocales();
  const deviceLang = locales[0]?.languageCode ?? 'en';
  return SUPPORTED_LANGUAGES.includes(deviceLang) ? deviceLang : 'en';
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    de: { translation: de },
    // ... other languages
  },
  lng: getDeviceLanguage(), // Will be overridden by user preference on hydrate
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already escapes
  },
  compatibilityJSON: 'v4', // Required for React Native pluralization
});

export default i18n;
```

### Pattern 3: Reactive Language Switching (Hot-Swap)
**What:** Change language without app restart using i18next.changeLanguage()
**Example:**
```typescript
// In language store or selector handler
import i18n from '../i18n';

async function setLanguage(lang: string) {
  await i18n.changeLanguage(lang);
  // Persist to server
  await apiFetch('/users/me', {
    method: 'PATCH',
    body: JSON.stringify({ uiLanguage: lang }),
  });
}
```
The `useTranslation` hook automatically re-renders components when language changes -- this is built into react-i18next.

### Pattern 4: Using Translations in Components
**What:** Replace hardcoded strings with t() calls
**Example:**
```typescript
// Before
<Text>No ratings yet</Text>
<Text>Log Out</Text>

// After
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
<Text>{t('profile.noRatings')}</Text>
<Text>{t('profile.logOut')}</Text>
```

### Pattern 5: Server-Side i18n (API Errors & Notifications)
**What:** Use i18next on the Fastify server, passing language from user profile or request header
**Example:**
```typescript
// apps/api/src/i18n/index.ts
import i18n from 'i18next';
import en from './locales/en.json';
// ... other imports

i18n.init({
  resources: { en: { translation: en }, /* ... */ },
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export function t(key: string, lng: string, options?: Record<string, unknown>) {
  return i18n.t(key, { lng, ...options });
}
```
```typescript
// In route handler or service
import { t } from '../i18n';

// Get user's language from DB or JWT claim
const userLang = user.uiLanguage || 'en';
return reply.code(404).send({ error: t('errors.userNotFound', userLang) });
```

### Pattern 6: Date/Number Formatting
**What:** Use Intl APIs (already available in Hermes) for locale-aware formatting
**Example:**
```typescript
// Date formatting
const formatDate = (dateStr: string, locale: string) => {
  return new Date(dateStr).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Number formatting
const formatNumber = (num: number, locale: string) => {
  return new Intl.NumberFormat(locale).format(num);
};
```

### Anti-Patterns to Avoid
- **String concatenation for translations:** Never do `t('hello') + ' ' + name`. Use interpolation: `t('greeting', { name })`.
- **Inline default text as keys:** Never use `t('No ratings yet')`. Use structured keys like `t('profile.noRatings')`.
- **Hardcoded locale in formatDate:** The existing `formatDate` in profile.tsx uses `'en-US'` -- this must use the current i18n language.
- **Splitting sentences across multiple t() calls:** Each translatable sentence should be one key. Word order differs between languages.
- **Forgetting pluralization:** `t('tradeCount', { count: n })` -- i18next handles `_one`, `_other`, `_zero` suffixes automatically.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pluralization | Custom plural logic per language | i18next built-in pluralization | Japanese/Korean/Chinese have no plural forms; English has 2; some languages have 6+ forms |
| Device locale detection | Manual native module calls | expo-localization getLocales() | Handles platform differences (iOS vs Android vs web) transparently |
| Translation interpolation | String templates / concatenation | i18next interpolation `{{variable}}` | Handles escaping, nested interpolation, context-based translations |
| Locale-aware date/number | Custom formatting functions | Intl.DateTimeFormat / Intl.NumberFormat | Built into Hermes engine; handles thousands separators, date order, etc. |
| Language change reactivity | Custom context/state propagation | react-i18next useTranslation hook | Automatically re-renders on language change via i18next event system |

**Key insight:** i18next's plugin system and react-i18next's hooks handle all the hard parts of i18n (pluralization rules for 10 languages, reactive re-rendering, interpolation safety). Hand-rolling any of these would be error-prone and incomplete.

## Common Pitfalls

### Pitfall 1: Forgetting intl-pluralrules Polyfill
**What goes wrong:** Pluralization silently fails or crashes on React Native (Hermes engine)
**Why it happens:** Hermes does not ship Intl.PluralRules by default; i18next needs it for plural form selection
**How to avoid:** Install `intl-pluralrules` and import it before i18next init
**Warning signs:** Plural translations always showing the `_other` form regardless of count

### Pitfall 2: compatibilityJSON Not Set
**What goes wrong:** Pluralization keys like `_one`, `_other` don't work in React Native
**Why it happens:** i18next v4 JSON format requires explicit opt-in via `compatibilityJSON: 'v4'`
**How to avoid:** Set `compatibilityJSON: 'v4'` in i18next init config
**Warning signs:** `tradeCount_one` never matches, always falls through to `_other`

### Pitfall 3: CJK Text Overflow
**What goes wrong:** Japanese, Korean, Chinese, and Thai text is often shorter or longer than English, breaking layouts
**Why it happens:** CJK characters are wider; some translations are significantly longer/shorter
**How to avoid:** Use flexible layouts (flexShrink, flexWrap); avoid fixed widths on text containers; test with longest translations
**Warning signs:** Text truncation or overflow in buttons, headers, tab labels

### Pitfall 4: Hardcoded Locale in Existing Code
**What goes wrong:** Dates and numbers still display in English after language switch
**Why it happens:** The existing `formatDate` in profile.tsx uses hardcoded `'en-US'` locale
**How to avoid:** Audit all `toLocaleDateString`, `toLocaleString`, `Intl.NumberFormat` calls; replace hardcoded locales with current i18n language
**Warning signs:** Dates showing "March 17, 2026" instead of "17 mars 2026" in French

### Pitfall 5: Server-Side Language Not Synced
**What goes wrong:** User changes language on mobile but API still sends English errors/notifications
**Why it happens:** Server reads language from user profile DB column; if not updated, defaults to English
**How to avoid:** PATCH uiLanguage to server on language change; push notifications read from user.uiLanguage
**Warning signs:** Errors/notifications in English after switching to another language

### Pitfall 6: Missing Thai (TH) Support
**What goes wrong:** Thai is the 10th language (not in the existing 9 card languages); could be forgotten in server-side enums
**Why it happens:** The existing `supportedLanguages` constant in schema.ts only has 9 card languages; UI languages need a separate constant
**How to avoid:** Create a distinct `supportedUILanguages` array in shared package that includes 'th'; keep card languages separate
**Warning signs:** Thai not appearing in language selector or causing validation errors

## Code Examples

### Existing Code That Needs i18n Integration

The `users` table (schema.ts line 8-23) needs a new `uiLanguage` column:
```typescript
// Add to users table in schema.ts
uiLanguage: varchar('ui_language', { length: 5 }).default('en'),
```

The User interface in auth store needs `uiLanguage`:
```typescript
interface User {
  // ... existing fields
  uiLanguage?: string;
}
```

The profile updateProfileSchema needs `uiLanguage`:
```typescript
export const updateProfileSchema = z.object({
  // ... existing fields
  uiLanguage: z.enum(['en', 'de', 'es', 'fr', 'it', 'ja', 'ko', 'pt', 'zh', 'th']).optional(),
});
```

### Tab Layout Integration
```typescript
// apps/mobile/app/(tabs)/_layout.tsx
import { useTranslation } from 'react-i18next';

export default function TabLayout() {
  const { t } = useTranslation();
  // ...
  <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
  <Tabs.Screen name="cards" options={{ title: t('tabs.cards') }} />
  // ...
}
```

### Language Selector Component
```typescript
// Language list data (shared constant)
export const UI_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'es', name: 'Spanish', nativeName: 'Espanol' },
  { code: 'fr', name: 'French', nativeName: 'Francais' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'ja', name: 'Japanese', nativeName: '\u65E5\u672C\u8A9E' },
  { code: 'ko', name: 'Korean', nativeName: '\uD55C\uAD6D\uC5B4' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Portugues' },
  { code: 'zh', name: 'Chinese', nativeName: '\u4E2D\u6587' },
  { code: 'th', name: 'Thai', nativeName: '\u0E44\u0E17\u0E22' },
] as const;
```

### Notification Service Integration
```typescript
// In notification.service.ts - fetch user language before sending
const user = await db.select({ uiLanguage: users.uiLanguage })
  .from(users).where(eq(users.id, userId));
const lang = user[0]?.uiLanguage || 'en';

messages.push({
  to: record.token,
  sound: 'default',
  title: t('notifications.newSetTitle', lang),
  body: t('notifications.newSetBody', lang, { setName, cardCount }),
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| i18n-js with Expo | i18next + react-i18next + expo-localization | 2023+ | i18next won the ecosystem; Expo docs recommend it |
| `Localization.locale` (string) | `getLocales()` (array of objects) | expo-localization ~15.0 | Richer locale data (region, text direction, currency) |
| Manual re-render on language change | react-i18next hooks auto-re-render | react-i18next 11+ | No need for custom context/state management |
| JSON v3 pluralization (key_plural) | JSON v4 pluralization (key_one, key_other) | i18next v21+ | Must set compatibilityJSON: 'v4' |

**Deprecated/outdated:**
- `Localization.locale` (old string-based API) -- replaced by `getLocales()` returning structured array
- `i18next-react-native-language-detector` -- not needed with expo-localization direct usage

## Open Questions

1. **Email template translation approach**
   - What we know: Nodemailer is used for emails (password reset, welcome). Templates need translation.
   - What's unclear: Whether templates use HTML strings or a templating engine. Need to check the auth service for email sending patterns.
   - Recommendation: Likely simple string-based templates that can use i18next's `t()` function with the user's stored language.

2. **Translation key extraction strategy**
   - What we know: ~138 TS/TSX files in mobile app, ~31 Toast messages, 5 tab labels, plus all component text
   - What's unclear: Exact count of unique strings to extract
   - Recommendation: Manual extraction screen-by-screen during implementation. Automated extraction tools (i18next-parser) exist but manual is more reliable for a one-time pass on a medium codebase.

3. **AI translation generation workflow**
   - What we know: User decided on AI/machine translation for initial strings
   - What's unclear: Whether to generate during the phase or as a separate step
   - Recommendation: Generate en.json first with all keys, then use AI to produce the other 9 translation files. This can be done as part of the plan.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7 with ts-jest |
| Config file | apps/api/jest.config.js |
| Quick run command | `cd apps/api && pnpm test -- --testPathPattern="i18n" --no-coverage` |
| Full suite command | `cd apps/api && pnpm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PLAT-03 | All UI text displays in selected language | manual-only | N/A - visual verification of translated UI | N/A |
| PLAT-03 | Server returns translated error messages | unit | `cd apps/api && pnpm test -- --testPathPattern="i18n" -x` | No - Wave 0 |
| PLAT-03 | Notifications sent in user's language | unit | `cd apps/api && pnpm test -- --testPathPattern="notification" -x` | Partial (notification-inbox.service.test.ts exists) |
| PLAT-04 | PATCH /users/me accepts uiLanguage field | unit | `cd apps/api && pnpm test -- --testPathPattern="users.profile" -x` | Yes (users.profile.test.ts exists, needs uiLanguage test) |
| PLAT-04 | Device locale detected and matched to supported language | unit | Manual or mobile test | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `cd apps/api && pnpm test -- --testPathPattern="users|i18n" --no-coverage -x`
- **Per wave merge:** `cd apps/api && pnpm test`
- **Phase gate:** Full suite green before /gsd:verify-work

### Wave 0 Gaps
- [ ] `apps/api/__tests__/services/i18n.test.ts` -- covers server-side translation function correctness
- [ ] Add uiLanguage test case to existing `users.profile.test.ts`
- [ ] No mobile test infrastructure exists (manual verification of UI translations)

## Sources

### Primary (HIGH confidence)
- [expo-localization official docs](https://docs.expo.dev/versions/latest/sdk/localization/) - getLocales() API, device locale detection
- [Expo localization guide](https://docs.expo.dev/guides/localization/) - recommended i18next + expo-localization setup
- [react-i18next npm](https://www.npmjs.com/package/react-i18next) - v16.5.8 current, actively maintained
- [i18next npm](https://www.npmjs.com/package/i18next) - v25.8.18 current, actively maintained

### Secondary (MEDIUM confidence)
- [i18next-http-middleware for Fastify](https://github.com/i18next/i18next-http-middleware) - server-side integration pattern
- [Expo + React Native i18next guide (Feb 2026)](https://medium.com/@kgkrool/implementing-internationalization-in-expo-react-native-i18next-expo-localization-8ed810ad4455) - confirms setup works with current SDK
- [Server-side i18n patterns](https://dev.to/adrai/how-does-server-side-internationalization-i18n-look-like-5f4c) - i18next server usage patterns

### Tertiary (LOW confidence)
- None -- all findings verified with primary or secondary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - i18next + react-i18next + expo-localization is the universally recommended stack for Expo apps; confirmed by official Expo docs and npm download stats
- Architecture: HIGH - translation JSON structure, key naming, and initialization patterns are well-documented and stable
- Pitfalls: HIGH - compatibilityJSON, intl-pluralrules polyfill, and CJK overflow are widely documented gotchas
- Server-side: MEDIUM - Fastify + i18next integration is straightforward but less commonly documented than Express

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable ecosystem, 30-day validity)
