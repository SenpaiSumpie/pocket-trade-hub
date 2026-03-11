import { Ionicons } from '@expo/vector-icons';

interface PremiumBadgeProps {
  size?: number;
}

export function PremiumBadge({ size = 16 }: PremiumBadgeProps) {
  return <Ionicons name="diamond" size={size} color="#f0c040" />;
}
