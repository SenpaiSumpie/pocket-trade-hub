import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useCollectionStore } from '@/src/stores/collection';
import { useLoadCollection } from '@/src/hooks/useCollection';
import { usePremiumStore } from '@/src/stores/premium';
import { useImageExport } from '@/src/hooks/useImageExport';
import { ExportRenderer } from '@/src/components/export/ExportRenderer';
import { ShareButton } from '@/src/components/export/ShareButton';
import { CollectionExport } from '@/src/components/export/templates/CollectionExport';
import { colors, typography, spacing, borderRadius } from '@/src/constants/theme';
import { useMemo } from 'react';

export default function CollectionSummary() {
  const { t } = useTranslation();
  useLoadCollection();

  const collectionByCardId = useCollectionStore((s) => s.collectionByCardId);
  const progressBySet = useCollectionStore((s) => s.progressBySet);
  const isPremium = usePremiumStore((s) => s.isPremium);
  const { viewRef: exportRef, exportAndShare, exporting } = useImageExport();

  const stats = useMemo(() => {
    const totalUniqueCards = Object.keys(collectionByCardId).length;

    const setEntries = Object.entries(progressBySet);
    const totalCards = setEntries.reduce((sum, [, s]) => sum + s.total, 0);
    const overallCompletion = totalCards > 0 ? Math.round((totalUniqueCards / totalCards) * 100) : 0;

    const setsInProgress = setEntries
      .filter(([, s]) => s.owned > 0 && s.owned < s.total)
      .map(([id, s]) => ({ id, ...s }))
      .sort((a, b) => b.owned / b.total - a.owned / a.total);

    return { totalUniqueCards, totalCards, overallCompletion, setsInProgress };
  }, [collectionByCardId, progressBySet]);

  const isEmpty = stats.totalUniqueCards === 0;

  if (isEmpty) {
    return (
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Ionicons name="albums" size={22} color={colors.primary} />
          <Text style={styles.title}>{t('cards.myCollection')}</Text>
        </View>
        <Text style={styles.emptyText}>
          {t('cards.noCardsInCollection')}
        </Text>
      </View>
    );
  }

  const displayedSets = stats.setsInProgress.slice(0, 3);
  const remainingSets = stats.setsInProgress.length - 3;

  return (
    <View style={styles.card}>
      {/* Offscreen export renderer */}
      <ExportRenderer ref={exportRef}>
        <CollectionExport
          setName={t('cards.myCollection')}
          completionPercent={stats.overallCompletion}
          cardImages={[]}
          totalCards={stats.totalCards}
          ownedCards={stats.totalUniqueCards}
          showWatermark={!isPremium}
        />
      </ExportRenderer>

      <View style={styles.titleRow}>
        <Ionicons name="albums" size={22} color={colors.primary} />
        <Text style={styles.title}>{t('cards.myCollection')}</Text>
        <View style={styles.titleSpacer} />
        <ShareButton
          onPress={() => exportAndShare('Share Collection')}
          loading={exporting}
          size={18}
        />
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalUniqueCards}</Text>
          <Text style={styles.statLabel}>{t('home.totalCards')}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {stats.overallCompletion}%
          </Text>
          <Text style={styles.statLabel}>{t('home.completionRate')}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.setsInProgress.length}</Text>
          <Text style={styles.statLabel}>{t('home.setsStarted')}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.overallBar}>
        <View style={[styles.overallBarFill, { width: `${Math.min(stats.overallCompletion, 100)}%` }]} />
      </View>

      {/* Sets in progress */}
      {displayedSets.length > 0 && (
        <View style={styles.setsSection}>
          {displayedSets.map((s) => {
            const pct = s.total > 0 ? Math.round((s.owned / s.total) * 100) : 0;
            return (
              <View key={s.id} style={styles.setRow}>
                <Text style={styles.setName} numberOfLines={1}>
                  {s.setName}
                </Text>
                <View style={styles.setBarContainer}>
                  <View style={styles.setBar}>
                    <View style={[styles.setBarFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={styles.setCount}>
                    {s.owned}/{s.total}
                  </Text>
                </View>
              </View>
            );
          })}
          {remainingSets > 0 && (
            <Text style={styles.moreText}>and {remainingSets} more</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.subheading,
    fontSize: 18,
  },
  titleSpacer: {
    flex: 1,
  },
  emptyText: {
    ...typography.caption,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  statLabel: {
    ...typography.caption,
    fontSize: 11,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  overallBar: {
    height: 6,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  overallBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  setsSection: {
    gap: spacing.sm,
  },
  setRow: {
    gap: spacing.xs,
  },
  setName: {
    ...typography.caption,
    fontSize: 12,
  },
  setBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  setBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  setBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  setCount: {
    ...typography.caption,
    fontSize: 11,
    width: 40,
    textAlign: 'right',
  },
  moreText: {
    ...typography.caption,
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
});
