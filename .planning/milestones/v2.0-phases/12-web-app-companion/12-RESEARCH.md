# Phase 12: Web App Companion - Research

**Researched:** 2026-03-20
**Domain:** Next.js web application, cookie-based auth, Tailwind CSS, Zustand state management
**Confidence:** HIGH

## Summary

Phase 12 adds a browser-based companion app at `apps/web` in the existing Turborepo monorepo. The web app consumes the same Fastify API as the mobile app, sharing the `@pocket-trade-hub/shared` package for schemas and types. The core technical challenges are: (1) adapting JWT auth to use HTTP-only cookies instead of Bearer tokens, requiring small API-side changes to the auth plugin and CORS config, (2) setting up a new Next.js App Router project with Tailwind CSS and Zustand stores tailored for web (not reusing mobile's RN-specific stores), and (3) implementing Socket.IO client in a client component context that avoids SSR hydration issues.

The existing API is fully built with all routes needed (cards, collection, posts, proposals, meta, tierlists, suggestions, premium). The web app is a consumption layer -- no new API endpoints beyond cookie-auth adaptations. The i18n locale JSON files from mobile can be copied/shared since they contain the same translation keys.

**Primary recommendation:** Use Next.js 15 (stable, well-documented) with App Router, Tailwind CSS v4, and Zustand 5. Cookie auth requires a small Fastify plugin change to read JWT from cookies alongside Bearer headers, plus CORS `credentials: true` with an explicit origin.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Next.js with App Router (server components, streaming, layouts)
- Own Zustand stores in `apps/web` (not shared with mobile -- mobile stores use React Native-specific patterns like SecureStore)
- Tailwind CSS for styling (no component library -- plain Tailwind utilities)
- Direct API calls from browser to Fastify (no Next.js API proxy layer)
- Core subset: browse cards, collection management, trade posts (browse/create), deck meta, tier lists, proposals (full accept/reject/counter flow)
- Skip: push notifications, camera scanning, IAP/premium purchase, Apple Sign-In
- Premium status respected -- if user is premium on mobile, premium content visible on web. No way to purchase premium on web.
- Basic real-time via Socket.IO -- trade notifications and new matches. Not full real-time for everything.
- HTTP-only cookies for JWT storage (more secure than localStorage for web)
- Small API changes needed to support cookie-based auth alongside mobile's Bearer token flow
- Login methods: email/password + Google OAuth (skip Apple Sign-In on web)
- Next.js middleware for auth route protection (server-side redirect before page renders)
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

### Deferred Ideas (OUT OF SCOPE)
- Light theme toggle for web -- could be added in a future polish phase
- Stripe web purchases for premium -- significant scope, defer to v3+
- Apple Sign-In on web -- complex redirect flow, low priority since Google covers OAuth
- Full real-time for all data types -- basic notifications sufficient for companion app
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PLAT-01 | Users can access the app via web browser (companion web app) | Next.js App Router project setup in Turborepo, Tailwind dark theme, sidebar layout, auth middleware |
| PLAT-02 | Web app supports browse, search, and trading features | Direct Fastify API calls with cookie auth, Zustand stores for cards/collection/posts/proposals/meta/tierlists, Socket.IO for real-time |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | ^15.2 | Web framework with App Router | Stable, mature, excellent SSR/SSG, Turbopack dev server. v15 is production-proven; v16 is too new for a companion app. |
| React | ^19.1 | UI library | Matches mobile's React version, required by Next.js 15 |
| Tailwind CSS | ^4.0 | Utility-first styling | Locked decision. v4 has CSS-first config, no JS config file needed, 70% smaller output. |
| Zustand | ^5.0 | Client state management | Same library as mobile, but separate web-specific stores. Lightweight, no boilerplate. |
| socket.io-client | ^4.8 | Real-time WebSocket connection | Must match API's socket.io ^4.8.3 server version |
| i18next | ^25.8 | Internationalization | Same library as mobile, share locale JSON files |
| react-i18next | ^16.5 | React i18n bindings | Standard i18next React integration |
| zod | ^3.24 | Schema validation | Already in shared package, used for form validation |
| @pocket-trade-hub/shared | workspace:* | Shared schemas and types | Existing monorepo package with all Zod schemas |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-hook-form | ^7.71 | Form state management | Login, signup, post creation, proposal forms |
| @hookform/resolvers | ^5.2 | Zod resolver for react-hook-form | Connects shared Zod schemas to forms |
| lucide-react | ^0.500 | Icon library | Sidebar icons, action buttons, card UI elements |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tailwind v4 | Tailwind v3 | v4 is stable since Jan 2025, CSS-first config is simpler, smaller output; no reason to use v3 |
| Next.js 15 | Next.js 16 | v16 has breaking middleware/caching changes; v15 is better documented and lower risk |
| lucide-react | heroicons | Both work; lucide has broader icon set and consistent with modern Next.js projects |

**Installation:**
```bash
cd apps/web
pnpm add next@^15.2 react@^19.1 react-dom@^19.1 zustand@^5.0 socket.io-client@^4.8 i18next@^25.8 react-i18next@^16.5 react-hook-form@^7.71 @hookform/resolvers@^5.2 lucide-react zod@^3.24
pnpm add -D typescript@^5.8 @types/react@^19.1 tailwindcss@^4.0 @tailwindcss/postcss postcss autoprefixer
```

## Architecture Patterns

### Recommended Project Structure
```
apps/web/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout (dark theme, sidebar)
│   │   ├── page.tsx            # Landing/redirect
│   │   ├── (auth)/             # Auth route group (no sidebar)
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (app)/              # Authenticated route group (with sidebar)
│   │   │   ├── layout.tsx      # Sidebar layout wrapper
│   │   │   ├── cards/page.tsx
│   │   │   ├── collection/page.tsx
│   │   │   ├── market/page.tsx
│   │   │   ├── proposals/page.tsx
│   │   │   ├── meta/page.tsx
│   │   │   └── tierlists/page.tsx
│   │   ├── not-found.tsx       # 404 page
│   │   └── error.tsx           # Error boundary
│   ├── components/             # Shared UI components
│   │   ├── layout/             # Sidebar, header, mobile gate
│   │   ├── cards/              # Card grid, card detail modal
│   │   ├── trading/            # Post list, post creation, proposal modals
│   │   ├── collection/         # Collection grid, filters
│   │   ├── meta/               # Deck meta, tier lists
│   │   └── ui/                 # Button, input, modal, skeleton
│   ├── stores/                 # Zustand stores (web-specific)
│   │   ├── auth.ts
│   │   ├── cards.ts
│   │   ├── collection.ts
│   │   ├── posts.ts
│   │   ├── proposals.ts
│   │   ├── meta.ts
│   │   └── tierlists.ts
│   ├── lib/                    # Utilities
│   │   ├── api.ts              # Fetch wrapper with cookie credentials
│   │   ├── socket.ts           # Socket.IO client instance
│   │   └── constants.ts        # API URL, theme tokens
│   ├── i18n/                   # Web i18n setup
│   │   └── index.ts
│   └── middleware.ts           # Auth middleware (cookie check + redirect)
├── public/                     # Static assets
├── postcss.config.mjs          # PostCSS with Tailwind
├── next.config.ts              # Next.js configuration
├── tsconfig.json
└── package.json
```

### Pattern 1: Cookie-Based Auth with External API
**What:** Browser sends credentials (cookies) with every fetch to the Fastify API. No Next.js API proxy -- direct browser-to-API calls.
**When to use:** All authenticated API calls from the web app.
**Example:**
```typescript
// src/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include', // CRITICAL: sends cookies cross-origin
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (res.status === 401) {
    // Try refresh via cookie -- API sets new cookie automatically
    const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (refreshRes.ok) {
      // Retry original request with new cookie
      return apiFetch<T>(path, options);
    }
    // Redirect to login
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error ${res.status}`);
  }

  return res.json();
}
```

### Pattern 2: API Auth Plugin Update (Cookie + Bearer)
**What:** Fastify auth plugin reads JWT from cookie OR Authorization header.
**When to use:** Required API-side change to support both mobile and web clients.
**Example:**
```typescript
// Updated apps/api/src/plugins/auth.ts
fastify.decorate(
  'authenticate',
  async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Try Authorization header first (mobile)
      await request.jwtVerify();
    } catch (err) {
      // Fall back to cookie (web)
      const token = request.cookies?.accessToken;
      if (token) {
        try {
          await request.jwtVerify({ onlyCookie: false });
          // Manually verify the cookie token
          const decoded = fastify.jwt.verify(token);
          request.user = decoded;
          return;
        } catch {
          // Cookie token invalid
        }
      }
      reply.code(401).send({ error: 'Unauthorized' });
    }
  }
);
```

### Pattern 3: Next.js Middleware for Route Protection
**What:** Middleware checks for auth cookie before rendering protected pages, redirects to login if missing.
**When to use:** All routes under the (app) route group.
**Example:**
```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/login')
    || request.nextUrl.pathname.startsWith('/signup');

  // Redirect to login if no token on protected routes
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect to app if already logged in on auth pages
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/cards', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
```

### Pattern 4: Socket.IO Client in Next.js
**What:** Socket.IO client instance created in a "use client" module, connected in a layout effect.
**When to use:** Real-time trade notifications and new matches.
**Example:**
```typescript
// src/lib/socket.ts
"use client";
import { io, Socket } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const socket: Socket = io(API_URL, {
  autoConnect: false, // Connect manually after auth
  withCredentials: true, // Send cookies
});
```

### Pattern 5: Zustand Store (Web-Specific)
**What:** Web stores use cookies/apiFetch instead of SecureStore/Bearer tokens.
**When to use:** All client-side state in the web app.
**Example:**
```typescript
// src/stores/auth.ts
"use client";
import { create } from 'zustand';
import { apiFetch } from '../lib/api';

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isHydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoggedIn: false,
  isHydrated: false,

  login: async (email, password) => {
    // API sets HTTP-only cookie in response
    const data = await apiFetch<{ user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    set({ user: data.user, isLoggedIn: true });
  },

  hydrate: async () => {
    try {
      const user = await apiFetch<User>('/users/me');
      set({ user, isLoggedIn: true, isHydrated: true });
    } catch {
      set({ isHydrated: true });
    }
  },

  logout: async () => {
    await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
    set({ user: null, isLoggedIn: false });
  },
}));
```

### Pattern 6: Mobile Browser Gate
**What:** Detect small viewport and show "download the app" prompt instead of the web app.
**When to use:** Viewport < 768px width.
**Example:**
```typescript
// src/components/layout/MobileGate.tsx
"use client";
export function MobileGate({ children }: { children: React.ReactNode }) {
  // Use CSS media query to show/hide, avoiding hydration mismatch
  return (
    <>
      <div className="hidden md:contents">{children}</div>
      <div className="md:hidden flex items-center justify-center min-h-screen bg-zinc-900 text-white p-8">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Pocket Trade Hub</h1>
          <p>For the best experience, download our mobile app.</p>
          {/* App store links */}
        </div>
      </div>
    </>
  );
}
```

### Anti-Patterns to Avoid
- **Next.js API routes as proxy:** User explicitly locked "direct API calls from browser to Fastify." Do NOT create `/api/*` route handlers that proxy to the Fastify backend.
- **Sharing mobile stores:** Mobile stores use SecureStore, React Native Platform checks, and Google/Apple native sign-in. Create fresh web-specific stores.
- **Server-side fetch with cookies:** In server components, you do NOT have access to the browser's cookies automatically when making fetch calls to an external API. Use client components with `credentials: 'include'` for auth-requiring data.
- **Initializing socket state at module level:** Avoid `const [connected] = useState(socket.connected)` -- causes hydration mismatch. Use `useEffect` to check connection state.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Custom validators | react-hook-form + @hookform/resolvers + shared Zod schemas | Already have all schemas in shared package |
| Icon system | SVG sprite sheet | lucide-react | Consistent, tree-shakeable, 1000+ icons |
| Auth token refresh | Manual retry logic | Centralized apiFetch wrapper with 401 interception | Single retry point, avoids race conditions |
| i18n | Custom translation loader | i18next + react-i18next (same as mobile) | Can share locale JSON files directly |
| Date formatting | Custom formatters | Intl.DateTimeFormat (browser built-in) | Locale-aware, zero dependencies |
| Modal management | Custom portal system | React `createPortal` + Tailwind overlay | Simple, no library needed for overlay modals |

**Key insight:** The web app is a thin UI layer over an already-complete API. Almost all business logic lives in the API. The web stores are simple fetch-and-cache layers.

## Common Pitfalls

### Pitfall 1: CORS with Credentials
**What goes wrong:** Browser blocks API calls because `credentials: 'include'` requires the server to respond with `Access-Control-Allow-Credentials: true` AND a specific origin (not `*`).
**Why it happens:** Current Fastify CORS is `{ origin: true }` which works for simple requests but needs explicit origin + credentials for cookies.
**How to avoid:** Update Fastify CORS config:
```typescript
await app.register(cors, {
  origin: process.env.WEB_ORIGIN || 'http://localhost:3001',
  credentials: true,
});
```
**Warning signs:** "CORS policy: No 'Access-Control-Allow-Origin'" errors in browser console.

### Pitfall 2: Cookie Domain and SameSite
**What goes wrong:** Cookies set by the API are not sent back by the browser on subsequent requests.
**Why it happens:** If API is on `api.example.com` and web is on `app.example.com`, the cookie must have `domain=.example.com`. Also, `SameSite=None` is required for cross-site cookies, AND `Secure` must be true (HTTPS only).
**How to avoid:** In development, run both on localhost with different ports. In production, use the same parent domain. Set cookies with:
```typescript
reply.setCookie('accessToken', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/',
  maxAge: 15 * 60, // 15 minutes (matches JWT expiry)
});
```
**Warning signs:** Login succeeds but subsequent API calls return 401.

### Pitfall 3: Fastify Cookie Plugin Required
**What goes wrong:** `request.cookies` is undefined in Fastify route handlers.
**Why it happens:** Fastify doesn't parse cookies by default. Need `@fastify/cookie` plugin.
**How to avoid:** Install and register `@fastify/cookie` before auth plugin:
```bash
pnpm add @fastify/cookie  # in apps/api
```
**Warning signs:** `Cannot read property 'accessToken' of undefined` in auth plugin.

### Pitfall 4: Refresh Token in Cookies
**What goes wrong:** Token refresh flow doesn't work because refresh token was in the request body (mobile pattern) but web needs it in a cookie.
**Why it happens:** Mobile sends `{ refreshToken }` in POST body. Web needs the API to read it from a separate cookie.
**How to avoid:** Set refresh token as a separate HTTP-only cookie with a longer maxAge. The `/auth/refresh` endpoint reads from either body (mobile) or cookie (web).

### Pitfall 5: Hydration Mismatch with Auth State
**What goes wrong:** Server renders "logged out" state, client hydrates "logged in" -- React throws hydration error.
**Why it happens:** Server components don't have access to auth state. Client Zustand store hydrates after mount.
**How to avoid:** Use a loading/skeleton state during hydration. Only render auth-dependent content after `isHydrated` is true.

### Pitfall 6: Socket.IO Module-Level Instantiation
**What goes wrong:** `ReferenceError: io is not defined` during SSR or build.
**Why it happens:** Socket.IO client module runs on the server during SSR.
**How to avoid:** Mark the socket module with `"use client"` directive and use `autoConnect: false`. Connect only after auth hydration in a `useEffect`.

### Pitfall 7: Google OAuth on Web vs Mobile
**What goes wrong:** Trying to use `@react-native-google-signin/google-signin` on web.
**Why it happens:** Mobile uses native Google Sign-In SDK. Web needs browser-based OAuth redirect flow.
**How to avoid:** Use Google's browser OAuth flow (redirect to Google, callback to your app) or Google Identity Services (GSI) button. The API's `/auth/oauth/google` endpoint already accepts an `idToken` -- web just needs a different way to obtain it.

## Code Examples

### CORS Update for Fastify (API-side)
```typescript
// apps/api/src/server.ts -- updated CORS registration
await app.register(cors, {
  origin: [
    process.env.WEB_ORIGIN || 'http://localhost:3001',
    // Keep mobile origin support
    ...(process.env.MOBILE_ORIGINS?.split(',') || []),
  ],
  credentials: true,
});
```

### Cookie-Setting Auth Route (API-side)
```typescript
// In auth routes, after issuing tokens:
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
  path: '/',
};

reply
  .setCookie('accessToken', tokens.accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60,
  })
  .setCookie('refreshToken', tokens.refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60,
  })
  .send({ user });
```

### Tailwind v4 Dark Theme Setup
```css
/* apps/web/src/app/globals.css */
@import "tailwindcss";

