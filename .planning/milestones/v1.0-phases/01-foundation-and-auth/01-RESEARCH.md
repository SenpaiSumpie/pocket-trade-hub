# Phase 1: Foundation and Auth - Research

**Researched:** 2026-03-07
**Domain:** Expo (React Native) + Fastify monorepo scaffolding, email/password authentication, user profiles
**Confidence:** HIGH

## Summary

This phase bootstraps a greenfield Turborepo monorepo with an Expo (React Native) mobile app and a Fastify API server backed by PostgreSQL. The core deliverables are email/password authentication (sign up, login, logout, password reset), user profile management (display name, preset avatar, Pokemon TCG Pocket friend code), viewing other users' profiles, and a tab-based navigation shell with placeholder screens for future phases.

The ecosystem is mature and well-documented. Expo SDK 55 (React Native 0.83, React 19.2) with Expo Router v7 provides file-based routing with built-in protected route guards. Fastify v5 with @fastify/jwt and Drizzle ORM for PostgreSQL is the standard server-side stack. Zustand handles client-side auth state with expo-secure-store for token persistence. Form validation uses react-hook-form + zod, with zod schemas shared between app and API via a monorepo shared package.

**Primary recommendation:** Use Expo Router v7's `Stack.Protected` component for auth guards, @fastify/jwt with access+refresh token pair for session management, Drizzle ORM for type-safe database access, and a `packages/shared` workspace for zod schemas shared between app and API.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Branded and immersive login screen with Pokemon card art/imagery and app branding
- Email/password authentication only (OAuth deferred to v2)
- Dedicated onboarding screen after sign-up (skippable, can complete later)
- Avatar selection from preset Pokemon-themed icons (no photo upload)
- Friend code field validates against Pokemon TCG Pocket's actual format (16 digits, XXXX-XXXX-XXXX-XXXX)
- Display names are non-unique (Discord-style -- accounts identified internally, names can repeat)
- Other user profiles show: avatar, display name, friend code, join date
- Tap friend code to copy to clipboard with brief "Copied!" toast confirmation
- Own profile edited through a dedicated "Edit Profile" screen (not inline editing)
- Bottom tab bar with 4 tabs from Phase 1: Home, Cards, Trades, Profile
- Cards and Trades tabs show "Coming soon" placeholder screens
- Home tab shows welcome message with setup checklist (set name, choose avatar, add friend code) plus "coming soon" previews of future features

### Claude's Discretion
- Email verification approach (verify-later with nudge banner is the standard)
- Password reset mechanism (email link vs 6-digit code)
- Auth layout (separate screens vs tabs for login/sign-up)
- Profile view presentation (full screen vs bottom sheet)
- Visual theme direction (dark, light, or system-adaptive)
- Loading states and error handling
- Exact spacing, typography, and component styling

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can create account with email and password | Fastify + @fastify/jwt + bcrypt + Drizzle users table; react-hook-form + zod on client |
| AUTH-02 | User can log in and stay logged in across app sessions | Access/refresh JWT tokens stored in expo-secure-store; Zustand auth store with hydration |
| AUTH-03 | User can log out from any screen | Zustand auth store clear + SecureStore delete; Expo Router Stack.Protected auto-redirects |
| AUTH-04 | User can reset password via email link | JWT-based reset token + Nodemailer/Resend email delivery; deep link back to app |
| PROF-01 | User can set display name and avatar | Onboarding screen + Edit Profile screen; preset avatar enum stored in DB |
| PROF-02 | User can add their Pokemon TCG Pocket friend code | 16-digit numeric validation (XXXX-XXXX-XXXX-XXXX format); zod schema |
| PROF-03 | User can view other users' profiles with trade history count | GET /users/:id endpoint; profile screen with avatar, name, friend code, join date (trade count=0 for now) |
| PROF-04 | User can copy another user's friend code to clipboard | expo-clipboard + toast notification |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo | ~55.x (SDK 55) | React Native framework | Latest stable SDK; React Native 0.83, React 19.2, New Architecture default |
| expo-router | v7 (bundled with SDK 55) | File-based routing + navigation | Built on React Navigation; Stack.Protected for auth guards |
| fastify | ^5.8 | API server | Fastest Node.js framework; first-class TypeScript; plugin architecture |
| drizzle-orm | ^0.45 | PostgreSQL ORM | Type-safe SQL; shared schema types; migration system |
| drizzle-kit | latest | Drizzle migrations CLI | Schema push and migration generation |
| zustand | ^5.x | Client state management | Minimal API; hook-based; perfect for auth state |
| turborepo | latest | Monorepo orchestration | Task caching; workspace management; pnpm workspaces |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @fastify/jwt | ^9.x | JWT sign/verify on server | Every auth endpoint; access + refresh tokens |
| @fastify/cors | ^10.x | CORS headers | All API responses (mobile app requests) |
| bcrypt | ^5.x | Password hashing | Registration and login; salt rounds = 10 |
| expo-secure-store | bundled with SDK 55 | Encrypted token storage | Storing JWT tokens on device (NOT AsyncStorage) |
| expo-clipboard | bundled with SDK 55 | Clipboard access | Copying friend codes |
| react-hook-form | ^7.x | Form state management | Login, signup, profile edit forms |
| zod | ^3.x | Schema validation | Shared between app and API; form + request validation |
| @hookform/resolvers | ^3.x | RHF + zod bridge | Connecting zod schemas to react-hook-form |
| postgres | ^3.x | PostgreSQL driver | Drizzle's recommended driver for node-postgres |
| @react-native-async-storage/async-storage | bundled | Non-sensitive persistence | Onboarding state, UI preferences (NOT tokens) |
| nodemailer | ^6.x | Email sending | Password reset emails (or use Resend for simpler setup) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Drizzle ORM | Prisma | Prisma has better docs but heavier; Drizzle is lighter, SQL-closer, better for monorepo type sharing |
| Zustand | Redux Toolkit | RTK is more feature-rich but boilerplate-heavy; Zustand is simpler for this scope |
| bcrypt | argon2 | Argon2 is technically superior but bcrypt is battle-tested and has better React Native compatibility |
| Nodemailer | Resend | Resend is simpler (API-based, no SMTP config) but adds a paid dependency |

**Installation (app workspace):**
```bash
npx create-expo-app@latest apps/mobile --template tabs
cd apps/mobile
npx expo install expo-secure-store expo-clipboard @react-native-async-storage/async-storage
npm install zustand zod react-hook-form @hookform/resolvers
```

**Installation (api workspace):**
```bash
npm install fastify @fastify/jwt @fastify/cors bcrypt drizzle-orm postgres nodemailer
npm install -D drizzle-kit @types/bcrypt @types/nodemailer typescript tsx
```

## Architecture Patterns

