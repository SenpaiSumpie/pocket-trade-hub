# Phase 7: Multi-Language Cards and OAuth - Research

**Researched:** 2026-03-11
**Domain:** Multi-language card database (TCGdex API), OAuth (Google + Apple), Drizzle schema migration
**Confidence:** MEDIUM

## Summary

This phase has two parallel workstreams: (1) extending the card database to support 9 languages with per-card language tracking in collections, and (2) adding Google/Apple OAuth alongside existing email/password auth with account linking.

The most critical finding is a **TCGdex API language gap**: TCGdex currently serves TCG Pocket card data in only 6 of the 9 required languages (en, de, es, fr, it, pt). Japanese, Korean, and Traditional Chinese endpoints return 404 for TCG Pocket series. The seed script must handle this gracefully -- either by importing only the 6 available languages now and adding the remaining 3 when TCGdex adds them, or by sourcing the missing 3 languages from an alternative provider. The card_translations table schema should support all 9 languages regardless, so the data model is future-proof.

For OAuth, the standard Expo approach is `@react-native-google-signin/google-signin` for Google and `expo-apple-authentication` for Apple. Both provide native flows that return ID tokens. The API server verifies these tokens server-side using `google-auth-library` (Google) and Apple's public JWKS endpoint (Apple), then issues the same JWT access/refresh tokens the app already uses. The existing `users` table needs `passwordHash` changed to nullable and a new `oauthAccounts` table for provider linkage.

**Primary recommendation:** Build the `cardTranslations` table for all 9 languages but seed only the 6 currently available from TCGdex. For OAuth, use native sign-in libraries on mobile with server-side token verification -- do NOT use browser-based `expo-auth-session` for Google/Apple.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Per-card language in collection: each card entry has its own language (user can own 2 EN Pikachu + 1 JA Pikachu as separate entries)
- Same card in different languages = different collection entries with separate quantities
- Import all 9 language versions of every card from TCGdex upfront (full card_translations table)
- User profile has a "preferred card language" that pre-selects when adding cards, but user can override per-card
- Wanted list should also become language-aware (user specifies which language they want) -- critical for Phase 8 language-aware post matching

### Claude's Discretion
- Language switcher vs filter chip approach for card browsing
- Card detail view language display (tabs vs single language)
- Visual representation of languages (flags vs text codes)
- Collection view language distinction (badge vs grouping)
- Login screen layout (social buttons position relative to email/password form)
- Account linking approach when OAuth email matches existing account (recommend prompt-to-link with password verification for security)
- Profile settings for linking/unlinking OAuth providers
- Whether OAuth-only users can add a password later (recommend yes for account recovery)
- How to handle existing language-agnostic collection items (recommend default to English with user notification)
- Set completion tracking -- per-language vs total vs both

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CARD-01 | Card database supports 9 languages (EN, DE, ES, FR, IT, JA, KO, PT, ZH) | cardTranslations table schema; TCGdex API for 6 langs, gap for JA/KO/ZH |
| CARD-02 | User can select card language when adding to collection | Language field on collection/wanted schemas; preferred language on user profile |
| CARD-03 | User can filter/search cards by language | Language parameter on card search endpoint; cardTranslations join queries |
| CARD-04 | Card detail view shows available languages and translations | cardTranslations query by cardId; language availability flags |
| AUTH-01 | User can sign up/login with Google account | @react-native-google-signin + google-auth-library server verification |
| AUTH-02 | User can sign up/login with Apple account | expo-apple-authentication + Apple JWKS server verification |
| AUTH-03 | Existing email users can link Google/Apple accounts | oauthAccounts table; link endpoint with password verification |
| AUTH-04 | OAuth accounts that match existing email prompt for account linking (no silent merge) | Server-side email lookup on OAuth login; return needs_linking status |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @react-native-google-signin/google-signin | ^13.x | Native Google Sign-In on mobile | Expo-recommended; native flow, not browser-based |
| expo-apple-authentication | ~3.0.x (SDK 54) | Native Apple Sign-In on iOS | Official Expo module; required native button for App Store |
| google-auth-library | ^9.x | Server-side Google ID token verification | Official Google library for Node.js |
| jose | ^5.x | Server-side Apple ID token verification via JWKS | Lightweight JWT/JWKS library; no Apple SDK needed |
| drizzle-orm | ^0.45.0 | Database ORM (already installed) | Already in use; schema migrations for new tables |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-crypto | ~14.0.x | Peer dependency of expo-auth-session | Already available in Expo SDK 54 |
| expo-web-browser | ~15.0.10 | Already installed | NOT needed for Google/Apple native flows |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @react-native-google-signin | expo-auth-session (browser-based) | Browser flow is worse UX, opens external browser; native is recommended |
| jose (Apple verification) | jsonwebtoken + jwks-rsa | More dependencies; jose is modern, lighter |
| Separate oauthAccounts table | JSON column on users table | Separate table is cleaner, supports multiple providers per user |

