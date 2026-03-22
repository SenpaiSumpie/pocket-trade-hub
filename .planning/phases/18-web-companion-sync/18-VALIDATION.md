---
phase: 18
slug: web-companion-sync
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 18 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.1.0 |
| **Config file** | `apps/web/package.json` (relies on Vitest defaults — no vitest.config.ts) |
| **Quick run command** | `pnpm --filter web test` |
| **Full suite command** | `pnpm --filter web test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter web test`
- **After every plan wave:** Run `pnpm --filter web test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 18-01-01 | 01 | 1 | WEB-01 | smoke | `pnpm generate-tokens && grep --count "color-accent" apps/web/src/app/tokens.css` | ✅ | ⬜ pending |
| 18-02-01 | 02 | 1 | WEB-02 | unit | `pnpm --filter web test` | ❌ W0 | ⬜ pending |
| 18-02-02 | 02 | 1 | WEB-02 | unit | `pnpm --filter web test` | ❌ W0 | ⬜ pending |
| 18-02-03 | 02 | 1 | WEB-02 | unit | `pnpm --filter web test` | ❌ W0 | ⬜ pending |
| 18-03-01 | 03 | 2 | WEB-03 | manual | N/A — visual review | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/web/src/components/ui/__tests__/Badge.test.tsx` — stubs for WEB-02 Badge variant rendering
- [ ] `apps/web/src/stores/__tests__/toast.test.ts` — stubs for WEB-02 Toast store show/dismiss
- [ ] `apps/web/src/components/ui/__tests__/Skeleton.test.tsx` — stubs for WEB-02 Skeleton shimmer variants
- [ ] Confirm Vitest config — verify `vitest run` works with defaults or create `vitest.config.ts` if needed

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| All 8 web pages match mobile visual language | WEB-03 | Visual consistency requires human comparison | Open each page side-by-side with mobile screenshots; verify colors, spacing, typography scale match |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