### Recommended Monorepo Structure
```
pocket-trade-hub/
├── turbo.json
├── package.json                    # Root workspace config (pnpm)
├── pnpm-workspace.yaml
├── apps/
│   ├── mobile/                     # Expo app
│   │   ├── app/                    # Expo Router file-based routes
│   │   │   ├── _layout.tsx         # Root layout (auth provider wrap)
│   │   │   ├── (auth)/             # Auth group (login, signup, reset)
│   │   │   │   ├── _layout.tsx
│   │   │   │   ├── login.tsx
│   │   │   │   ├── signup.tsx
│   │   │   │   └── reset-password.tsx
│   │   │   ├── (tabs)/             # Main app tabs (protected)
│   │   │   │   ├── _layout.tsx     # Tab bar config
│   │   │   │   ├── index.tsx       # Home tab
│   │   │   │   ├── cards.tsx       # Placeholder
│   │   │   │   ├── trades.tsx      # Placeholder
│   │   │   │   └── profile.tsx     # Own profile
│   │   │   ├── onboarding.tsx      # Post-signup onboarding
│   │   │   └── user/
│   │   │       └── [id].tsx        # Other user profile view
│   │   ├── src/
│   │   │   ├── stores/             # Zustand stores
│   │   │   │   └── auth.ts
│   │   │   ├── hooks/              # Custom hooks
│   │   │   │   └── useApi.ts
│   │   │   ├── components/         # Shared UI components
│   │   │   ├── constants/          # Avatar presets, theme colors
│   │   │   └── utils/              # Helpers
│   │   ├── assets/                 # Images, avatar icons, fonts
│   │   ├── app.json
│   │   └── package.json
│   └── api/                        # Fastify server
│       ├── src/
│       │   ├── server.ts           # Fastify app setup
│       │   ├── plugins/            # Fastify plugins
│       │   │   ├── auth.ts         # JWT + auth decorators
│       │   │   └── db.ts           # Drizzle + postgres connection
│       │   ├── routes/             # Route handlers
│       │   │   ├── auth.ts         # POST /auth/signup, /auth/login, etc.
│       │   │   └── users.ts        # GET /users/:id, PATCH /users/me
│       │   ├── db/
│       │   │   ├── schema.ts       # Drizzle table definitions
│       │   │   └── migrations/     # Generated migrations
│       │   └── services/           # Business logic
│       │       ├── auth.service.ts
│       │       └── user.service.ts
│       ├── drizzle.config.ts
│       └── package.json
└── packages/
    └── shared/                     # Shared TypeScript types + zod schemas
        ├── src/
        │   ├── schemas/            # Zod schemas (auth, user)
        │   │   ├── auth.ts
        │   │   └── user.ts
        │   └── types/              # Inferred TypeScript types
        │       └── index.ts
        ├── package.json
        └── tsconfig.json
```

### Pattern 1: Expo Router Protected Routes with Stack.Protected
**What:** Declarative auth guard using Stack.Protected component
**When to use:** Separating authenticated vs unauthenticated route groups
**Example:**
```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';
import { useAuthStore } from '@/stores/auth';

export default function RootLayout() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  return (
    <Stack>
      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ presentation: 'modal' }} />
        <Stack.Screen name="user/[id]" />
      </Stack.Protected>
    </Stack>
  );
}
```

### Pattern 2: Zustand Auth Store with SecureStore Hydration
**What:** Persisted auth state that survives app restarts
**When to use:** Managing JWT tokens and login state
**Example:**
```typescript
// src/stores/auth.ts
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isLoggedIn: boolean;
  isHydrated: boolean;
  login: (access: string, refresh: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  isLoggedIn: false,
  isHydrated: false,

  login: async (access, refresh) => {
    await SecureStore.setItemAsync('accessToken', access);
    await SecureStore.setItemAsync('refreshToken', refresh);
    set({ accessToken: access, refreshToken: refresh, isLoggedIn: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    set({ accessToken: null, refreshToken: null, isLoggedIn: false });
  },

  hydrate: async () => {
    const access = await SecureStore.getItemAsync('accessToken');
    const refresh = await SecureStore.getItemAsync('refreshToken');
    set({
      accessToken: access,
      refreshToken: refresh,
      isLoggedIn: !!access,
      isHydrated: true,
    });
  },
}));
```

### Pattern 3: Shared Zod Schemas Between App and API
**What:** Single source of truth for validation in monorepo
**When to use:** Any data that crosses the app/API boundary
**Example:**
```typescript
// packages/shared/src/schemas/auth.ts
import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// packages/shared/src/schemas/user.ts
export const friendCodeSchema = z
  .string()
  .regex(/^\d{4}-\d{4}-\d{4}-\d{4}$/, 'Friend code must be in XXXX-XXXX-XXXX-XXXX format (digits only)');

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(30).optional(),
  avatarId: z.string().optional(),   // preset avatar identifier
  friendCode: friendCodeSchema.optional(),
});
```

