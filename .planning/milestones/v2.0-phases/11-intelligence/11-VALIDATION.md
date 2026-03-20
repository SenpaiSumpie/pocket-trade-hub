---
phase: 11
slug: intelligence
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.7 with ts-jest |
| **Config file** | `apps/api/jest.config.js` |
| **Quick run command** | `cd apps/api && npx jest --testPathPattern="PATTERN" --no-coverage` |
| **Full suite command** | `cd apps/api && npx jest --no-coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/api && npx jest --testPathPattern="RELEVANT_PATTERN" --no-coverage`
- **After every plan wave:** Run `cd apps/api && npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | INTL-01 | unit | `cd apps/api && npx jest --testPathPattern="suggest" --no-coverage` | ❌ W0 | ⬜ pending |
| 11-01-02 | 01 | 1 | TRAD-07 | integration | `cd apps/api && npx jest --testPathPattern="suggest" --no-coverage` | ❌ W0 | ⬜ pending |
| 11-02-01 | 02 | 1 | INTL-02 | unit | `cd apps/api && npx jest --testPathPattern="meta-scraper" --no-coverage` | ❌ W0 | ⬜ pending |
| 11-02-02 | 02 | 1 | INTL-02 | integration | `cd apps/api && npx jest --testPathPattern="meta" --no-coverage` | ❌ W0 | ⬜ pending |
| 11-03-01 | 03 | 2 | INTL-03 | unit | `cd apps/api && npx jest --testPathPattern="tierlist" --no-coverage` | ❌ W0 | ⬜ pending |
| 11-03-02 | 03 | 2 | INTL-04 | integration | `cd apps/api && npx jest --testPathPattern="tierlist" --no-coverage` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/__tests__/suggest.service.test.ts` — stubs for INTL-01, TRAD-07
- [ ] `apps/api/__tests__/meta-scraper.service.test.ts` — stubs for INTL-02 (scraper parsing)
- [ ] `apps/api/__tests__/routes/meta.route.test.ts` — stubs for INTL-02 (route + premium gating)
- [ ] `apps/api/__tests__/routes/tierlist.route.test.ts` — stubs for INTL-03, INTL-04
- [ ] `apps/api/__tests__/tierlist.service.test.ts` — stubs for INTL-03 (official generation), INTL-04 (CRUD + voting)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Drag-and-drop tier list creation UI | INTL-04 | Gesture interaction requires device | 1. Open Meta tab → Tier Lists → Create 2. Drag deck cards into S/A/B/C/D tiers 3. Verify items reorder correctly |
| Smart Trades horizontal scroll on Home | INTL-01 | Visual layout + scroll behavior | 1. Open Home tab as premium user 2. Verify "Smart Trades" section renders 3. Swipe horizontally through suggestion cards |
| 6th tab bar rendering on small screens | INTL-02 | Device-specific layout | 1. Test on iPhone SE (320pt width) 2. Verify "Meta" tab label is readable 3. No overlap with adjacent tabs |
| Free user blurred preview with CTA | INTL-01 | Visual blur effect verification | 1. Log in as free user 2. Navigate to Home → Smart Trades 3. Verify cards show blurred with upgrade CTA |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
