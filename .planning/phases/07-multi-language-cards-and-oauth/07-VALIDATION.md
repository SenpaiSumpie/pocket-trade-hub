---
phase: 7
slug: multi-language-cards-and-oauth
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.7.0 + ts-jest |
| **Config file** | `apps/api/jest.config.js` |
| **Quick run command** | `cd apps/api && pnpm test -- --testPathPattern="PATTERN" --no-coverage` |
| **Full suite command** | `cd apps/api && pnpm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/api && pnpm test -- --testPathPattern="CHANGED_FILE" --no-coverage`
- **After every plan wave:** Run `cd apps/api && pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | CARD-01 | unit | `cd apps/api && pnpm test -- --testPathPattern="card-translation" --no-coverage` | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 1 | CARD-02 | integration | `cd apps/api && pnpm test -- --testPathPattern="collection.route" --no-coverage` | ✅ needs update | ⬜ pending |
| 07-01-03 | 01 | 1 | CARD-03 | integration | `cd apps/api && pnpm test -- --testPathPattern="cards.route" --no-coverage` | ✅ needs update | ⬜ pending |
| 07-01-04 | 01 | 1 | CARD-04 | unit | `cd apps/api && pnpm test -- --testPathPattern="card.service" --no-coverage` | ✅ needs update | ⬜ pending |
| 07-02-01 | 02 | 1 | AUTH-01 | integration | `cd apps/api && pnpm test -- --testPathPattern="auth.oauth" --no-coverage` | ❌ W0 | ⬜ pending |
| 07-02-02 | 02 | 1 | AUTH-02 | integration | `cd apps/api && pnpm test -- --testPathPattern="auth.oauth" --no-coverage` | ❌ W0 | ⬜ pending |
| 07-02-03 | 02 | 1 | AUTH-03 | integration | `cd apps/api && pnpm test -- --testPathPattern="auth.link" --no-coverage` | ❌ W0 | ⬜ pending |
| 07-02-04 | 02 | 1 | AUTH-04 | unit | `cd apps/api && pnpm test -- --testPathPattern="auth.oauth" --no-coverage` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/__tests__/auth.oauth.test.ts` — stubs for AUTH-01, AUTH-02, AUTH-04 (Google/Apple OAuth login, needs_linking)
- [ ] `apps/api/__tests__/auth.link.test.ts` — stubs for AUTH-03 (account linking)
- [ ] `apps/api/__tests__/services/card-translation.service.test.ts` — stubs for CARD-01 (translations CRUD)
- [ ] Update `apps/api/__tests__/routes/collection.route.test.ts` — add language param tests for CARD-02
- [ ] Update `apps/api/__tests__/routes/cards.route.test.ts` — add language filter tests for CARD-03
- [ ] Update `apps/api/__tests__/services/card.service.test.ts` — add translation query tests for CARD-04
- [ ] Mock utilities for google-auth-library and jose in test environment

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Google native sign-in flow on device | AUTH-01 | Requires real Google Cloud project + device | Build dev client, tap Google button, verify login completes |
| Apple native sign-in flow on iOS | AUTH-02 | Requires Apple Developer account + iOS device | Build dev client on iOS, tap Apple button, verify login completes |
| Card images display correctly per language | CARD-04 | Visual verification of image rendering | Browse cards in DE/FR/ES, verify images load and match language |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
