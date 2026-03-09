import { calculateFairness, RARITY_WEIGHTS } from '../schemas/fairness';

describe('calculateFairness', () => {
  it('returns Unfair when giving crown for diamond1', () => {
    const result = calculateFairness(
      [{ rarity: 'crown' }],
      [{ rarity: 'diamond1' }],
    );
    // getValue=1, total=101, score=1
    expect(result.score).toBeLessThan(20);
    expect(result.label).toBe('Unfair');
  });

  it('returns Great for equal rarity trades', () => {
    const result = calculateFairness(
      [{ rarity: 'star1' }],
      [{ rarity: 'star1' }],
    );
    expect(result.score).toBe(50);
    expect(result.label).toBe('Great');
  });

  it('returns Fair for both empty arrays', () => {
    const result = calculateFairness([], []);
    expect(result.score).toBe(50);
    expect(result.label).toBe('Fair');
  });

  it('returns Great for single card each with same rarity', () => {
    const result = calculateFairness(
      [{ rarity: 'diamond3' }],
      [{ rarity: 'diamond3' }],
    );
    expect(result.score).toBe(50);
    expect(result.label).toBe('Great');
  });

  it('returns Fair for moderately mismatched rarities', () => {
    // giving star2(30), getting star1(15) => score = 15/45*100 = 33 => Fair (between 20-80 but not 35-65)
    const result = calculateFairness(
      [{ rarity: 'star2' }],
      [{ rarity: 'star1' }],
    );
    expect(result.score).toBeGreaterThanOrEqual(20);
    expect(result.score).toBeLessThan(35);
    expect(result.label).toBe('Fair');
  });

  it('handles multiple cards', () => {
    const result = calculateFairness(
      [{ rarity: 'diamond1' }, { rarity: 'diamond1' }],
      [{ rarity: 'diamond2' }],
    );
    // giveValue=2, getValue=2, score=50
    expect(result.score).toBe(50);
    expect(result.label).toBe('Great');
  });

  it('exports RARITY_WEIGHTS with correct values', () => {
    expect(RARITY_WEIGHTS.diamond1).toBe(1);
    expect(RARITY_WEIGHTS.crown).toBe(100);
    expect(RARITY_WEIGHTS.star3).toBe(60);
  });
});
