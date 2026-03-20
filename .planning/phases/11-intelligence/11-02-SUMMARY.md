---
phase: 11-intelligence
plan: 02
subsystem: api
tags: [suggestions, tierlists, meta, routes, workers, bullmq, premium]

# Dependency graph
requires:
  - phase: 11-intelligence
    plan: 01
    provides: DB schema, shared Zod schemas, meta-scraper and meta services
provides:
  - Suggestion computation service with Redis caching and rule-based scoring
  - Tier list CRUD service with atomic voting and official tier list generation
  - API routes: GET /suggestions (premium-gated), GET /meta/decks, CRUD /tierlists
  - BullMQ workers: on-demand suggest computation, daily 5am meta scraping
affects: [11-03-mobile-meta-tab, 11-04-tierlist-creator]
---

## What was built
Complete backend API surface for the Intelligence phase: suggestion engine, tier list service, 3 route files, and 2 background workers.

## Key files

### Created
- `apps/api/src/services/suggest.service.ts` — Rule-based trade suggestion engine with Redis caching, trade power + trending + priority scoring
- `apps/api/src/services/tierlist.service.ts` — Tier list CRUD, atomic vote toggling, official tier list auto-generation from meta data
- `apps/api/src/routes/suggestions.ts` — GET /suggestions with premium gating and cache refresh
- `apps/api/src/routes/meta.ts` — GET /meta/decks and /meta/decks/:id with free/premium data split
- `apps/api/src/routes/tierlists.ts` — Full CRUD + POST /tierlists/:id/vote with validation
- `apps/api/src/jobs/suggest-worker.ts` — On-demand BullMQ worker with rate limiting
- `apps/api/src/jobs/meta-scrape-worker.ts` — Daily 5am scheduled scraper with official tier list regeneration

### Modified
- `apps/api/src/server.ts` — Registered 3 new routes and 2 new workers with lifecycle management

## Decisions
- Suggestion scoring uses weighted heuristics (trade power × 10, trending × 5, priority bonus, rarity matching) rather than ML
- Suggest worker uses rate limiter (10 jobs/min) to prevent abuse
- Meta scrape worker runs at 5am (after analytics at 4am) and regenerates official tier list from fresh data
- Official tier list uses percentile-based tier assignment: S(10%), A(20%), B(30%), C(25%), D(15%)

## Deviations
None — implemented as planned.
