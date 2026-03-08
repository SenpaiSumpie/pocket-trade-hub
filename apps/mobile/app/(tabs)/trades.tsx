import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/src/constants/theme';

export default function TradesScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="swap-horizontal-outline" size={64} color={colors.textMuted} />
      <Text style={styles.title}>Trades</Text>
      <Text style={styles.subtitle}>Coming soon</Text>
      <Text style={styles.description}>
        Find and propose trades with other players in the community.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  title: {
    ...typography.subheading,
    marginTop: spacing.md,
  },
  subtitle: {
    ...typography.caption,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    maxWidth: 280,
  },
});
