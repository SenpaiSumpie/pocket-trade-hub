---
phase: 9
slug: engagement-quick-wins
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 + ts-jest |
| **Config file** | `apps/api/jest.config.js` |
| **Quick run command** | `cd apps/api && npx jest --testPathPattern="promo\|pull-rates" -x` |
| **Full suite command** | `cd apps/api && npx jest` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/api && npx jest --testPathPattern="promo|pull-rates" -x`
- **After every plan wave:** Run `cd apps/api && npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | INTL-05 | unit | `cd apps/api && npx jest --testPathPattern="pull-rates" -x` | ❌ W0 | ⬜ pending |
| 09-01-02 | 01 | 1 | INTL-05 | unit | `cd apps/api && npx jest --testPathPattern="pull-rates" -x` | ❌ W0 | ⬜ pending |
| 09-02-01 | 02 | 1 | DISC-03 | manual-only | Manual: verify images render correctly on device | N/A | ⬜ pending |
| 09-02-02 | 02 | 1 | DISC-03 | manual-only | Manual: visual check watermark on device | N/A | ⬜ pending |
| 09-03-01 | 03 | 1 | DISC-04 | unit | `cd apps/api && npx jest --testPathPattern="promo" -x` | ❌ W0 | ⬜ pending |
| 09-03-02 | 03 | 1 | DISC-04 | unit | `cd apps/api && npx jest --testPathPattern="promo" -x` | ❌ W0 | ⬜ pending |
| 09-03-03 | 03 | 1 | DISC-04 | unit | `cd apps/api && npx jest --testPathPattern="promo" -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/shared/src/__tests__/pull-rates.test.ts` — stubs for INTL-05 math
- [ ] `apps/api/__tests__/services/promo.service.test.ts` — stubs for DISC-04 backend
- [ ] `apps/api/__tests__/routes/promo.route.test.ts` — stubs for DISC-04 API routes

*Existing infrastructure covers framework install — Jest already configured.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Image export renders correctly | DISC-03 | View capture requires device rendering | 1. Open collection screen 2. Tap share/export 3. Verify image contains cards with correct layout |
| Watermark on free user exports | DISC-03 | Visual verification needed | 1. Log in as free user 2. Export image 3. Verify watermark is present and positioned correctly |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
