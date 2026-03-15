---
phase: 07-multi-language-cards-and-oauth
verified: 2026-03-15T12:00:00Z
status: passed
score: 12/12 must-haves verified
re_verification: false
human_verification:
  - test: "Verify language filter chip visually filters card browsing"
    expected: "Selecting DE shows German-translated card names and images"
    why_human: "Visual rendering and API data integration need live device"
  - test: "Verify Google OAuth end-to-end on custom dev client"
    expected: "Native Google Sign-In sheet appears, creates account, returns to app"
    why_human: "Requires Google Cloud credentials and EAS custom build"
  - test: "Verify Apple Sign-In on iOS device"
    expected: "Native Apple Sign-In sheet appears on iOS only"
    why_human: "Requires Apple Developer account and physical iOS device"
  - test: "Verify account linking modal appears on email collision"
    expected: "LinkAccountModal shows with password field when OAuth email matches existing account"
    why_human: "Requires two accounts with same email to test needs_linking flow"
---

# Phase 7: Multi-Language Cards and OAuth Verification Report

**Phase Goal:** Users can manage cards in their actual language and sign in with Google or Apple accounts
**Verified:** 2026-03-15
**Status:** passed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Card database supports 9 languages (EN, DE, ES, FR, IT, JA, KO, PT, ZH) | VERIFIED | `schema.ts` line 5: `supportedLanguages` array with all 9 codes; `cardTranslations` table defined with unique index on (cardId, language) |
| 2 | User can select card language when adding to collection | VERIFIED | `AddToCollectionModal.tsx` (183 lines) has 9-language picker pre-selecting user's preferred language; `useCollection.ts` passes `language` in POST body; `collection.service.ts` includes language in INSERT/upsert |
| 3 | User can filter/search cards by language | VERIFIED | `FilterChips.tsx` has language chip with 9 options + "All Languages"; `useCards.ts` line 61 passes `language` query param; `card.service.ts` INNER JOINs `cardTranslations` when language set |
| 4 | Card detail view shows available languages and translations | VERIFIED | `CardDetailModal.tsx` has `TranslationBadges` component that fetches `/cards/:id/translations`, displays tappable badges for all 9 languages, switches displayed name/imageUrl on tap |
| 5 | User can sign up/login with Google account | VERIFIED | `google-auth.ts` wraps `@react-native-google-signin/google-signin`; `auth.ts` store has `loginWithGoogle()` calling POST `/auth/oauth/google`; `OAuthButtons.tsx` renders "Continue with Google" button; `oauth.service.ts` verifies via `OAuth2Client.verifyIdToken` |
| 6 | User can sign up/login with Apple account | VERIFIED | `apple-auth.ts` wraps `expo-apple-authentication`; `auth.ts` store has `loginWithApple()` calling POST `/auth/oauth/apple`; `OAuthButtons.tsx` renders Apple button (iOS only via `isAppleSignInAvailable`); `oauth.service.ts` verifies via `jwtVerify` + Apple JWKS |
| 7 | Existing email users can link Google/Apple accounts | VERIFIED | `oauth.ts` route POST `/auth/link` (authenticated, line 86) calls `linkOAuthAccount` which verifies password then inserts oauthAccounts row; Profile screen has "Linked Accounts" section with link/unlink for Google and Apple |
| 8 | OAuth accounts that match existing email prompt for account linking | VERIFIED | `oauth.service.ts` `findOrCreateOAuthUser` checks users table for email match, returns `{ needsLinking: true, email, provider }`; `auth.ts` store sets `needsLinking` state; `LinkAccountModal.tsx` (217 lines) shows password field with explanation text |
| 9 | OAuth-only users have null passwordHash and can still login via OAuth | VERIFIED | `schema.ts` line 11: `passwordHash` has no `.notNull()`; `oauth.service.ts` line 129: `passwordHash: null` in new user creation; `auth.service.ts` has null guard for passwordHash |
| 10 | Collection entries are language-specific (same card different languages = separate entries) | VERIFIED | `schema.ts` line 132: unique index on (userId, cardId, language); `collection.ts` store uses `compositeKey(cardId, language)` pattern; collection service uses 3-column conflict target |
| 11 | Card translation seed script works for 6 TCGdex languages | VERIFIED | `seed-translations.ts` (180 lines) iterates 6 languages, fetches from TCGdex, upserts into cardTranslations with onConflictDoUpdate; supports --dry-run flag |
| 12 | User's preferred language pre-selects when adding cards | VERIFIED | `AddToCollectionModal.tsx` line 42-43: reads `user.preferredCardLanguage`, pre-selects it; line 131: shows hint text about preferred language |

