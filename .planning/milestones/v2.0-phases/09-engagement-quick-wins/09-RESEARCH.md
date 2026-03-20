# Phase 9: Engagement Quick Wins - Research

**Researched:** 2026-03-15
**Domain:** React Native utility features (probability calculator, image export, promo codes)
**Confidence:** HIGH

## Summary

Phase 9 implements three independent engagement features: a luck calculator for pack opening probabilities, image export for shareable visuals, and a promo code redemption system. All three are standalone with no cross-dependencies, making them parallelizable.

The luck calculator is entirely client-side math using community-datamined Pokemon TCG Pocket pull rates per slot. Image export uses `react-native-view-shot` (Expo-compatible) to capture React Native views as images and `expo-sharing` for the native share sheet. The promo code system requires new DB tables and API routes but follows the existing admin + service pattern exactly.

**Primary recommendation:** Implement each feature as an independent work stream. The luck calculator and image export are mobile-only; the promo code system spans API and mobile.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Luck calculator entry: "Calculate odds" button on CardDetailModal, opens bottom sheet or inline expansion
- No dedicated screen for luck calculator -- lives in existing card browsing flow
- Stats shown: pull rate per pack, expected packs to pull, cost estimate, cumulative probability curve
- Data source: hardcoded rarity rate constants based on community-datamined rates
- Update strategy: manual constant updates when new sets change rates
- Luck calculator: free for all users
- Four image export types: collection summary, trade post card, wanted list, single card showcase
- Visual style: branded dark background with gold accent (#f0c040), app logo watermark, card thumbnails in grid, stats overlay
- Premium difference: free = watermarked, premium = clean exports
- Share flow: generate image then native OS share sheet (no auto-save to gallery)
- Button placement: context-specific share icons on collection set view, post detail, wanted list screen, card detail modal
- No dedicated export screen
- Promo code rewards: premium subscription time only (no cosmetics)
- Redemption UI: "Redeem Code" button in profile/settings screen, simple text input + redeem button
- Code management: admin-only API routes (create/list/deactivate), no admin dashboard UI
- Redemption limits: one use per user per code, optional global max redemption count
- Integration: extends existing RevenueCat premium tier -- code grants premium time server-side

### Claude's Discretion
- Luck calculator bottom sheet vs inline expansion design
- Cumulative probability chart implementation (library choice, visual style)
- Image generation approach (react-native view capture vs canvas rendering)
- Exact watermark placement and style on exported images
- Promo code format and validation rules (length, charset, case sensitivity)
- How premium time from codes interacts with existing RevenueCat subscriptions
- DB schema design for promo codes and redemption tracking

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INTL-05 | User can calculate pack opening probabilities for specific cards | Luck calculator with hardcoded TCG Pocket slot-based pull rates, cumulative probability math, bottom sheet UI on CardDetailModal |
| DISC-03 | User can export collection or trade posts as shareable images | react-native-view-shot for capture, expo-sharing for native share sheet, premium gating for watermark removal |
| DISC-04 | User can redeem gift/promo codes for premium time or benefits | New DB tables (promo_codes, promo_redemptions), admin CRUD routes, redemption API, premium.service.ts extension |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native-view-shot | ^4.0.0 | Capture RN views as images | Expo-recommended, listed in Expo docs under captureRef |
| expo-sharing | ~3.0.x | Native OS share sheet | First-party Expo module, handles iOS/Android share sheets |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-native-svg | (already installed via deps) | SVG rendering for probability chart | Cumulative probability curve visualization |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-native-view-shot | expo-capture-ref (same lib) | view-shot IS the underlying lib for Expo's captureRef |
| react-native-chart-kit | react-native-gifted-charts | gifted-charts is heavier; chart-kit is simpler for one chart |
| SVG path (hand-drawn curve) | Full chart library | A single cumulative probability curve can be drawn with react-native-svg Path directly, avoiding a chart library dependency entirely |

**Installation:**
```bash
cd apps/mobile && npx expo install react-native-view-shot expo-sharing
```

**Recommendation for chart:** Use `react-native-svg` (likely already a transitive dependency) to draw the cumulative probability curve as an SVG `<Path>`. This avoids adding a full chart library for a single visualization. The curve is a simple monotonically increasing function from 0% to ~99% -- trivial to compute and render as an SVG path.

## Architecture Patterns

### Recommended Project Structure
```
packages/shared/src/schemas/
  pull-rates.ts              # Hardcoded pull rate constants + probability math
apps/mobile/src/components/
  cards/LuckCalculator.tsx   # Bottom sheet UI for probability display
  export/ExportRenderer.tsx  # Hidden View that renders exportable image
  export/ShareButton.tsx     # Reusable share icon button
  export/templates/          # CollectionExport, PostExport, WantedExport, CardExport
  promo/RedeemCodeForm.tsx   # Text input + redeem button component
apps/mobile/src/hooks/
  useImageExport.ts          # captureRef + shareAsync logic
apps/mobile/src/stores/
  promo.ts                   # Zustand store for redemption state
apps/api/src/services/
  promo.service.ts           # Create, validate, redeem promo codes
apps/api/src/routes/
  promo.ts                   # POST /promo/redeem (auth), admin CRUD routes
apps/api/src/db/
  schema.ts                  # Add promoCodes + promoRedemptions tables
packages/shared/src/schemas/
  promo.ts                   # Zod schemas for promo code API
```

### Pattern 1: Pull Rate Constants (Shared Package)
**What:** Hardcoded slot-based pull rate data as typed constants in the shared package
**When to use:** All probability calculations reference these constants
**Example:**
```typescript
// packages/shared/src/schemas/pull-rates.ts
// Source: Community-datamined rates (Shacknews, Game8)

export const SLOT_RATES = {
  // Slots 1-3: guaranteed 1-diamond
  slots_1_3: { diamond1: 1.0 },
  // Slot 4
  slot_4: {
    diamond2: 0.90,
    diamond3: 0.05,
    diamond4: 0.01666,
    star1: 0.02572,
    star2: 0.005,
    star3: 0.00222,
    crown: 0.0004,
  },
  // Slot 5
  slot_5: {
    diamond2: 0.60,
    diamond3: 0.20,
    diamond4: 0.06664,
    star1: 0.10288,
    star2: 0.02,
    star3: 0.00888,
    crown: 0.0016,
  },
} as const;

// God pack rate: 0.05% chance of getting a rare pack
export const GOD_PACK_RATE = 0.0005;

// In a god pack, all 5 slots use these rates:
export const GOD_PACK_SLOT_RATES = {
  star1: 0.40,
  star2: 0.50,
  star3: 0.05,
  crown: 0.05,
} as const;

/** Probability of pulling a specific card in N packs */
export function probabilityInNPacks(
  cardRarity: string,
  cardsOfSameRarityInPack: number,
  numPacks: number,
): number {
  // Per-pack probability for this specific card
  const slot4Rate = SLOT_RATES.slot_4[cardRarity as keyof typeof SLOT_RATES.slot_4] || 0;
  const slot5Rate = SLOT_RATES.slot_5[cardRarity as keyof typeof SLOT_RATES.slot_5] || 0;

  // Rate for THIS specific card (divide by number of cards sharing this rarity in the pack)
  const perPackRate = (slot4Rate + slot5Rate) / cardsOfSameRarityInPack;

  // Cumulative: 1 - (1 - p)^n
  return 1 - Math.pow(1 - perPackRate, numPacks);
}

/** Expected number of packs to reach X% probability */
export function packsForProbability(
  cardRarity: string,
  cardsOfSameRarityInPack: number,
  targetProbability: number,
): number {
  const slot4Rate = SLOT_RATES.slot_4[cardRarity as keyof typeof SLOT_RATES.slot_4] || 0;
  const slot5Rate = SLOT_RATES.slot_5[cardRarity as keyof typeof SLOT_RATES.slot_5] || 0;
  const perPackRate = (slot4Rate + slot5Rate) / cardsOfSameRarityInPack;

  if (perPackRate <= 0) return Infinity;
  // n = log(1 - target) / log(1 - p)
  return Math.ceil(Math.log(1 - targetProbability) / Math.log(1 - perPackRate));
}
```

### Pattern 2: View Capture for Image Export
**What:** Render a hidden/offscreen View, capture it with react-native-view-shot, share via expo-sharing
**When to use:** All four export types
**Example:**
```typescript
// apps/mobile/src/hooks/useImageExport.ts
import { useRef, useCallback } from 'react';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

export function useImageExport() {
  const viewRef = useRef(null);

  const exportAndShare = useCallback(async () => {
    if (!viewRef.current) return;

    const uri = await captureRef(viewRef.current, {
      format: 'png',
      quality: 1,
      result: 'tmpfile',
    });

    await Sharing.shareAsync('file://' + uri, {
      mimeType: 'image/png',
      dialogTitle: 'Share your collection',
    });
  }, []);

  return { viewRef, exportAndShare };
}
```

### Pattern 3: Promo Code DB Schema
**What:** Two tables for code management and redemption tracking
**When to use:** Promo code feature backend
**Example:**
```typescript
// Added to apps/api/src/db/schema.ts
export const promoCodes = pgTable('promo_codes', {
  id: text('id').primaryKey(),
  code: varchar('code', { length: 30 }).notNull().unique(),
  description: text('description'),
  premiumDays: integer('premium_days').notNull(),
  maxRedemptions: integer('max_redemptions'), // null = unlimited
  currentRedemptions: integer('current_redemptions').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  expiresAt: timestamp('expires_at'), // null = never expires
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('promo_codes_code_idx').on(table.code),
]);

export const promoRedemptions = pgTable('promo_redemptions', {
  id: text('id').primaryKey(),
  promoCodeId: text('promo_code_id')
    .notNull()
    .references(() => promoCodes.id),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  premiumDaysGranted: integer('premium_days_granted').notNull(),
  redeemedAt: timestamp('redeemed_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('promo_redemptions_user_code_idx').on(table.userId, table.promoCodeId),
  index('promo_redemptions_user_id_idx').on(table.userId),
]);
```

### Anti-Patterns to Avoid
- **Fetching pull rates from API:** These are static constants. Do not add a backend endpoint for pull rate data. Keep it in the shared package.
- **Using WebView for charts:** Heavy, slow startup, poor UX. Use SVG path rendering instead.
- **Saving images to gallery without user action:** App Store reviewers flag this. Only share via share sheet.
- **Exposing promo code creation to non-admin users:** Always guard with requireAdmin middleware.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| View capture to image | Canvas API / pixel manipulation | react-native-view-shot captureRef | Handles platform differences, memory management, format encoding |
| OS share sheet | Custom share UI with platform intents | expo-sharing shareAsync | Handles iOS UIActivityViewController / Android Intent.ACTION_SEND |
| Cumulative probability math | Simulation/Monte Carlo | Closed-form formula: 1-(1-p)^n | Exact, instant, no randomness needed |
| UUID generation for promo codes | Custom random string | Existing nanoid/crypto pattern from project | Consistent with existing ID generation |

**Key insight:** The probability math is pure math with no external dependencies. The image export is a well-solved problem with Expo's recommended library chain. The promo system follows existing service+route patterns exactly.

## Common Pitfalls

### Pitfall 1: View Capture of Offscreen/Hidden Content
**What goes wrong:** captureRef returns blank/empty images when the View is not actually rendered
**Why it happens:** React Native doesn't render content that is off-screen or has `display: 'none'`
**How to avoid:** Render the export template with `position: 'absolute'` and `opacity: 0` or just outside the visible area, NOT with `display: 'none'`. Set `collapsable={false}` on the target View.
**Warning signs:** Blank white/transparent images from captureRef

### Pitfall 2: Pull Rate Math -- Per-Card vs Per-Rarity
**What goes wrong:** Showing "2.57% chance" for a specific star1 card when that is the total rate for ALL star1 cards in that slot
**Why it happens:** Confusing slot rarity rate with individual card rate
**How to avoid:** Always divide the slot rate by the count of cards sharing that rarity in the specific pack. For example, if a pack has 5 star1 cards, each individual card's slot 4 rate is 2.572% / 5 = 0.5144%.
**Warning signs:** Probabilities that seem too high for rare cards

### Pitfall 3: Promo Code Premium Time Stacking
**What goes wrong:** Code redemption overwrites existing premium expiry instead of extending it
**Why it happens:** Using `setPremiumStatus(db, userId, true, newExpiry)` with a fixed date instead of extending
**How to avoid:** Check current `premiumExpiresAt`. If already premium and not expired, add days to existing expiry. If expired or not premium, add days from now.
**Warning signs:** Premium users who redeem codes losing their remaining subscription time

### Pitfall 4: Race Condition in Promo Code Redemption
**What goes wrong:** Two simultaneous requests for the same code + user both succeed
**Why it happens:** Check-then-insert without transaction isolation
**How to avoid:** Use a DB transaction with the unique constraint on `(userId, promoCodeId)` in promoRedemptions. The unique index will reject the second insert.
**Warning signs:** Users appearing in promoRedemptions twice for the same code

### Pitfall 5: expo-sharing File URI Format
**What goes wrong:** Share sheet fails or shows empty file on Android
**Why it happens:** captureRef returns a path without `file://` prefix, but expo-sharing needs it
**How to avoid:** Always prepend `file://` to the captureRef result before passing to `Sharing.shareAsync()`
**Warning signs:** "File not found" or empty share sheet on Android

## Code Examples

### Promo Code Redemption Service
```typescript
// apps/api/src/services/promo.service.ts
import { eq, and, sql } from 'drizzle-orm';
import { promoCodes, promoRedemptions, users } from '../db/schema';

export async function redeemCode(db: any, userId: string, code: string) {
  return db.transaction(async (tx: any) => {
    // 1. Find active code
    const [promo] = await tx
      .select()
      .from(promoCodes)
      .where(and(
        eq(promoCodes.code, code.toUpperCase().trim()),
        eq(promoCodes.isActive, true),
      ));

    if (!promo) throw new Error('Invalid or expired code');
    if (promo.expiresAt && promo.expiresAt < new Date()) throw new Error('Code has expired');
    if (promo.maxRedemptions && promo.currentRedemptions >= promo.maxRedemptions) {
      throw new Error('Code has reached maximum redemptions');
    }

    // 2. Check user hasn't already redeemed (unique index enforces this too)
    const [existing] = await tx
      .select()
      .from(promoRedemptions)
      .where(and(
        eq(promoRedemptions.userId, userId),
        eq(promoRedemptions.promoCodeId, promo.id),
      ));

    if (existing) throw new Error('You have already redeemed this code');

    // 3. Record redemption
    await tx.insert(promoRedemptions).values({
      id: crypto.randomUUID(),
      promoCodeId: promo.id,
      userId,
      premiumDaysGranted: promo.premiumDays,
    });

    // 4. Increment redemption count
    await tx
      .update(promoCodes)
      .set({ currentRedemptions: sql`${promoCodes.currentRedemptions} + 1` })
      .where(eq(promoCodes.id, promo.id));

    // 5. Extend premium time
    const [user] = await tx
      .select({ isPremium: users.isPremium, premiumExpiresAt: users.premiumExpiresAt })
      .from(users)
      .where(eq(users.id, userId));

    const now = new Date();
    const baseDate = (user?.isPremium && user?.premiumExpiresAt && user.premiumExpiresAt > now)
      ? user.premiumExpiresAt
      : now;
    const newExpiry = new Date(baseDate.getTime() + promo.premiumDays * 24 * 60 * 60 * 1000);

    await tx
      .update(users)
      .set({ isPremium: true, premiumExpiresAt: newExpiry, updatedAt: now })
      .where(eq(users.id, userId));

    return { premiumDays: promo.premiumDays, newExpiresAt: newExpiry };
  });
}
```

### Export Template (Collection Summary)
```typescript
// apps/mobile/src/components/export/templates/CollectionExport.tsx
// Hidden view rendered for capture -- not displayed to user
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { forwardRef } from 'react';

interface CollectionExportProps {
  setName: string;
  completionPercent: number;
  cardImages: string[];
  totalCards: number;
  ownedCards: number;
  showWatermark: boolean;
}

export const CollectionExport = forwardRef<View, CollectionExportProps>(
  ({ setName, completionPercent, cardImages, totalCards, ownedCards, showWatermark }, ref) => (
    <View ref={ref} collapsable={false} style={exportStyles.container}>
      {/* Dark branded background */}
      <View style={exportStyles.header}>
        <Text style={exportStyles.title}>{setName}</Text>
        <Text style={exportStyles.subtitle}>
          {ownedCards}/{totalCards} ({completionPercent}%)
        </Text>
      </View>
      {/* Card grid */}
      <View style={exportStyles.grid}>
        {cardImages.slice(0, 20).map((uri, i) => (
          <Image key={i} source={{ uri }} style={exportStyles.thumb} />
        ))}
      </View>
      {/* Watermark */}
      {showWatermark && (
        <Text style={exportStyles.watermark}>Pocket Trade Hub</Text>
      )}
    </View>
  )
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| expo-capture-screen (deprecated) | react-native-view-shot + captureRef | Expo SDK 50+ | Use captureRef from react-native-view-shot directly |
| Share.share (RN built-in, text only) | expo-sharing (supports files) | Expo SDK 48+ | Built-in Share API cannot share files/images, must use expo-sharing |
| WebView-based charts | react-native-svg + direct Path | 2024+ | No WebView overhead for simple visualizations |

**Deprecated/outdated:**
- `Expo.takeSnapshotAsync`: Removed in SDK 48+, replaced by `captureRef` from react-native-view-shot
- `react-native-share` (community): Still works but expo-sharing is simpler for Expo projects

## Open Questions

1. **Exact card count per rarity per pack**
   - What we know: Pull rates per slot are documented. Individual card probability requires knowing how many cards share that rarity in a specific pack.
   - What's unclear: Whether to hardcode per-set rarity counts or compute from the card database at runtime.
   - Recommendation: Compute from the cards table at runtime -- the data is already there (count cards by rarity per setId). This avoids maintaining a separate rarity-count constant per set.

2. **RevenueCat interaction with code-granted premium**
   - What we know: Current premium system uses RevenueCat webhooks to set isPremium + premiumExpiresAt on the user record.
   - What's unclear: If a user redeems a code and then also subscribes via RevenueCat, or vice versa, the dates could conflict.
   - Recommendation: Treat code-granted time as additive. RevenueCat webhook EXPIRATION should only clear premium if premiumExpiresAt has actually passed (check the date, don't blindly set false). This requires a small guard in handleWebhookEvent.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29 + ts-jest |
| Config file | `apps/api/jest.config.js` |
| Quick run command | `cd apps/api && npx jest --testPathPattern="promo" -x` |
| Full suite command | `cd apps/api && npx jest` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INTL-05 | Probability math correctness | unit | `cd apps/api && npx jest --testPathPattern="pull-rates" -x` | No - Wave 0 |
| INTL-05 | Pull rate constants sum to ~1.0 per slot | unit | (same as above) | No - Wave 0 |
| DISC-03 | Image export (view capture) | manual-only | Manual: verify images render correctly on device | N/A |
| DISC-03 | Watermark presence for free users | manual-only | Manual: visual check on device | N/A |
| DISC-04 | Promo code creation (admin) | unit | `cd apps/api && npx jest --testPathPattern="promo" -x` | No - Wave 0 |
| DISC-04 | Promo code redemption (valid code) | unit | (same as above) | No - Wave 0 |
| DISC-04 | Promo code redemption (duplicate prevention) | unit | (same as above) | No - Wave 0 |
| DISC-04 | Promo code redemption (expired/inactive) | unit | (same as above) | No - Wave 0 |
| DISC-04 | Premium time extension (stacking) | unit | (same as above) | No - Wave 0 |
| DISC-04 | Promo code max redemption limit | unit | (same as above) | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `cd apps/api && npx jest --testPathPattern="promo|pull-rates" -x`
- **Per wave merge:** `cd apps/api && npx jest`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `packages/shared/src/__tests__/pull-rates.test.ts` -- covers INTL-05 math
- [ ] `apps/api/__tests__/services/promo.service.test.ts` -- covers DISC-04 backend
- [ ] `apps/api/__tests__/routes/promo.route.test.ts` -- covers DISC-04 API routes
- [ ] DISC-03 is primarily UI/visual -- manual testing only, no automated test gaps

## Sources

### Primary (HIGH confidence)
- [Expo captureRef docs](https://docs.expo.dev/versions/latest/sdk/captureRef/) -- react-native-view-shot usage and installation
- [Expo Sharing docs](https://docs.expo.dev/versions/latest/sdk/sharing/) -- expo-sharing API and limitations
- [Shacknews Pokemon TCG Pocket drop rates](https://www.shacknews.com/article/142035/pokemon-trading-card-game-pocket-card-drop-chance-rate) -- Slot-based pull rate percentages
- [Game8 Rare Packs rates](https://game8.co/games/Pokemon-TCG-Pocket/archives/477126) -- God pack rates and rarity distribution
- Existing codebase: `apps/api/src/db/schema.ts`, `apps/api/src/services/premium.service.ts`, `apps/api/src/routes/admin.ts`, `apps/mobile/src/components/cards/CardDetailModal.tsx`

### Secondary (MEDIUM confidence)
- [Expo SDK 54 changelog](https://expo.dev/changelog/sdk-54) -- SDK compatibility verification
- [react-native-view-shot GitHub](https://github.com/gre/react-native-view-shot) -- collapsable={false} requirement, format options

### Tertiary (LOW confidence)
- Pull rate exact values may shift with new Pokemon TCG Pocket updates. The slot structure (1-3 guaranteed, 4 variable, 5 enhanced) is well-established but exact percentages are community-datamined, not officially published by Nintendo/DeNA.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Expo docs directly recommend react-native-view-shot + expo-sharing
- Architecture: HIGH - Follows existing project patterns (service+route, Zustand stores, shared schemas)
- Pitfalls: HIGH - Well-documented community issues with captureRef, math is verifiable
- Pull rate data: MEDIUM - Community-datamined, not official, but widely corroborated across multiple sources

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable libraries; pull rates may need updating if new Pokemon TCG Pocket expansion changes slot structure)
