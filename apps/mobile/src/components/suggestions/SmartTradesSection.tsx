import { useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useSuggestionsStore } from '@/src/stores/suggestions';
import { SuggestionCard } from './SuggestionCard';
import { LockedFeatureCard } from '@/src/components/premium/LockedFeatureCard';
import { colors, typography, spacing, borderRadius } from '@/src/constants/theme';
import type { TradeSuggestion } from '@pocket-trade-hub/shared';

export function SmartTradesSection() {
  const { t } = useTranslation();
  const suggestions = useSuggestionsStore((s) => s.suggestions);
  const isPremium = useSuggestionsStore((s) => s.isPremium);
  const loading = useSuggestionsStore((s) => s.loading);
  const fetchSuggestions = useSuggestionsStore((s) => s.fetchSuggestions);

  const renderItem = useCallback(
    ({ item }: { item: TradeSuggestion }) => <SuggestionCard suggestion={item} />,
    [],
  );

  const keyExtractor = useCallback((item: TradeSuggestion) => item.id, []);

  // Loading state
  if (loading && suggestions.length === 0) {
    return (
      <View>
        <View style={styles.header}>
          <Ionicons name="flash" size={20} color={colors.primary} />
          <Text style={styles.headerText}>{t('suggestions.smartTrades')}</Text>
        </View>
        <View style={styles.skeletonRow}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <ActivityIndicator size="small" color={colors.textMuted} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  // Free user: show blurred preview with upgrade CTA
  if (!isPremium) {
    return (
      <View>
        <View style={styles.header}>
          <Ionicons name="flash" size={20} color={colors.primary} />
          <Text style={styles.headerText}>{t('suggestions.smartTrades')}</Text>
        </View>
        <View style={styles.lockedContainer}>
          <View style={styles.blurredPreview}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.blurredCard}>
                <View style={styles.blurredImage} />
                <View style={styles.blurredLine} />
                <View style={styles.blurredLineShort} />
              </View>
            ))}
          </View>
          <View style={styles.overlay}>
            <LockedFeatureCard
              title={t('suggestions.unlock')}
              description={t('suggestions.unlockDescription')}
              icon="flash"
              onPress={() => router.push('/(tabs)/profile')}
            />
          </View>
        </View>
      </View>
    );
  }

  // Premium but no suggestions
  if (suggestions.length === 0) {
    return (
      <View>
        <View style={styles.header}>
          <Ionicons name="flash" size={20} color={colors.primary} />
          <Text style={styles.headerText}>{t('suggestions.smartTrades')}</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="bulb-outline" size={32} color={colors.textMuted} />
          <Text style={styles.emptyText}>{t('suggestions.noSuggestions')}</Text>
          <Text style={styles.emptySubtext}>{t('suggestions.addMoreCards')}</Text>
        </View>
      </View>
    );
  }

  // Premium with suggestions
  return (
    <View>
      <View style={styles.header}>
        <Ionicons name="flash" size={20} color={colors.primary} />
        <Text style={styles.headerText}>{t('suggestions.smartTrades')}</Text>
      </View>
      <FlatList
        data={suggestions}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={() => fetchSuggestions(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  headerText: {
    ...typography.subheading,
    fontSize: 18,
  },
  listContent: {
    paddingRight: spacing.md,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  skeletonCard: {
    width: 280,
    height: 180,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  lockedContainer: {
    position: 'relative',
    minHeight: 140,
  },
  blurredPreview: {
    flexDirection: 'row',
    gap: spacing.md,
    opacity: 0.3,
  },
  blurredCard: {
    width: 280,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  blurredImage: {
    width: '100%',
    height: 80,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  blurredLine: {
    width: '80%',
    height: 12,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  blurredLineShort: {
    width: '50%',
    height: 10,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontWeight: '500',
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    maxWidth: 260,
  },
});
