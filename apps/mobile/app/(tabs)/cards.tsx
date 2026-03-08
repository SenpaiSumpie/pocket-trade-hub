import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/src/constants/theme';

export default function CardsScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="albums-outline" size={64} color={colors.textMuted} />
      <Text style={styles.title}>Cards</Text>
      <Text style={styles.subtitle}>Coming soon</Text>
      <Text style={styles.description}>
        Browse and manage your Pokemon TCG Pocket card collection.
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
