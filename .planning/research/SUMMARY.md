# Research Summary: Pocket Trade Hub

**Domain:** Mobile trading/matchmaking platform (Pokemon TCG Pocket)
**Researched:** 2026-03-07
**Overall confidence:** MEDIUM (web research tools unavailable; recommendations based on training data through early 2025)

## Executive Summary

Pocket Trade Hub is a React Native mobile app for coordinating Pokemon TCG Pocket card trades. The core technical challenges are: (1) a trade matching engine that runs as background jobs and surfaces results via push notifications, (2) real-time updates when trade partners are found or proposals change, (3) a card database that needs periodic updates as new sets release, and (4) subscription billing that complies with app store policies.

The recommended stack is Expo (managed workflow) for the mobile app, Fastify + TypeScript for the backend API, PostgreSQL for the primary database, Redis for caching and job queue backing, BullMQ for background trade matching, and Socket.IO for in-app real-time updates. This is a well-trodden stack with strong community support and no exotic requirements.

The most consequential technical decision is payment processing. Apple and Google require in-app purchases for digital subscriptions, meaning Stripe alone may not be compliant. RevenueCat is recommended to wrap Apple/Google billing APIs, despite the 30% revenue cut. This affects the business model and should be decided early.

The monorepo approach (Turborepo) is recommended to share TypeScript types and Zod validation schemas between the mobile app and API, preventing the API contract drift that commonly plagues mobile+API projects.

## Key Findings

**Stack:** Expo + Fastify + PostgreSQL + Redis + BullMQ + Socket.IO + RevenueCat
**Architecture:** Monorepo with shared types; background job-driven trade matching with real-time notification layer
**Critical pitfall:** App store IAP requirements may force RevenueCat over Stripe, taking 30% of subscription revenue

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Foundation** - Project scaffolding, monorepo setup, database schema, auth
   - Addresses: User accounts, database setup, shared types infrastructure
   - Avoids: Late-stage restructuring from flat project to monorepo

2. **Card Data + Inventory** - Card database, import system, user inventory management
   - Addresses: Card database, inventory management, card search
   - Avoids: Building features without the core data model in place

3. **Trade Matching Engine** - Background matching jobs, wanted lists, match notifications
   - Addresses: Trade matching, background jobs, push notifications
   - Avoids: Building manual trades before the algorithmic matching (the killer feature)

4. **Trade Proposals + Real-Time** - Manual trade proposals, real-time updates, in-app notifications
   - Addresses: Trade proposals, Socket.IO real-time, trade fairness evaluation
   - Avoids: Premature real-time complexity before matching logic is solid

5. **Premium + Payments** - Subscription tier, RevenueCat/IAP integration, premium features
   - Addresses: Premium subscription, analytics, demand metrics, priority listings
   - Avoids: Payment integration blocking core feature development

6. **Polish + Launch** - Testing, performance, app store submission, EAS configuration
   - Addresses: E2E testing, app store compliance, OTA update pipeline

**Phase ordering rationale:**
- Card data must exist before inventory, inventory before matching, matching before trades
- Payment is Phase 5 because it requires app store review cycles and policy compliance -- do not let it block core development
- Real-time (Socket.IO) is layered on after the core matching engine works via polling/push notifications

**Research flags for phases:**
- Phase 2: Needs research on Pokemon TCG Pocket card data sources (API? scraping? manual?)
- Phase 5: Needs research on current App Store/Google Play IAP policies and RevenueCat setup
- Phase 3: Trade matching algorithm design needs deeper technical research (graph matching, set intersection efficiency)

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Established technologies, but exact versions need npm verification. Library choices are HIGH confidence. |
| Features | HIGH | Well-understood domain (trading platforms, matchmaking). Table stakes are clear from PROJECT.md. |
| Architecture | HIGH | Standard patterns: API + background jobs + real-time. No novel architectural challenges. |
| Pitfalls | MEDIUM | IAP policy is the biggest unknown. Trade matching performance at scale needs benchmarking. |

## Gaps to Address

- Pokemon TCG Pocket card data source -- no research done on available APIs or data sources
- Exact current versions of all recommended packages (web tools unavailable)
- App Store / Google Play IAP policy details for 2026 (policies change frequently)
- Trade matching algorithm design (set intersection at scale)
- Card data update workflow when new sets release
