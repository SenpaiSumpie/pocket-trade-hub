---
phase: 6
slug: premium-tier
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.7 + ts-jest |
| **Config file** | `apps/api/jest.config.js` |
| **Quick run command** | `cd apps/api && npx jest --testPathPattern="<pattern>" --no-coverage` |
| **Full suite command** | `cd apps/api && npx jest --no-coverage` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/api && npx jest --testPathPattern="<relevant_test>" --no-coverage`
- **After every plan wave:** Run `cd apps/api && npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | PREM-01 | unit | `cd apps/api && npx jest --testPathPattern="premium.service" --no-coverage` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | PREM-01 | unit | `cd apps/api && npx jest --testPathPattern="premium" --no-coverage` | ❌ W0 | ⬜ pending |
| 06-01-03 | 01 | 1 | PREM-02 | unit | `cd apps/api && npx jest --testPathPattern="analytics.service" --no-coverage` | ❌ W0 | ⬜ pending |
| 06-01-04 | 01 | 1 | PREM-02 | integration | `cd apps/api && npx jest --testPathPattern="premium" --no-coverage` | ❌ W0 | ⬜ pending |
| 06-01-05 | 01 | 1 | PREM-03 | unit | `cd apps/api && npx jest --testPathPattern="match.service" --no-coverage` | ✅ partial | ⬜ pending |
| 06-01-06 | 01 | 1 | PREM-04 | unit | `cd apps/api && npx jest --testPathPattern="card-alert" --no-coverage` | ❌ W0 | ⬜ pending |
| 06-01-07 | 01 | 1 | PREM-04 | unit | `cd apps/api && npx jest --testPathPattern="card-alert" --no-coverage` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/__tests__/services/premium.service.test.ts` — stubs for PREM-01 (webhook handling, status sync)
- [ ] `apps/api/__tests__/services/analytics.service.test.ts` — stubs for PREM-02 (aggregation queries)
- [ ] `apps/api/__tests__/routes/premium.route.test.ts` — stubs for PREM-01, PREM-02 (API endpoints, auth gating)
- [ ] `apps/api/__tests__/services/card-alert.service.test.ts` — stubs for PREM-04 (alert creation, batching)
- [ ] Extend existing `match.service.test.ts` — stubs for PREM-03 (premium boost)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| IAP purchase flow on iOS | PREM-01 | Requires physical device + sandbox Apple ID | 1. Open app on iOS device 2. Navigate to Premium screen 3. Tap Subscribe 4. Complete StoreKit sandbox purchase 5. Verify premium badge appears |
| IAP purchase flow on Android | PREM-01 | Requires physical device + Google Play test account | 1. Open app on Android device 2. Navigate to Premium screen 3. Tap Subscribe 4. Complete Google Play test purchase 5. Verify premium badge appears |
| RevenueCat dashboard sync | PREM-01 | Requires RevenueCat account | Verify subscription event appears in RevenueCat dashboard after test purchase |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
