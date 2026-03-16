import {
  SLOT_RATES,
  GOD_PACK_RATE,
  GOD_PACK_SLOT_RATES,
  probabilityInNPacks,
  packsForProbability,
} from '../schemas/pull-rates';

describe('pull-rates', () => {
  describe('SLOT_RATES constants', () => {
    it('slot_4 values sum to approximately 1.0', () => {
      const sum = Object.values(SLOT_RATES.slot_4).reduce<number>((a, b) => a + (b as number), 0);
      expect(sum).toBeCloseTo(1.0, 2);
    });

    it('slot_5 values sum to approximately 1.0', () => {
      const sum = Object.values(SLOT_RATES.slot_5).reduce<number>((a, b) => a + (b as number), 0);
      expect(sum).toBeCloseTo(1.0, 2);
    });

    it('GOD_PACK_RATE is 0.05%', () => {
      expect(GOD_PACK_RATE).toBe(0.0005);
    });

    it('GOD_PACK_SLOT_RATES values sum to approximately 1.0', () => {
      const sum = Object.values(GOD_PACK_SLOT_RATES).reduce<number>((a, b) => a + (b as number), 0);
      expect(sum).toBeCloseTo(1.0, 2);
    });
  });

  describe('probabilityInNPacks', () => {
    it('returns 0 for 0 packs', () => {
      expect(probabilityInNPacks('star1', 5, 0)).toBe(0);
    });

    it('returns value approaching 1.0 for very high pack count', () => {
      const result = probabilityInNPacks('star1', 5, 10000);
      expect(result).toBeGreaterThan(0.99);
      expect(result).toBeLessThanOrEqual(1.0);
    });

    it('returns 1.0 for diamond1 rarity (guaranteed in slots 1-3)', () => {
      // diamond1 is guaranteed in every pack via slots 1-3
      // probabilityInNPacks should return 1.0 for diamond1
      expect(probabilityInNPacks('diamond1', 5, 1)).toBe(1.0);
      expect(probabilityInNPacks('diamond1', 5, 100)).toBe(1.0);
    });

    it('returns correct cumulative probability for known rarity', () => {
      // For star2 with 3 cards of same rarity:
      // slot4Rate = 0.005, slot5Rate = 0.02, perPackRate = 0.025 / 3
      // P(1 pack) = 1 - (1 - 0.025/3)^1
      const perPackRate = (0.005 + 0.02) / 3;
      const expected = 1 - Math.pow(1 - perPackRate, 1);
      expect(probabilityInNPacks('star2', 3, 1)).toBeCloseTo(expected, 10);
    });

    it('per-card rate correctly divides by cardsOfSameRarityInPack', () => {
      // More cards of same rarity = lower individual probability
      const prob5 = probabilityInNPacks('star1', 5, 10);
      const prob10 = probabilityInNPacks('star1', 10, 10);
      expect(prob5).toBeGreaterThan(prob10);
    });
  });

  describe('packsForProbability', () => {
    it('returns correct expected packs for 50% probability on known rarity', () => {
      // For star2 with 3 cards of same rarity:
      // perPackRate = (0.005 + 0.02) / 3 = 0.025 / 3
      // n = ceil(log(1 - 0.5) / log(1 - 0.025/3))
      const perPackRate = (0.005 + 0.02) / 3;
      const expected = Math.ceil(Math.log(1 - 0.5) / Math.log(1 - perPackRate));
      expect(packsForProbability('star2', 3, 0.5)).toBe(expected);
    });

    it('returns Infinity for diamond1 (not in slot 4 or 5 rates)', () => {
      // diamond1 has 0 rate in slot_4 and slot_5, so perPackRate = 0
      // packsForProbability should return Infinity
      expect(packsForProbability('diamond1', 5, 0.5)).toBe(Infinity);
    });

    it('returns higher pack count for higher target probability', () => {
      const packs50 = packsForProbability('star1', 5, 0.5);
      const packs90 = packsForProbability('star1', 5, 0.9);
      expect(packs90).toBeGreaterThan(packs50);
    });
  });
});
