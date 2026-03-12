# Pitfalls Research

**Domain:** Pokemon TCG Pocket Trading Platform -- v2.0 Feature Additions
**Researched:** 2026-03-11
**Confidence:** HIGH (based on codebase analysis, competitor research, and established patterns)

## Critical Pitfalls

### Pitfall 1: Post-Based Model Migration Destroys Existing Matching/Proposal Chain

**What goes wrong:**
The v1.0 schema tightly couples proposals to matches via `tradeProposals.matchId` referencing `tradeMatches.id`. The `createProposalSchema` in `packages/shared` requires `matchId` as a non-optional string. Moving to a post-based model (Offering/Seeking posts) means matches no longer originate from the automatic engine -- they originate from posts. If the migration drops or restructures `tradeMatches` without accounting for existing proposals, all in-progress proposals lose their context. Worse, the mobile app's `ProposalCreationModal` and `ProposalDetailModal` depend on match data to display what each party offers/wants.

**Why it happens:**
Developers treat the post-based model as a replacement for matching rather than an evolution. The automatic matching system in `match.service.ts` computes two-way matches from collection/wanted data, stores them in `tradeMatches`, and proposals reference those matches. The temptation is to rip out `tradeMatches` entirely, but proposals in-flight depend on that data.

**How to avoid:**
- Use the expand-contract pattern: add `tradePosts` table and `postId` column on `tradeProposals` alongside existing `matchId`. Make `matchId` nullable in the schema (it is already nullable in the DB column definition but required in the Zod schema).
- Keep automatic matching running in parallel during transition. Let it coexist with posts -- users who have not adopted posts still get matched automatically.
- Migrate the `createProposalSchema` to accept either `matchId` or `postId` (union type) so proposals can originate from either source.
- Only deprecate automatic matching after post adoption is confirmed via analytics.

**Warning signs:**
- Proposals failing validation because `matchId` is missing.
- Mobile app crashes when opening old proposals that reference deleted matches.
- Users report "my trades disappeared" after update.

**Phase to address:**
Phase 1 (Post Model) -- must be the FIRST feature built because it is an architecture overhaul that every subsequent feature depends on.

---

### Pitfall 2: Card Language Mismatch in Trades (The PokeHub Problem)

**What goes wrong:**
Users post cards in one language (e.g., Japanese Pikachu) but partners expect another language (e.g., English Pikachu). Pokemon TCG Pocket restricts trades to same-language cards. If the app does not enforce or clearly display card language at every step -- post creation, search results, proposal creation, proposal review -- users complete the coordination flow only to discover they cannot execute the trade in-game. This is PokeHub's most-reported UX failure.

**Why it happens:**
The current `cards` table has a single `name` field with no `language` column. Card IDs from TCGdex are language-agnostic (same card, different language = different TCGdex ID). When adding multi-language support, developers add the language column to the database but forget to propagate it through every UI surface -- search filters, post creation, proposal cards display, and match results.

**How to avoid:**
- Add `language` column to `cards` table and `userCollectionItems` (users may own cards in multiple languages).
- Display language badges on EVERY card surface -- collection, search, posts, proposals.
- Add a language filter that defaults to the user's game language and prominently warns when viewing cross-language results.
- Validate at proposal creation that both sides' cards share the same language.
- The card seed script must import cards per-language from TCGdex, not just English.

**Warning signs:**
- Cards display without language indicators anywhere in the UI.
- No language filter on search or post browsing screens.
- Proposals can be created between cards of different languages with no warning.

**Phase to address:**
Phase 1 or 2 (Multi-Language Card Database) -- must ship BEFORE or WITH the post-based model, not after. Language-blind trading is the single biggest user complaint in the competitor app.

---

### Pitfall 3: OAuth Account Linking Creates Duplicate/Orphaned Accounts

**What goes wrong:**
A user who registered with email/password tries to sign in with Google using the same email. The app creates a new account instead of linking to the existing one, resulting in duplicate accounts with split collection data. Conversely, Apple Sign-In's "Hide My Email" feature generates a `privaterelay.appleid.com` proxy email that never matches any existing account, so the user cannot link their Apple ID to their existing account.

