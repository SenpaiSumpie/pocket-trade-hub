import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAuthStore } from '@/src/stores/auth';
import { colors, typography, spacing, borderRadius } from '@/src/constants/theme';

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const displayName = user?.displayName || 'Trainer';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.welcome}>Welcome, {displayName}!</Text>
      <Text style={styles.subtitle}>Your trading dashboard</Text>

      {/* Placeholder -- SetupChecklist will be added in Task 2 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Getting Started</Text>
        <Text style={styles.sectionText}>
          Complete your profile setup to get the most out of Pocket Trade Hub.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  welcome: {
    ...typography.heading,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    marginBottom: spacing.xl,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.subheading,
    marginBottom: spacing.sm,
  },
  sectionText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
