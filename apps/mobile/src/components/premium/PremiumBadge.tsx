import { Diamond } from 'phosphor-react-native';

interface PremiumBadgeProps {
  size?: number;
}

export function PremiumBadge({ size = 16 }: PremiumBadgeProps) {
  return <Diamond size={size} color="#f0c040" weight="fill" />;
}
