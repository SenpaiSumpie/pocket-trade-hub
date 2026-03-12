# Stack Research: v2.0 New Feature Technologies

**Domain:** Pokemon TCG Pocket trading platform -- new capabilities for v2.0
**Researched:** 2026-03-11
**Confidence:** MEDIUM-HIGH (most libraries verified via official docs and npm; some edge cases flagged)

> This document covers ONLY new technology additions for v2.0 features.
> Existing validated stack (Expo 54, Fastify 5, PostgreSQL, Redis, BullMQ, Socket.IO, RevenueCat, Drizzle ORM, Zustand, Zod, Turborepo/pnpm) is NOT re-evaluated.

---

## Recommended Stack Additions

### 1. OAuth Authentication (Google + Apple)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `expo-apple-authentication` | ~3.0.x (SDK 54) | Native Apple Sign-In on iOS | First-party Expo module; App Store REQUIRES Apple Sign-In when any third-party OAuth is offered; uses native modal (not browser redirect); config plugin built in |
| `@react-native-google-signin/google-signin` | ^16.1.2 | Native Google Sign-In | Uses platform-native APIs (not browser-based); Expo config plugin included; actively maintained (last published March 2026); 16.x is current stable |
| `google-auth-library` | ^9.x | Server-side Google ID token verification | Official Google library; verifies ID tokens without external network calls when using cached certs; lightweight |

**No new backend auth dependency needed for Apple** -- Apple Sign-In returns a JWT that can be verified with `@fastify/jwt` (already installed) using Apple's public keys.

**Architecture note:** OAuth adds a parallel auth path alongside existing email/password. Mobile client receives an OAuth ID token from native modal, sends it to the API, API verifies and either creates a new user or links to an existing account. Existing JWT refresh token rotation remains unchanged for session management.

**Expo config:**
```json
{
  "expo": {
    "ios": { "usesAppleSignIn": true },
    "plugins": [
      ["@react-native-google-signin/google-signin", {
        "iosUrlScheme": "com.googleusercontent.apps._YOUR_CLIENT_ID_"
      }]
    ]
  }
}
```

**Important:** Both require EAS Build (not Expo Go) due to native code.

**Confidence:** HIGH -- official Expo docs + actively maintained npm packages verified.

---

### 2. Card Scanning (Camera + OCR/Image Recognition)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `expo-camera` | ~16.0.x (SDK 54) | Camera access for live card capture | First-party Expo module; replaces deprecated expo-barcode-scanner; handles permissions automatically via config plugin |
| `expo-image-picker` | ~16.0.x (SDK 54) | Import card screenshots from gallery | First-party Expo module; `launchImageLibraryAsync()` for gallery, `launchCameraAsync()` for camera; handles permissions |
| Google Cloud Vision API | v1 (REST) | Server-side OCR text extraction | Extracts card name + card number text from photos; 1,000 free units/month then ~$1.50/1,000; battle-tested accuracy |

**Card recognition strategy: Server-side hybrid OCR + fuzzy matching.**

The flow:
1. Mobile captures photo (expo-camera) or imports screenshot (expo-image-picker)
2. Upload image to Fastify API endpoint
3. API calls Google Cloud Vision TEXT_DETECTION
4. Extract card name + set number from OCR response
5. Fuzzy match against TCGdex card DB already in PostgreSQL (using trigram similarity: `pg_trgm` extension)
6. Return top 3-5 candidate matches for user confirmation

**Why NOT on-device ML:**
- `react-native-mlkit-ocr` (v0.3.0) is abandoned -- 3+ years without updates. Do not use.
- `expo-mlkit-ocr` and `rn-mlkit-ocr` are community-maintained with uncertain long-term stability
- On-device image matching (CLIP, YOLO) requires 50-200MB model downloads per device
- Server-side approach is simpler to iterate on, more accurate, and cost-effective at our expected scale
- Google Vision handles edge cases (glare, angles, sleeves) better than lightweight on-device models

