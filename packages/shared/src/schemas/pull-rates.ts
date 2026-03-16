// Pokemon TCG Pocket slot-based pull rates
// Source: Community-datamined rates (Shacknews, Game8)

/**
 * Pack slot rates by rarity.
 * - Slots 1-3: always diamond1 (guaranteed)
 * - Slot 4: variable rarity
 * - Slot 5: enhanced rates for rarer cards
 */
export const SLOT_RATES = {
  // Slots 1-3: guaranteed 1-diamond
  slots_1_3: { diamond1: 1.0 } as const,
  // Slot 4
  slot_4: {
    diamond2: 0.90,
    diamond3: 0.05,
    diamond4: 0.01666,
    star1: 0.02572,
    star2: 0.005,
    star3: 0.00222,
    crown: 0.0004,
  } as const,
  // Slot 5
  slot_5: {
    diamond2: 0.60,
    diamond3: 0.20,
    diamond4: 0.06664,
    star1: 0.10288,
    star2: 0.02,
    star3: 0.00888,
    crown: 0.0016,
  } as const,
} as const;

/** God pack rate: 0.05% chance of getting a rare pack */
export const GOD_PACK_RATE = 0.0005;

/** In a god pack, all 5 slots use these rates */
export const GOD_PACK_SLOT_RATES = {
  star1: 0.40,
  star2: 0.50,
  star3: 0.05,
  crown: 0.05,
} as const;

/**
 * Probability of pulling a specific card in N packs.
 * Uses cumulative probability: 1 - (1-p)^n
 *
 * For diamond1 rarity, returns 1.0 (guaranteed in slots 1-3 of every pack).
 */
export function probabilityInNPacks(
  cardRarity: string,
  cardsOfSameRarityInPack: number,
  numPacks: number,
): number {
  // diamond1 cards are guaranteed in slots 1-3 of every pack
  if (cardRarity === 'diamond1') {
    return numPacks > 0 ? 1.0 : 0;
  }

  const slot4Rate = SLOT_RATES.slot_4[cardRarity as keyof typeof SLOT_RATES.slot_4] ?? 0;
  const slot5Rate = SLOT_RATES.slot_5[cardRarity as keyof typeof SLOT_RATES.slot_5] ?? 0;

  // Rate for THIS specific card (divide by number of cards sharing this rarity in the pack)
  const perPackRate = (slot4Rate + slot5Rate) / cardsOfSameRarityInPack;

  if (perPackRate <= 0) return 0;

  // Cumulative: 1 - (1 - p)^n
  return 1 - Math.pow(1 - perPackRate, numPacks);
}

/**
 * Expected number of packs to reach a target probability for a specific card.
 * Uses inverse formula: ceil(log(1-target) / log(1-p))
 *
 * Returns Infinity if the card cannot appear in slot 4/5 (e.g. diamond1).
 */
export function packsForProbability(
  cardRarity: string,
  cardsOfSameRarityInPack: number,
  targetProbability: number,
): number {
  // diamond1 is guaranteed but doesn't appear in slot 4/5 rates
  if (cardRarity === 'diamond1') {
    return Infinity;
  }

  const slot4Rate = SLOT_RATES.slot_4[cardRarity as keyof typeof SLOT_RATES.slot_4] ?? 0;
  const slot5Rate = SLOT_RATES.slot_5[cardRarity as keyof typeof SLOT_RATES.slot_5] ?? 0;
  const perPackRate = (slot4Rate + slot5Rate) / cardsOfSameRarityInPack;

  if (perPackRate <= 0) return Infinity;

  // n = ceil(log(1 - target) / log(1 - p))
  return Math.ceil(Math.log(1 - targetProbability) / Math.log(1 - perPackRate));
}
