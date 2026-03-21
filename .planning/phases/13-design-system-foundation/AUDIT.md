# Hardcoded Value Audit -- Phase 13

**Generated:** 2026-03-21
**Script:** packages/shared/scripts/audit-hardcoded-values.ts

## Summary

- Total hardcoded hex values found: 135
- Files with hardcoded values: 28
- Values with known token mappings: 94
- Values with UNKNOWN mappings: 41

## Migration Notes

- This list is referenced during Phases 16/17 screen migration
- Each screen's migration should address all entries for files in that screen
- UNKNOWN entries may need new tokens or are intentionally one-off values
- Per D-11: actual file-by-file migration happens in Phases 16/17, NOT this phase
- Many UNKNOWN values are avatar type colors (16 entries in avatars.ts) and old energy type colors (10 entries in CardThumbnail.tsx) that use different hex values than the palette.energy tokens -- future phases should decide whether to unify or keep separate
- `#0f0f1a` appears 5 times in export templates as a background darker than `palette.gray[950]` (#0c0c18) -- may warrant a new `palette.gray[1000]` or similar token
- `#3b82f6` (Tailwind blue-500) appears 6 times for "seeking" post badge color -- needs a semantic token like `colors.seeking` or `colors.info`
- `#f1c40f` appears 4 times as tier B color -- slightly different from `palette.gold[500]` (#f0c040), should be unified

## Audit Results

| File | Line | Value | Context | Suggested Token | Category |
|------|------|-------|---------|-----------------|----------|
| apps/mobile/src/components/auth/OAuthButtons.tsx | 127 | `#ffffff` | `backgroundColor: '#ffffff',` | `colors.onSurface` | color |
| apps/mobile/src/components/auth/OAuthButtons.tsx | 139 | `#333333` | `color: '#333333',` | `UNKNOWN -- add to token package` | color |
| apps/mobile/src/components/cards/CardDetailModal.tsx | 51 | `#e74c3c` | `high: '#e74c3c',` | `colors.error` | color |
| apps/mobile/src/components/cards/CardDetailModal.tsx | 112 | `#ffffff` | `active && { color: '#ffffff' },` | `colors.onSurface` | color |
| apps/mobile/src/components/cards/CardDetailModal.tsx | 155 | `#e74c3c` | `<Ionicons name="heart" size={14} color="#e74c3c" />` | `colors.error` | color |
| apps/mobile/src/components/cards/CardDetailModal.tsx | 156 | `#e74c3c` | `<Text style={[statusStyles.badgeText, { color: '#e74c3c' }]}>` | `colors.error` | color |
| apps/mobile/src/components/cards/CardThumbnail.tsx | 30 | `#f08030` | `Fire: '#f08030',` | `UNKNOWN -- add to token package` | color |
| apps/mobile/src/components/cards/CardThumbnail.tsx | 31 | `#6890f0` | `Water: '#6890f0',` | `UNKNOWN -- add to token package` | color |
| apps/mobile/src/components/cards/CardThumbnail.tsx | 32 | `#78c850` | `Grass: '#78c850',` | `UNKNOWN -- add to token package` | color |
| apps/mobile/src/components/cards/CardThumbnail.tsx | 33 | `#f8d030` | `Lightning: '#f8d030',` | `palette.energy[lightning]` | color |
| apps/mobile/src/components/cards/CardThumbnail.tsx | 34 | `#f85888` | `Psychic: '#f85888',` | `UNKNOWN -- add to token package` | color |
| apps/mobile/src/components/cards/CardThumbnail.tsx | 35 | `#c03028` | `Fighting: '#c03028',` | `UNKNOWN -- add to token package` | color |
| apps/mobile/src/components/cards/CardThumbnail.tsx | 36 | `#705848` | `Darkness: '#705848',` | `UNKNOWN -- add to token package` | color |
| apps/mobile/src/components/cards/CardThumbnail.tsx | 37 | `#b8b8d0` | `Metal: '#b8b8d0',` | `UNKNOWN -- add to token package` | color |
| apps/mobile/src/components/cards/CardThumbnail.tsx | 38 | `#7038f8` | `Dragon: '#7038f8',` | `UNKNOWN -- add to token package` | color |
| apps/mobile/src/components/cards/CardThumbnail.tsx | 39 | `#a8a878` | `Colorless: '#a8a878',` | `UNKNOWN -- add to token package` | color |
| apps/mobile/src/components/cards/CardThumbnail.tsx | 40 | `#a8a878` | `Normal: '#a8a878',` | `UNKNOWN -- add to token package` | color |
| apps/mobile/src/components/cards/CardThumbnail.tsx | 44 | `#e74c3c` | `high: '#e74c3c',` | `colors.error` | color |
| apps/mobile/src/components/cards/CardThumbnail.tsx | 138 | `#e74c3c` | `<Ionicons name="heart" size={12} color="#e74c3c" />` | `colors.error` | color |
| apps/mobile/src/components/cards/CardThumbnail.tsx | 172 | `#ffffff` | `<Ionicons name="checkmark-circle" size={28} color="#ffffff" />` | `colors.onSurface` | color |
| apps/mobile/src/components/cards/CardThumbnail.tsx | 227 | `#ffffff` | `color: '#ffffff',` | `colors.onSurface` | color |
| apps/mobile/src/components/cards/CardThumbnail.tsx | 242 | `#ffffff` | `color: '#ffffff',` | `colors.onSurface` | color |
| apps/mobile/src/components/cards/CardThumbnail.tsx | 294 | `#ffffff` | `color: '#ffffff',` | `colors.onSurface` | color |
| apps/mobile/src/components/cards/LuckCalculator.tsx | 32 | `#f0c040` | `const GOLD = '#f0c040';` | `colors.accent` | color |
| apps/mobile/src/components/cards/RarityBadge.tsx | 13 | `#a0a0b8` | `if (!rarity) return { text: '', color: '#a0a0b8' };` | `colors.onSurfaceSecondary` | color |
| apps/mobile/src/components/cards/RarityBadge.tsx | 17 | `#7ec8e3` | `return { text: DIAMOND, color: '#7ec8e3' };` | `colors.rarityDiamond` | color |
| apps/mobile/src/components/cards/RarityBadge.tsx | 19 | `#7ec8e3` | `return { text: DIAMOND.repeat(2), color: '#7ec8e3' };` | `colors.rarityDiamond` | color |
| apps/mobile/src/components/cards/RarityBadge.tsx | 21 | `#7ec8e3` | `return { text: DIAMOND.repeat(3), color: '#7ec8e3' };` | `colors.rarityDiamond` | color |
| apps/mobile/src/components/cards/RarityBadge.tsx | 23 | `#7ec8e3` | `return { text: DIAMOND.repeat(4), color: '#7ec8e3' };` | `colors.rarityDiamond` | color |
| apps/mobile/src/components/cards/RarityBadge.tsx | 25 | `#f0c040` | `return { text: STAR, color: '#f0c040' };` | `colors.accent` | color |
| apps/mobile/src/components/cards/RarityBadge.tsx | 27 | `#f0c040` | `return { text: STAR.repeat(2), color: '#f0c040' };` | `colors.accent` | color |
| apps/mobile/src/components/cards/RarityBadge.tsx | 29 | `#f0c040` | `return { text: STAR.repeat(3), color: '#f0c040' };` | `colors.accent` | color |
| apps/mobile/src/components/cards/RarityBadge.tsx | 31 | `#e8b4f8` | `return { text: CROWN, color: '#e8b4f8' };` | `colors.rarityCrown` | color |
| apps/mobile/src/components/cards/RarityBadge.tsx | 33 | `#a0a0b8` | `return { text: '', color: '#a0a0b8' };` | `colors.onSurfaceSecondary` | color |
| apps/mobile/src/components/export/ExportRenderer.tsx | 43 | `#0f0f1a` | `backgroundColor: '#0f0f1a',` | `UNKNOWN -- add to token package` | color |
| apps/mobile/src/components/export/templates/CardExport.tsx | 13 | `#f0c040` | `const GOLD = '#f0c040';` | `colors.accent` | color |
| apps/mobile/src/components/export/templates/CardExport.tsx | 14 | `#0f0f1a` | `const BG = '#0f0f1a';` | `UNKNOWN -- add to token package` | color |
| apps/mobile/src/components/export/templates/CardExport.tsx | 15 | `#1a1a2e` | `const SURFACE = '#1a1a2e';` | `colors.surface` | color |
| apps/mobile/src/components/export/templates/CardExport.tsx | 74 | `#ffffff` | `color: '#ffffff',` | `colors.onSurface` | color |
| apps/mobile/src/components/export/templates/CardExport.tsx | 90 | `#a0a0b8` | `color: '#a0a0b8',` | `colors.onSurfaceSecondary` | color |
| apps/mobile/src/components/export/templates/CollectionExport.tsx | 14 | `#f0c040` | `const GOLD = '#f0c040';` | `colors.accent` | color |
| apps/mobile/src/components/export/templates/CollectionExport.tsx | 15 | `#0f0f1a` | `const BG = '#0f0f1a';` | `UNKNOWN -- add to token package` | color |
| apps/mobile/src/components/export/templates/CollectionExport.tsx | 16 | `#1a1a2e` | `const SURFACE = '#1a1a2e';` | `colors.surface` | color |
| apps/mobile/src/components/export/templates/CollectionExport.tsx | 93 | `#ffffff` | `color: '#ffffff',` | `colors.onSurface` | color |
| apps/mobile/src/components/export/templates/CollectionExport.tsx | 109 | `#ffffff` | `color: '#ffffff',` | `colors.onSurface` | color |
| apps/mobile/src/components/export/templates/CollectionExport.tsx | 113 | `#a0a0b8` | `color: '#a0a0b8',` | `colors.onSurfaceSecondary` | color |
| apps/mobile/src/components/export/templates/PostExport.tsx | 18 | `#f0c040` | `const GOLD = '#f0c040';` | `colors.accent` | color |
| apps/mobile/src/components/export/templates/PostExport.tsx | 19 | `#0f0f1a` | `const BG = '#0f0f1a';` | `UNKNOWN -- add to token package` | color |
| apps/mobile/src/components/export/templates/PostExport.tsx | 20 | `#1a1a2e` | `const SURFACE = '#1a1a2e';` | `colors.surface` | color |
| apps/mobile/src/components/export/templates/PostExport.tsx | 25 | `#2ecc71` | `const badgeColor = isOffering ? '#2ecc71' : '#e74c3c';` | `colors.success` | color |
| apps/mobile/src/components/export/templates/PostExport.tsx | 25 | `#e74c3c` | `const badgeColor = isOffering ? '#2ecc71' : '#e74c3c';` | `colors.error` | color |
| apps/mobile/src/components/export/templates/PostExport.tsx | 83 | `#ffffff` | `color: '#ffffff',` | `colors.onSurface` | color |
| apps/mobile/src/components/export/templates/PostExport.tsx | 115 | `#ffffff` | `color: '#ffffff',` | `colors.onSurface` | color |
| apps/mobile/src/components/export/templates/PostExport.tsx | 131 | `#a0a0b8` | `color: '#a0a0b8',` | `colors.onSurfaceSecondary` | color |
| apps/mobile/src/components/export/templates/WantedExport.tsx | 18 | `#f0c040` | `const GOLD = '#f0c040';` | `colors.accent` | color |
| apps/mobile/src/components/export/templates/WantedExport.tsx | 19 | `#0f0f1a` | `const BG = '#0f0f1a';` | `UNKNOWN -- add to token package` | color |
| apps/mobile/src/components/export/templates/WantedExport.tsx | 20 | `#1a1a2e` | `const SURFACE = '#1a1a2e';` | `colors.surface` | color |
| apps/mobile/src/components/export/templates/WantedExport.tsx | 23 | `#e74c3c` | `high: '#e74c3c',` | `colors.error` | color |
| apps/mobile/src/components/export/templates/WantedExport.tsx | 24 | `#f0c040` | `medium: '#f0c040',` | `colors.accent` | color |
| apps/mobile/src/components/export/templates/WantedExport.tsx | 25 | `#a0a0b8` | `low: '#a0a0b8',` | `colors.onSurfaceSecondary` | color |
| apps/mobile/src/components/export/templates/WantedExport.tsx | 90 | `#a0a0b8` | `color: '#a0a0b8',` | `colors.onSurfaceSecondary` | color |
| apps/mobile/src/components/export/templates/WantedExport.tsx | 123 | `#ffffff` | `borderColor: '#ffffff',` | `colors.onSurface` | color |
| apps/mobile/src/components/export/templates/WantedExport.tsx | 128 | `#ffffff` | `color: '#ffffff',` | `colors.onSurface` | color |
| apps/mobile/src/components/market/PostCard.tsx | 31 | `#3b82f6` | `const typeBadgeColor = isOffering ? colors.success : '#3b82f6';` | `UNKNOWN -- add to token package` | color |
| apps/mobile/src/components/market/PostCard.tsx | 62 | `#f0c040` | `<Ionicons name="star" size={10} color="#f0c040" />` | `colors.accent` | color |
| apps/mobile/src/components/market/PostCard.tsx | 112 | `#f0c040` | `borderColor: '#f0c040',` | `colors.accent` | color |
| apps/mobile/src/components/market/PostCard.tsx | 134 | `#ffffff` | `color: '#ffffff',` | `colors.onSurface` | color |
| apps/mobile/src/components/market/PostCard.tsx | 158 | `#f0c040` | `backgroundColor: '#f0c040' + '30',` | `colors.accent` | color |
| apps/mobile/src/components/market/PostCard.tsx | 166 | `#f0c040` | `color: '#f0c040',` | `colors.accent` | color |
| apps/mobile/src/components/market/PostCreationModal.tsx | 201 | `#3b82f6` | `style={[styles.typeCard, { borderColor: '#3b82f6' }]}` | `UNKNOWN -- add to token package` | color |
| apps/mobile/src/components/market/PostCreationModal.tsx | 204 | `#3b82f6` | `<Ionicons name="arrow-down-circle" size={32} color="#3b82f6" />` | `UNKNOWN -- add to token package` | color |
| apps/mobile/src/components/market/PostCreationModal.tsx | 279 | `#3b82f6` | `{ backgroundColor: postType === 'offering' ? colors.success : '#3b82f6' },` | `UNKNOWN -- add to token package` | color |
| apps/mobile/src/components/market/PostCreationModal.tsx | 456 | `#ffffff` | `color: '#ffffff',` | `colors.onSurface` | color |
| apps/mobile/src/components/market/PostDetailModal.tsx | 51 | `#3b82f6` | `const typeBadgeColor = isOffering ? colors.success : '#3b82f6';` | `UNKNOWN -- add to token package` | color |
| apps/mobile/src/components/market/PostDetailModal.tsx | 180 | `#f0c040` | `<Ionicons name="star" size={12} color="#f0c040" />` | `colors.accent` | color |
| apps/mobile/src/components/market/PostDetailModal.tsx | 322 | `#ffffff` | `color: '#ffffff',` | `colors.onSurface` | color |
| apps/mobile/src/components/market/PostDetailModal.tsx | 328 | `#f0c040` | `backgroundColor: '#f0c040' + '25',` | `colors.accent` | color |
| apps/mobile/src/components/market/PostDetailModal.tsx | 336 | `#f0c040` | `color: '#f0c040',` | `colors.accent` | color |
| apps/mobile/src/components/meta/TierListCard.tsx | 23 | `#e74c3c` | `S: '#e74c3c',` | `colors.error` | color |
| apps/mobile/src/components/meta/TierListCard.tsx | 24 | `#e67e22` | `A: '#e67e22',` | `colors.warning` | color |
| apps/mobile/src/components/meta/TierListCard.tsx | 25 | `#f1c40f` | `B: '#f1c40f',` | `UNKNOWN -- add to token package` | color |
| apps/mobile/src/components/meta/TierListCard.tsx | 26 | `#2ecc71` | `C: '#2ecc71',` | `colors.success` | color |
| apps/mobile/src/components/meta/TierListCard.tsx | 27 | `#3498db` | `D: '#3498db',` | `colors.tierD` | color |
| apps/mobile/src/components/meta/TierListCard.tsx | 75 | `#f0c040` | `<Ionicons name="shield-checkmark" size={14} color="#f0c040" />` | `colors.accent` | color |
| apps/mobile/src/components/meta/TierListCard.tsx | 130 | `#f0c040` | `<Ionicons name="shield-checkmark" size={18} color="#f0c040" />` | `colors.accent` | color |
| apps/mobile/src/components/meta/TierListCard.tsx | 236 | `#f0c040` | `backgroundColor: '#f0c040' + '20',` | `colors.accent` | color |
| apps/mobile/src/components/meta/TierListCard.tsx | 244 | `#f0c040` | `color: '#f0c040',` | `colors.accent` | color |
| apps/mobile/src/components/meta/TierRow.tsx | 6 | `#e74c3c` | `S: '#e74c3c',` | `colors.error` | color |
| apps/mobile/src/components/meta/TierRow.tsx | 7 | `#e67e22` | `A: '#e67e22',` | `colors.warning` | color |
| apps/mobile/src/components/meta/TierRow.tsx | 8 | `#f1c40f` | `B: '#f1c40f',` | `UNKNOWN -- add to token package` | color |
| apps/mobile/src/components/meta/TierRow.tsx | 9 | `#2ecc71` | `C: '#2ecc71',` | `colors.success` | color |
| apps/mobile/src/components/meta/TierRow.tsx | 10 | `#3498db` | `D: '#3498db',` | `colors.tierD` | color |
| apps/mobile/src/components/meta/TierRow.tsx | 70 | `#ffffff` | `color: '#ffffff',` | `colors.onSurface` | color |
| apps/mobile/src/components/notifications/NotificationBell.tsx | 37 | `#e53e3e` | `backgroundColor: '#e53e3e',` | `UNKNOWN -- add to token package` | color |
| apps/mobile/src/components/notifications/NotificationBell.tsx | 46 | `#ffffff` | `color: '#ffffff',` | `colors.onSurface` | color |
| apps/mobile/src/components/notifications/NotificationItem.tsx | 28 | `#6c63ff` | `new_match: '#6c63ff',` | `UNKNOWN -- add to token package` | color |
| apps/mobile/src/components/notifications/NotificationItem.tsx | 100 | `#3b82f6` | `backgroundColor: '#3b82f6',` | `UNKNOWN -- add to token package` | color |
| apps/mobile/src/components/premium/LockedFeatureCard.tsx | 25 | `#f0c040` | `<Ionicons name="diamond" size={10} color="#f0c040" />` | `colors.accent` | color |
| apps/mobile/src/components/premium/LockedFeatureCard.tsx | 90 | `#f0c040` | `color: '#f0c040',` | `colors.accent` | color |
| apps/mobile/src/components/premium/PremiumBadge.tsx | 8 | `#f0c040` | `return <Ionicons name="diamond" size={size} color="#f0c040" />;` | `colors.accent` | color |
| apps/mobile/src/components/trades/FairnessMeter.tsx | 99 | `#e74c3c` | `backgroundColor: '#e74c3c',` | `colors.error` | color |
| apps/mobile/src/components/trades/FairnessMeter.tsx | 104 | `#e8a030` | `backgroundColor: '#e8a030',` | `UNKNOWN -- add to token package` | color |
| apps/mobile/src/components/trades/FairnessMeter.tsx | 110 | `#e8a030` | `backgroundColor: '#e8a030',` | `UNKNOWN -- add to token package` | color |
| apps/mobile/src/components/trades/FairnessMeter.tsx | 113 | `#e74c3c` | `backgroundColor: '#e74c3c',` | `colors.error` | color |
| apps/mobile/src/components/trades/MatchCard.tsx | 35 | `#f0c040` | `<Ionicons name="star" size={10} color="#f0c040" />` | `colors.accent` | color |
| apps/mobile/src/components/trades/MatchCard.tsx | 77 | `#f0c040` | `color={i < match.starRating ? '#f0c040' : colors.surfaceLight}` | `colors.accent` | color |
| apps/mobile/src/components/trades/MatchDetailModal.tsx | 28 | `#e74c3c` | `high: '#e74c3c',` | `colors.error` | color |
| apps/mobile/src/components/trades/MatchDetailModal.tsx | 100 | `#f0c040` | `color={i < match.starRating ? '#f0c040' : colors.surfaceLight}` | `colors.accent` | color |
| apps/mobile/src/components/trades/MyPostCard.tsx | 15 | `#e67e22` | `auto_closed: { color: '#e67e22', label: 'Auto-closed' },` | `colors.warning` | color |
| apps/mobile/src/components/trades/MyPostCard.tsx | 135 | `#ffffff` | `color: '#ffffff',` | `colors.onSurface` | color |
| apps/mobile/src/components/trades/MyPostCard.tsx | 145 | `#ffffff` | `color: '#ffffff',` | `colors.onSurface` | color |
| apps/mobile/src/components/trades/MyPostDetailModal.tsx | 28 | `#e67e22` | `auto_closed: { color: '#e67e22', label: 'Auto-closed', description: 'This post w` | `colors.warning` | color |
| apps/mobile/src/components/trades/MyPostDetailModal.tsx | 252 | `#ffffff` | `color: '#ffffff',` | `colors.onSurface` | color |
| apps/mobile/src/components/trades/MyPostDetailModal.tsx | 310 | `#ffffff` | `color: '#ffffff',` | `colors.onSurface` | color |
| apps/mobile/src/components/trades/ProposalCard.tsx | 32 | `#3498db` | `countered: '#3498db',` | `colors.tierD` | color |
| apps/mobile/src/components/trades/ProposalCard.tsx | 248 | `#ffffff` | `color: '#ffffff',` | `colors.onSurface` | color |
| apps/mobile/src/components/trades/ProposalDetailModal.tsx | 649 | `#ffffff` | `color: '#ffffff',` | `colors.onSurface` | color |
| apps/mobile/src/components/trades/ProposalDetailModal.tsx | 660 | `#3498db` | `backgroundColor: '#3498db',` | `colors.tierD` | color |
| apps/mobile/src/components/trades/RatingModal.tsx | 78 | `#f0c040` | `color={filled ? '#f0c040' : colors.textMuted}` | `colors.accent` | color |
| apps/mobile/src/constants/avatars.ts | 9 | `#e74c3c` | `{ id: 'fire', label: 'Fire', emoji: '...', color: '#e74c3c' },` | `colors.error` | color |
| apps/mobile/src/constants/avatars.ts | 10 | `#3498db` | `{ id: 'water', label: 'Water', emoji: '...', color: '#3498db' },` | `colors.tierD` | color |
| apps/mobile/src/constants/avatars.ts | 11 | `#2ecc71` | `{ id: 'grass', label: 'Grass', emoji: '...', color: '#2ecc71' },` | `colors.success` | color |
| apps/mobile/src/constants/avatars.ts | 12 | `#f1c40f` | `{ id: 'electric', label: 'Electric', emoji: '...', color: '#f1c40f' },` | `UNKNOWN -- add to token package` | color |
| apps/mobile/src/constants/avatars.ts | 13 | `#e84393` | `{ id: 'psychic', label: 'Psychic', emoji: '...', color: '#e84393' },` | `UNKNOWN -- add to token package` | color |
| apps/mobile/src/constants/avatars.ts | 14 | `#636e72` | `{ id: 'dark', label: 'Dark', emoji: '...', color: '#636e72' },` | `UNKNOWN -- add to token package` | color |
| apps/mobile/src/constants/avatars.ts | 15 | `#6c5ce7` | `{ id: 'dragon', label: 'Dragon', emoji: '...', color: '#6c5ce7' },` | `UNKNOWN -- add to token package` | color |
| apps/mobile/src/constants/avatars.ts | 16 | `#fd79a8` | `{ id: 'fairy', label: 'Fairy', emoji: '...', color: '#fd79a8' },` | `UNKNOWN -- add to token package` | color |
| apps/mobile/src/constants/avatars.ts | 17 | `#d63031` | `{ id: 'fighting', label: 'Fighting', emoji: '...', color: '#d63031' },` | `UNKNOWN -- add to token package` | color |
| apps/mobile/src/constants/avatars.ts | 18 | `#a29bfe` | `{ id: 'ghost', label: 'Ghost', emoji: '...', color: '#a29bfe' },` | `UNKNOWN -- add to token package` | color |
| apps/mobile/src/constants/avatars.ts | 19 | `#b2bec3` | `{ id: 'steel', label: 'Steel', emoji: '...', color: '#b2bec3' },` | `UNKNOWN -- add to token package` | color |
| apps/mobile/src/constants/avatars.ts | 20 | `#74b9ff` | `{ id: 'ice', label: 'Ice', emoji: '...', color: '#74b9ff' },` | `UNKNOWN -- add to token package` | color |
| apps/mobile/src/constants/avatars.ts | 21 | `#6c5ce7` | `{ id: 'poison', label: 'Poison', emoji: '...', color: '#6c5ce7' },` | `UNKNOWN -- add to token package` | color |
| apps/mobile/src/constants/avatars.ts | 22 | `#e17055` | `{ id: 'ground', label: 'Ground', emoji: '...', color: '#e17055' },` | `UNKNOWN -- add to token package` | color |
| apps/mobile/src/constants/avatars.ts | 23 | `#81ecec` | `{ id: 'flying', label: 'Flying', emoji: '...', color: '#81ecec' },` | `UNKNOWN -- add to token package` | color |
| apps/mobile/src/constants/avatars.ts | 24 | `#00b894` | `{ id: 'bug', label: 'Bug', emoji: '...', color: '#00b894' },` | `UNKNOWN -- add to token package` | color |

## Files by Count

| File | Hardcoded Values |
|------|-----------------|
| apps/mobile/src/components/cards/CardThumbnail.tsx | 17 |
| apps/mobile/src/constants/avatars.ts | 16 |
| apps/mobile/src/components/cards/RarityBadge.tsx | 10 |
| apps/mobile/src/components/meta/TierListCard.tsx | 9 |
| apps/mobile/src/components/export/templates/WantedExport.tsx | 9 |
| apps/mobile/src/components/export/templates/PostExport.tsx | 8 |
| apps/mobile/src/components/meta/TierRow.tsx | 6 |
| apps/mobile/src/components/market/PostCard.tsx | 6 |
| apps/mobile/src/components/export/templates/CollectionExport.tsx | 6 |
| apps/mobile/src/components/market/PostDetailModal.tsx | 5 |
| apps/mobile/src/components/export/templates/CardExport.tsx | 5 |
| apps/mobile/src/components/trades/FairnessMeter.tsx | 4 |
| apps/mobile/src/components/market/PostCreationModal.tsx | 4 |
| apps/mobile/src/components/cards/CardDetailModal.tsx | 4 |
| apps/mobile/src/components/trades/MyPostDetailModal.tsx | 3 |
| apps/mobile/src/components/trades/MyPostCard.tsx | 3 |
| apps/mobile/src/components/trades/ProposalDetailModal.tsx | 2 |
| apps/mobile/src/components/trades/ProposalCard.tsx | 2 |
| apps/mobile/src/components/trades/MatchDetailModal.tsx | 2 |
| apps/mobile/src/components/trades/MatchCard.tsx | 2 |
| apps/mobile/src/components/premium/LockedFeatureCard.tsx | 2 |
| apps/mobile/src/components/notifications/NotificationItem.tsx | 2 |
| apps/mobile/src/components/notifications/NotificationBell.tsx | 2 |
| apps/mobile/src/components/auth/OAuthButtons.tsx | 2 |
| apps/mobile/src/components/trades/RatingModal.tsx | 1 |
| apps/mobile/src/components/premium/PremiumBadge.tsx | 1 |
| apps/mobile/src/components/export/ExportRenderer.tsx | 1 |
| apps/mobile/src/components/cards/LuckCalculator.tsx | 1 |
