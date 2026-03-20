import { View, Text, Modal, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius } from '@/src/constants/theme';
import { useMetaStore } from '@/src/stores/meta';
import { PaywallCard } from '@/src/components/premium/PaywallCard';
import type { DeckMeta } from '@pocket-trade-hub/shared';

interface DeckDetailModalProps {
  visible: boolean;
  onClose: () => void;
  deck: DeckMeta | null;
}

export function DeckDetailModal({ visible, onClose, deck }: DeckDetailModalProps) {
  const { t } = useTranslation();
  const isPremium = useMetaStore((s) => s.isPremium);

  if (!deck) return null;

  const formatRate = (rate: number | null): string => {
    if (rate === null) return '--';
    return (rate / 100).toFixed(1) + '%';
  };

  const topCards = deck.cards
    ? (Array.isArray(deck.cards) ? deck.cards : []).slice(0, 3)
    : [];

  const allCards = deck.cards
    ? (Array.isArray(deck.cards) ? deck.cards : [])
    : [];

  const matchups = deck.matchups
    ? (Array.isArray(deck.matchups) ? deck.matchups : [])
    : [];

  const tournamentResults = deck.tournamentResults
    ? (Array.isArray(deck.tournamentResults) ? deck.tournamentResults : [])
    : [];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {deck.name}
          </Text>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Stats grid - visible to all */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statBoxLabel}>{t('meta.winRate')}</Text>
              <Text style={styles.statBoxValue}>{formatRate(deck.winRate)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBoxLabel}>{t('meta.usageRate')}</Text>
              <Text style={styles.statBoxValue}>{formatRate(deck.usageRate)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBoxLabel}>{t('meta.playCount')}</Text>
              <Text style={styles.statBoxValue}>
                {deck.playCount !== null ? deck.playCount.toLocaleString() : '--'}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBoxLabel}>{t('meta.matchRecord')}</Text>
              <Text style={styles.statBoxValue}>{deck.matchRecord ?? '--'}</Text>
            </View>
          </View>

          {/* Top 3 cards - visible to all */}
          {topCards.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('meta.topCards')}</Text>
              {topCards.map((card: any, idx: number) => (
                <View key={idx} style={styles.cardRow}>
                  <Text style={styles.cardName}>{card.name || card}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Premium sections */}
          {isPremium ? (
            <>
              {/* Full card list */}
              {allCards.length > 3 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t('meta.fullCardList')}</Text>
                  {allCards.map((card: any, idx: number) => (
                    <View key={idx} style={styles.cardRow}>
                      <Text style={styles.cardName}>{card.name || card}</Text>
                      {card.quantity && (
                        <Text style={styles.cardQuantity}>x{card.quantity}</Text>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Matchup data */}
              {matchups.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t('meta.matchups')}</Text>
                  {matchups.map((mu: any, idx: number) => (
                    <View key={idx} style={styles.matchupRow}>
                      <Text style={styles.matchupName}>{mu.opponent || mu.name}</Text>
                      <Text
                        style={[
                          styles.matchupRate,
                          { color: (mu.winRate ?? 0) >= 5000 ? colors.success : colors.error },
                        ]}
                      >
                        {formatRate(mu.winRate ?? null)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Tournament results */}
              {tournamentResults.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t('meta.tournamentResults')}</Text>
                  {tournamentResults.map((tr: any, idx: number) => (
                    <View key={idx} style={styles.tournamentRow}>
                      <Text style={styles.tournamentName}>{tr.name || tr.tournament}</Text>
                      <Text style={styles.tournamentPlace}>{tr.placement || tr.place}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : (
            /* Premium teaser for non-premium users */
            <View style={styles.premiumSection}>
              <View style={styles.blurOverlay}>
                <Ionicons name="lock-closed" size={32} color={colors.primary} />
                <Text style={styles.premiumTeaserTitle}>{t('meta.premiumContent')}</Text>
                <Text style={styles.premiumTeaserText}>{t('meta.premiumContentHint')}</Text>
              </View>
              <PaywallCard />
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.subheading,
    flex: 1,
    marginRight: spacing.md,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statBoxLabel: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  statBoxValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.primary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  cardName: {
    ...typography.body,
    fontSize: 14,
  },
  cardQuantity: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  matchupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  matchupName: {
    ...typography.body,
    fontSize: 14,
    flex: 1,
  },
  matchupRate: {
    fontSize: 14,
    fontWeight: '600',
  },
  tournamentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  tournamentName: {
    ...typography.body,
    fontSize: 14,
    flex: 1,
    marginRight: spacing.sm,
  },
  tournamentPlace: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  premiumSection: {
    marginTop: spacing.md,
  },
  blurOverlay: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
  },
  premiumTeaserTitle: {
    ...typography.subheading,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  premiumTeaserText: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.xs,
    maxWidth: 280,
  },
});