@theme {
  --color-bg: #0a0a0a;
  --color-surface: #18181b;
  --color-surface-hover: #27272a;
  --color-border: #3f3f46;
  --color-text: #fafafa;
  --color-text-muted: #a1a1aa;
  --color-gold: #f0c040;
  --color-gold-hover: #d4a830;
}
```

### Web i18n Setup (sharing mobile locales)
```typescript
// apps/web/src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import the same locale files (can symlink or copy from mobile)
import en from '../../locales/en.json';
import de from '../../locales/de.json';
// ... all 10 locales

function getBrowserLanguage(): string {
  if (typeof navigator === 'undefined') return 'en';
  const lang = navigator.language?.split('-')[0];
  const supported = ['en','de','es','fr','it','ja','ko','pt','zh','th'];
  return supported.includes(lang || '') ? lang! : 'en';
}

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, de: { translation: de } /* ... */ },
  lng: getBrowserLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
```

### Sidebar Layout
```typescript
// apps/web/src/app/(app)/layout.tsx
"use client";
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileGate } from '@/components/layout/MobileGate';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <MobileGate>
      <div className="flex min-h-screen bg-bg text-text">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </MobileGate>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| tailwind.config.js | CSS-first @theme in globals.css | Tailwind v4 (Jan 2025) | No JS config file needed, simpler setup |
