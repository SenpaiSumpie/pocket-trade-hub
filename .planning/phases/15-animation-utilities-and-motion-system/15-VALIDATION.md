---
phase: 15
slug: animation-utilities-and-motion-system
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (React Native / Expo) |
| **Config file** | `apps/mobile/jest.config.js` |
| **Quick run command** | `cd apps/mobile && npx jest --passWithNoTests` |
| **Full suite command** | `cd apps/mobile && npx jest --passWithNoTests` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/mobile && npx jest --passWithNoTests`
- **After every plan wave:** Run `cd apps/mobile && npx jest --passWithNoTests`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 15-01-01 | 01 | 1 | MOT-01 | unit | `npx jest useAnimatedPress` | ❌ W0 | ⬜ pending |
| 15-01-02 | 01 | 1 | MOT-01 | unit | `npx jest useStaggeredList` | ❌ W0 | ⬜ pending |
| 15-02-01 | 02 | 1 | MOT-02 | unit | `npx jest AnimatedCounter` | ❌ W0 | ⬜ pending |
| 15-03-01 | 03 | 1 | MOT-03 | unit | `npx jest useCardFlip` | ❌ W0 | ⬜ pending |
| 15-04-01 | 04 | 2 | MOT-04 | manual | visual inspection | N/A | ⬜ pending |
| 15-05-01 | 05 | 1 | MOT-05 | unit | `npx jest Shimmer` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/mobile/src/hooks/__tests__/` — test directory for animation hooks
- [ ] `apps/mobile/src/components/animation/__tests__/` — test directory for animation components
- [ ] Jest configured with Reanimated mock (`jest-setup.js` includes `react-native-reanimated/mock`)

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Bottom sheet drag-to-dismiss | MOT-04 | Gesture interaction requires device | Open any detail modal → drag down past threshold → verify dismiss |
| Shimmer animation visual | MOT-05 | Visual sweep timing needs human eye | Navigate to loading state → verify gradient sweeps left-to-right |
| Card flip 3D perspective | MOT-03 | 3D transform rendering is visual | Open card detail → trigger flip → verify smooth Y-axis rotation |
| Spring overshoot feel | MOT-03 | Spring "feel" is subjective | Navigate to card grid → verify subtle overshoot on card appear |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
