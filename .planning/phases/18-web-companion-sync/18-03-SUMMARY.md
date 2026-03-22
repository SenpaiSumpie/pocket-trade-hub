---
phase: 18-web-companion-sync
plan: 03
subsystem: ui
tags: [cards, collection, market, proposals, skeleton, empty-state, token-colors]
---

## One-liner
Refreshed Cards, Collection, Market, and Proposals pages with skeleton loading, empty states, and token-based color replacement.

## Self-Check: PASSED

## What was built
- Cards page: 12-item skeleton grid while loading, EmptyState "No cards found" when empty
- Collection page: 8-item skeleton grid, EmptyState "Your collection is empty" with "Browse Cards" CTA
- Market page: 6-item skeleton list, EmptyState "No posts yet" with "Create Post" CTA
- Proposals page: 4-item skeleton list, EmptyState "No active proposals" with "Go to Market" CTA, Badge for pending count
- All hardcoded Tailwind color classes replaced with token CSS vars across 12 trading/cards components

## Key files

### Modified
- `apps/web/src/app/(app)/cards/page.tsx` — skeleton + empty state
- `apps/web/src/app/(app)/collection/page.tsx` — skeleton + empty state + Card wrapper
- `apps/web/src/app/(app)/market/page.tsx` — skeleton + empty state
- `apps/web/src/app/(app)/proposals/page.tsx` — skeleton + empty state + Badge
- `apps/web/src/components/cards/CardThumbnail.tsx` — rarity tokens
- `apps/web/src/components/cards/CardDetailModal.tsx` — error token
- `apps/web/src/components/collection/CollectionGrid.tsx` — error token
- `apps/web/src/components/trading/PostCard.tsx` — offering/seeking tokens
- `apps/web/src/components/trading/PostDetailModal.tsx` — type + error tokens
- `apps/web/src/components/trading/CreatePostModal.tsx` — type tokens
- `apps/web/src/components/trading/ProposalCard.tsx` — status + fairness tokens
- `apps/web/src/components/trading/ProposalDetailModal.tsx` — status + fairness + error tokens

## Deviations
- CreateProposalModal.tsx had no hardcoded color references — no changes needed
- PostList.tsx and ProposalList.tsx had no hardcoded colors — no changes needed
