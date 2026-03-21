import { TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { ShareNetwork } from 'phosphor-react-native';
import { colors } from '@/src/constants/theme';

interface ShareButtonProps {
  onPress: () => void;
  loading?: boolean;
  size?: number;
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

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
        <ShareNetwork size={size} color={colors.textSecondary} weight="regular" />
      )}
    </TouchableOpacity>
  );
}