**Installation:**
```bash
# API server
cd apps/api && pnpm add google-auth-library jose

# Mobile app
cd apps/mobile && npx expo install @react-native-google-signin/google-signin expo-apple-authentication
```

## Architecture Patterns

### Database Schema Changes

```sql
-- New table: card translations (one row per card per language)
CREATE TABLE card_translations (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL REFERENCES cards(id),
  language VARCHAR(5) NOT NULL,  -- 'en', 'de', 'es', 'fr', 'it', 'ja', 'ko', 'pt', 'zh'
  name VARCHAR(100) NOT NULL,
  image_url TEXT NOT NULL,
  attacks JSONB,                 -- translated attack names/descriptions
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(card_id, language)
);
CREATE INDEX card_translations_language_idx ON card_translations(language);
CREATE INDEX card_translations_name_lower_idx ON card_translations(lower(name));

-- New table: OAuth provider accounts
CREATE TABLE oauth_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  provider VARCHAR(20) NOT NULL,     -- 'google' | 'apple'
  provider_user_id TEXT NOT NULL,     -- Google sub or Apple user identifier
  email VARCHAR(255),                 -- email from provider (may differ from user email)
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(provider, provider_user_id)
);
CREATE INDEX oauth_accounts_user_id_idx ON oauth_accounts(user_id);

-- Alter existing tables
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users ADD COLUMN preferred_card_language VARCHAR(5) DEFAULT 'en';

-- Alter collection items: add language, change unique constraint
ALTER TABLE user_collection_items ADD COLUMN language VARCHAR(5) NOT NULL DEFAULT 'en';
DROP INDEX user_collection_items_user_card_idx;
CREATE UNIQUE INDEX user_collection_items_user_card_lang_idx
  ON user_collection_items(user_id, card_id, language);

-- Alter wanted cards: add language
ALTER TABLE user_wanted_cards ADD COLUMN language VARCHAR(5) NOT NULL DEFAULT 'en';
DROP INDEX user_wanted_cards_user_card_idx;
CREATE UNIQUE INDEX user_wanted_cards_user_card_lang_idx
  ON user_wanted_cards(user_id, card_id, language);
```

### Recommended Project Structure Changes
```
apps/api/src/
  db/
    schema.ts              # Add cardTranslations, oauthAccounts tables; alter users
    seeds/
      seed-cards.ts        # Extend to fetch all 6 (then 9) languages
  services/
    auth.service.ts        # Add createOAuthUser, findOrCreateByOAuth, linkOAuthAccount
    card.service.ts        # Add language param to searches, getTranslations
  routes/
    auth.ts                # Add POST /auth/oauth/google, /auth/oauth/apple, /auth/link

packages/shared/src/schemas/
  auth.ts                  # Add oauthLoginSchema, linkAccountSchema
  card.ts                  # Add language field to cardSearchSchema
  collection.ts            # Add language field to addToCollectionSchema, addToWantedSchema

apps/mobile/src/
  services/
    google-auth.ts         # Google Sign-In wrapper
    apple-auth.ts          # Apple Sign-In wrapper
  stores/
    auth.ts                # Add OAuth login methods
    collection.ts          # Update to include language in keys
  components/
    auth/
      OAuthButtons.tsx     # Google + Apple sign-in buttons
      LinkAccountModal.tsx # Account linking UI
```

### Pattern 1: OAuth Login Flow (Server-Side Token Verification)
**What:** Mobile gets native ID token, sends to server, server verifies and issues app JWT
**When to use:** Always for OAuth -- never trust client-side tokens without server verification

