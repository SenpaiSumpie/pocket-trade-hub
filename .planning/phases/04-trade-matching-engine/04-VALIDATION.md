---
phase: 4
slug: trade-matching-engine
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-08
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.7 + ts-jest |
| **Config file** | apps/api/package.json (jest config via ts-jest) |
| **Quick run command** | `cd apps/api && npx jest --testPathPattern=match -x` |
| **Full suite command** | `cd apps/api && npx jest` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/api && npx jest --testPathPattern=match -x`
- **After every plan wave:** Run `cd apps/api && npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | MATCH-01 | unit | `cd apps/api && npx jest __tests__/services/match.service.test.ts -x` | No - W0 | pending |
| 04-01-02 | 01 | 1 | MATCH-02 | integration | `cd apps/api && npx jest __tests__/routes/matches.route.test.ts -x` | No - W0 | pending |
| 04-01-03 | 01 | 1 | MATCH-03 | unit | `cd apps/api && npx jest __tests__/services/match.service.test.ts -t "notification" -x` | No - W0 | pending |
| 04-01-04 | 01 | 1 | MATCH-04 | unit | `cd apps/api && npx jest __tests__/services/match.service.test.ts -t "ranking" -x` | No - W0 | pending |
| 04-01-05 | 01 | 1 | MATCH-05 | integration | `cd apps/api && npx jest __tests__/services/match.service.test.ts -t "socket" -x` | No - W0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/__tests__/services/match.service.test.ts` — stubs for MATCH-01, MATCH-03, MATCH-04, MATCH-05
- [ ] `apps/api/__tests__/routes/matches.route.test.ts` — stubs for MATCH-02
- [ ] `apps/api/__tests__/setup.ts` — update to register match routes and add trade_matches to TRUNCATE
- [ ] Redis mock or test Redis instance for BullMQ worker tests
- [ ] Framework install: `cd apps/api && npm install bullmq ioredis socket.io fastify-socket.io`

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Toast banner slides down and auto-dismisses after 5s | MATCH-05 | Visual animation timing | 1. Add/remove a card to trigger match, 2. Observe toast appears, 3. Verify auto-dismiss at 5s |
| Tab badge shows correct unseen count | MATCH-05 | React Native tab bar rendering | 1. Generate new matches, 2. Observe badge count on Trades tab, 3. Open tab and verify badge clears |
| Push notification opens Trades tab | MATCH-03 | Device push notification interaction | 1. Background app, 2. Trigger match, 3. Tap push notification, 4. Verify Trades tab opens |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
