# Technology Stack

**Project:** Pocket Trade Hub
**Researched:** 2026-03-07
**Note:** WebSearch and WebFetch were unavailable during research. All recommendations are based on training data (through early 2025). Versions should be verified against npm/official docs before implementation.

## Recommended Stack

### Mobile App (React Native)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Expo (Managed) | ~52 | App framework, build system, OTA updates | Expo is the standard way to build React Native apps in 2025. Managed workflow handles native config, EAS Build handles CI/CD. No reason to use bare React Native for a CRUD+notifications app. | MEDIUM (verify version) |
| React Native | ~0.76 | UI runtime | Bundled with Expo SDK. New Architecture (Fabric, TurboModules) is stable. | MEDIUM (verify version) |
| Expo Router | ~4.x | File-based navigation | Built on React Navigation, file-based routing is simpler than manual stack configuration. Ships with Expo. | MEDIUM |
| React Native Paper | ~5.x | UI component library | Material Design 3 components. Well-maintained, good dark mode support, accessible. Alternative: Tamagui for more custom styling, but Paper is faster to ship with. | MEDIUM |
| Zustand | ~5.x | Client state management | Lightweight, zero boilerplate, TypeScript-native. Redux is overkill for this app. Jotai is fine too but Zustand has stronger ecosystem. | HIGH |
| TanStack Query (React Query) | ~5.x | Server state, caching | The standard for server state in React. Handles caching, background refetching, optimistic updates. Critical for trade listings that change frequently. | HIGH |
| expo-notifications | latest | Push notifications | First-party Expo module for push notifications. Handles both iOS and Android. Uses Expo Push Service as the notification gateway. | HIGH |
| expo-secure-store | latest | Secure token storage | Keychain (iOS) / Keystore (Android) for auth tokens. Do not use AsyncStorage for sensitive data. | HIGH |
| @stripe/stripe-react-native | latest | Payment UI | Official Stripe SDK for React Native. Handles PCI compliance, payment sheets, subscription management. | HIGH |
| react-native-mmkv | latest | Fast local storage | 30x faster than AsyncStorage. Use for card inventory cache, user preferences, non-sensitive data. | HIGH |

### Backend API

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Node.js | 22 LTS | Runtime | LTS version, stable, matches React Native JS ecosystem. Single language across stack. | HIGH |
| Fastify | ~5.x | HTTP framework | 2-3x faster than Express, built-in schema validation via JSON Schema, TypeScript-first, plugin architecture. Express is legacy at this point for new projects. | HIGH |
| TypeScript | ~5.7 | Language | Non-negotiable for a project this size. Shared types between API and mobile app. | HIGH |
| Drizzle ORM | latest | Database ORM/query builder | Type-safe, SQL-like syntax, lightweight, excellent PostgreSQL support. Prisma generates too much overhead and has cold start issues. Drizzle is closer to SQL so easier to optimize queries for the trade matching engine. | MEDIUM |
| Zod | ~3.x | Runtime validation | Schema validation for API inputs. Integrates with Fastify via fastify-type-provider-zod. Shared schemas between frontend and backend. | HIGH |

### Database and Data Layer

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| PostgreSQL | 16 | Primary database | Required per project spec. Excellent for relational data (users, cards, trades, inventory). Full-text search for card lookups. JSONB for flexible card metadata. | HIGH |
| Redis | 7.x | Cache, job queue backing store, real-time pub/sub | BullMQ requires Redis. Also use for session cache, rate limiting, trade match result caching. | HIGH |
| Drizzle Kit | latest | Database migrations | Paired with Drizzle ORM. Generates SQL migrations from schema changes. | MEDIUM |

### Background Jobs and Real-Time

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| BullMQ | ~5.x | Background job processing | The standard Node.js job queue. Redis-backed, supports delayed jobs, retries, priorities, rate limiting. Use for: trade matching engine, notification dispatch, subscription billing checks. | HIGH |
| Socket.IO | ~4.x | Real-time WebSocket communication | Real-time trade match notifications, trade proposal updates, online status. Well-supported with React Native. Alternative: Expo Push for notification-only real-time, but Socket.IO gives you in-app real-time updates too. | HIGH |
| Expo Push Notifications (server-side) | - | Push notification delivery | Expo's push service sends to APNs/FCM. Use `expo-server-sdk` npm package on the backend. Simpler than managing APNs/FCM directly. | HIGH |

