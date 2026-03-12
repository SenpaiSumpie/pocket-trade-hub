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

## Cross-Milestone Trends

### Process Evolution

| Milestone | Execution Time | Phases | Key Change |
|-----------|---------------|--------|------------|
| v1.0 | 2.0 hours | 6 | Initial project — established all patterns |

### Cumulative Quality

| Milestone | Plans | Avg/Plan | LOC |
|-----------|-------|----------|-----|
| v1.0 | 17 | 7.1 min | 20,382 |

### Top Lessons (Verified Across Milestones)

1. (Awaiting v1.1 to cross-validate)
