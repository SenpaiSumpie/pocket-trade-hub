---
phase: 14
slug: navigation-shell-and-app-chrome
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (via expo preset) |
| **Config file** | `apps/mobile/jest.config.js` |
| **Quick run command** | `cd apps/mobile && npx jest --passWithNoTests` |
| **Full suite command** | `cd apps/mobile && npx jest --passWithNoTests` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/mobile && npx jest --passWithNoTests`
- **After every plan wave:** Run `cd apps/mobile && npx jest --passWithNoTests`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 1 | NAV-04 | grep | `grep -r "phosphor-react-native" apps/mobile/package.json` | ❌ W0 | ⬜ pending |
| 14-01-02 | 01 | 1 | NAV-03 | grep | `grep -r "Inter" apps/mobile/app.json` | ❌ W0 | ⬜ pending |
| 14-02-01 | 02 | 1 | NAV-01 | grep | `grep -r "tabBar" apps/mobile/app/\(tabs\)/_layout.tsx` | ❌ W0 | ⬜ pending |
| 14-02-02 | 02 | 1 | NAV-05 | grep | `grep -r "expo-haptics\|Haptics" apps/mobile/app/\(tabs\)/_layout.tsx` | ❌ W0 | ⬜ pending |
| 14-03-01 | 03 | 1 | NAV-02 | grep | `grep -r "useAnimatedScrollHandler\|collaps" apps/mobile/src/components/` | ❌ W0 | ⬜ pending |
| 14-04-01 | 04 | 2 | NAV-04 | grep | `grep -rL "phosphor-react-native" apps/mobile/src/ \| head -5` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `phosphor-react-native` — install icon package
- [ ] `@expo-google-fonts/inter` or raw Inter .ttf files — font assets
- [ ] Existing test infrastructure covers framework needs

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Tab bar sliding pill animation | NAV-01 | Visual animation quality | Switch tabs, observe smooth pill slide |
| Icon morphing on selection | NAV-01 | Visual transition | Tap each tab, verify outline→fill morph |
| Collapsible header smooth scroll | NAV-02 | Scroll interaction UX | Scroll down on Cards/Market, verify header collapses; scroll up, verify re-expand |
| Inter font rendering | NAV-03 | Visual typography | Check all screens render Inter (no system font flash) |
| Haptic feedback on tab switch | NAV-05 | Hardware interaction | Switch tabs on physical device, feel haptic response |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