### Payment Processing

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Stripe | latest API | Subscription billing | Industry standard. Stripe Billing handles recurring $5/month subscriptions, proration, dunning (failed payment retries), customer portal. | HIGH |
| @stripe/stripe-react-native | latest | Mobile payment UI | Official SDK. Payment Sheet handles card input, Apple Pay, Google Pay. PCI compliant out of the box. | HIGH |
| stripe (Node.js) | latest | Server-side Stripe SDK | Webhook handling for subscription events (created, renewed, cancelled, payment failed). Stripe Checkout or Payment Intents for initial subscription. | HIGH |

### Infrastructure and DevOps

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| EAS Build | - | Mobile app builds | Expo's cloud build service. Handles iOS and Android builds without local Xcode/Android Studio. Free tier sufficient for solo/small team. | HIGH |
| EAS Submit | - | App store submission | Automates submission to App Store and Google Play. | HIGH |
| EAS Update | - | OTA updates | Push JS bundle updates without app store review. Critical for card database updates and bug fixes. | HIGH |
| Railway or Render | - | Backend hosting | Simple deployment for Node.js + PostgreSQL + Redis. Railway has better DX. Render has free tier. Either works. Avoid AWS/GCP complexity for a v1. | MEDIUM |
| Docker | latest | Local dev / deployment | Containerize the API for consistent local dev (especially PostgreSQL + Redis). Also simplifies deployment. | HIGH |

### Testing

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vitest | ~2.x | Unit/integration tests (backend) | Faster than Jest, native ESM support, compatible with Jest API. Use for API route tests, trade matching logic, business rules. | HIGH |
| Jest + React Native Testing Library | latest | Mobile app tests | Expo ships with Jest config. RNTL for component tests. | HIGH |
| Maestro | latest | Mobile E2E tests | Simpler than Detox, YAML-based test flows, works with Expo. Test critical flows: login, add cards, create trade, accept trade. | MEDIUM |

### Developer Experience

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Biome | latest | Linter + formatter | Replaces ESLint + Prettier in a single tool. 10-100x faster. Opinionated defaults reduce config time. | MEDIUM |
| Turborepo | latest | Monorepo management | If using monorepo (recommended): `apps/mobile`, `apps/api`, `packages/shared` (types, validation schemas). Turborepo handles build caching and task orchestration. | MEDIUM |
| TypeScript Project References | - | Shared types | Share Zod schemas, API types, card data types between mobile and API. | HIGH |

## Monorepo Structure (Recommended)

```
pocket-trade-hub/
  apps/
    mobile/          # Expo React Native app
    api/             # Fastify backend
  packages/
    shared/          # Shared types, Zod schemas, constants
    card-data/       # Pokemon TCG Pocket card definitions
  turbo.json
  package.json
```

