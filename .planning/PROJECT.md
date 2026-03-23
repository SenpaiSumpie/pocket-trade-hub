# Pocket Trade Hub

## What This Is

A React Native mobile app with Next.js web companion that is the primary trade coordination platform for Pokemon TCG Pocket players. Users create Offering and Seeking trade posts in 9 card languages to get matched with compatible partners, negotiate via structured proposals with fairness evaluation, rate partners, track multi-language card collections, access AI-powered trade suggestions and deck meta analytics, browse and create tier lists, calculate pack odds, and share branded collection images — all in 10 UI languages with premium features via subscription.

## Core Value

Players can instantly find other players who have cards they want AND want cards they have, eliminating the friction of manual trade hunting across Discord, Reddit, and spreadsheets.

## Requirements

### Validated

- ✓ User accounts with email/password auth, refresh token rotation, password reset — v1.0
- ✓ User profiles with display name, avatar, friend code — v1.0
- ✓ Complete Pokemon TCG Pocket card database with search/browse/import — v1.0
- ✓ Push notifications for new card sets — v1.0
- ✓ Card inventory management with bulk-add, quantities, per-set progress — v1.0
- ✓ Wanted list with priority levels (high/medium/low) — v1.0
- ✓ Two-way trade matching engine with priority-weighted scoring — v1.0
- ✓ Real-time match notifications (push + in-app via Socket.IO) — v1.0
- ✓ Trade proposals with accept/reject/counter-offer workflow — v1.0
- ✓ Trade fairness evaluation (rarity-based scoring) — v1.0
- ✓ Trader reputation system (ratings + trade count) — v1.0
- ✓ Persistent notification inbox with cursor-based pagination — v1.0
- ✓ Premium subscription via RevenueCat IAP ($5/month) — v1.0
- ✓ Card demand analytics (most wanted, least available, trending) — v1.0
- ✓ Premium match boost (priority placement) — v1.0
- ✓ Advanced card alerts for wanted cards — v1.0
- ✓ Multi-language card database (9 languages) with translated names and images — v2.0
- ✓ Card language selection in collection and wanted flows — v2.0
- ✓ Card language filtering and search — v2.0
- ✓ Google and Apple OAuth sign-in with account linking — v2.0
- ✓ Offering/Seeking post-based trade model with JSONB matching — v2.0
- ✓ Post browsing with filters (card, set, rarity, language) — v2.0
- ✓ Complementary post matching with notifications — v2.0
- ✓ AI-powered trade suggestions with reasoning (premium) — v2.0
- ✓ Deck meta analytics (top decks, win rates, tournament results) — v2.0
- ✓ Tier list browser and creator with voting — v2.0
- ✓ Luck calculator with hypergeometric pull rates — v2.0
- ✓ Branded image export with native share sheet — v2.0
- ✓ Promo code system for premium time grants — v2.0
- ✓ Full i18n (10 UI languages) with per-user preferences — v2.0
- ✓ Next.js web companion with cards, collection, marketplace, proposals, meta — v2.0
- ✓ Socket.IO real-time notifications on web — v2.0

- ✓ Shared design token package with cross-platform sync (mobile TS + web CSS custom properties) — v3.0
- ✓ Custom animated tab bar with gold pill indicator, Phosphor icons, Inter typography — v3.0
- ✓ Reusable animation library (3D card flip, parallax, staggered lists, shimmer, bottom sheets) — v3.0
- ✓ Full visual refresh of all 6 mobile tabs with component primitives and motion — v3.0
- ✓ Web companion synced with shared design tokens and upgraded primitives — v3.0
- ✓ Contextual haptic feedback system, branded splash animation, card grid layout modes — v3.0
- ✓ Parallax card detail view with reduced-motion accessibility — v3.0

### Active

(No active milestone — planning next)

### Known Gaps

- WEB-03: Screen-by-screen web page refresh not fully completed (web primitives and tokens synced, but individual page refreshes deferred)

### Out of Scope

- In-game trade execution — app coordinates trades, players execute in Pokemon TCG Pocket
- Chat/messaging system — moderation liability; structured proposals are the differentiator
- Real-money marketplace — legal/ToS minefield for digital cards
- Social feed / timeline — scope bloat; users come to trade, not scroll
- Gamification / badges / leaderboards — encourages fake trades; simple reputation sufficient
- Other TCGs (Magic, Yu-Gi-Oh) — long-term expansion only
- On-device ML for card scanning — 50-200MB app bloat for worse accuracy than server-side

## Context

