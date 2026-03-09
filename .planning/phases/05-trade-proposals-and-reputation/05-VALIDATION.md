---
phase: 5
slug: trade-proposals-and-reputation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest with ts-jest |
| **Config file** | `apps/api/jest.config.js` |
| **Quick run command** | `cd apps/api && npx jest --testPathPattern="proposal\|rating\|notification" -x` |
| **Full suite command** | `cd apps/api && npx jest` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/api && npx jest --testPathPattern="proposal|rating|notification" -x`
- **After every plan wave:** Run `cd apps/api && npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | TRADE-01 | unit | `cd apps/api && npx jest --testPathPattern="proposal" -x` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | TRADE-02 | unit | `cd apps/api && npx jest --testPathPattern="proposal" -x` | ❌ W0 | ⬜ pending |
| 05-01-03 | 01 | 1 | TRADE-03 | unit | `cd apps/api && npx jest --testPathPattern="proposal" -x` | ❌ W0 | ⬜ pending |
| 05-01-04 | 01 | 1 | TRADE-04 | unit | `cd apps/api && npx jest --testPathPattern="proposal" -x` | ❌ W0 | ⬜ pending |
| 05-01-05 | 01 | 1 | TRADE-05 | unit | `cd apps/api && npx jest --testPathPattern="proposal" -x` | ❌ W0 | ⬜ pending |
| 05-01-06 | 01 | 1 | TRADE-06 | unit | `cd packages/shared && npx jest --testPathPattern="fairness" -x` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 1 | REP-01 | unit | `cd apps/api && npx jest --testPathPattern="rating" -x` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 1 | REP-02 | unit | `cd apps/api && npx jest --testPathPattern="rating" -x` | ❌ W0 | ⬜ pending |
| 05-03-01 | 03 | 1 | NOTIF-01 | unit | `cd apps/api && npx jest --testPathPattern="notification" -x` | ❌ W0 | ⬜ pending |
| 05-03-02 | 03 | 1 | NOTIF-02 | unit | `cd apps/api && npx jest --testPathPattern="notification" -x` | ❌ W0 | ⬜ pending |
| 05-03-03 | 03 | 1 | NOTIF-03 | unit | `cd apps/api && npx jest --testPathPattern="notification" -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/__tests__/proposal.service.test.ts` — stubs for TRADE-01 through TRADE-05
- [ ] `apps/api/__tests__/rating.service.test.ts` — stubs for REP-01, REP-02
- [ ] `apps/api/__tests__/notification.service.test.ts` — stubs for NOTIF-01 through NOTIF-03
- [ ] `packages/shared/src/__tests__/fairness.test.ts` — stubs for TRADE-06

*Existing infrastructure covers test framework — only stub files needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Push notification delivery | NOTIF-01, NOTIF-02 | Requires physical device + Expo push service | 1. Create proposal on device A 2. Verify push appears on device B |
| Fairness meter animation | TRADE-06 | Visual/animation quality | 1. Open proposal editor 2. Add/remove cards 3. Verify meter updates smoothly |
| Deep link navigation | NOTIF-03 | Requires full app navigation context | 1. Tap notification in inbox 2. Verify navigates to correct proposal/match |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
