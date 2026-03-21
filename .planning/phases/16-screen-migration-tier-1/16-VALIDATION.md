---
phase: 16
slug: screen-migration-tier-1
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — no test framework exists in this repository |
| **Config file** | None |
| **Quick run command** | `npx tsc --noEmit` (type-check only) |
| **Full suite command** | `npx tsc --noEmit && npx expo export --platform web --dev` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx tsc --noEmit && npx expo export --platform web --dev`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 16-01-01 | 01 | 1 | CL-01 | type-check | `npx tsc --noEmit` | N/A | ⬜ pending |
| 16-01-02 | 01 | 1 | CL-01 | type-check | `npx tsc --noEmit` | N/A | ⬜ pending |
| 16-01-03 | 01 | 1 | CL-01 | type-check | `npx tsc --noEmit` | N/A | ⬜ pending |
| 16-02-01 | 02 | 1 | CL-02 | type-check | `npx tsc --noEmit` | N/A | ⬜ pending |
| 16-02-02 | 02 | 1 | CL-03 | type-check | `npx tsc --noEmit` | N/A | ⬜ pending |
| 16-02-03 | 02 | 1 | CL-04 | type-check | `npx tsc --noEmit` | N/A | ⬜ pending |
| 16-03-01 | 03 | 2 | SCR-01 | type-check | `npx tsc --noEmit` | N/A | ⬜ pending |
| 16-03-02 | 03 | 2 | SCR-02 | type-check | `npx tsc --noEmit` | N/A | ⬜ pending |
| 16-03-03 | 03 | 2 | SCR-03 | type-check | `npx tsc --noEmit` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. No test framework to install — this is a UI-only phase validated via type-checking and manual smoke tests.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Button/Card/Text/Badge/Input/Divider render with correct token values | CL-01 | Visual styling — no snapshot testing framework | Open each primitive in simulator, verify against design tokens |
| Skeleton shows while loading, disappears when data loads | CL-02 | Requires network delay simulation | Toggle airplane mode or throttle network, observe skeleton → content transition |
| Empty state with CTA appears when list is empty | CL-03 | Requires empty data state | Clear user data or use fresh account, verify each list shows empty state |
| Toast appears bottom-of-screen, auto-dismisses, all 4 variants | CL-04 | Animation timing + visual styling | Trigger each toast variant, verify position above tab bar, 3s auto-dismiss |
| Scale-down animation + haptic on press | CL-05 | Haptic feedback requires physical device | Tap all interactive elements on physical device, verify scale animation + vibration |
| Gold tint pull-to-refresh | CL-06 | Platform-specific spinner styling | Pull-to-refresh on iOS (tintColor gold ring) and Android (gold progress indicator) |
| Home tab staggered entrance, no layout regressions | SCR-01 | Visual layout + animation timing | Navigate to Home, verify staggered fade-in, compare with previous layout |
| Cards tab rarity effects (shimmer for stars, glow for crowns) | SCR-02 | Visual effects — SVG shimmer overlay + border glow | Filter cards by rarity, verify star cards have moving shimmer, crown cards have pulsing glow |
| Trades tab animated press, skeleton, empty state | SCR-03 | Combined visual + interaction testing | Navigate Trades with data (verify animated press) and without data (verify empty state) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
