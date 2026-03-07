# Pocket Trade Hub

## What This Is

A React Native mobile app that serves as the primary trade coordination platform for Pokémon TCG Pocket players. Users track their card inventory, list cards they want, get automatically matched with compatible trade partners, and evaluate trade fairness — then execute the actual trades in-game. The app includes both free and premium tiers.

## Core Value

Players can instantly find other players who have cards they want AND want cards they have, eliminating the friction of manual trade hunting across Discord, Reddit, and spreadsheets.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. -->

- [ ] User accounts (email/password authentication)
- [ ] Pokémon TCG Pocket card database (sourced via research)
- [ ] User card inventory management (add, remove, update quantity, bulk add)
- [ ] Wanted cards list with priority levels
- [ ] Trade matching engine (background jobs + real-time notifications)
- [ ] Manual trade proposals (create, accept, reject, counter-offer)
- [ ] Card search with filters (name, set, rarity) and demand data
- [ ] Trade fairness evaluation system
- [ ] Premium subscription tier ($5/month) with analytics, demand metrics, priority listings, and alerts
- [ ] Card set import system for new releases (JSON-based admin tools)

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Deck meta system (competitive decks, win rates, tournament results) — deferred to v2
- OAuth login (Google/Apple) — v2 feature, email/password sufficient for v1
- Web app — mobile-first, web version deferred
- In-game trade execution — app coordinates trades, players execute in Pokémon TCG Pocket
- Card scanning via camera — future feature
- AI trade suggestions — future feature
- Local trade finder — future feature
- Tournament integration — future feature
- Price tracking graphs — future feature
- Other TCGs (Magic, Yu-Gi-Oh, Flesh and Blood) — long-term expansion only

## Context

- Pokémon TCG Pocket is a mobile game where players collect and trade digital cards
- Current trading happens through fragmented channels (Discord, Reddit, spreadsheets, low-quality apps)
- No dominant platform exists for structured trade matching — opportunity to become the primary infrastructure
- Target users: competitive players, casual collectors, online players, tournament participants
- Secondary audience: content creators and deck builders
- New card sets release several times per year, requiring card database updates
- Trade matching is the killer feature — background matching with suggested trades on app open, plus real-time match notifications

## Constraints

- **Platform**: React Native mobile app (iOS + Android)
- **Card data source**: TBD — needs research to identify best source (API, scraping, manual curation)
- **Trade execution**: Coordination only — actual trades happen in-game
- **Monetization**: Free tier (inventory, search, proposals) + Premium tier ($5/month for analytics, demand metrics, priority listings, meta deck tools, alerts)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Mobile-first (React Native) | Players are on their phones, matches the game platform | — Pending |
| Trade coordination, not execution | Actual trades happen in Pokémon TCG Pocket | — Pending |
| Deck meta deferred to v2 | Keep v1 focused on core trading loop | — Pending |
| Free + Premium in v1 | Monetization from launch, premium adds analytics and priority | — Pending |
| Background + real-time matching | Suggested trades on open + live notifications for new matches | — Pending |

---
*Last updated: 2026-03-07 after initialization*
