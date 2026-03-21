import { TouchableOpacity, Text, View, StyleSheet, Platform, ToastAndroid } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Copy } from 'phosphor-react-native';
import Toast from 'react-native-toast-message';
import { colors, spacing, borderRadius } from '@/src/constants/theme';

interface FriendCodeBadgeProps {
  code: string;
  size?: 'small' | 'large';
}

export default function FriendCodeBadge({ code, size = 'large' }: FriendCodeBadgeProps) {
  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    if (Platform.OS === 'android') {
      ToastAndroid.show('Copied!', ToastAndroid.SHORT);
    } else {
      Toast.show({
        type: 'success',
        text1: 'Copied!',
        text2: 'Friend code copied to clipboard',
        visibilityTime: 1500,
      });
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, size === 'small' && styles.containerSmall]}
      onPress={handleCopy}
      activeOpacity={0.7}
    >
      <View style={styles.codeRow}>
        <Text style={[styles.code, size === 'small' && styles.codeSmall]}>
          {code}
        </Text>
        <Copy
          size={size === 'small' ? 14 : 18}
          color={colors.textSecondary}
          weight="regular"
        />
      </View>
      <Text style={styles.hint}>Tap to copy</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  containerSmall: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  code: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 18,
    color: colors.text,
    letterSpacing: 1,
    fontWeight: '600',
  },
  codeSmall: {
    fontSize: 14,
  },
  hint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