**For screenshot import:** Users take in-game screenshots showing their cards, then use expo-image-picker to select from gallery. Same OCR pipeline processes the image server-side.

**Backend additions needed:** No new npm package -- use Node.js `fetch()` to call the Google Vision REST API directly. One utility function, no SDK bloat.

**Confidence:** MEDIUM -- Google Vision OCR is proven; the card-specific fuzzy matching logic will need tuning. The `pg_trgm` PostgreSQL extension for text similarity is mature but matching accuracy depends on OCR quality. Flag for deeper research during implementation phase.

---

### 3. AI-Powered Trade Suggestions

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `openai` | ^4.x | OpenAI API client for Node.js | 8.8M weekly downloads; 34.3 kB gzipped; official SDK with TypeScript types; JSON mode for structured responses |

**Approach:** Server-side only. Zero AI libraries on mobile.

**How it works:**
1. BullMQ job triggers on app open (existing pattern from match computation)
2. Collect: user's inventory, wanted list, duplicates, recent market demand analytics
3. Send structured prompt to GPT-4o-mini with JSON mode enabled
4. GPT returns structured trade suggestions with reasoning in natural language
5. Cache results in Redis (TTL: 1 hour) -- skip API call if cache is fresh
6. Display suggestions with explanations: "Trade your duplicate Mewtwo EX (crown) -- it's the #3 most-wanted card this week"

**Cost estimate:** GPT-4o-mini at ~$0.15/1M input tokens, ~$0.60/1M output tokens. Typical suggestion request: ~2K input tokens, ~500 output tokens. At 10K DAU, 1 request/day = ~$3.30/day ($100/month). Manageable.

**Why NOT a custom recommendation algorithm:**
- Collaborative filtering requires significant training data we don't have yet at launch
- GPT-4o-mini provides natural language explanations that increase user trust
- Faster to build: prompt engineering vs. weeks of ML pipeline work
- Can evolve prompts without retraining models
- At scale (100K+ DAU), revisit with a hybrid approach: custom scoring + LLM explanations

**Confidence:** HIGH -- OpenAI Node.js SDK is mature; GPT-4o-mini JSON mode is well-documented.

---

### 4. Local Trade Finder (Geolocation)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `expo-location` | ~18.0.x (SDK 54) | Device geolocation (foreground only) | First-party Expo module; handles permissions; `getCurrentPositionAsync()` for on-demand location |
| PostGIS | 3.4+ (PostgreSQL extension) | Spatial queries for nearby users | Industry standard; `ST_DWithin` for radius queries; GIST index for fast spatial lookups; no new database needed |
| `drizzle-postgis` | ^0.2.x | PostGIS helper types for Drizzle ORM | Provides geometry column types + spatial query helpers; avoids raw SQL for schema definitions |