```typescript
// Server: POST /auth/oauth/google
async function googleOAuthLogin(fastify: FastifyInstance, idToken: string) {
  const { OAuth2Client } = await import('google-auth-library');
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload || !payload.sub || !payload.email) {
    throw new Error('Invalid Google token');
  }

  // Check if OAuth account exists
  const existing = await findOAuthAccount(db, 'google', payload.sub);
  if (existing) {
    return issueTokens(fastify, existing.userId);
  }

  // Check if email matches existing user -> needs_linking
  const emailUser = await findUserByEmail(db, payload.email);
  if (emailUser) {
    return { needs_linking: true, email: payload.email, provider: 'google' };
  }

  // Create new user (no password)
  const user = await createOAuthUser(db, payload.email, 'google', payload.sub);
  return issueTokens(fastify, user.id);
}
```

### Pattern 2: Apple ID Token Verification with JWKS
**What:** Verify Apple's identity token using their public key set
**When to use:** Server-side Apple Sign-In verification

```typescript
// Server: Apple token verification using jose
import { createRemoteJWKSet, jwtVerify } from 'jose';

const APPLE_JWKS = createRemoteJWKSet(
  new URL('https://appleid.apple.com/auth/keys')
);

async function verifyAppleToken(identityToken: string) {
  const { payload } = await jwtVerify(identityToken, APPLE_JWKS, {
    issuer: 'https://appleid.apple.com',
    audience: process.env.APPLE_BUNDLE_ID, // e.g., 'com.pockettradehub.app'
  });
  return {
    sub: payload.sub as string,
    email: payload.email as string,
  };
}
```

### Pattern 3: Card Translation Seed Script
**What:** Extend seed script to iterate all languages per set
**When to use:** Initial data import and periodic sync

```typescript
const TCGDEX_LANGUAGES = ['en', 'de', 'es', 'fr', 'it', 'pt']; // 6 available now
// Future: add 'ja', 'ko', 'zh' when TCGdex supports them

for (const lang of TCGDEX_LANGUAGES) {
  const setData = await fetchJson(`https://api.tcgdex.net/v2/${lang}/sets/${setId}`);
  for (const card of setData.cards) {
    await tx.insert(cardTranslations).values({
      id: `${card.id}-${lang}`,
      cardId: card.id,  // references the base card (EN is canonical)
      language: lang,
      name: card.name,
      imageUrl: card.image ? `${card.image}/high.webp` : fallbackUrl(lang, setId, card.localId),
      attacks: card.attacks ? translateAttacks(card.attacks) : null,
    }).onConflictDoUpdate({
      target: [cardTranslations.cardId, cardTranslations.language],
      set: { name: card.name, imageUrl: /* updated url */ },
    });
  }
}
```

### Pattern 4: Collection Store with Language Keys
**What:** Change collection store keys from cardId to cardId:language composite
**When to use:** All collection/wanted operations

```typescript
// Key format: "A1-001:en", "A1-001:ja"
const compositeKey = (cardId: string, language: string) => `${cardId}:${language}`;

// In collection store
collectionByKey: Record<string, number>,  // key = "cardId:lang"
addToCollection: (cardId: string, language: string, quantity?: number) => void,
```

### Anti-Patterns to Avoid
- **Browser-based OAuth for Google/Apple:** Use native sign-in libraries, not expo-auth-session. Browser flows open an external browser which is poor UX and may not work reliably on all devices.
- **Trusting client-side OAuth tokens:** ALWAYS verify ID tokens server-side before creating sessions.
- **Merging OAuth accounts silently:** When an OAuth email matches an existing account, NEVER merge automatically -- always prompt user to confirm and verify password (AUTH-04).
- **Storing provider access tokens:** Only store the provider user ID for account linking. The app only needs the initial ID token for verification; it does not need ongoing Google/Apple API access.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Google ID token verification | Manual JWT decode + key fetch | google-auth-library `verifyIdToken` | Handles key rotation, clock skew, audience validation |
| Apple ID token verification | Manual JWKS fetch + JWT verify | jose `jwtVerify` + `createRemoteJWKSet` | JWKS key rotation, caching, proper validation |
| Apple Sign-In button | Custom styled button | AppleAuthentication.AppleAuthenticationButton | App Store requires official button component |
| Database migrations | Raw SQL ALTER TABLE | Drizzle Kit `db:generate` + `db:push` | Schema drift, rollback safety |
| TCGdex API client | Raw fetch everywhere | Centralized fetchTcgdex utility with rate limiting + retry | Rate limits (500ms delay already in seed), error handling |

## Common Pitfalls

### Pitfall 1: TCGdex Language Availability Gap
**What goes wrong:** Attempting to import all 9 languages fails for JA, KO, ZH because TCGdex returns 404
**Why it happens:** TCGdex has incomplete coverage for Asian languages in TCG Pocket. Only en/de/es/fr/it/pt work.
**How to avoid:** Design the schema for all 9 languages. Seed only the 6 available. Track language availability per card in the translations table. UI should show "translation not yet available" for missing languages. Add a periodic sync job to check for newly available translations.
**Warning signs:** HTTP 404 from `https://api.tcgdex.net/v2/{ja|ko|zh-*}/series/tcgp`

### Pitfall 2: Apple Sign-In Credential Caching
**What goes wrong:** Apple only returns user's name/email on FIRST sign-in. Subsequent calls return only the user identifier.
**Why it happens:** Apple privacy design -- data is provided once.
**How to avoid:** Store the email and name from the first credential response in the oauthAccounts table. Use `getCredentialStateAsync()` for subsequent auth checks, not `signInAsync()`.
**Warning signs:** User appears with null email after re-signing in.

### Pitfall 3: passwordHash NOT NULL Constraint
**What goes wrong:** Creating OAuth-only users fails because `users.passwordHash` is NOT NULL
**Why it happens:** Original schema assumed all users have passwords
**How to avoid:** Migration MUST run `ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL` BEFORE any OAuth user creation. Also update `verifyCredentials` to handle null passwordHash gracefully (return "use OAuth" error).
**Warning signs:** Database insert error on OAuth signup.

### Pitfall 4: Collection Unique Index Breaking Change
**What goes wrong:** Adding language to collection items breaks the existing unique index (userId, cardId)
**Why it happens:** Existing data has no language value; adding language column with default 'en' creates conflicts if migration order is wrong
**How to avoid:** Migration order: (1) add language column with default 'en', (2) drop old unique index, (3) create new unique index on (userId, cardId, language). Do this in a single transaction.
**Warning signs:** Duplicate key violation errors after migration.

### Pitfall 5: Card ID Consistency Across Languages
**What goes wrong:** Different language endpoints return different card IDs or different card counts per set
**Why it happens:** TCGdex has varying completion per language (e.g., EN has 286 cards for A1, DE has fewer)
**How to avoid:** Use English as the canonical card set. The `cards` table stays EN-only (base reference). `card_translations` adds translations for cards that exist in each language. Cards missing from a language simply have no translation row.
**Warning signs:** Card count mismatch between languages for the same set.

### Pitfall 6: Google Sign-In Requires Custom Dev Client
**What goes wrong:** @react-native-google-signin does not work in Expo Go
**Why it happens:** Requires custom native code
**How to avoid:** Must use EAS Build or a development build. Add the config plugin to app.json. For Android, need SHA-1 fingerprint from the signing key.
**Warning signs:** "Module not found" error in Expo Go.

## Code Examples

### Drizzle Schema: cardTranslations Table
```typescript
// Source: Project pattern from existing schema.ts
export const supportedLanguages = ['en', 'de', 'es', 'fr', 'it', 'ja', 'ko', 'pt', 'zh'] as const;
export type CardLanguage = typeof supportedLanguages[number];

export const cardTranslations = pgTable('card_translations', {
  id: text('id').primaryKey(),
  cardId: text('card_id').notNull().references(() => cards.id),
  language: varchar('language', { length: 5 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  imageUrl: text('image_url').notNull(),
  attacks: jsonb('attacks'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('card_translations_card_lang_idx').on(table.cardId, table.language),
  index('card_translations_language_idx').on(table.language),
  index('card_translations_name_lower_idx').on(sql`lower(${table.name})`),
]);
```

### Drizzle Schema: oauthAccounts Table
```typescript
export const oauthAccounts = pgTable('oauth_accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  provider: varchar('provider', { length: 20 }).notNull(),  // 'google' | 'apple'
  providerUserId: text('provider_user_id').notNull(),
  email: varchar('email', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('oauth_accounts_provider_uid_idx').on(table.provider, table.providerUserId),
  index('oauth_accounts_user_id_idx').on(table.userId),
]);
```

