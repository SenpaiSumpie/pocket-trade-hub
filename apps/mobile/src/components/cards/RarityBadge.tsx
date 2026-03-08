import { Text, StyleSheet } from 'react-native';

interface RarityBadgeProps {
  rarity: string | null;
  size?: 'sm' | 'lg';
}

const DIAMOND = '\u2666';
const STAR = '\u2605';
const CROWN = '\uD83D\uDC51';

function getRarityDisplay(rarity: string | null): { text: string; color: string } {
  if (!rarity) return { text: '', color: '#a0a0b8' };

  switch (rarity) {
    case 'diamond1':
      return { text: DIAMOND, color: '#7ec8e3' };
    case 'diamond2':
      return { text: DIAMOND.repeat(2), color: '#7ec8e3' };
    case 'diamond3':
      return { text: DIAMOND.repeat(3), color: '#7ec8e3' };
    case 'diamond4':
      return { text: DIAMOND.repeat(4), color: '#7ec8e3' };
    case 'star1':
      return { text: STAR, color: '#f0c040' };
    case 'star2':
      return { text: STAR.repeat(2), color: '#f0c040' };
    case 'star3':
      return { text: STAR.repeat(3), color: '#f0c040' };
    case 'crown':
      return { text: CROWN, color: '#e8b4f8' };
    default:
      return { text: '', color: '#a0a0b8' };
  }
}

export function RarityBadge({ rarity, size = 'sm' }: RarityBadgeProps) {
  const { text, color } = getRarityDisplay(rarity);
  if (!text) return null;

  return (
    <Text style={[styles.badge, size === 'lg' && styles.large, { color }]}>
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    fontSize: 12,
    letterSpacing: 1,
  },
  large: {
    fontSize: 20,
    letterSpacing: 2,
  },
});
