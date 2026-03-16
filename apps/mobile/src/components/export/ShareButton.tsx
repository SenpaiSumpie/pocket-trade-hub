import { TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/constants/theme';

interface ShareButtonProps {
  onPress: () => void;
  loading?: boolean;
  size?: number;
}

export function ShareButton({ onPress, loading = false, size = 22 }: ShareButtonProps) {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Ionicons name="share-outline" size={size} color={colors.textSecondary} />
      )}
    </TouchableOpacity>
  );
}
