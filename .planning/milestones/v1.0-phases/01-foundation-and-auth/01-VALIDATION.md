---
phase: 1
slug: foundation-and-auth
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-07
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (bundled with Expo SDK 55) + Supertest (API integration) |
| **Config file** | apps/mobile/jest.config.js, apps/api/jest.config.js, packages/shared/jest.config.js (Wave 0 installs) |
| **Quick run command** | `pnpm --filter <workspace> test -- --watchAll=false` |
| **Full suite command** | `pnpm turbo test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter <workspace> test -- --watchAll=false`
- **After every plan wave:** Run `pnpm turbo test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | AUTH-01 | integration | `pnpm --filter api test -- --testPathPattern=auth.signup --watchAll=false` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | AUTH-02 | integration | `pnpm --filter api test -- --testPathPattern=auth.login --watchAll=false` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | AUTH-03 | unit | `pnpm --filter mobile test -- --testPathPattern=auth.store --watchAll=false` | ❌ W0 | ⬜ pending |
| 01-01-04 | 01 | 1 | AUTH-04 | integration | `pnpm --filter api test -- --testPathPattern=auth.reset --watchAll=false` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | PROF-01 | integration | `pnpm --filter api test -- --testPathPattern=users --watchAll=false` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | PROF-02 | unit | `pnpm --filter shared test -- --testPathPattern=user.schema --watchAll=false` | ❌ W0 | ⬜ pending |
| 01-02-03 | 02 | 1 | PROF-03 | integration | `pnpm --filter api test -- --testPathPattern=users.profile --watchAll=false` | ❌ W0 | ⬜ pending |
| 01-02-04 | 02 | 1 | PROF-04 | manual-only | N/A (native clipboard) | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/jest.config.js` — Jest config for Fastify integration tests
- [ ] `apps/api/__tests__/setup.ts` — Test database setup/teardown with Drizzle
- [ ] `apps/mobile/jest.config.js` — Jest config for Expo (may come from create-expo-app template)
- [ ] `packages/shared/jest.config.js` — Jest config for shared schema unit tests
- [ ] Install test deps: `pnpm add -D jest @types/jest ts-jest supertest @types/supertest` in api workspace

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Friend code copy to clipboard | PROF-04 | Native clipboard interaction cannot be tested in Jest | 1. Navigate to another user's profile. 2. Tap the friend code. 3. Verify "Copied!" toast appears. 4. Paste elsewhere to confirm clipboard content. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