Shipped v3.0 UI/UX Overhaul on 2026-03-23. ~67,600 LOC TypeScript across mobile, web, API, and shared packages.
Tech stack: Expo (React Native) + Next.js + Fastify + PostgreSQL + Redis + BullMQ + Socket.IO + RevenueCat.
Monorepo via Turborepo with pnpm workspaces and shared Zod schemas.
Dark theme with Pokemon-inspired gold accent (#f0c040). Design token system with Inter typography.
Built across 3 milestones (v1.0 MVP, v2.0 Full Platform, v3.0 UI/UX Overhaul), ~375 commits.

Competitor analysis: PokeHub (4.72 stars, 35k ratings) is the primary competitor. Weaknesses: excessive ads, aggressive VIP popups, poor filtering, language mismatches. Our advantages: no ads, structured proposals (cleaner than chat), fairness evaluation, deck meta, AI suggestions, web companion.

Known issues:
- App Store/Google Play IAP policies need verification before production launch
- Some v1 proposal/rating service tests have FK constraint failures needing seed data fixes
- TCGdex language completeness varies (ja, ko, zh return 404 from API)

## Constraints

- **Platform**: React Native mobile app (iOS + Android) via Expo + Next.js web companion
- **Backend**: Fastify + PostgreSQL + Redis + BullMQ
- **Card data source**: TCGdex API with rarity mapping to diamond/star/crown enum
- **Trade execution**: Coordination only — actual trades happen in-game
- **Monetization**: Free tier (inventory, search, proposals) + Premium tier ($5/month via RevenueCat)
- **Real-time**: Socket.IO with polling+websocket transports for mobile compatibility

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Mobile-first (React Native/Expo) | Players are on their phones, matches the game platform | ✓ Good |
| Trade coordination, not execution | Actual trades happen in Pokemon TCG Pocket | ✓ Good |
| Free + Premium in v1 | Monetization from launch, premium adds analytics and priority | ✓ Good |
| Background + real-time matching | Suggested trades on open + live notifications for new matches | ✓ Good |
| Turborepo monorepo with shared Zod schemas | Type safety across API and mobile with single source of truth | ✓ Good |
| Fastify + Drizzle ORM | Fast, type-safe API with PostgreSQL | ✓ Good |
| bcrypt over argon2 | React Native compatibility (10 rounds) | ✓ Good |
| JWT with refresh token rotation | Stateless auth with secure token refresh | ✓ Good |
| Socket.IO directly via fastify-plugin | fastify-socket.io incompatible with Fastify 5 | ✓ Good |
| BullMQ for background jobs | Debounced match recomputation, analytics cron, card alerts | ✓ Good |
| RevenueCat for IAP | Cross-platform subscription management, graceful no-op in dev | ✓ Good |
| Zustand per-domain stores | State isolation (auth, cards, collection, trades, notifications, premium) | ✓ Good |
| Rarity-based fairness scoring | diamond1=1 to crown=100 with Great/Fair/Unfair thresholds | ✓ Good |
| Dark theme with gold accent | Branded, immersive Pokemon feel | ✓ Good |
| Post-based trading model | Offering/Seeking posts give users control; JSONB for flexible card matching | ✓ Good |
| No chat, keep structured proposals | Moderation liability avoided; proposals are cleaner than freeform chat | ✓ Good |
| Multi-language cards in same phase as OAuth | Both are foundations; parallel work efficiency | ✓ Good |
| JSONB for post card arrays | Flexible querying with GIN indexes; complementary matching via containment | ✓ Good |
| Cookie + Bearer dual auth | Mobile uses Bearer, web uses cookies — both supported seamlessly | ✓ Good |
| Next.js web companion | Expand beyond mobile-only; shares API and Zod schemas | ✓ Good |
| Tailwind v4 CSS-first config | Modern approach, dark theme via @theme variables | ✓ Good |
| Basis points for win/usage rates | Integer math avoids float precision issues in meta analytics | ✓ Good |
| Text codes for language display | Culturally neutral (EN, DE) instead of flag emojis | ✓ Good |
| 10 UI languages (includes Thai) | Broader audience reach beyond the 9 card languages | ✓ Good |
| Two-tier design token system | Shared TS tokens + backward-compatible shim preserves 44 files | ✓ Good |
| Phosphor icons over Ionicons | Richer icon set, weight morphing, consistent visual language | ✓ Good |
| @gorhom/bottom-sheet for modals | Native gesture-driven sheets replace Modal components | ✓ Good |
| Reanimated worklet-based animations | 60fps animations off JS thread for card flip, parallax, stagger | ✓ Good |
| Share tokens, not components (web) | Mobile and web consume same token package, build platform-native components | ✓ Good |
| Haptic singleton over hook-only | Module-level hapticPatterns works in runOnJS worklet context | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-23 after v3.0 UI/UX Overhaul milestone complete*