| @tailwind directives | @import "tailwindcss" | Tailwind v4 (Jan 2025) | Single import line replaces 3 directives |
| Content path config | Automatic content detection | Tailwind v4 (Jan 2025) | No need to specify which files to scan |
| Pages Router auth | App Router middleware + server components | Next.js 13+ (stable in 15) | Middleware runs at edge, redirects before render |
| localStorage JWT | HTTP-only cookies | Security best practice | XSS cannot access tokens |

**Deprecated/outdated:**
- `tailwind.config.js` / `tailwind.config.ts` -- replaced by CSS @theme in v4
- `@tailwind base; @tailwind components; @tailwind utilities;` -- replaced by `@import "tailwindcss"` in v4
- Next.js `getServerSideProps` -- replaced by server components in App Router

## Open Questions

1. **Locale file sharing strategy**
   - What we know: Mobile and web use the same i18n keys and i18next library
   - What's unclear: Should locale JSONs live in `packages/shared` or be symlinked/copied?
   - Recommendation: Move locale files to `packages/shared/locales/` so both apps import from the same source. Alternatively, keep them in mobile and symlink from web if moving is disruptive.

2. **Google OAuth on web implementation**
   - What we know: Mobile uses native Google Sign-In SDK, web needs browser-based flow
   - What's unclear: Whether to use Google Identity Services (GIS) button component or redirect-based OAuth
   - Recommendation: Use Google Identity Services `@react-oauth/google` library for the "Sign in with Google" button. It provides an ID token directly, compatible with existing `/auth/oauth/google` endpoint.