**Schema addition:**
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
ALTER TABLE users ADD COLUMN location geometry(Point, 4326);
ALTER TABLE users ADD COLUMN location_updated_at timestamptz;
CREATE INDEX idx_users_location ON users USING GIST(location);
```

**Nearby query:**
```typescript
// Find traders within radius (raw SQL via Drizzle for spatial queries)
const nearby = await db.execute(sql`
  SELECT id, display_name, avatar_url,
    ST_Distance(location::geography, ST_MakePoint(${lng}, ${lat})::geography) as distance_meters
  FROM users
  WHERE location IS NOT NULL
    AND ST_DWithin(location::geography, ST_MakePoint(${lng}, ${lat})::geography, ${radiusMeters})
    AND id != ${userId}
  ORDER BY distance_meters
  LIMIT 50
`);
```

**Privacy controls:**
- Location is strictly opt-in (off by default)
- Store approximate location only: round coordinates to 2 decimal places (~1.1km precision)
- Users can disable/clear their location at any time
- No background location tracking -- only update when user explicitly taps "Update my location"
- `location_updated_at` timestamp lets us filter stale locations (e.g., >30 days)

**Why NOT a separate geospatial service (Elasticsearch, MongoDB):** PostgreSQL with PostGIS handles geospatial queries at our scale (sub-100K users) without introducing a new database. One fewer service to deploy and maintain.

**Confidence:** HIGH -- PostGIS is mature (20+ years); expo-location is first-party Expo; Drizzle has official PostGIS guide.

---

### 5. Web App Companion

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Expo Router (web) | ~6.0.x (already installed) | File-based routing for web | Already in the project; supports web out of the box |
| `react-native-web` | ~0.21.0 (already installed) | Render RN components as web DOM | Already a dependency; no new install needed |

**Key decision: Use Expo Router's built-in web support. Do NOT add Next.js.**

**Why NOT Next.js:**
- Adding Next.js creates a separate app with its own routing, SSR setup, and deployment pipeline
- Expo Router already supports web with file-based routing and static export (SDK 52+)
- Maximum code sharing: same components, hooks, stores, and API client
- EAS Hosting supports deploying Expo web apps with custom domains and SSL
- One codebase, one set of routes, one deployment system

**Enable web in app.json:**
```json
{
  "expo": {
    "web": {
      "bundler": "metro",
      "output": "static"
    }
  }
}
```

**Web-specific considerations:**
- Native-only modules need `Platform.OS === 'web'` guards or `.web.tsx` file variants
- `expo-secure-store` -> `localStorage` wrapper on web (already have web polyfill pattern)
- `expo-camera` / `expo-haptics` -> conditionally disabled or replaced with web APIs
- Push notifications -> Web Push API (separate implementation from Expo Push)
- No new npm packages required for basic web support

**Confidence:** HIGH -- Expo web support is production-ready; `react-native-web` is already installed.

---

### 6. Multi-Language UI (i18n)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `expo-localization` | ~16.0.x (SDK 54) | Detect device locale | First-party Expo module; `getLocales()` returns device language preferences |
| `i18next` | ^24.x | i18n framework core | De facto standard; 8M+ weekly downloads; supports pluralization, interpolation, namespaces, lazy loading |
| `react-i18next` | ^15.x | React hooks for i18next | `useTranslation()` hook; Suspense support; official React integration |

**Installation:**
```bash
npx expo install expo-localization
pnpm add i18next react-i18next --filter mobile
```

**Architecture:**
- Translation JSON files in `packages/shared/src/i18n/locales/{lang}/` -- shared between mobile + web
- Namespace files per feature: `common.json`, `trades.json`, `cards.json`, `profile.json`, `decks.json`
- Device language auto-detected via `expo-localization`; user can override in Settings
- Persist language preference in AsyncStorage (already installed)
- Lazy-load non-default language bundles to reduce initial bundle size

**Initial languages:** English, Japanese, French, German, Spanish, Portuguese, Italian, Korean, Chinese (Simplified) -- matching Pokemon TCG Pocket's supported languages.

**Why NOT Lingui or react-intl:** i18next has the largest ecosystem, best Expo integration documentation (officially recommended in Expo docs), and most community resources. Lingui is good but smaller community. react-intl is ICU-focused and heavier.

**Confidence:** HIGH -- expo-localization + i18next is the officially recommended approach in Expo documentation.

---

### 7. Multi-Language Card Database

**No new npm packages needed.**

TCGdex API (already integrated) supports 14 languages natively. The existing card seed script fetches English-only data; extend it to fetch all supported languages.

**Schema approach:**
```typescript
export const cardTranslations = pgTable('card_translations', {
  id: serial('id').primaryKey(),
  cardId: text('card_id').notNull().references(() => cards.id),
  language: text('language').notNull(), // ISO 639-1: 'en', 'ja', 'fr', 'de', etc.
  name: text('name').notNull(),
  description: text('description'),
}, (table) => ({
  uniqueCardLang: unique().on(table.cardId, table.language),
  langIdx: index('idx_card_translations_lang').on(table.language),
}));
```

**Confidence:** HIGH -- TCGdex multi-language is a core API feature.

---

### 8. Deck Meta System

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Limitless TCG API | REST v1 | Tournament results, decklists, meta stats | Primary source for competitive Pokemon TCG data; free for most endpoints (no key needed); covers tournaments, deck archetypes, win rates |

**Data ingestion:**
- BullMQ cron job fetches tournament results daily from Limitless API
- Store in PostgreSQL: `deck_archetypes`, `tournament_results`, `deck_cards` junction table
- Compute win rates, popularity percentages, tier rankings server-side
- No SDK needed -- plain `fetch()` to Limitless REST endpoints

**Supplementary:** Pokedata.ovh for additional standings and meta snapshots.

**Important caveats:**
- The Limitless `/decks` endpoint (full decklists) requires an API key (free, apply via their site)
- Other endpoints (tournaments, standings, meta) are open but rate-limited
- **Verify Limitless covers Pokemon TCG Pocket specifically** (vs. physical TCG tournaments). If Pocket tournament data is sparse, consider supplementing with community-sourced data or building our own meta tracking from user deck submissions

**No new npm dependencies.** HTTP requests via built-in `fetch()`.

**Confidence:** MEDIUM -- Limitless API is documented and stable for physical TCG. Coverage of Pokemon TCG Pocket competitive data needs validation. Flag for research during deck meta phase.

---

### 9. Image Export (Shareable Collection/Tier List Images)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `react-native-view-shot` | ^4.0.x | Capture React Native views as PNG/JPG | Standard approach; 1.5M+ weekly downloads; renders any View subtree to an image file |
| `expo-sharing` | ~13.0.x (SDK 54) | Open native share sheet | First-party Expo module; share files/images via OS share dialog |
| `expo-file-system` | ~18.0.x (SDK 54) | Temp file management | First-party Expo module; manage captured image files |
| `expo-media-library` | ~17.0.x (SDK 54) | Save images to camera roll | First-party Expo module; save exported images to device gallery |

**Flow:**
1. Render collection grid or tier list inside a `ViewShot` wrapper component
2. Call `captureRef()` to produce a temp image URI (PNG, configurable quality)
3. User chooses: "Share" (expo-sharing opens native sheet) or "Save" (expo-media-library saves to gallery)

**Web fallback:** On web, `react-native-view-shot` may not work. Use `html2canvas` or server-side rendering for web image export if needed.

**Confidence:** HIGH -- react-native-view-shot + expo-sharing is the documented pattern in official Expo tutorials.

---

### 10. Gift/Promo Code System

**No new dependencies needed.** Pure backend feature using existing stack:
- New `promo_codes` table in PostgreSQL (code, type, value, expires_at, max_uses, current_uses)
- New `promo_redemptions` table (user_id, code_id, redeemed_at)
- Fastify route: `POST /promo-codes/redeem`
- BullMQ cron for expiration cleanup

**Confidence:** HIGH -- standard CRUD with existing tools.

---

### 11. Luck Calculator

**No new dependencies needed.** Pure computation feature:
- Calculate pack opening probabilities based on known Pokemon TCG Pocket pack rates
- Server-side statistics computation, cached in Redis
- All math in TypeScript -- no stats library needed for basic probability calculations

**Confidence:** HIGH -- straightforward math with existing stack.

---

## Complete Installation Commands

```bash
# Mobile app -- new dependencies
cd apps/mobile
npx expo install expo-apple-authentication expo-camera expo-image-picker \
  expo-location expo-localization expo-sharing expo-file-system \
  expo-media-library expo-crypto
