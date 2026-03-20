# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-11
**Phases:** 6 | **Plans:** 17 | **Execution time:** 2.0 hours

### What Was Built
- Full-stack trade coordination platform: Expo mobile + Fastify API + PostgreSQL
- Complete card database with TCGdex import, search, and browse UI
- Two-way trade matching engine with real-time Socket.IO notifications
- Trade proposal workflow with fairness evaluation, counter-offers, reputation
- Premium tier with RevenueCat IAP, analytics dashboard, match boost, card alerts
- Push notification infrastructure with Expo Push SDK

### What Worked
- Turborepo monorepo with shared Zod schemas eliminated API/mobile type drift
- Service layer pattern (routes validate, call service, return response) kept code clean
- Phase-by-phase execution with clear success criteria prevented scope creep
- Optimistic updates with revert-on-error pattern made UI feel responsive
- BullMQ job deduplication (jobId-based, 30s window) elegantly handled rapid collection changes
- Domain-isolated Zustand stores (auth, cards, collection, trades, notifications, premium) scaled well

### What Was Inefficient
- Phase 5 ROADMAP showed "3/4 In Progress" and Phase 2 "2/3 In Progress" despite all being complete — progress table tracking lagged behind actual completion
- Phase 5 plan 04 was a gap closure (wiring RatingModal) that could have been caught during plan 03 review
- Some early plans didn't mark roadmap checkboxes as complete, requiring manual fixup

### Patterns Established
- Socket.IO directly via fastify-plugin (fastify-socket.io incompatible with Fastify 5)
- Bidirectional match storage for both user perspectives
- Cursor-based pagination for mobile infinite scroll
- RevenueCat graceful no-op pattern for dev/Expo Go environments
- Soft upsell UI pattern (LockedFeatureCard with description, no aggressive pop-ups)

### Key Lessons
1. Wire UI components to their trigger points in the same plan — don't leave orphaned modals for a gap-closure plan
2. Update roadmap progress table as part of plan completion, not as a separate step
3. Dark theme with brand accent color from day one creates cohesive feel without redesign later

### Cost Observations
- Model mix: balanced profile (opus for planning/verification, sonnet for execution)
- Execution: 17 plans in 2.0 hours (7.1 min average)
- Notable: Later phases executed faster (Phase 6 avg 5.3 min vs Phase 4 avg 10.5 min) — pattern familiarity accelerated work

---

## Milestone: v2.0 — Full Platform

**Shipped:** 2026-03-20
**Phases:** 6 | **Plans:** 27 | **Execution time:** ~3.6 hours

### What Was Built
- Multi-language card database (9 languages) with Google/Apple OAuth sign-in
- Post-based Offering/Seeking trade model with JSONB complementary matching
- Engagement suite: luck calculator, promo codes, branded image export
- Full i18n (10 UI languages) across mobile and API
- Intelligence: AI trade suggestions, Limitless TCG meta scraper, tier lists
- Next.js web companion with full trading, collection, and meta features

### What Worked
- JSONB containment (@>) with GIN indexes handled complex post matching queries efficiently
- Cookie + Bearer dual auth pattern made web companion seamless alongside existing mobile auth
- Shared Zod schemas (from v1.0 pattern) continued to eliminate type drift for web app
- Wave-based parallelization in phase execution kept plan durations consistent (~7 min)
- Reusing existing service layer patterns from v1.0 made v2.0 phases faster to implement
- Phase 12 (web app) benefited from all features being stable — no rework needed

### What Was Inefficient
- Phase 9 roadmap checkbox never marked complete despite 3/3 plans finished — stale state
- INTL-05 requirement checkbox never updated despite being implemented (09-01 shipped luck calculator)
- Traceability table had stale "Pending" entries for completed requirements (DISC-03)
- Phase 11 required a wave-0 test stubs plan (11-00) that wasn't in original roadmap — inserted reactively
- Phase 10 plan 03 (translations) took 25 min vs 7 min average — scale of string replacement across 9 languages

### Patterns Established
- JSONB containment queries with GIN indexes for flexible multi-criteria filtering
- Cookie fallback auth: Bearer header first, then cookies for web/mobile dual support
- Basis points (integer) for rates to avoid float precision issues
- Offscreen positioning (left: -9999) for react-native-view-shot compatibility
- Text codes (EN, DE) for language display instead of flag emojis
- TierListCreator with click-to-assign UX (no drag-and-drop library dependency)

### Key Lessons
1. Keep traceability table and requirement checkboxes in sync during plan completion — stale state compounds across phases
2. Web app as final phase is optimal — all APIs stable, i18n in place, no rework
3. Translation plans should budget 3x time vs feature plans due to string volume
4. Wave-0 test stub plans are worth inserting early rather than discovering gaps mid-phase

### Cost Observations
- Model mix: balanced profile (opus for planning, sonnet/haiku for execution agents)
- Execution: 27 plans in ~3.6 hours (7.0 min average — near identical to v1.0)
- Notable: Consistent 7 min/plan across both milestones suggests this is the natural cadence for this project's complexity

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Execution Time | Phases | Key Change |
|-----------|---------------|--------|------------|
| v1.0 | 2.0 hours | 6 | Initial project — established all patterns |
| v2.0 | ~3.6 hours | 6 | Added web platform, i18n, intelligence; kept same velocity |

### Cumulative Quality

| Milestone | Plans | Avg/Plan | LOC |
|-----------|-------|----------|-----|
| v1.0 | 17 | 7.1 min | 20,382 |
| v2.0 | 27 | 7.0 min | 40,275 |

### Top Lessons (Verified Across Milestones)

1. Shared Zod schemas in monorepo eliminate type drift across all platforms (mobile, web, API) — confirmed v1.0 + v2.0
2. Domain-isolated Zustand stores scale well as features grow — same pattern served both milestones
3. ~7 min/plan is the natural execution cadence for this project regardless of complexity — consistent across 44 plans
4. Keeping requirement/roadmap checkboxes in sync during execution prevents stale state — learned in v1.0, still an issue in v2.0