### Pattern 4: Fastify JWT Auth Plugin
**What:** Centralized JWT verification as a Fastify decorator
**When to use:** Protecting API routes that require authentication
**Example:**
```typescript
// apps/api/src/plugins/auth.ts
import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';

export default fp(async (fastify) => {
  fastify.register(jwt, {
    secret: process.env.JWT_SECRET!,
    sign: { expiresIn: '15m' },  // access token
  });

  fastify.decorate('authenticate', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  });
});
```

### Pattern 5: Drizzle Schema with Identity Columns
**What:** Modern PostgreSQL schema using identity columns (not serial)
**When to use:** All table definitions
**Example:**
```typescript
// apps/api/src/db/schema.ts
import { pgTable, text, timestamp, varchar, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),  // UUID generated in app code
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: varchar('display_name', { length: 30 }),
  avatarId: varchar('avatar_id', { length: 50 }),
  friendCode: varchar('friend_code', { length: 19 }),  // XXXX-XXXX-XXXX-XXXX
  emailVerified: timestamp('email_verified'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const refreshTokens = pgTable('refresh_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  revokedAt: timestamp('revoked_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### Anti-Patterns to Avoid
- **Storing JWT tokens in AsyncStorage:** AsyncStorage is unencrypted plain text. Always use expo-secure-store for tokens.
- **Single JWT with long expiry:** Use access (15min) + refresh (30 days) token pair. Never issue a single token that lasts weeks.
- **Putting business logic in route handlers:** Extract to service layer. Route handlers should validate input, call service, return response.
- **Hand-rolling auth state with useContext:** Zustand is simpler, faster, and avoids unnecessary re-renders that Context causes.
- **Using serial/autoincrement for primary keys:** Use UUIDs (crypto.randomUUID()) for user-facing IDs. Prevents enumeration attacks and simplifies distributed systems.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password hashing | Custom hash function | bcrypt (salt rounds 10) | Timing attacks, rainbow tables, salt management |
| JWT creation/verification | Manual token parsing | @fastify/jwt (uses fast-jwt) | Algorithm confusion, expiry bugs, signature validation |
| Encrypted storage | Custom encryption on AsyncStorage | expo-secure-store | Uses OS keychain (iOS) / Keystore (Android); audited |
| Form validation | Manual onChange handlers | react-hook-form + zod | Re-render optimization, error state management |
| Route protection | Manual navigation guards | Expo Router Stack.Protected | Handles deep links, back navigation, race conditions |
| Email sending | Raw SMTP connection | Nodemailer or Resend SDK | Connection pooling, retry logic, template support |
| Database migrations | Raw SQL files | drizzle-kit generate/migrate | Schema drift detection, rollback support |

**Key insight:** Authentication and security primitives are the worst things to build from scratch. Every custom implementation will have subtle vulnerabilities that battle-tested libraries have already fixed.

## Common Pitfalls

### Pitfall 1: Hydration Flash on App Start
**What goes wrong:** App briefly shows login screen before checking stored tokens, causing a visual flash.
**Why it happens:** SecureStore reads are async; Expo Router renders before hydration completes.
**How to avoid:** Show a splash/loading screen until `isHydrated` is true in the auth store. Use `expo-splash-screen` to keep the native splash visible during hydration.
**Warning signs:** Users see login screen flicker on every app open.

### Pitfall 2: Expo Router Group Naming Confusion
**What goes wrong:** Route groups like `(auth)` and `(tabs)` don't behave as expected.
**Why it happens:** Parenthesized folder names are route groups (not in URL path). Each needs its own `_layout.tsx`.
**How to avoid:** Every `(group)` folder must have a `_layout.tsx`. The root `_layout.tsx` must list all groups as `Stack.Screen` entries.
**Warning signs:** Blank screens, navigation errors, missing tab bars.

### Pitfall 3: Missing CORS Configuration
**What goes wrong:** Mobile app API requests fail silently or with opaque network errors.
**Why it happens:** Fastify doesn't add CORS headers by default; React Native's fetch needs them in dev (especially on web preview).
**How to avoid:** Register `@fastify/cors` as the first plugin. Allow all origins in development.
**Warning signs:** "Network request failed" errors with no server-side logs.

### Pitfall 4: Turborepo + Expo Metro Resolution
**What goes wrong:** Metro bundler can't find packages from the monorepo shared workspace.
**Why it happens:** Metro's module resolution differs from Node.js. Shared packages need proper `main`/`exports` fields.
**How to avoid:** Use Expo SDK 55's automatic monorepo Metro detection. Ensure shared packages have `"main": "src/index.ts"` in their package.json. Use `pnpm` with `node-linker=hoisted` in `.npmrc`.
**Warning signs:** "Unable to resolve module" errors when importing from `@pocket-trade-hub/shared`.

### Pitfall 5: Password Reset Token Reuse
**What goes wrong:** Attacker intercepts reset email and uses token multiple times.
**Why it happens:** Token is not invalidated after first use.
**How to avoid:** Store token hash in DB with `usedAt` timestamp. Mark as used on first successful reset. Set short expiry (15-30 minutes).
**Warning signs:** No `usedAt` column in password_reset_tokens table.

### Pitfall 6: Duplicate React/React Native in Monorepo
**What goes wrong:** Runtime crash: "Invalid hook call" or "Multiple React instances."
**Why it happens:** Both root and app workspace install separate React copies.
**How to avoid:** Hoist React and React Native to root workspace. In app's package.json, React should be a peer dependency or hoisted. Check with `pnpm why react`.
**Warning signs:** Hook-related runtime errors that only appear in monorepo setup.

## Code Examples

### API Route: User Signup
```typescript
// apps/api/src/routes/auth.ts
import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { signupSchema } from '@pocket-trade-hub/shared/schemas/auth';
import { users } from '../db/schema';
import { db } from '../plugins/db';
import { eq } from 'drizzle-orm';

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/auth/signup', async (request, reply) => {
    const parsed = signupSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ errors: parsed.error.flatten() });
    }

    const { email, password } = parsed.data;

    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      return reply.code(409).send({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = randomUUID();

    await db.insert(users).values({ id, email, passwordHash });

    const accessToken = fastify.jwt.sign({ sub: id }, { expiresIn: '15m' });
    const refreshToken = fastify.jwt.sign({ sub: id, type: 'refresh' }, { expiresIn: '30d' });

    return reply.code(201).send({ accessToken, refreshToken, user: { id, email } });
  });
}
```

### Friend Code Copy with Toast
```typescript
// Clipboard copy pattern for friend code
import * as Clipboard from 'expo-clipboard';
import { Alert, Platform, ToastAndroid } from 'react-native';

