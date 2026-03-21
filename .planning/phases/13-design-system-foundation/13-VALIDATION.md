---
phase: 13
slug: design-system-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 + ts-jest (shared package) |
| **Config file** | `packages/shared/jest.config.js` |
| **Quick run command** | `cd packages/shared && pnpm test` |
| **Full suite command** | `pnpm test` (runs via Turborepo across all packages) |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd packages/shared && pnpm test`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 13-01-T1 | 01 | 1 | DS-01, DS-02 | unit | `cd packages/shared && pnpm test -- --testPathPattern=tokens` | ❌ W0 | ⬜ pending |
| 13-01-T2 | 01 | 1 | DS-03 | unit + tsc | `cd packages/shared && pnpm test -- --testPathPattern=theme-shim && cd ../../apps/mobile && npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 13-02-T1 | 02 | 2 | DS-04 | unit | `cd packages/shared && pnpm test -- --testPathPattern=generate-css` | ❌ W0 | ⬜ pending |
| 13-02-T2 | 02 | 2 | DS-04 | integration + tsc | `cd packages/shared && npx tsx scripts/generate-css-tokens.ts && grep "@theme" ../../apps/web/src/app/tokens.css && cd ../../apps/web && npx tsc --noEmit` | n/a | ⬜ pending |
| 13-03-T1 | 03 | 2 | DS-05 | unit | `cd packages/shared && pnpm test -- --testPathPattern=audit` | ❌ W0 | ⬜ pending |
| 13-03-T2 | 03 | 2 | DS-05 | integration | `test -f .planning/phases/13-design-system-foundation/AUDIT.md && grep "Suggested Token" .planning/phases/13-design-system-foundation/AUDIT.md` | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/shared/src/__tests__/tokens.test.ts` — stubs for DS-01, DS-02: validates token exports exist and have correct types
- [ ] `packages/shared/src/__tests__/theme-shim.test.ts` — stubs for DS-03: validates shim API matches old theme.ts shape exactly
- [ ] `packages/shared/src/__tests__/generate-css.test.ts` — stubs for DS-04: validates CSS output format and content
- [ ] `packages/shared/src/__tests__/audit.test.ts` — stubs for DS-05: validates audit script against fixture files

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Existing screens render identically after migration | DS-03 | Visual regression requires human eye | Open each major screen (portfolio, meta, trade) and compare before/after screenshots |
| Web and mobile show identical color/spacing values | DS-04 | Cross-platform visual comparison | Compare rendered color values in browser dev tools vs React Native inspector |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