### Shared Schema: Language-Aware Collection
```typescript
// packages/shared/src/schemas/collection.ts additions
export const cardLanguageValues = ['en', 'de', 'es', 'fr', 'it', 'ja', 'ko', 'pt', 'zh'] as const;

export const addToCollectionSchema = z.object({
  cardId: z.string().min(1),
  language: z.enum(cardLanguageValues).default('en'),
  quantity: z.number().int().min(1).max(99).default(1),
});

export const addToWantedSchema = z.object({
  cardId: z.string().min(1),
  language: z.enum(cardLanguageValues).default('en'),
  priority: z.enum(priorityValues).default('medium'),
});
```

### Shared Schema: OAuth Login
```typescript
// packages/shared/src/schemas/auth.ts additions
export const oauthLoginSchema = z.object({
  provider: z.enum(['google', 'apple']),
  idToken: z.string().min(1),
});

export const linkAccountSchema = z.object({
  provider: z.enum(['google', 'apple']),
  idToken: z.string().min(1),
  password: z.string().min(1),  // required to verify account ownership
});

export type OAuthLoginInput = z.infer<typeof oauthLoginSchema>;
export type LinkAccountInput = z.infer<typeof linkAccountSchema>;
```

### Mobile: Google Sign-In Configuration
```typescript
// apps/mobile/src/services/google-auth.ts
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, // WEB client ID for server verification
  offlineAccess: false, // We only need ID token
  scopes: ['email', 'profile'],
});

export async function signInWithGoogle(): Promise<string | null> {
  try {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    return response.data?.idToken ?? null;
  } catch (error: any) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) return null;
    throw error;
  }
}
```

### Mobile: Apple Sign-In
```typescript
// apps/mobile/src/services/apple-auth.ts
import * as AppleAuthentication from 'expo-apple-authentication';

export async function signInWithApple(): Promise<{ idToken: string; email?: string } | null> {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) throw new Error('No identity token');
    return {
      idToken: credential.identityToken,
      email: credential.email ?? undefined,
    };
  } catch (e: any) {
    if (e.code === 'ERR_REQUEST_CANCELED') return null;
    throw e;
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| expo-auth-session for Google | @react-native-google-signin/google-signin | 2024+ | Native flow, better UX, Expo recommended |
| Manual Apple JWT verification | jose library with createRemoteJWKSet | 2023+ | Auto key rotation, standards-compliant |
| Storing OAuth provider tokens | Store only provider user ID | Best practice | Less data liability, no token refresh needed |

**Deprecated/outdated:**
- `expo-google-sign-in`: Deprecated, replaced by @react-native-google-signin
- `expo-google-app-auth`: Deprecated since Expo SDK 46
- Browser-based OAuth for native apps: Still works but is considered second-class UX

## Open Questions

1. **TCGdex Asian Language Timeline**
   - What we know: JA, KO, ZH return 404 for TCGP series. TCGdex status page shows partial progress (JA: 5655/14694 cards globally, KO: 0/9118).
   - What's unclear: When/if TCGdex will add TCGP support for these languages. Could be weeks or months.
   - Recommendation: Build schema for all 9 languages. Seed 6 now. Add a BullMQ periodic job to check for new language availability and auto-import. Flag missing languages in UI as "coming soon."

2. **Card Image URL Pattern Across Languages**
   - What we know: EN images use pattern `https://assets.tcgdex.net/en/tcgp/{setId}/{localId}/high.webp`. Other languages likely follow `https://assets.tcgdex.net/{lang}/tcgp/{setId}/{localId}/high.webp`.
   - What's unclear: Whether all language variants have distinct images or some share EN images.
   - Recommendation: Store the image URL returned by TCGdex per translation. If API returns no image, fall back to EN image URL.

3. **Existing Collection Migration Volume**
   - What we know: Current collection items have no language. Need to default to 'en'.
   - What's unclear: How many active users/items exist; whether batch migration is instant or needs chunking.
   - Recommendation: Single migration adds column with DEFAULT 'en'. For existing data this is a metadata-only change in PostgreSQL (no row rewrite), so it should be fast regardless of size.

