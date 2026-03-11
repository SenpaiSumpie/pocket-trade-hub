import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '@/src/stores/auth';
import SetupChecklist from '@/src/components/SetupChecklist';
import CollectionSummary from '@/src/components/cards/CollectionSummary';
import { LockedFeatureCard } from '@/src/components/premium/LockedFeatureCard';
import { usePremiumStore } from '@/src/stores/premium';
import { colors, typography, spacing, borderRadius } from '@/src/constants/theme';

interface PreviewCard {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
}

const PREVIEWS: PreviewCard[] = [
  {
    icon: 'albums',
    title: 'Cards Database',
    description: 'Browse all Pokemon TCG Pocket cards and manage your collection.',
    color: '#3498db',
  },
  {
    icon: 'git-compare',
    title: 'Trade Matching',
    description: 'Find players who have cards you want and want cards you have.',
    color: '#2ecc71',
  },
  {
    icon: 'paper-plane',
    title: 'Trade Proposals',
    description: 'Send and receive trade proposals with built-in friend code sharing.',
    color: '#e74c3c',
  },
];

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const displayName = user?.displayName || 'Trainer';
  const isPremium = usePremiumStore((s) => s.isPremium);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.welcome}>Welcome, {displayName}!</Text>
      <Text style={styles.subtitle}>Your trading dashboard</Text>

      {/* Setup Checklist */}
      {user && (
        <View style={styles.section}>
          <SetupChecklist user={user} />
        </View>
      )}

      {/* Collection Summary (requires auth) */}
      {isLoggedIn && (
        <View style={styles.section}>
          <CollectionSummary />
        </View>
      )}

      {/* Analytics Section */}
      {isLoggedIn && (
        <View style={styles.section}>
          {isPremium ? (
            <TouchableOpacity
              style={styles.analyticsCard}
              onPress={() => router.push('/analytics' as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.previewIcon, { backgroundColor: '#f0c04020' }]}>
                <Ionicons name="analytics" size={28} color={colors.primary} />
              </View>
              <View style={styles.previewContent}>
                <Text style={styles.previewTitle}>Card Analytics</Text>
                <Text style={styles.previewDescription}>
                  See which cards are most wanted, least available, and trending
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ) : (
            <LockedFeatureCard
              title="Card Analytics"
              description="See which cards are most wanted, least available, and trending"
              icon="analytics"
              onPress={() => router.push('/(tabs)/profile')}
            />
          )}
        </View>
      )}

      {/* Coming Soon Previews */}
      <Text style={styles.previewsTitle}>Coming Soon</Text>
      {PREVIEWS.map((preview, index) => (
        <View key={index} style={styles.previewCard}>
          <View style={[styles.previewIcon, { backgroundColor: preview.color + '20' }]}>
            <Ionicons name={preview.icon} size={28} color={preview.color} />
          </View>
          <View style={styles.previewContent}>
            <Text style={styles.previewTitle}>{preview.title}</Text>
            <Text style={styles.previewDescription}>{preview.description}</Text>
          </View>
        </View>
      ))}
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
    paddingBottom: spacing.xxl,
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
    marginBottom: spacing.lg,
  },
  previewsTitle: {
    ...typography.subheading,
    marginBottom: spacing.md,
  },
  analyticsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  previewCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  previewIcon: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewContent: {
    flex: 1,
  },
  previewTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  previewDescription: {
    ...typography.caption,
    lineHeight: 18,
  },
});
