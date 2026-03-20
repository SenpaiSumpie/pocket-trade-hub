---
phase: 10
slug: internationalization
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-17
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.7 with ts-jest |
| **Config file** | apps/api/jest.config.js |
| **Quick run command** | `cd apps/api && pnpm test -- --testPathPattern="i18n\|users" --no-coverage -x` |
| **Full suite command** | `cd apps/api && pnpm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/api && pnpm test -- --testPathPattern="i18n|users" --no-coverage -x`
- **After every plan wave:** Run `cd apps/api && pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | PLAT-03, PLAT-04 | unit | `cd apps/api && pnpm test -- --testPathPattern="i18n\|users.profile" -x` | Created in task (Wave 0) | pending |
| 10-01-02 | 01 | 1 | PLAT-03 | unit+json | `cd apps/mobile && node -e "..."` (en.json validation) | Created in task | pending |
| 10-02-01 | 02 | 2 | PLAT-03 | tsc | `cd apps/mobile && npx tsc --noEmit` | N/A | pending |
| 10-02-02 | 02 | 2 | PLAT-04 | tsc | `cd apps/mobile && npx tsc --noEmit` | N/A | pending |
| 10-03-01 | 03 | 2 | PLAT-03 | json | Key structure match validation | N/A | pending |
| 10-03-02 | 03 | 2 | PLAT-03 | unit | `cd apps/api && pnpm test -- --no-coverage -x` | Existing + Wave 0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [x] `apps/api/__tests__/services/i18n.test.ts` — Created in Plan 01 Task 1: tests for server-side i18n t() function (PLAT-03)
- [x] `apps/api/__tests__/routes/users.profile.test.ts` — uiLanguage test cases added in Plan 01 Task 1 (PLAT-04)
- [ ] No mobile test infrastructure needed — UI translations verified manually + tsc

*Wave 0 tests are created as part of Plan 01 Task 1 (combined with implementation to avoid a separate Wave 0 plan).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| All UI text displays in selected language | PLAT-03 | Visual verification of translated strings across all screens | Switch to each of 10 languages, navigate all tabs, verify no English text leaks |
| Language selector shows native names | PLAT-04 | UI component visual check | Open Profile > Language, verify list shows "Deutsch (DE)", "日本語 (JA)", etc. |
| Language change applies instantly | PLAT-04 | Hot-swap reactivity check | Change language in selector, verify all visible text updates without restart |
| CJK/Thai text doesn't overflow | PLAT-03 | Layout visual check | Switch to JA/KO/ZH/TH, check buttons, headers, tabs for text truncation |
| Device locale auto-detection | PLAT-04 | Device setting integration | Change device language to a supported language, reinstall app, verify it defaults correctly |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved
