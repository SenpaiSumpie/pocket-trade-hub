---
phase: 17
slug: screen-migration-tier-2
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — no automated test framework in mobile app |
| **Config file** | None |
| **Quick run command** | Manual visual inspection on device/simulator |
| **Full suite command** | Manual visual inspection on device/simulator |
| **Estimated runtime** | ~5 minutes per tab (manual) |

---

## Sampling Rate

- **After every task commit:** Visual check on affected screen(s) via simulator
- **After every plan wave:** Full visual walkthrough of all 3 tabs (Market, Meta, Profile)
- **Before `/gsd:verify-work`:** All 3 tabs visually verified on simulator
- **Max feedback latency:** ~300 seconds (manual visual)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 17-01-xx | 01 | 1 | SCR-04 | manual-visual | n/a | n/a | ⬜ pending |
| 17-02-xx | 02 | 1 | SCR-05 | manual-visual | n/a | n/a | ⬜ pending |
| 17-03-xx | 03 | 1 | SCR-06 | manual-visual | n/a | n/a | ⬜ pending |
| 17-04-xx | 04 | 2 | SCR-04,SCR-05,SCR-06 | manual-visual | n/a | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No automated test framework to install — validation is manual visual inspection.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Market tab gold gradient accents on premium posts | SCR-04 | Visual styling — no automated test for gradient rendering | Open Market tab, verify gold left-border on premium PostCards, Badge premium variant on boost indicator |
| Meta tab deck cards and tier list visual refresh | SCR-05 | Visual styling — component primitive adoption is visual | Open Meta tab, verify Card primitives on rankings, Badge tier pills (S=gold, A=purple, B=blue, C=green, D=gray), sort toggles as Button primitives |
| Profile glassmorphism header and settings primitives | SCR-06 | Visual styling — blur effect and glassmorphism visual only | Open Profile tab, verify blurred backdrop behind avatar, gold overlay, Card primitives on info sections, Button variants on actions |
| Unified visual language across all 6 tabs | SCR-04,SCR-05,SCR-06 | Cross-screen visual consistency — subjective assessment | Navigate all 6 tabs in sequence, verify no tab looks visually inconsistent with the others |
| Gold pull-to-refresh on all 3 tabs | SCR-04,SCR-05,SCR-06 | Interactive gesture — requires device interaction | Pull to refresh on Market, Meta, Profile — verify gold tint on refresh indicator |
| Skeleton loading states | SCR-04,SCR-05,SCR-06 | Visual animation — requires observing load transition | Force reload each tab, verify shimmer skeletons appear before content |
| Staggered entrance animations | SCR-04,SCR-05,SCR-06 | Visual animation timing | Navigate away from and back to each tab, verify staggered fade-in on list items |

---

## Validation Sign-Off

- [ ] All tasks have manual-visual verification instructions
- [ ] Sampling continuity: visual check after every task commit
- [ ] Wave 0 covers all MISSING references — N/A (no automated tests)
- [ ] No watch-mode flags
- [ ] Feedback latency < 300s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