3. **Production domain structure**
   - What we know: Cookie domain/SameSite depends on whether API and web share a parent domain
   - What's unclear: Production deployment topology (same domain? subdomains?)
   - Recommendation: Plan for `app.domain.com` (web) and `api.domain.com` (API) with cookies on `.domain.com`. Development uses localhost with different ports.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (matches existing API/shared test setup) or Vitest (lighter for Next.js) |
| Config file | `apps/web/jest.config.ts` or `apps/web/vitest.config.ts` -- Wave 0 |
| Quick run command | `cd apps/web && pnpm test` |
| Full suite command | `pnpm --filter web test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PLAT-01 | Web app loads in browser, shows cards/posts/collection | smoke (manual) | Manual browser test | N/A |
| PLAT-01 | Auth middleware redirects unauthenticated users | unit | `cd apps/web && pnpm test -- --testPathPattern middleware` | Wave 0 |
| PLAT-01 | API auth plugin accepts cookies alongside Bearer | unit | `cd apps/api && pnpm test -- --testPathPattern auth` | Existing (needs update) |
| PLAT-01 | CORS allows web origin with credentials | integration | `cd apps/api && pnpm test -- --testPathPattern cors` | Wave 0 |
| PLAT-02 | Zustand stores fetch and cache API data | unit | `cd apps/web && pnpm test -- --testPathPattern stores` | Wave 0 |
| PLAT-02 | apiFetch wrapper handles 401 refresh | unit | `cd apps/web && pnpm test -- --testPathPattern api` | Wave 0 |
| PLAT-02 | Cookie-based login/signup flow | integration | `cd apps/api && pnpm test -- --testPathPattern auth.cookie` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd apps/web && pnpm test`
- **Per wave merge:** `pnpm test` (runs all workspace tests)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/web/package.json` -- project scaffold with test script
- [ ] `apps/web/jest.config.ts` or `apps/web/vitest.config.ts` -- test framework config
- [ ] `apps/web/__tests__/middleware.test.ts` -- auth middleware unit test
- [ ] `apps/web/__tests__/lib/api.test.ts` -- apiFetch wrapper tests
- [ ] `apps/api/src/__tests__/auth-cookie.test.ts` -- cookie-based auth integration test
- [ ] `@fastify/cookie` dependency in apps/api

## Sources

### Primary (HIGH confidence)
- Existing codebase: `apps/api/src/plugins/auth.ts`, `apps/api/src/server.ts`, `apps/api/src/routes/auth.ts`, `apps/mobile/src/stores/auth.ts` -- direct code review
- [Socket.IO Next.js guide](https://socket.io/how-to/use-with-nextjs) -- official setup patterns for App Router
- [Tailwind CSS v4 announcement](https://tailwindcss.com/blog/tailwindcss-v4) -- CSS-first config, @import directive
- [Tailwind CSS Next.js guide](https://tailwindcss.com/docs/guides/nextjs) -- official installation steps
- [Next.js Authentication guide](https://nextjs.org/docs/app/guides/authentication) -- middleware patterns, cookie handling

### Secondary (MEDIUM confidence)
- [Next.js cookie-based auth with external API patterns](https://medium.com/@urboifox/authentication-in-next-ajs-with-an-external-backend-262fc2748158) -- verified against Next.js official docs
- [CORS credentials with cookies](https://blog.logrocket.com/using-cors-next-js-handle-cross-origin-requests/) -- standard browser behavior, well-documented

### Tertiary (LOW confidence)
- Next.js 15 vs 16 version recommendation -- based on web search indicating v16 is new with breaking changes; v15 is safer for this project

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - well-established libraries matching existing project patterns
- Architecture: HIGH - direct code review of existing API, clear integration points identified
- Pitfalls: HIGH - CORS/cookies are well-documented browser behaviors, Socket.IO SSR issues are well-known
- Cookie auth pattern: MEDIUM - requires API-side changes, specific @fastify/cookie integration needs verification during implementation

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (stable ecosystem, 30-day validity)