pnpm add @react-native-google-signin/google-signin@^16.1.2 \
  i18next@^24.0.0 react-i18next@^15.0.0 react-native-view-shot@^4.0.0

# API server -- new dependencies
cd apps/api
pnpm add openai@^4.0.0 google-auth-library@^9.0.0

# Shared package -- no new deps, just i18n translation files
# Database -- enable extensions
# psql: CREATE EXTENSION IF NOT EXISTS postgis;
# psql: CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| Google Cloud Vision API (server OCR) | On-device ML Kit (expo-mlkit-ocr) | Community-maintained, uncertain stability, large model downloads, harder to iterate |
| Google Cloud Vision API (server OCR) | On-device CLIP/YOLO models | 50-200MB downloads per device, complex TensorFlow.js setup, worse accuracy without fine-tuning |
| OpenAI GPT-4o-mini (trade suggestions) | Custom collaborative filtering | Higher dev cost, needs training data we don't have, can't explain reasoning |
| Expo Router web (companion app) | Separate Next.js app | Doubles maintenance, separate routing/deployment, less code sharing |
| i18next (i18n) | Lingui | Smaller community, fewer Expo-specific resources |
| i18next (i18n) | react-intl | Heavier (ICU message format), less flexible for simple key-value translations |
| PostGIS (geolocation queries) | MongoDB geospatial / Elasticsearch | Already using PostgreSQL; no need for a new database at our scale |
| Limitless TCG API (deck meta) | Web scraping tournament sites | Fragile; breaks on CSS changes; Limitless provides a stable API |
| `@react-native-google-signin` (Google auth) | `expo-auth-session` (browser-based) | Browser redirect is worse UX than native modal; expo-auth-session is a fallback |
| `@react-native-google-signin` (Google auth) | Clerk / Auth0 | External auth service adds cost + vendor dependency; we already have JWT infrastructure |
| `react-native-view-shot` (image export) | Server-side image generation (Sharp/Puppeteer) | Unnecessary complexity; client-side capture is fast and free |
| Plain `fetch()` for external APIs | Axios | Built-in fetch is sufficient; Axios adds bundle size for no benefit |

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `expo-barcode-scanner` | Deprecated since SDK 52 | `expo-camera` has built-in barcode scanning |
| `react-native-mlkit-ocr` | Abandoned (v0.3.0, 3+ years stale, will break) | Google Cloud Vision API (server-side) |
| Next.js | Separate framework adds routing/SSR/deployment complexity | Expo Router web support (already available) |
| `@clerk/expo` / Auth0 / Supabase Auth | External auth service is unnecessary cost when you have working JWT infrastructure | Direct OAuth with google-signin + apple-authentication + existing Fastify JWT |
| TensorFlow.js / ONNX Runtime on mobile | 50-200MB model bundles, complex native setup for card recognition | Server-side Google Vision API |
| `react-native-maps` | Overkill for local trade finder -- users need a list sorted by distance, not a map | `expo-location` for coords + PostGIS for spatial queries |
| Crowdin / Lokalise (translation SaaS) | Premature for initial launch; JSON files in repo are simpler to start | JSON translation files in shared package; evaluate SaaS if 10+ languages |
| `@tanstack/react-query` | Tempting for server state, but existing Zustand + manual fetch pattern works and is already battle-tested in v1 | Keep current pattern; only add if data fetching complexity grows significantly |
| `react-native-mmkv` | Fast storage, but AsyncStorage is already working and sufficient | Keep AsyncStorage; MMKV is an optimization for later if needed |
| Stripe (for payments) | RevenueCat already handles IAP correctly for App Store compliance | Keep RevenueCat |

