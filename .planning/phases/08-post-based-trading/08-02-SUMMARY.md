---
phase: 08-post-based-trading
plan: 02
subsystem: api
tags: [bullmq, jsonb, socket.io, drizzle, notifications, worker]

requires:
  - phase: 08-post-based-trading
    provides: "tradePosts table, post CRUD service, post routes"
provides:
  - "Post matching service with JSONB containment queries"
  - "BullMQ post-match worker with 5-second batching delay"
  - "Proactive wanted-list matching for Offering posts"
  - "Proposal postId support (matchId now optional)"
  - "Auto-close of affected posts on trade completion"
  - "Per-user notification batching to prevent spam"
affects: [08-03, 08-04, mobile-post-proposals, mobile-market-tab]

tech-stack:
  added: []
  patterns: ["JSONB containment for post matching", "BullMQ delayed job for batched processing", "Auto-close pattern on trade completion"]

key-files:
  created:
    - apps/api/src/services/post-match.service.ts (findComplementaryMatches, findWantedListMatches, processPostMatch)
    - apps/api/src/jobs/post-match-worker.ts (queuePostMatch, initPostMatchWorker, closePostMatchWorker)
    - apps/api/__tests__/services/post-match.service.test.ts (10 tests)
    - apps/api/__tests__/services/proposal.service.test.ts (12 tests)
  modified:
    - apps/api/src/db/schema.ts (postId column on tradeProposals)
    - packages/shared/src/schemas/proposal.ts (matchId optional, postId optional, refine)
    - apps/api/src/services/proposal.service.ts (postId support, post validation, auto-close)
    - apps/api/src/routes/proposals.ts (pass postId from body)
    - apps/api/src/routes/posts.ts (queue post matching after creation)
    - apps/api/src/server.ts (post-match worker startup/shutdown)

key-decisions:
  - "Duplicated insertNotification/sendPushToUser in post-match service to avoid coupling with proposal service"
  - "JSONB containment operator for matching cardId+language between posts and wanted lists"
  - "5-second BullMQ delay for batching rapid post creation into single worker runs"
  - "Per-user notification deduplication via Set-based grouping in processPostMatch"
  - "Auto-close uses JSONB containment to find posts with matching cardIds after trade"

patterns-established:
  - "Post matching via JSONB containment queries between complementary post types"
  - "Auto-close pattern: trade completion triggers post status updates and notifications"
  - "BullMQ worker pattern for post events (extends existing match-worker pattern)"

requirements-completed: [TRAD-04, TRAD-05]

duration: 8min
completed: 2026-03-15
---

# Phase 8 Plan 2: Post Matching and Proposal Adaptation Summary

**BullMQ post-match worker with JSONB complementary matching, proposal postId support with optional matchId, and auto-close of traded posts on completion**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-15T16:38:16Z
- **Completed:** 2026-03-15T16:46:00Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Post matching service finds complementary posts using JSONB containment queries (cardId + language)
- Proactive wanted-list matching notifies users even without Seeking posts
- BullMQ post-match worker with 5-second delay for batching rapid post creation
- Proposals can now reference postId instead of matchId (TRAD-05), with refine validation requiring at least one
- Trade completion auto-closes affected Offering and Seeking posts with notifications
- 22 tests passing (10 post-match + 12 proposal)

## Task Commits

Each task was committed atomically:

1. **Task 1: Post matching service and BullMQ worker** - `7e00358` (feat)
2. **Task 2: Proposal adaptation with postId and auto-close** - `87eef20` (feat)

## Files Created/Modified
- `apps/api/src/services/post-match.service.ts` - Complementary matching, wanted-list matching, batched notifications
- `apps/api/src/jobs/post-match-worker.ts` - BullMQ worker with 5-second delay
- `apps/api/src/db/schema.ts` - Added postId column and index to tradeProposals
- `packages/shared/src/schemas/proposal.ts` - matchId optional, postId optional, refine validation
- `apps/api/src/services/proposal.service.ts` - postId support, post validation, auto-close logic
- `apps/api/src/routes/proposals.ts` - Pass postId from request body
- `apps/api/src/routes/posts.ts` - Queue post matching after creation
- `apps/api/src/server.ts` - Register post-match worker startup/shutdown
- `apps/api/__tests__/services/post-match.service.test.ts` - 10 tests for matching service
- `apps/api/__tests__/services/proposal.service.test.ts` - 12 tests for proposal with postId and auto-close

## Decisions Made
- Duplicated notification helpers in post-match service rather than extracting to shared module (avoids coupling, follows existing pattern)
- Used JSONB containment operator for matching cardId+language between posts and wanted lists
- 5-second BullMQ delay chosen for batching (vs 30-second for match-recompute) since post creation is more interactive
- Per-user notification deduplication prevents spam when a user has both a Seeking post AND wanted list entry for the same card

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed SQL array binding in conflict detection**
- **Found during:** Task 2
- **Issue:** Pre-existing bug in completeProposal: `= ANY(${senderGivesCardIds})` caused "malformed array literal" because Drizzle doesn't auto-convert JS arrays to SQL arrays
- **Fix:** Changed to `ANY(ARRAY[${sql.join(...)}])` with explicit parameter binding per element
- **Files modified:** apps/api/src/services/proposal.service.ts
- **Verification:** completeProposal auto-close tests pass
- **Committed in:** 87eef20

**2. [Rule 3 - Blocking] Fixed ioredis type mismatch in post-match-worker**
- **Found during:** Task 1
- **Issue:** Duplicate ioredis versions in monorepo caused TS type incompatibility (pre-existing issue also in match-worker.ts)
- **Fix:** Added `any` return type annotation to getConnection() function
- **Files modified:** apps/api/src/jobs/post-match-worker.ts
- **Verification:** ts-jest compiles and all tests pass
- **Committed in:** 7e00358

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes necessary for correctness and compilation. No scope creep.

## Issues Encountered
- Schema push needed to target both main and test databases separately (test DB uses DATABASE_URL_TEST via env override)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Post matching and proposal system ready for Plan 03 (mobile UI)
- Socket.IO events (post-match, post-closed) ready for client consumption
- Shared proposal schema updated for mobile app to consume

---
*Phase: 08-post-based-trading*
*Completed: 2026-03-15*