**Why it happens:**
The current `users` table stores `email` and `passwordHash` with no OAuth provider columns. Adding OAuth without an account-linking flow means the app has no way to associate a Google/Apple identity with an existing email/password user. Developers add OAuth as a separate registration path without considering existing users.

**How to avoid:**
- Add `authProviders` junction table: `userId, provider (google|apple|email), providerUserId, providerEmail`.
- On OAuth sign-in, check if an email match exists (for Google where email is available). If yes, prompt the user to link accounts by verifying their existing password.
- For Apple's hidden email: store the Apple user ID as the linking key, not email. On first Apple sign-in, require the user to confirm their existing account (enter email + password) to link.
- Never auto-merge accounts silently -- always require user confirmation.
- Add an account settings screen where users can view/manage linked providers.

**Warning signs:**
- Users report "I can't find my cards" after signing in with Google.
- Database shows duplicate emails or users with zero collection who should have data.
- Support requests about "lost accounts."

**Phase to address:**
Phase 2 (OAuth) -- design the linking flow BEFORE implementing the OAuth providers. The database schema change (authProviders table) should be in the same migration.

---

### Pitfall 4: Web App Shares Too Much or Too Little with Mobile

**What goes wrong:**
Adding a web app (`apps/web`) to the Turborepo monorepo leads to one of two failure modes. (A) Over-sharing: importing mobile components that use React Native APIs (`Animated`, `FlatList`, `TouchableOpacity`, platform-specific storage) into the web app, causing build failures or runtime crashes. (B) Under-sharing: duplicating all business logic and Zod schemas instead of using the shared package, leading to divergent behavior between web and mobile.

**Why it happens:**
The current monorepo has `apps/mobile` (Expo/React Native) and `packages/shared` (Zod schemas). The shared package only contains schemas -- no hooks, no API client, no business logic. When building the web app, developers either try to import from `apps/mobile/src` directly (breaks) or rebuild everything from scratch (diverges).

**How to avoid:**
- Extract shared business logic into `packages/shared` BEFORE building the web app: API client, Zod schemas (already there), type definitions, fairness calculation, constants.
- Keep UI components platform-specific: `apps/mobile/src/components` and `apps/web/src/components` -- do NOT try to share React Native components with web.
- Use React Native for Web (via Expo) only if committing to a single codebase. If building a separate Next.js/React web app, do not import anything from `react-native`.
- Shared hooks that use platform-agnostic APIs (fetch, Zod validation) go in `packages/shared`. Hooks that use AsyncStorage, SecureStore, or React Native modules stay in `apps/mobile`.
- Zustand stores can be shared IF they do not import platform-specific persistence.

**Warning signs:**
- Web build fails with "Cannot resolve module react-native."
- Same API endpoint behaves differently on web vs mobile.
- Bug fixes applied to one platform but not the other.
- Shared package imports growing to include React Native dependencies.

**Phase to address:**
Dedicated phase for shared package refactoring BEFORE the web app phase. Extract the API client and business logic first, then build the web app consuming those shared packages.

---

### Pitfall 5: Card Scanning Frustration Loop -- Low Accuracy Kills Trust

**What goes wrong:**
Card scanning using camera/screenshot recognition achieves 80-85% accuracy in initial implementation. Users scan a card, get the wrong result, manually correct it, and after 3-4 bad scans, abandon the feature entirely. Worse, if incorrect scans silently add wrong cards to inventory, users discover errors later when trades fail. Pokemon TCG Pocket cards have subtle visual differences (same art, different rarity symbols) that trip up image recognition.

**Why it happens:**
Pokemon cards in the same set often share artwork across rarity variants (e.g., a regular Pikachu and a full-art Pikachu look nearly identical in photos). OCR struggles with the small rarity diamonds/stars. Developers ship the feature targeting the happy path (good lighting, flat card, clear shot) but real-world usage involves glare, angles, and screenshots with UI overlays.