---

## Version Compatibility Matrix

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `expo-apple-authentication` ~3.0.x | Expo SDK 54, iOS only | Android returns `isAvailableAsync() === false`; guard with Platform.OS check |
| `@react-native-google-signin/google-signin` ^16.x | Expo SDK 54 | Requires EAS Build (not Expo Go); config plugin handles native setup |
| `expo-camera` ~16.0.x | Expo SDK 54 | Replaces deprecated expo-barcode-scanner |
| `drizzle-postgis` ^0.2.x | drizzle-orm ^0.45.0 | Known quoting bug with `box2d` type in drizzle-kit; may need patch; points work fine |
| `openai` ^4.x | Node.js 18+ | Fastify 5 already requires Node 18+; compatible |
| `i18next` ^24.x + `react-i18next` ^15.x | React 19, Expo SDK 54 | Ensure matching major versions between i18next and react-i18next |
| `react-native-view-shot` ^4.x | Expo SDK 54 | Requires dev build (not Expo Go); wraps native screenshot APIs |
| `google-auth-library` ^9.x | Node.js 18+ | Lightweight; only used server-side |
| PostGIS 3.4+ | PostgreSQL 14-16 | Enable via `CREATE EXTENSION postgis`; verify hosting provider supports it |

---

## External Service Dependencies (New)