4. **Google Cloud Console Project Setup**
   - What we know: Need a Google Cloud project with OAuth 2.0 credentials (Web Client ID for server verification + Android/iOS client IDs).
   - What's unclear: Whether the project owner has already set this up.
   - Recommendation: Document the required setup steps as a prerequisite task. Need: Web Client ID, Android Client ID (with SHA-1), iOS Client ID, Apple Developer account with Sign In with Apple capability.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 + ts-jest |
| Config file | `apps/api/jest.config.js` |
| Quick run command | `cd apps/api && pnpm test -- --testPathPattern="PATTERN" --no-coverage` |
| Full suite command | `cd apps/api && pnpm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CARD-01 | Card translations table seeded with multi-language data | unit | `cd apps/api && pnpm test -- --testPathPattern="card-translation" --no-coverage` | No - Wave 0 |
| CARD-02 | Add to collection with language param | integration | `cd apps/api && pnpm test -- --testPathPattern="collection.route" --no-coverage` | Yes - needs update |
| CARD-03 | Card search with language filter | integration | `cd apps/api && pnpm test -- --testPathPattern="cards.route" --no-coverage` | Yes - needs update |
| CARD-04 | Card detail returns available translations | unit | `cd apps/api && pnpm test -- --testPathPattern="card.service" --no-coverage` | Yes - needs update |
| AUTH-01 | Google OAuth login creates/returns user | integration | `cd apps/api && pnpm test -- --testPathPattern="auth.oauth" --no-coverage` | No - Wave 0 |
| AUTH-02 | Apple OAuth login creates/returns user | integration | `cd apps/api && pnpm test -- --testPathPattern="auth.oauth" --no-coverage` | No - Wave 0 |
| AUTH-03 | Link OAuth to existing account | integration | `cd apps/api && pnpm test -- --testPathPattern="auth.link" --no-coverage` | No - Wave 0 |
| AUTH-04 | OAuth email match returns needs_linking | unit | `cd apps/api && pnpm test -- --testPathPattern="auth.oauth" --no-coverage` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `cd apps/api && pnpm test -- --testPathPattern="CHANGED_FILE" --no-coverage`
- **Per wave merge:** `cd apps/api && pnpm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/api/__tests__/auth.oauth.test.ts` -- covers AUTH-01, AUTH-02, AUTH-04 (Google/Apple OAuth login, needs_linking)
- [ ] `apps/api/__tests__/auth.link.test.ts` -- covers AUTH-03 (account linking)
- [ ] `apps/api/__tests__/services/card-translation.service.test.ts` -- covers CARD-01 (translations CRUD)
- [ ] Update `apps/api/__tests__/routes/collection.route.test.ts` -- add language param tests for CARD-02
- [ ] Update `apps/api/__tests__/routes/cards.route.test.ts` -- add language filter tests for CARD-03
- [ ] Update `apps/api/__tests__/services/card.service.test.ts` -- add translation query tests for CARD-04
- [ ] Mock utilities for google-auth-library and jose in test environment

## Sources

### Primary (HIGH confidence)
- TCGdex REST API -- verified language endpoints via direct HTTP requests (en/de/es/fr/it/pt return 200, ja/ko/zh return 404)
- [Expo Apple Authentication docs](https://docs.expo.dev/versions/latest/sdk/apple-authentication/) -- setup, API, code examples
- [Expo Google Authentication guide](https://docs.expo.dev/guides/google-authentication/) -- recommends @react-native-google-signin
- [Google ID token verification docs](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token) -- google-auth-library verifyIdToken

### Secondary (MEDIUM confidence)
- [TCGdex homepage](https://tcgdex.dev) -- claims 9 TCG Pocket languages but API endpoints don't match
- [Pokemon TCG Pocket support page](https://app-ptcgp.pokemon-support.com/hc/en-us/articles/39077907007257) -- confirms 9 in-game languages
- TCGdex status page shows partial completion for JA/KO/ZH globally

### Tertiary (LOW confidence)
- TCGdex Asian language timeline: no official roadmap found; status page shows ongoing work

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Expo docs and Google docs confirm library choices
- Architecture: HIGH - Schema design follows established Drizzle patterns in the project
- Card language coverage: MEDIUM - TCGdex gap for 3/9 languages is confirmed but workaround is clear
- OAuth flow: HIGH - Standard pattern with well-documented libraries
- Pitfalls: HIGH - Verified through direct API testing and code review

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (30 days; TCGdex language availability may change sooner)