**How to avoid:**
- Always show a confirmation screen after scan with the detected card prominently displayed. NEVER auto-add to collection.
- Show top-3 candidate matches with confidence scores, letting the user tap the correct one.
- Support screenshot import (from game's collection screen) as the PRIMARY flow -- it is more reliable than camera because it eliminates lighting/angle variables.
- Use fuzzy matching against the card database (name + set + rarity) rather than pure image matching. A 97% accuracy rate was achieved by combining fuzzy text search with probability analysis.
- Implement a "report wrong scan" button that feeds back into accuracy improvement.
- Gate the feature as "Beta" at launch to set expectations.

**Warning signs:**
- Users scanning same card repeatedly getting different results.
- High abandonment rate on the scan screen (analytics).
- Inventory contains cards the user does not actually own (from silent mis-scans).

**Phase to address:**
Later phase (Phase 4+) -- this is a differentiator, not table stakes. Ship it when the core trading flow is solid, and ship it as beta with confirmation-first UX.

---

### Pitfall 6: AI Trade Suggestions Feel Random Without Enough Data

**What goes wrong:**
AI-powered trade suggestions require understanding card value, user preferences, and market dynamics. With a small user base (early v2.0), collaborative filtering has no signal. The system suggests trades that are technically valid (rarity matches) but feel random -- suggesting a user trade away a card they are actively using in their competitive deck, or suggesting low-demand cards nobody wants.

**Why it happens:**
Cold start problem. The v1.0 matching engine uses a simple priority-weighted scoring system (`high=3, medium=2, low=1`). Upgrading to "AI suggestions" without sufficient training data means the model falls back to rule-based heuristics that are barely better than the existing system. Users expect "AI" to be magic, and when it is not, they distrust the feature permanently.

**How to avoid:**
- Start with enhanced rule-based suggestions, not ML. Use card demand analytics (already in v1.0's `cardAnalytics` table), rarity balance, and community-wide want/have ratios.
- Label it "Smart Suggestions" not "AI" to manage expectations.
- Incorporate deck meta data: never suggest trading away cards that are core to popular competitive decks.
- Add a "Not interested" / "Good suggestion" feedback mechanism to improve over time.
- Only graduate to ML-based recommendations when you have 1000+ completed trades as training data.

**Warning signs:**
- Users consistently dismissing suggestions (track dismiss rate).
- Suggestions that propose trading crown-rarity cards for diamond-1 cards.
- Suggestions involving cards the user has in their competitive deck.

**Phase to address:**
Phase 5+ -- after deck meta, after post-based trading has generated enough trade completion data. The "smart" part requires data that does not exist yet.

---

### Pitfall 7: Local Trade Finder Exposes Precise User Locations

**What goes wrong:**
Implementing "nearby traders" by storing and sharing precise GPS coordinates. Users can be stalked or harassed if their exact location is visible. Even city-level granularity can be problematic for smaller towns. Under GDPR, location data is classified as personal data (and potentially sensitive data), requiring explicit opt-in consent, purpose limitation, and data minimization.

**Why it happens:**
The simplest implementation stores lat/lng on the user profile and queries by distance. Developers forget that showing "User X is 0.3km away" reveals approximate location, and repeated queries can triangulate exact position. The Pokemon TCG community includes minors, adding child safety concerns under regulations like the UK's Age Appropriate Design Code.

**How to avoid:**
- Never store precise coordinates. Snap to a grid (e.g., geohash at 5-character precision = ~5km area).
- Display distance in ranges ("< 1km", "1-5km", "5-25km") not exact distances.
- Location sharing must be opt-in, off by default, and easily toggled per-session.
- Do NOT show location on profile -- only use it for filtering trade results.
- Add a "city/region" text field as an alternative to GPS for users who refuse location access.
- Implement server-side distance calculation so raw coordinates are never sent to other clients.
- Auto-expire location data after 24 hours unless refreshed.
- Privacy policy must explicitly cover location data collection, purpose, and retention.

**Warning signs:**
- Location data visible in API responses to other users.
- No opt-in flow before location is requested.
- Location persists indefinitely in database.
- No alternative for users who decline location access.

**Phase to address:**
Phase 4+ -- requires careful privacy design. Should be designed with legal/privacy review before implementation.

---

### Pitfall 8: i18n Retrofit Breaks Existing UI Layouts

**What goes wrong:**
Retrofitting internationalization into an existing app with 232 files and 20,382 LOC means touching nearly every component that displays text. German translations are 30-40% longer than English. Japanese/Chinese characters have different line-break rules. The gold-on-dark theme's carefully sized buttons, headers, and card labels overflow or truncate when text length changes. RTL languages (Arabic, Hebrew) break layouts that assume left-to-right flow.

**Why it happens:**
The v1.0 app hardcodes all strings directly in JSX. Extracting to translation keys is mechanical but tedious, and developers inevitably miss strings in error messages, alerts, placeholder text, and accessibility labels. Layout testing only happens in English, so translation-length issues are discovered in production.

**How to avoid:**
- Use a systematic extraction tool (e.g., `i18next-scanner`) to find all hardcoded strings rather than manual search.
- Adopt `i18next` + `react-i18next` with namespace-per-screen organization.
- Use pseudo-localization (extended characters that expand text by 40%) during development to catch layout overflow before real translations exist.
- Set `numberOfLines` and `adjustsFontSizeToFit` on all text-constrained components.
- If RTL is not in the initial language set (Pokemon TCG Pocket does not have Arabic/Hebrew releases), defer RTL support -- but do not write code that actively breaks it.
- Store the language preference in user profile (server-side) and Zustand store (client-side), NOT just device locale, so web and mobile can share the setting.

**Warning signs:**
- Strings found in components without translation function wrapping.
- Buttons that clip text in any non-English language.
- Mixed translated/untranslated strings on the same screen.
- Date/number formats not localized (e.g., showing "3/11/2026" to European users).

**Phase to address:**
Phase 3 (Multi-Language UI) -- should be done AFTER the post-based model and multi-language cards are stable, but BEFORE the web app so the web app is built i18n-first.

---

### Pitfall 9: TCGdex Multi-Language Card Data Has Gaps

**What goes wrong:**
TCGdex supports 14 languages but completion varies dramatically. English is near-complete, but less common languages (Thai, Indonesian, Polish, Russian) may be missing entire sets. When the app queries TCGdex for a card in Portuguese and gets no result, it either shows a blank card, crashes, or silently falls back to English without telling the user -- all bad outcomes.

**Why it happens:**
Developers test with English and maybe one other language (French, Japanese) and assume all languages are equally populated. The card seed script (`seed-cards.ts`) currently imports only one language. Expanding to multi-language without handling missing translations means the card database has holes.

**How to avoid:**
- Query TCGdex's status endpoint to know which languages have complete data for which sets.
- Implement a graceful fallback chain: requested language -> English -> null with "translation unavailable" indicator.
- Store the source language for each card record so the UI can show "Shown in English (Japanese unavailable)".
- Limit supported languages to those with 90%+ completion in TCGdex for the sets that Pokemon TCG Pocket actually uses.
- Run a data completeness check as part of the card seed job and log/alert on gaps.

**Warning signs:**
- Blank card names or images for non-English languages.
- Users in non-English locales seeing a mix of English and localized card names.
- Card counts per set differ across languages (indicates missing data).

**Phase to address:**
Phase 2 (Multi-Language Card Database) -- the seed script must be updated to multi-language import before any user-facing language selection is available.

---

### Pitfall 10: Deck Meta Data Becomes Stale or Unreliable

**What goes wrong:**
Deck meta data (competitive decks, win rates, tier lists) is only as good as its data source. If sourcing from community sites like Limitless TCG, the data may be tournament-focused and not reflect casual play. If scraping third-party sites, they may change their format or block the scraper. Win rates shift dramatically with each new expansion release (monthly in Pokemon TCG Pocket), making cached data misleading within days of a new set.

**Why it happens:**
Developers build the deck meta feature assuming a stable, reliable data pipeline. In reality, Pokemon TCG Pocket's meta shifts rapidly, community data sources have no SLA, and aggregating win rates from different sources (tournament vs. ladder) produces conflicting numbers.

**How to avoid:**
- Display the "as of" date prominently on all meta data.
- Use multiple data sources and show confidence levels ("High confidence -- based on 5000+ games" vs. "Limited data -- based on 200 games").
- Build the deck meta as a curated editorial feature initially, not a fully automated pipeline. Manual curation with data backing is more trustworthy than pure automation.
- Cache aggressively but show staleness indicators. Meta data older than 7 days after a new set release should display a warning.
- If using Limitless TCG data, their API terms must be checked -- scraping may violate ToS.

**Warning signs:**
- Tier list unchanged after a major expansion release.
- Win rates that do not add up (both sides of a matchup showing >50%).
- Data source returning errors silently, serving cached stale data.

**Phase to address:**
Phase 5 (Deck Meta System) -- this is a content feature that requires ongoing maintenance, not just initial development.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Keeping automatic matching AND post-based trading | Faster migration, no data loss | Two code paths to maintain, double the matching logic | During transition period only (3-6 months), then deprecate |
| Hardcoding English fallback for missing translations | Feature ships faster | Users in non-English locales see mixed languages, feels broken | MVP only -- must add proper fallback UI before production |
| Storing OAuth tokens in AsyncStorage instead of SecureStore | Simple implementation | Tokens accessible if device is compromised | Never -- use expo-secure-store for all auth tokens |
| Single-language card seed then "add languages later" | Faster initial v2.0 launch | Users cannot trade cross-language cards, core feature blocked | Never -- multi-language cards are table stakes for v2.0 |
| Screenshot scanning only (no camera) | Avoids camera permission complexity | Users expect camera scanning, feels incomplete | Acceptable for initial release, add camera in follow-up |
| City-text field instead of GPS geolocation | No privacy concerns, no permissions | Less precise matching, worse UX than GPS-based | Acceptable as the ONLY option until privacy design is validated |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| TCGdex API (multi-language) | Assuming all languages have same card coverage | Check completion per language per set; implement fallback chain |
| Google OAuth | Not handling email mismatch between Google account and existing account | Check email match first, prompt account linking with password verification |
| Apple Sign-In | Treating Apple's relay email as a real email for account lookup | Store Apple user ID as primary key; email is unreliable for linking |
| Limitless TCG / meta sources | Scraping without checking API terms, no error handling | Verify ToS, implement circuit breaker pattern, cache with staleness indicators |
| RevenueCat (existing) | Not gating new premium features behind entitlement checks | All new premium features must check `isPremium` -- use the existing premium middleware |
| Expo Camera/Image Picker | Requesting camera permission on app launch | Request only when user taps "Scan Card", explain why in the permission prompt |
| Geolocation APIs | Using `getCurrentPosition` in foreground with no timeout | Set timeout (10s), use `getLastKnownPosition` as fallback, handle permission denied gracefully |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Post-based browsing without pagination | Scroll jank, memory pressure, crashes on older devices | Cursor-based pagination from day 1 (already used for notifications) | 500+ active posts |
| Recomputing matches for all users when a post is created | API timeout, BullMQ queue backlog | Only compute matches for posts that overlap with the new post's cards | 1000+ users |
| Loading all card images for multi-language card browser | Massive bandwidth on mobile data | Lazy-load images, use thumbnails for list views, CDN with aggressive caching | 5000+ cards across languages |
| Full-text search across multi-language card names | Slow queries, wrong results for non-Latin scripts | PostgreSQL `pg_trgm` extension with GIN indexes per language, or dedicated search (Meilisearch) | 50,000+ card records |
| AI suggestion computation on every app open | Slow cold start, server load spikes | Pre-compute suggestions in BullMQ job (already the pattern), cache results, refresh on collection change only | 5000+ users opening app simultaneously |
| Geolocation distance queries on every search | O(n) scan of all users with location | PostGIS extension with spatial indexes, or geohash-based bucketing | 10,000+ users with location enabled |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Storing precise GPS coordinates in user profile accessible via API | Stalking, harassment, child safety violation | Never expose coordinates in API responses; compute distance server-side; return only distance ranges |
| OAuth tokens stored in AsyncStorage instead of SecureStore | Token theft on rooted/jailbroken devices | Use `expo-secure-store` for all auth tokens; AsyncStorage is for non-sensitive data only |
| Card scanning uploads sent to third-party AI without consent | Privacy violation, GDPR issue | Process scans on-device if possible; if server-side, obtain explicit consent and delete images after processing |
| No rate limiting on post creation | Spam posts flooding the trading feed | Rate limit: max 10 posts per hour per user; premium gets higher limit |
| Deck meta scraper credentials in client bundle | API keys exposed | All scraping/API calls happen server-side; client only receives processed data |
| Gift/promo codes brute-forceable | Free premium access exploitation | Rate limit code attempts (5/hour), use cryptographically random codes (16+ chars), log attempts |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Removing automatic matching without clear migration path | Existing users lose their workflow, feel abandoned | Keep matches visible as "Legacy Matches" for 30 days, guide users to create posts from their existing collection/wanted list |
| Card language shown only in card detail, not in lists | Users browse, create posts, and proposals without realizing language mismatch | Language badge on EVERY card thumbnail in EVERY list/grid view |
| AI suggestions with no explanation | Users see "Trade your Charizard for their Pikachu" with no reasoning, feels arbitrary | Show WHY: "This card is trending down, you have 3 copies, and Pikachu fits the Raichu deck you're building" |
| Scan feature requires perfect conditions | Users in dim rooms or with glare get repeated failures | Support screenshot import as primary; show "Tips for better scans" before camera opens |
| Local finder shows traders but no way to coordinate | Users see nearby traders but still have to use the normal post/proposal flow | Local finder should pre-filter posts to nearby users, not be a separate feature |
| i18n switches language but dates/numbers stay English-formatted | Feels half-translated, reduces trust | Use `Intl.DateTimeFormat` and `Intl.NumberFormat` everywhere, not manual formatting |
| Deck meta shows win rates without sample size | Users trust a "95% win rate" based on 20 games | Always show sample size: "95% win rate (20 games)" vs "52% win rate (5,000 games)" |

## "Looks Done But Isn't" Checklist

- [ ] **Post-based trading:** Often missing the "create post from existing collection" flow -- verify users can bulk-create Offering posts from their inventory, not just manual card picking
- [ ] **Multi-language cards:** Often missing the card seed for non-English languages -- verify card counts match across all supported languages
- [ ] **OAuth:** Often missing the account-linking flow for existing users -- verify a user with email/password can link Google/Apple and sign in both ways
- [ ] **Card scanning:** Often missing the confirmation/correction step -- verify users ALWAYS see what was detected and can correct before it hits their collection
- [ ] **AI suggestions:** Often missing the "dismiss" feedback loop -- verify dismissed suggestions do not reappear and feed back into the algorithm
- [ ] **Local finder:** Often missing the privacy settings screen -- verify users can toggle location sharing on/off and see what data is being shared
- [ ] **Web app:** Often missing the shared API client -- verify web and mobile use identical API calling code from the shared package
- [ ] **i18n:** Often missing error messages and system alerts -- verify ALL user-facing strings are translated, including error toasts, empty states, and loading messages
- [ ] **Deck meta:** Often missing the "data freshness" indicator -- verify users can see when the meta data was last updated
- [ ] **Gift codes:** Often missing the redemption history -- verify users can see which codes they have redeemed and admins can see redemption analytics

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Duplicate accounts from OAuth | HIGH | Manual account merge tool for support team; SQL migration to merge collection/proposals/ratings by user confirmation |
| Wrong cards from silent scan import | MEDIUM | Add "Recently Scanned" section in collection with undo; bulk-review screen for scan history |
| Language mismatch in completed proposals | HIGH | Cannot undo in-game trade; add post-trade survey "Did the in-game trade succeed?" to detect mismatches |
| Stale deck meta data | LOW | Manual refresh trigger for admins; "Report outdated" button for users |
| i18n layout overflow in production | MEDIUM | Hot-fix with `numberOfLines` and `adjustsFontSizeToFit`; add pseudo-localization to CI pipeline |
| Location data breach | HIGH | Incident response plan required; ability to purge all location data with single command; notify affected users |
| AI suggestions destroyed trust | MEDIUM | Rebrand feature, add explanations, add "Why this suggestion?" deep link; reset user's suggestion history |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Post-based migration breaks proposals | Phase 1 (Post Model) | Existing proposals still load and display correctly after migration |
| Card language mismatch | Phase 1-2 (Multi-Lang Cards) | Language badge visible on every card surface; cross-language proposal blocked |
| OAuth duplicate accounts | Phase 2 (OAuth) | User with email account can link Google, sign out, sign in with Google, see same data |
| Web/mobile code divergence | Pre-Web-App phase (Shared Package Refactor) | Shared package has zero react-native imports; web builds without native dependencies |
| Card scanning frustration | Phase 4 (Scanning) | Scan always shows confirmation; top-3 candidates displayed; abandon rate below 30% |
| AI suggestions cold start | Phase 5 (AI Suggestions) | Suggestions include explanation text; dismiss rate tracked; rule-based until 1000+ trades |
| Location privacy exposure | Phase 4 (Local Finder) | API responses contain no raw coordinates; privacy toggle exists; 24h data expiry |
| i18n layout breakage | Phase 3 (i18n) | Pseudo-localization passes with 40% text expansion; all strings in translation files |
| TCGdex data gaps | Phase 2 (Multi-Lang Cards) | Fallback chain tested for each supported language; completeness report generated |
| Deck meta staleness | Phase 5 (Deck Meta) | "Updated" timestamp visible; staleness warning after 7 days post-expansion |

## Sources

- Codebase analysis: `apps/api/src/db/schema.ts`, `apps/api/src/services/match.service.ts`, `packages/shared/src/schemas/proposal.ts`
- [How I Built a Pokemon Card Scanner App with AI - 50,000 Users](https://pokescope.app/blog/how-i-built-pokemon-card-scanner-ai-50000-users/)
- [PokeHub - Trade PTCG Pocket Reviews (Google Play)](https://play.google.com/store/apps/details?id=com.mi.poketrade&hl=en)
- [PokeHub - for TCG Pocket Reviews (App Store)](https://apps.apple.com/us/app/pokehub-for-tcg-pocket/id6740797484?see-all=reviews&platform=iphone)
- [TCGdex API - Multi-Language Pokemon TCG Database](https://tcgdex.dev)
- [TCGdex Status - Language Completion Tracking](https://tcgdex.dev/status)
- [Limitless TCG - Pokemon TCG Pocket Competitive Data](https://play.limitlesstcg.com/decks?game=POCKET)
- [Pokemon Meta - Win Rates Updated Daily](https://www.pokemonmeta.com/winrates)
- [Common Mistakes When Implementing i18n in React Apps](https://infinitejs.com/posts/common-mistakes-i18n-react)
- [20 i18n Mistakes Developers Make in React Apps](https://www.translatedright.com/blog/20-i18n-mistakes-developers-make-in-react-apps-and-how-to-fix-them/)
- [Geolocation Data and the GDPR](https://22academy.com/blog/geolocation-data-and-the-gdpr)
- [ICO Age Appropriate Design Code - Geolocation](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/10-geolocation/)
- [The Cold Start Problem in Recommender Systems](https://www.synaptiq.ai/library/the-cold-start-problem)
- [Database Migrations: Safe, Downtime-Free Strategies](https://vadimkravcenko.com/shorts/database-migrations/)
- [Reflecting on Code Sharing Between React and React Native](https://matthewwolfe.github.io/blog/code-sharing-react-and-react-native)

---
*Pitfalls research for: Pokemon TCG Pocket Trading Platform v2.0 Feature Additions*
*Researched: 2026-03-11*