| Service | Free Tier | Paid Cost | Purpose | Required Phase |
|---------|-----------|-----------|---------|----------------|
| Google Cloud Vision API | 1,000 units/month | ~$1.50/1,000 units | Card OCR text extraction | Card scanning |
| OpenAI API (GPT-4o-mini) | None (pay-per-use) | ~$0.15/1M input, ~$0.60/1M output tokens | AI trade suggestions | Smart suggestions |
| Limitless TCG API | Free (rate-limited) | Free API key for /decks (apply) | Deck meta tournament data | Deck meta system |
| Google Cloud Console | Free | Free | OAuth client credentials for Google Sign-In | OAuth login |
| Apple Developer Portal | Included in $99/yr membership | N/A | Apple Sign-In capability + certificates | OAuth login |

---

## Sources

- [Expo Authentication Docs](https://docs.expo.dev/develop/authentication/) -- OAuth approaches, provider comparison
- [Expo Apple Authentication](https://docs.expo.dev/versions/latest/sdk/apple-authentication/) -- Setup, config plugin, limitations
- [Expo Google Authentication Guide](https://docs.expo.dev/guides/google-authentication/) -- Recommended approaches
- [@react-native-google-signin Expo Setup](https://react-native-google-signin.github.io/docs/setting-up/expo) -- Config plugin, version 16.x
- [Expo Camera Docs](https://docs.expo.dev/versions/latest/sdk/camera/) -- Camera API, replaces barcode-scanner
- [Expo Image Picker Docs](https://docs.expo.dev/versions/latest/sdk/imagepicker/) -- Gallery/camera image selection
- [Google Cloud Vision Pricing](https://cloud.google.com/vision/pricing) -- OCR pricing tiers, free tier
- [OpenAI Node.js SDK](https://platform.openai.com/docs/libraries/node-js-library) -- Official SDK, JSON mode
- [Expo Location Docs](https://docs.expo.dev/versions/latest/sdk/location/) -- Geolocation APIs, permissions
- [Drizzle ORM PostGIS Guide](https://orm.drizzle.team/docs/guides/postgis-geometry-point) -- Geometry point support, ST_MakePoint
- [drizzle-postgis GitHub](https://github.com/Schmavery/drizzle-postgis) -- Community PostGIS extension for Drizzle
- [Expo Localization Docs](https://docs.expo.dev/versions/latest/sdk/localization/) -- i18n setup with i18next
- [Expo Web Development](https://docs.expo.dev/workflow/web/) -- Web platform support, EAS Hosting, static export
- [Limitless TCG Developer Docs](https://docs.limitlesstcg.com/developer.html) -- API endpoints, rate limits, key requirements
- [TCGdex API](https://tcgdex.dev) -- Multi-language card data (14 languages)
- [Expo captureRef / react-native-view-shot](https://docs.expo.dev/versions/latest/sdk/captureRef/) -- Screenshot capture
- [PokemonTCG Card Scanner Architecture](https://pokescope.app/blog/how-i-built-pokemon-card-scanner-ai-50000-users/) -- Real-world card scanner approach comparison
- [Expo Take a Screenshot Tutorial](https://docs.expo.dev/tutorial/screenshot/) -- View-shot + sharing pattern

---
*Stack research for: Pocket Trade Hub v2.0 new feature technologies*
*Researched: 2026-03-11*