**Score:** 12/12 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/api/src/db/schema.ts` | cardTranslations, oauthAccounts, language columns | VERIFIED | Both tables defined, unique indexes correct, passwordHash nullable, preferredCardLanguage present |
| `apps/api/src/db/seeds/seed-translations.ts` | Multi-language seed from TCGdex | VERIFIED | 180 lines, 6 languages, upsert with conflict handling |
| `packages/shared/src/schemas/card.ts` | cardLanguageValues, cardSearchSchema with language | VERIFIED | Exports cardLanguageValues (9 codes), cardSearchSchema has language field, cardTranslationSchema exported |
| `packages/shared/src/schemas/collection.ts` | Language on addToCollectionSchema, addToWantedSchema | VERIFIED | Both schemas have `language: z.enum(cardLanguageValues).default('en')` |
| `packages/shared/src/schemas/auth.ts` | oauthLoginSchema, linkAccountSchema | VERIFIED | Both exported with provider enum and idToken/password fields |
| `apps/api/src/services/card.service.ts` | searchCards with language JOIN, getCardTranslations | VERIFIED | 253 lines; INNER JOIN on cardTranslations; getCardTranslations and getCardById with language fallback |
| `apps/api/src/routes/cards.ts` | /cards/:id/translations, language on search | VERIFIED | 70 lines; translations endpoint, language validation on /cards/:id |
| `apps/api/src/services/oauth.service.ts` | Google/Apple verification, findOrCreateOAuthUser, linkOAuthAccount | VERIFIED | 202 lines; verifyGoogleToken, verifyAppleToken, findOrCreateOAuthUser (3 cases), linkOAuthAccount with bcrypt |
| `apps/api/src/routes/oauth.ts` | POST google, apple, link | VERIFIED | 137 lines; 3 endpoints with proper error handling |
| `apps/api/__tests__/auth.oauth.test.ts` | OAuth test coverage | VERIFIED | 208 lines |
| `apps/api/__tests__/auth.link.test.ts` | Account linking tests | VERIFIED | 166 lines |
| `apps/api/__tests__/services/card-translation.service.test.ts` | Translation query tests | VERIFIED | 198 lines |
| `apps/mobile/src/services/google-auth.ts` | GoogleSignin wrapper | VERIFIED | 32 lines; configureGoogleSignIn, signInWithGoogle, signOutGoogle exported |
| `apps/mobile/src/services/apple-auth.ts` | Apple Sign-In wrapper | VERIFIED | 30 lines; signInWithApple, isAppleSignInAvailable exported |
| `apps/mobile/src/components/auth/OAuthButtons.tsx` | Google + Apple buttons | VERIFIED | 147 lines; Google button always shown, Apple button iOS only, loading states, error toasts |
| `apps/mobile/src/components/auth/LinkAccountModal.tsx` | Account linking modal | VERIFIED | 217 lines; password input, error handling, clear explanation text |
| `apps/mobile/src/components/cards/FilterChips.tsx` | Language filter chip | VERIFIED | 268 lines; 9 language options + "All Languages", wired to useCardsStore |
| `apps/mobile/src/components/cards/CardDetailModal.tsx` | Translation badges | VERIFIED | 1020 lines; TranslationBadges component fetches translations, displays tappable language badges |
| `apps/mobile/src/components/collection/AddToCollectionModal.tsx` | Language picker for collection | VERIFIED | 327 lines; 9-language picker, preferred language pre-selection, quantity stepper |
| `apps/mobile/src/stores/cards.ts` | selectedLanguage, fetchTranslations | VERIFIED | 86 lines; selectedLanguage state, setSelectedLanguage, fetchTranslations from API |
| `apps/mobile/src/stores/collection.ts` | Composite key cardId:language | VERIFIED | 287 lines; compositeKey function, language-aware add/remove/update, language-agnostic cardId lookup |
| `apps/mobile/src/stores/auth.ts` | loginWithGoogle, loginWithApple, needsLinking | VERIFIED | 313 lines; OAuth methods, needsLinking state, linkAccount with retry, configureGoogleSignIn on load |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| card.service.ts | schema.ts | imports cardTranslations | WIRED | Line 2: `import { cards, sets, cardTranslations }` |
| cards.ts route | shared card.ts | uses cardSearchSchema | WIRED | Line 2: `import { cardSearchSchema }` |
| collection.ts route | shared collection.ts | uses addToCollectionSchema | WIRED | Language passed through `parsed.data.language` |
| oauth.service.ts | google-auth-library | OAuth2Client.verifyIdToken | WIRED | Line 1: `import { OAuth2Client }`, line 20: `googleClient.verifyIdToken` |
| oauth.service.ts | jose | jwtVerify + createRemoteJWKSet | WIRED | Line 2: `import { createRemoteJWKSet, jwtVerify }`, line 38: `await jwtVerify(identityToken, appleJWKS, ...)` |
| oauth.service.ts | schema.ts | oauthAccounts table | WIRED | Line 5: `import { users, oauthAccounts }`, used throughout |
| oauth.ts route | auth.service.ts | issueTokens | WIRED | Line 9: `import { issueTokens }`, line 42: `await issueTokens(fastify, result.user!.id)` |
| google-auth.ts | @react-native-google-signin | GoogleSignin | WIRED | Line 1-4: imports GoogleSignin and statusCodes |
| apple-auth.ts | expo-apple-authentication | AppleAuthentication | WIRED | Line 1: `import * as AppleAuthentication` |
| auth.ts store | /auth/oauth/google | POST idToken | WIRED | Line 219: `fetch(\`${API_URL}/auth/oauth/google\`, ...)` |
| LinkAccountModal | /auth/link | POST password + idToken | WIRED | auth.ts store line 281: `fetch(\`${API_URL}/auth/link\`, ...)` |
| server.ts | oauth.ts | route registration | WIRED | `import oauthRoutes`, `app.register(oauthRoutes)` |
| login.tsx | OAuthButtons + LinkAccountModal | component rendering | WIRED | Both imported and rendered in login and signup screens |
| useCards.ts | /api/cards | language query param | WIRED | Line 61: `params.set('language', selectedLanguage)` |
| useCollection.ts | /api/collection | language in body/query | WIRED | POST body includes language; DELETE/PUT use `?language=` query param |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| CARD-01 | 07-01 | Card database supports 9 languages | SATISFIED | cardTranslations table, supportedLanguages constant, seed script for 6 TCGdex languages |
| CARD-02 | 07-02, 07-04 | User can select card language when adding to collection | SATISFIED | AddToCollectionModal with language picker, collection API accepts language param |
| CARD-03 | 07-02, 07-04 | User can filter/search cards by language | SATISFIED | FilterChips language dropdown, card.service.ts INNER JOIN query, useCards passes language |
| CARD-04 | 07-02, 07-04 | Card detail shows available languages and translations | SATISFIED | /cards/:id/translations endpoint, TranslationBadges component with tappable switching |
| AUTH-01 | 07-03, 07-05 | User can sign up/login with Google account | SATISFIED | Google token verification server-side, native GoogleSignin on mobile, OAuthButtons component |
| AUTH-02 | 07-03, 07-05 | User can sign up/login with Apple account | SATISFIED | Apple JWKS verification server-side, expo-apple-authentication on mobile, iOS-only button |
| AUTH-03 | 07-03, 07-05 | Existing email users can link Google/Apple accounts | SATISFIED | POST /auth/link with password verification, profile linked accounts section |
| AUTH-04 | 07-03, 07-05 | OAuth accounts matching existing email prompt for linking | SATISFIED | needsLinking response from API, LinkAccountModal with password field and explanation |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None found | - | - | - | No TODOs, FIXMEs, placeholders, or stub implementations detected in phase artifacts |

### Human Verification Required

### 1. Language Filter Card Browsing

**Test:** Open Cards tab, select "DE" language filter, browse cards
**Expected:** Card names and images display in German where translations exist
**Why human:** Visual rendering and live API data integration need device testing

### 2. Card Detail Translation Switching

**Test:** Open a card detail, tap different language badges
**Expected:** Card name and image switch to selected language translation
**Why human:** UI state transitions and image loading need visual confirmation

### 3. Google OAuth End-to-End

**Test:** Tap "Continue with Google" on login screen (requires custom dev client + Google Cloud credentials)
**Expected:** Native Google Sign-In sheet appears, completes sign-in, returns to main app
**Why human:** Requires external service configuration and native module execution

### 4. Apple Sign-In on iOS

**Test:** Open login screen on iOS device, tap Apple Sign-In button
**Expected:** Native Apple Sign-In sheet appears (button hidden on Android)
**Why human:** Requires physical iOS device and Apple Developer account

### 5. Account Linking Flow

**Test:** Create email/password account, log out, try Google sign-in with same email
**Expected:** LinkAccountModal appears asking for password, linking succeeds after correct password
**Why human:** Requires two-step user flow with state transitions

### Gaps Summary

No gaps found. All 8 requirements (CARD-01 through CARD-04, AUTH-01 through AUTH-04) are fully implemented across 5 plans with complete backend services, API routes, database schema, shared types, mobile UI components, and test coverage. The implementation follows the planned architecture with proper three-level wiring verified.

The phase goal "Users can manage cards in their actual language and sign in with Google or Apple accounts" is achieved at the code level. Runtime verification requires external service configuration (Google Cloud, Apple Developer) and custom dev client builds.

---

_Verified: 2026-03-15_
_Verifier: Claude (gsd-verifier)_