**Why monorepo:** Shared TypeScript types between mobile and API prevent API contract drift. Card data schemas are shared. Zod validation schemas are shared. Single repo = simpler CI/CD.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| App Framework | Expo (Managed) | Bare React Native | No native modules needed that Expo doesn't support. Bare workflow adds complexity with no benefit for this app. |
| Navigation | Expo Router | React Navigation (manual) | Expo Router is built on React Navigation anyway. File-based routing is faster to develop with. |
| State Management | Zustand | Redux Toolkit | RTK is too much boilerplate for an app with modest client state. Zustand does everything needed in 1/10th the code. |
| State Management | Zustand | MobX | MobX requires decorators and observable patterns that add learning curve. Zustand is simpler. |
| Server State | TanStack Query | SWR | TanStack Query has better mutation support, devtools, and infinite query support (for paginated card lists). |
| ORM | Drizzle | Prisma | Prisma has cold start overhead, generates large client, and its query API hides the SQL. Drizzle is lighter and gives more control for complex trade matching queries. |
| ORM | Drizzle | Knex | Knex is a query builder without type safety. Drizzle gives the same SQL-like feel with full TypeScript inference. |
| HTTP Framework | Fastify | Express | Express is effectively in maintenance mode. Fastify is faster, has built-in validation, better TypeScript support, and active development. |
| HTTP Framework | Fastify | Hono | Hono is excellent for edge/serverless but less mature for traditional server with WebSockets, background jobs, and long-lived connections. |
| Job Queue | BullMQ | Agenda | Agenda uses MongoDB. We're using PostgreSQL + Redis. BullMQ is faster, more reliable, and better maintained. |
| Job Queue | BullMQ | pg-boss | pg-boss uses PostgreSQL as the queue, avoiding Redis. But Redis is already needed for caching and Socket.IO, so BullMQ's Redis-backed approach is fine and more performant. |
| Real-Time | Socket.IO | Pusher/Ably | Self-hosted is fine for v1 scale. Pusher/Ably add cost. Socket.IO works well with React Native. Revisit if scaling past 10K concurrent users. |
| Payments | Stripe | RevenueCat | RevenueCat is great for in-app purchases but this is a subscription service, not consumable IAP. Stripe gives more control over billing, webhooks, and customer management. Note: App Store/Google Play may require IAP for subscriptions sold within the app -- this needs legal/policy review. |
| Hosting | Railway/Render | AWS/GCP/Azure | Premature infrastructure complexity. Railway/Render deploy from git push, include managed PostgreSQL and Redis, and cost $5-20/month at v1 scale. |
| Testing | Vitest | Jest (backend) | Vitest is faster, native ESM, and has the same API as Jest. No reason to use Jest on the backend. |
| Linting | Biome | ESLint + Prettier | Biome is a single tool replacing two, dramatically faster, and requires less configuration. |

## Critical Decision: In-App Purchase vs. Stripe

**WARNING:** Apple and Google require that digital subscriptions sold within a mobile app use their in-app purchase systems (30% cut). If the premium subscription is sold through the app, you may be **required** to use Apple IAP / Google Play Billing instead of Stripe.

**Options:**
1. **Use RevenueCat** for IAP (simpler API over Apple/Google billing) -- safer legally, but 30% revenue cut
2. **Use Stripe via web** -- direct users to a web page for subscription signup, avoiding the app store cut (Reader Rule / anti-steering provisions may help)
3. **Start with RevenueCat IAP** for compliance, migrate to web-based Stripe if business scales

**Recommendation:** Start with RevenueCat for IAP compliance. At $5/month, the 30% cut ($1.50) is painful but the legal risk of using Stripe in-app is worse. Revisit when revenue justifies the complexity of a web-based billing flow.

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| RevenueCat | latest | IAP subscription management | Wraps Apple/Google billing APIs. Handles receipt validation, subscription status, cross-platform entitlements. Simpler than raw StoreKit/Google Play Billing. | MEDIUM |

## Installation

```bash
# Mobile app (Expo)
npx create-expo-app@latest pocket-trade-hub-mobile
cd pocket-trade-hub-mobile
npx expo install expo-router expo-notifications expo-secure-store
npm install @tanstack/react-query zustand react-native-mmkv react-native-paper react-native-purchases
npm install -D typescript @types/react

# Backend API
mkdir pocket-trade-hub-api && cd pocket-trade-hub-api
npm init -y
npm install fastify @fastify/cors @fastify/websocket drizzle-orm postgres zod bullmq ioredis socket.io stripe expo-server-sdk
npm install -D typescript tsx vitest drizzle-kit @types/node

# Shared package (if monorepo)
# Contains Zod schemas, TypeScript types, card data definitions
```

## Version Verification Needed

The following versions should be verified against npm before starting development, as my training data may be stale:

- [ ] Expo SDK version (likely 52 or 53 by March 2026)
- [ ] React Native version (likely 0.77+ by March 2026)
- [ ] Fastify version (v5 was releasing in late 2024)
- [ ] Drizzle ORM version (rapidly iterating)
- [ ] BullMQ version
- [ ] RevenueCat React Native SDK version

## Sources

- Training data knowledge (through early 2025) -- all recommendations marked accordingly
- Expo documentation patterns (expo.dev/docs)
- Fastify documentation (fastify.dev)
- Drizzle ORM documentation (orm.drizzle.team)
- BullMQ documentation (docs.bullmq.io)
- Stripe documentation (stripe.com/docs)
- RevenueCat documentation (revenuecat.com/docs)

**Confidence note:** All version numbers are MEDIUM confidence and should be verified. Architecture and library choice recommendations are HIGH confidence as these technologies were well-established by early 2025.
