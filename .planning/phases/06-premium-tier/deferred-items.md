# Deferred Items - Phase 06

## Pre-existing Test Failures

**proposal.service.test.ts** and **rating.service.test.ts** have failures in `completeProposal` and dependent tests. The `completeProposal` function attempts to insert card IDs like `card-1` and `c1` into `user_collection_items`, which violates FK constraints because those cards don't exist in the `cards` table. These tests need seed data for cards before completing proposals. Not caused by Phase 6 changes.

Affected tests:
- `completeProposal > sets status to completed when accepted`
- `rateTradePartner > creates a rating for a completed proposal`
- `rateTradePartner > returns null for duplicate rating (idempotent)`
- `rateTradePartner > fails if rater is not a party`
- `getUserReputation > returns aggregated rating data`
