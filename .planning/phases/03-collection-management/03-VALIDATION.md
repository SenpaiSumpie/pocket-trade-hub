---
phase: 3
slug: collection-management
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-08
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest with ts-jest preset |
| **Config file** | `apps/api/jest.config.js` |
| **Quick run command** | `cd apps/api && npx jest --testPathPattern="collection\|wanted" --no-coverage` |
| **Full suite command** | `cd apps/api && npx jest --no-coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/api && npx jest --testPathPattern="collection\|wanted" --no-coverage`
- **After every plan wave:** Run `cd apps/api && npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 0 | INV-01 | integration | `cd apps/api && npx jest --testPathPattern="collection.route" -t "add card" --no-coverage` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 0 | INV-02 | integration | `cd apps/api && npx jest --testPathPattern="collection.route" -t "remove card" --no-coverage` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 0 | INV-03 | integration | `cd apps/api && npx jest --testPathPattern="collection.route" -t "update quantity" --no-coverage` | ❌ W0 | ⬜ pending |
| 03-01-04 | 01 | 0 | INV-04 | integration | `cd apps/api && npx jest --testPathPattern="collection.route" -t "bulk" --no-coverage` | ❌ W0 | ⬜ pending |
| 03-01-05 | 01 | 0 | INV-05 | integration | `cd apps/api && npx jest --testPathPattern="collection.route" -t "progress" --no-coverage` | ❌ W0 | ⬜ pending |
| 03-01-06 | 01 | 0 | WANT-01 | integration | `cd apps/api && npx jest --testPathPattern="wanted.route" -t "add card" --no-coverage` | ❌ W0 | ⬜ pending |
| 03-01-07 | 01 | 0 | WANT-02 | integration | `cd apps/api && npx jest --testPathPattern="wanted.route" -t "remove card" --no-coverage` | ❌ W0 | ⬜ pending |
| 03-01-08 | 01 | 0 | WANT-03 | integration | `cd apps/api && npx jest --testPathPattern="wanted.route" -t "priority" --no-coverage` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/__tests__/routes/collection.route.test.ts` — stubs for INV-01 through INV-05
- [ ] `apps/api/__tests__/routes/wanted.route.test.ts` — stubs for WANT-01 through WANT-03
- [ ] `apps/api/__tests__/services/collection.service.test.ts` — unit tests for progress calculation, bulk operations
- [ ] `apps/api/__tests__/setup.ts` — update TRUNCATE to include new tables
- [ ] `packages/shared/src/__tests__/collection.schema.test.ts` — Zod schema validation tests

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Bulk-add checklist UI interaction | INV-04 | Visual component with haptic feedback | 1. Open set detail 2. Tap "Checklist" 3. Check multiple cards 4. Tap "Add All" 5. Verify toast + haptic |
| Collection progress bar rendering | INV-05 | Visual rendering verification | 1. Open Collection tab 2. Verify progress bars show correct % 3. Check empty/partial/full states |
| Priority badge colors on wanted list | WANT-03 | Visual styling verification | 1. Add cards with different priorities 2. Verify high=red, medium=yellow, low=green badges |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