async function copyFriendCode(code: string) {
  await Clipboard.setStringAsync(code);
  if (Platform.OS === 'android') {
    ToastAndroid.show('Copied!', ToastAndroid.SHORT);
  }
  // On iOS, use a custom toast component or brief inline feedback
}
```

### Tab Layout with 4 Tabs
```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color, size }) => (
          <Ionicons name="home" size={size} color={color} />
        )}}
      />
      <Tabs.Screen
        name="cards"
        options={{ title: 'Cards', tabBarIcon: ({ color, size }) => (
          <Ionicons name="albums" size={size} color={color} />
        )}}
      />
      <Tabs.Screen
        name="trades"
        options={{ title: 'Trades', tabBarIcon: ({ color, size }) => (
          <Ionicons name="swap-horizontal" size={size} color={color} />
        )}}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ color, size }) => (
          <Ionicons name="person" size={size} color={color} />
        )}}
      />
    </Tabs>
  );
}
```

## Discretion Recommendations

Based on research, here are recommendations for areas marked as Claude's discretion:

| Area | Recommendation | Rationale |
|------|---------------|-----------|
| Email verification | Verify-later with nudge banner | Standard pattern; doesn't block onboarding. Show a non-dismissible banner until verified. |
| Password reset | Email link with JWT token | More secure than 6-digit code; standard for mobile apps. Deep link opens app reset screen. |
| Auth layout | Separate screens (not tabs) | Login and signup are distinct flows; tabs suggest equal weight which is confusing. |
| Profile view | Full screen (not bottom sheet) | Profile has enough content (avatar, name, code, join date) to warrant full screen. Bottom sheets are better for quick peeks. |
| Theme | Dark theme | Matches Pokemon TCG Pocket's dark aesthetic; card art pops on dark backgrounds; reduces eye strain for gaming audience. |
| Loading states | Skeleton screens for data; spinner for actions | Skeletons feel faster than spinners for content loading. Spinners appropriate for button actions (login, save). |
| Error handling | Inline field errors + top-level toast for network errors | react-hook-form handles field-level; toast for unexpected server errors. |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| React Navigation manual setup | Expo Router v7 file-based routing | SDK 50+ (2024) | No manual navigator configuration; Stack.Protected for auth |
| Metro manual monorepo config | Auto-detected monorepo in Expo SDK 52+ | SDK 52 (Nov 2024) | No custom metro.config.js needed for monorepo |
| serial/SERIAL columns | Identity columns in PostgreSQL | Drizzle 2025 best practices | More standard, configurable identity columns |
| Old Architecture (Bridge) | New Architecture (default) | SDK 53+ (2025) | Legacy Architecture dropped in SDK 55; no opt-out |
| Redux for state | Zustand | 2023-2025 trend | 90% less boilerplate; no providers needed |
| Prisma for Node.js ORM | Drizzle ORM gaining fast | 2024-2025 | Lighter, SQL-closer, better monorepo type sharing |

**Deprecated/outdated:**
- `expo-app-auth`: Deprecated, use `expo-auth-session` (but not needed this phase -- email/password only)
- `AsyncStorage` for tokens: Never use for sensitive data; use `expo-secure-store`
- Legacy Architecture: Dropped entirely in SDK 55

## Open Questions

1. **Email service provider for password reset**
   - What we know: Nodemailer works with any SMTP; Resend is simpler API-based alternative
   - What's unclear: User's preference and budget for email service
   - Recommendation: Start with Resend (free tier: 100 emails/day) for simplicity; switch to Nodemailer + custom SMTP if volume grows

2. **Pokemon-themed preset avatars**
   - What we know: User wants preset Pokemon-themed icons, no photo upload
   - What's unclear: Exact avatar set; licensing considerations for Pokemon imagery
   - Recommendation: Create 12-16 stylized/abstract Pokemon-type-themed icons (fire, water, grass, etc.) to avoid copyright issues. Store as bundled assets with string IDs.

3. **Toast library for iOS**
   - What we know: Android has native ToastAndroid; iOS has no native equivalent
   - What's unclear: Which toast library integrates best with Expo SDK 55
   - Recommendation: Use `react-native-toast-message` or `burnt` (native iOS toasts via Expo). Burnt is lighter and uses native iOS toast style.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (bundled with Expo SDK 55) + Supertest (API) |
| Config file | apps/mobile/jest.config.js, apps/api/jest.config.js (Wave 0) |
| Quick run command | `pnpm --filter mobile test -- --testPathPattern=<pattern> --watchAll=false` |
| Full suite command | `pnpm turbo test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Signup creates user with hashed password | integration (API) | `pnpm --filter api test -- --testPathPattern=auth.signup -x` | No - Wave 0 |
| AUTH-02 | Login returns tokens; tokens validate correctly | integration (API) | `pnpm --filter api test -- --testPathPattern=auth.login -x` | No - Wave 0 |
| AUTH-03 | Logout clears tokens from SecureStore | unit (mobile) | `pnpm --filter mobile test -- --testPathPattern=auth.store -x` | No - Wave 0 |
| AUTH-04 | Reset token generated, emailed, and consumed | integration (API) | `pnpm --filter api test -- --testPathPattern=auth.reset -x` | No - Wave 0 |
| PROF-01 | Update display name and avatar via API | integration (API) | `pnpm --filter api test -- --testPathPattern=users -x` | No - Wave 0 |
| PROF-02 | Friend code validates 16-digit format | unit (shared) | `pnpm --filter shared test -- --testPathPattern=user.schema -x` | No - Wave 0 |
| PROF-03 | GET /users/:id returns profile data | integration (API) | `pnpm --filter api test -- --testPathPattern=users.profile -x` | No - Wave 0 |
| PROF-04 | Friend code copy to clipboard | manual-only | N/A (native clipboard interaction) | N/A |

