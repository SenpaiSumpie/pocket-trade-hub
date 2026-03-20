---
phase: 12
slug: web-app-companion
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (lighter for Next.js, modern ESM support) |
| **Config file** | `apps/web/vitest.config.ts` — Wave 0 installs |
| **Quick run command** | `cd apps/web && pnpm test` |
| **Full suite command** | `pnpm test` (all workspaces) |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/web && pnpm test`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | PLAT-01 | unit | `cd apps/web && pnpm test -- --testPathPattern middleware` | ❌ W0 | ⬜ pending |
| 12-01-02 | 01 | 1 | PLAT-01 | unit | `cd apps/api && pnpm test -- --testPathPattern auth` | ✅ (needs update) | ⬜ pending |
| 12-01-03 | 01 | 1 | PLAT-01 | integration | `cd apps/api && pnpm test -- --testPathPattern cors` | ❌ W0 | ⬜ pending |
| 12-02-01 | 02 | 2 | PLAT-02 | unit | `cd apps/web && pnpm test -- --testPathPattern stores` | ❌ W0 | ⬜ pending |
| 12-02-02 | 02 | 2 | PLAT-02 | unit | `cd apps/web && pnpm test -- --testPathPattern api` | ❌ W0 | ⬜ pending |
| 12-02-03 | 02 | 2 | PLAT-02 | integration | `cd apps/api && pnpm test -- --testPathPattern auth.cookie` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/web/package.json` — project scaffold with test script
- [ ] `apps/web/vitest.config.ts` — test framework config
- [ ] `apps/web/__tests__/middleware.test.ts` — auth middleware unit test stubs
- [ ] `apps/web/__tests__/lib/api.test.ts` — apiFetch wrapper test stubs
- [ ] `apps/api/src/__tests__/auth-cookie.test.ts` — cookie-based auth integration test stubs
- [ ] `@fastify/cookie` dependency in apps/api

*Existing API test infrastructure covers auth plugin; needs cookie extension.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Web app loads in browser, shows cards/posts/collection | PLAT-01 | Full browser rendering + visual check | 1. Start dev server 2. Navigate to localhost:3000 3. Login 4. Verify cards, posts, collection visible |
| Real-time notifications via Socket.IO | PLAT-02 | WebSocket connection in browser context | 1. Open web app 2. Create trade post from mobile 3. Verify notification appears in web |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
