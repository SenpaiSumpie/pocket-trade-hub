---
phase: 19
slug: premium-touches-and-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 19 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (React Native) |
| **Config file** | `apps/mobile/jest.config.js` |
| **Quick run command** | `cd apps/mobile && npx jest --passWithNoTests --bail` |
| **Full suite command** | `cd apps/mobile && npx jest --passWithNoTests` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/mobile && npx jest --passWithNoTests --bail`
- **After every plan wave:** Run `cd apps/mobile && npx jest --passWithNoTests`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 19-01-01 | 01 | 1 | POL-04 | unit | `npx jest useHaptics` | ❌ W0 | ⬜ pending |
| 19-01-02 | 01 | 1 | POL-04 | grep | `grep -r "useHaptics" apps/mobile/src` | ❌ W0 | ⬜ pending |
| 19-02-01 | 02 | 1 | POL-01 | unit | `npx jest SplashOverlay` | ❌ W0 | ⬜ pending |
| 19-02-02 | 02 | 1 | POL-05 | grep | `grep "useReducedMotion" apps/mobile/src/components/SplashOverlay.tsx` | ❌ W0 | ⬜ pending |
| 19-03-01 | 03 | 1 | POL-02 | unit | `npx jest useLayoutMode` | ❌ W0 | ⬜ pending |
| 19-03-02 | 03 | 1 | POL-02 | grep | `grep "layoutMode" apps/mobile/src/components/cards/CardGrid.tsx` | ❌ W0 | ⬜ pending |
| 19-04-01 | 04 | 2 | POL-03 | grep | `grep "useAnimatedScrollHandler" apps/mobile/src/components/cards/CardDetailScreen.tsx` | ❌ W0 | ⬜ pending |
| 19-04-02 | 04 | 2 | POL-05 | grep | `grep "useReducedMotion" apps/mobile/src/components/cards/CardDetailScreen.tsx` | ❌ W0 | ⬜ pending |
| 19-05-01 | 05 | 2 | POL-05 | grep | `grep -c "useReducedMotion" apps/mobile/src/hooks/*.ts apps/mobile/src/components/**/*.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/mobile/src/hooks/__tests__/useHaptics.test.ts` — unit tests for centralized haptic hook
- [ ] `apps/mobile/src/components/__tests__/SplashOverlay.test.tsx` — splash overlay mount/unmount tests
- [ ] `apps/mobile/src/hooks/__tests__/useLayoutMode.test.ts` — layout mode persistence tests

*Existing jest infrastructure covers framework needs — no new test framework install required.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Splash animation plays on launch | POL-01 | Visual animation timing requires device | Cold-start app, verify logo fade/scale + shimmer + app name sequence |
| Parallax scroll effect on card detail | POL-03 | Scroll-linked visual effect | Open card detail, scroll up, verify image translates at ~50% scroll speed |
| Haptic feedback feels distinct | POL-04 | Physical haptic sensation | Navigate tabs (light), add card (medium), trigger error (heavy), delete (notification) |
| Layout mode toggle cycles correctly | POL-02 | Visual layout verification | Tap toggle on Cards tab, verify grid→compact→list transitions |
| Reduced-motion disables all animations | POL-05 | Requires iOS accessibility setting | Enable reduce-motion in Settings, verify instant transitions everywhere |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