### Sampling Rate
- **Per task commit:** `pnpm --filter <workspace> test -- --watchAll=false`
- **Per wave merge:** `pnpm turbo test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/api/jest.config.js` -- Jest config for Fastify tests
- [ ] `apps/api/__tests__/setup.ts` -- Test database setup/teardown with Drizzle
- [ ] `apps/mobile/jest.config.js` -- Jest config for Expo (may come from create-expo-app template)
- [ ] `packages/shared/jest.config.js` -- Jest config for schema tests
- [ ] Framework install: `pnpm add -D jest @types/jest ts-jest supertest @types/supertest` in api workspace

## Sources

### Primary (HIGH confidence)
- [Expo Docs - Protected Routes](https://docs.expo.dev/router/advanced/protected/) - Stack.Protected auth pattern
- [Expo Docs - Authentication](https://docs.expo.dev/router/advanced/authentication/) - Auth redirect patterns
- [Expo Docs - Tabs](https://docs.expo.dev/router/advanced/tabs/) - Bottom tab navigation
- [Expo Docs - Monorepos](https://docs.expo.dev/guides/monorepos/) - Turborepo + Expo setup
- [Expo Docs - SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/) - Encrypted token storage
- [Expo SDK 55 Changelog](https://expo.dev/changelog/sdk-55) - Latest SDK version, React Native 0.83
- [Fastify Official](https://fastify.dev/) - v5.8, TypeScript support
- [Drizzle ORM - PostgreSQL](https://orm.drizzle.team/docs/get-started/postgresql-new) - Schema + migrations
- [fastify/fastify-jwt GitHub](https://github.com/fastify/fastify-jwt) - JWT plugin

### Secondary (MEDIUM confidence)
- [Fastify + Drizzle quick start](https://github.com/Looskie/fastify-drizzle-quick-start) - Integration patterns
- [Obytes Expo Starter - Auth](https://starter.obytes.com/guides/authentication/) - Zustand + SecureStore auth pattern
- [Turborepo monorepo 2025 guide](https://medium.com/@beenakumawat002/turborepo-monorepo-in-2025-next-js-react-native-shared-ui-type-safe-api-%EF%B8%8F-6194c83adff9) - Shared packages structure

### Tertiary (LOW confidence)
- Pokemon TCG Pocket friend code format (16 digits, XXXX-XXXX-XXXX-XXXX) -- inferred from user-shared codes on forums; no official API documentation found

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified via official docs and npm; versions confirmed current
- Architecture: HIGH - Expo Router protected routes and Turborepo monorepo patterns are well-documented
- Pitfalls: HIGH - Common issues documented across multiple community sources and official guides
- Friend code format: MEDIUM - Consistent across forum posts (16 digits) but no official developer documentation

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (30 days -- stack is stable)
