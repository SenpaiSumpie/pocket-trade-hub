---
phase: 18-web-companion-sync
plan: 04
subsystem: ui
tags: [meta, tierlists, auth, sidebar, token-colors, color-audit]
---

## One-liner
Refreshed Meta, Tier Lists, Auth pages, and Sidebar with token-based styling; completed full hardcoded color audit with zero remaining non-token classes.

## Self-Check: PASSED

## What was built
- Meta page: skeleton loading, EmptyState "No meta data available", Card wrapper for snapshot
- Tier Lists page: skeleton loading, EmptyState "No tier lists yet" with "Create Tier List" CTA
- All tier colors in DeckRankings, TierListBrowser, TierListCreator, TierListDetailModal replaced with --color-tier-* tokens
- Sidebar notification badge: bg-red-500 → var(--color-error), motion duration token on nav links
- Login/Signup pages: heading typography tokens
- LoginForm, SignupForm, GoogleSignIn: all text-red-400 and bg-red-900/30 replaced with token vars
- Final audit: zero hardcoded Tailwind color classes (red, green, blue, gray, zinc) remain in apps/web/src/

## Key files

### Modified
- `apps/web/src/app/(app)/meta/page.tsx` — skeleton + empty state + Card wrapper
- `apps/web/src/app/(app)/tierlists/page.tsx` — skeleton + empty state
- `apps/web/src/components/meta/DeckRankings.tsx` — success/error tokens
- `apps/web/src/components/meta/TierListBrowser.tsx` — tier color tokens
- `apps/web/src/components/meta/TierListCreator.tsx` — tier color + error tokens
- `apps/web/src/components/meta/TierListDetailModal.tsx` — tier color + error tokens
- `apps/web/src/components/layout/Sidebar.tsx` — error token + motion duration
- `apps/web/src/app/(auth)/login/page.tsx` — typography token
- `apps/web/src/app/(auth)/signup/page.tsx` — typography token
- `apps/web/src/components/auth/LoginForm.tsx` — error tokens
- `apps/web/src/components/auth/SignupForm.tsx` — error tokens
- `apps/web/src/components/auth/GoogleSignIn.tsx` — error tokens

## Deviations
- DeckDetailModal.tsx already had no hardcoded color references — no changes needed
