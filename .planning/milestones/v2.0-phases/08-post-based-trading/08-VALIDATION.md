---
phase: 8
slug: post-based-trading
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (configured in apps/api/package.json) |
| **Config file** | apps/api/jest.config.ts |
| **Quick run command** | `cd apps/api && npx jest --testPathPattern=<file> --no-coverage` |
| **Full suite command** | `cd apps/api && npx jest --no-coverage` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/api && npx jest --testPathPattern=<changed-file> --no-coverage`
- **After every plan wave:** Run `cd apps/api && npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | TRAD-01, TRAD-02, TRAD-06 | unit | `npx jest __tests__/services/post.service.test.ts -x` | ❌ W0 | ⬜ pending |
| 08-01-02 | 01 | 1 | TRAD-03 | route | `npx jest __tests__/routes/posts.route.test.ts -x` | ❌ W0 | ⬜ pending |
| 08-01-03 | 01 | 1 | TRAD-04 | unit | `npx jest __tests__/services/post-match.service.test.ts -x` | ❌ W0 | ⬜ pending |
| 08-01-04 | 01 | 1 | TRAD-05 | unit | `npx jest __tests__/proposal.service.test.ts -x` | ✅ (needs update) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/__tests__/services/post.service.test.ts` — stubs for TRAD-01, TRAD-02, TRAD-06 (create/close/auto-close, language validation)
- [ ] `apps/api/__tests__/routes/posts.route.test.ts` — stubs for TRAD-03 (browse, filter, pagination, premium limit)
- [ ] `apps/api/__tests__/services/post-match.service.test.ts` — stubs for TRAD-04 (complementary matching, notification dispatch)
- [ ] Update `apps/api/__tests__/proposal.service.test.ts` — stubs for TRAD-05 (postId-based proposal creation, optional matchId)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Post creation modal UX flow | TRAD-01, TRAD-02 | Mobile UI interaction | 1. Open marketplace tab 2. Tap "Create Post" 3. Select Offering/Seeking 4. Pick card + language 5. Confirm post appears in feed |
| Real-time notification display | TRAD-04 | Socket.IO + push notification rendering | 1. User A creates Offering post 2. User B has matching Seeking post 3. Verify User B receives notification |
| Proposal from post flow | TRAD-05 | End-to-end mobile flow | 1. View matched post 2. Tap "Propose Trade" 3. Complete proposal workflow 4. Verify proposal created with postId |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
