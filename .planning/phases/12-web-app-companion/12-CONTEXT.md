# Phase 12: Web App Companion - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Browser-based companion app that gives users desktop/tablet access to core trading, collection, and meta features. New `apps/web` package in the existing Turborepo monorepo, consuming the same Fastify API as mobile. Does NOT include mobile browser support (redirect to app store), premium purchase flow (web respects existing premium status only), or Apple Sign-In.

</domain>

<decisions>
## Implementation Decisions

### Web Framework
- Next.js with App Router (server components, streaming, layouts)
- Own Zustand stores in `apps/web` (not shared with mobile -- mobile stores use React Native-specific patterns like SecureStore)
- Tailwind CSS for styling (no component library -- plain Tailwind utilities)
- Direct API calls from browser to Fastify (no Next.js API proxy layer)

### Feature Scope
- Core subset: browse cards, collection management, trade posts (browse/create), deck meta, tier lists, proposals (full accept/reject/counter flow)
- Skip: push notifications, camera scanning, IAP/premium purchase, Apple Sign-In
- Premium status respected -- if user is premium on mobile, premium content visible on web. No way to purchase premium on web.
- Basic real-time via Socket.IO -- trade notifications and new matches. Not full real-time for everything.

### Auth and Sessions
- HTTP-only cookies for JWT storage (more secure than localStorage for web)
- Small API changes needed to support cookie-based auth alongside mobile's Bearer token flow
- Login methods: email/password + Google OAuth (skip Apple Sign-In on web)
- Next.js middleware for auth route protection (server-side redirect before page renders)

### Visual Identity and Layout
- Same dark theme with gold accent (#f0c040) as mobile -- consistent brand identity
- Sidebar navigation (persistent left sidebar with icons + labels)
- Responsive down to tablet (~768px). Mobile browser users shown "download the app" prompt.
- Card grid with larger images on desktop (4-6 per row), taking advantage of screen space
- Overlay modals for detail views (deck detail, proposal creation, tier lists) -- not full-page routes

### Claude's Discretion
- Exact sidebar width and collapse breakpoint
- Loading skeleton designs for web
- Error page designs (404, 500)
- Card hover effects and desktop-specific interactions
- Exact Tailwind color token mapping from mobile's dark theme

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/shared` -- All Zod schemas, types, and validation logic shared across API and mobile. Web app imports these directly.
- `apps/api` -- Complete Fastify backend with all routes already built (auth, cards, collection, posts, proposals, meta, tierlists, suggestions, premium)
- Shared i18n keys -- Server already uses `parseAcceptLanguage` for route-level language detection

### Established Patterns
- Turborepo monorepo with pnpm workspaces -- `apps/web` will be a new workspace entry
- JWT auth with refresh token rotation -- API already handles this, web needs cookie adapter
- Zustand per-domain stores -- Web creates its own stores following same domain separation (auth, cards, collection, trades, meta, etc.)
- CORS already configured on Fastify (`origin: true`) -- needs refinement for cookie credentials

### Integration Points
- `apps/api/src/server.ts` -- May need CORS update for `credentials: true` and specific web origin
- `apps/api/src/routes/auth.ts` -- Needs cookie-setting variant for web login/refresh
- `apps/api/src/plugins/auth.ts` -- Needs to accept auth from cookies in addition to Bearer header
- Socket.IO server -- Web client connects same as mobile, with cookie auth
- `turbo.json` -- Add web app to pipeline

</code_context>

<specifics>
## Specific Ideas

No specific references -- open to standard approaches for the Next.js web app. Key principle: desktop experience that complements mobile, not replaces it.

</specifics>

<deferred>
## Deferred Ideas

- Light theme toggle for web -- could be added in a future polish phase
- Stripe web purchases for premium -- significant scope, defer to v3+
- Apple Sign-In on web -- complex redirect flow, low priority since Google covers OAuth
- Full real-time for all data types -- basic notifications sufficient for companion app

</deferred>

---

*Phase: 12-web-app-companion*
*Context gathered: 2026-03-20*
