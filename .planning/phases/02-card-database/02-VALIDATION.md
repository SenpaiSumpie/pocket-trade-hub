---
phase: 2
slug: card-database
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-07
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.7 + ts-jest |
| **Config file** | `apps/api/jest.config.js` |
| **Quick run command** | `cd apps/api && pnpm test -- --testPathPattern=cards` |
| **Full suite command** | `cd apps/api && pnpm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/api && pnpm test -- --testPathPattern={relevant} -x`
- **After every plan wave:** Run `cd apps/api && pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 1 | CARD-01 | integration | `cd apps/api && pnpm test -- --testPathPattern=seed` | ❌ W0 | ⬜ pending |
| 2-01-02 | 01 | 1 | CARD-02 | unit | `cd apps/api && pnpm test -- --testPathPattern=card.service` | ❌ W0 | ⬜ pending |
| 2-01-03 | 01 | 1 | CARD-03 | integration | `cd apps/api && pnpm test -- --testPathPattern=cards.route` | ❌ W0 | ⬜ pending |
| 2-02-01 | 02 | 1 | CARD-04 | integration | `cd apps/api && pnpm test -- --testPathPattern=admin` | ❌ W0 | ⬜ pending |
| 2-02-02 | 02 | 1 | CARD-05 | unit | `cd apps/api && pnpm test -- --testPathPattern=notification` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/__tests__/services/card.service.test.ts` — stubs for CARD-01, CARD-02
- [ ] `apps/api/__tests__/routes/cards.route.test.ts` — stubs for CARD-03
- [ ] `apps/api/__tests__/routes/admin.route.test.ts` — stubs for CARD-04
- [ ] `apps/api/__tests__/services/notification.service.test.ts` — stubs for CARD-05
- [ ] Test database setup/teardown helpers (if not existing)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Card image grid renders 3 per row | CARD-01 | Visual layout | Open card browser, verify 3-column grid on device |
| Set picker horizontal scroll | CARD-01 | Touch interaction | Swipe set picker, verify smooth scroll and set switching |
| Search results update as typing | CARD-02 | UI responsiveness | Type in search bar, verify instant filtering |
| Push notification received | CARD-05 | Device notification | Import set via admin, verify notification on test device |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
