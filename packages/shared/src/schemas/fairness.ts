export const RARITY_WEIGHTS: Record<string, number> = {
  diamond1: 1,
  diamond2: 2,
  diamond3: 4,
  diamond4: 8,
  star1: 15,
  star2: 30,
  star3: 60,
  crown: 100,
};

export interface FairnessCard {
  rarity: string;
}

export interface FairnessResult {
  score: number;
  label: 'Unfair' | 'Fair' | 'Great';
}

export function calculateFairness(
  givingCards: FairnessCard[],
  gettingCards: FairnessCard[],
): FairnessResult {
  if (givingCards.length === 0 && gettingCards.length === 0) {
    return { score: 50, label: 'Fair' };
  }

  const giveValue = givingCards.reduce(
    (sum, card) => sum + (RARITY_WEIGHTS[card.rarity] || 1),
    0,
  );
  const getValue = gettingCards.reduce(
    (sum, card) => sum + (RARITY_WEIGHTS[card.rarity] || 1),
    0,
  );

  const total = giveValue + getValue;
  const score = total === 0 ? 50 : Math.round((getValue / total) * 100);

  let label: FairnessResult['label'];
  if (score >= 35 && score <= 65) {
    label = 'Great';
  } else if (score >= 20 && score <= 80) {
    label = 'Fair';
  } else {
    label = 'Unfair';
  }

  return { score, label };
}
