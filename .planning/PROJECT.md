# Pocket Trade Hub

## What This Is

A React Native mobile app that is the primary trade coordination platform for Pokemon TCG Pocket players. Users track their card inventory, manage wanted lists with priority levels, get automatically matched with compatible trade partners via a two-way matching engine, negotiate trades with fairness evaluation, rate partners, and access premium analytics — then execute the actual trades in-game.

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

### Active

(None — awaiting v1.1 milestone definition)

### Out of Scope

- Deck meta system (competitive decks, win rates, tournament results) — deferred to v2
- OAuth login (Google/Apple) — v2 feature, email/password sufficient for v1
- Web app — mobile-first, web version deferred
- In-game trade execution — app coordinates trades, players execute in Pokemon TCG Pocket
- Card scanning via camera — future feature
- AI trade suggestions — future feature
- Local trade finder — future feature
- Chat/messaging system — moderation liability; structured proposals + Discord links sufficient
- Real-money marketplace — legal/ToS minefield for digital cards
- Social feed / timeline — scope bloat; users come to trade, not scroll
- Gamification / badges / leaderboards — encourages fake trades; simple reputation sufficient
- Other TCGs (Magic, Yu-Gi-Oh) — long-term expansion only

## Context

Shipped v1.0 MVP with 20,382 LOC TypeScript across 232 files.
Tech stack: Expo (React Native) + Fastify + PostgreSQL + Redis + BullMQ + Socket.IO + RevenueCat.
Monorepo via Turborepo with pnpm workspaces and shared Zod schemas.
Dark theme with Pokemon-inspired gold accent (#f0c040).
Built in 5 days (2026-03-07 → 2026-03-11), 109 commits, 2.0 hours execution time.

Known issues:
- App Store/Google Play IAP policies need verification before production launch
- Some Phase 5 traceability shows "Backend Complete" — mobile UI was built in plans 05-02/03/04

## Constraints

- **Platform**: React Native mobile app (iOS + Android) via Expo
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
| Deck meta deferred to v2 | Keep v1 focused on core trading loop | ✓ Good |
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
| Optimistic updates with revert-on-error | Responsive UI for collection/wanted mutations | ✓ Good |
| Cursor-based pagination | Efficient mobile scrolling for notification inbox | ✓ Good |
| Rarity-based fairness scoring | diamond1=1 to crown=100 with Great/Fair/Unfair thresholds | ✓ Good |
| Dark theme with gold accent | Branded, immersive Pokemon feel | ✓ Good |

---
*Last updated: 2026-03-11 after v1.0 milestone*
