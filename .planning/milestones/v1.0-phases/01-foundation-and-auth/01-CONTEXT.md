# Phase 1: Foundation and Auth - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Project scaffolding (Expo + Fastify + PostgreSQL monorepo), user accounts with email/password authentication, user profiles with display name, avatar, and Pokemon TCG Pocket friend code, and viewing other users' profiles. OAuth, card database, and trading features are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Sign-up & login flow
- Branded & immersive login screen with Pokemon card art/imagery and app branding
- Email/password authentication only (OAuth deferred to v2)

### Profile setup
- Dedicated onboarding screen after sign-up (skippable, can complete later)
- Avatar selection from preset Pokemon-themed icons (no photo upload)
- Friend code field validates against Pokemon TCG Pocket's actual format
- Display names are non-unique (Discord-style — accounts identified internally, names can repeat)

### Profile viewing
- Other user profiles show: avatar, display name, friend code, join date
- Tap friend code to copy to clipboard with brief "Copied!" toast confirmation
- Own profile edited through a dedicated "Edit Profile" screen (not inline editing)

### App shell & navigation
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

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code

### Established Patterns
- Stack decided: Expo (React Native) + Fastify + PostgreSQL + Redis + BullMQ + Socket.IO + RevenueCat
- Monorepo with Turborepo for shared TypeScript types between mobile app and API

### Integration Points
- This phase establishes the foundational project structure that all subsequent phases build on
- Auth system will be consumed by every future feature requiring user identity
- Profile data (friend code) is referenced in trade coordination (Phase 5)
- Tab navigation shell will receive real content in Phases 2-6

</code_context>

<specifics>
## Specific Ideas

- Login screen should feel "branded & immersive" — Pokemon card art background, prominent app branding, not a plain form
- Home screen setup checklist guides new users through profile completion with checkmarks
- "Coming soon" placeholders on Cards/Trades tabs set expectations for what's next

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-and-auth*
*Context gathered: 2026-03-07*
