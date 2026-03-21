import { View, Text, Modal, ScrollView, Pressable, StyleSheet } from 'react-native';
import { X, Lock } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius } from '@/src/constants/theme';
import { useMetaStore } from '@/src/stores/meta';
import { useCollectionStore } from '@/src/stores/collection';
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
  const collectionByCardId = useCollectionStore((s) => s.collectionByCardId);

  if (!deck) return null;

  const formatRate = (rate: number | null): string => {
    if (rate === null) return '--';
    return (rate / 100).toFixed(1) + '%';
  };

  const allCards = deck.cards
    ? (Array.isArray(deck.cards) ? deck.cards : [])
    : [];

  const topCards = allCards.slice(0, 3);

  const matchups = deck.matchups
    ? (Array.isArray(deck.matchups) ? deck.matchups : [])
    : [];

  const tournamentResults = deck.tournamentResults
    ? (Array.isArray(deck.tournamentResults) ? deck.tournamentResults : [])
    : [];

  // Calculate have/need stats
  const haveCount = allCards.filter((c: any) => {
    const cardName = (c.name || '').toLowerCase();
    return Object.keys(collectionByCardId).some((id) => {
      return collectionByCardId[id] > 0 && id.toLowerCase().includes(cardName.split(' ')[0]);
    });
  }).length;

  // Simpler approach: check by name match against collection
  // Since we don't have exact card IDs from Limitless, we show the card list
  // and let users see what they recognize

  const renderCardRow = (card: any, idx: number, showHaveIndicator: boolean) => {
    const cardName = card.name || card;
    const count = card.count || 1;
    const setInfo = card.set && card.number ? `${card.set}-${card.number}` : '';

    return (
      <View key={idx} style={styles.cardRow}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>
            {count > 1 ? `${count}x ` : ''}{cardName}
          </Text>
          {setInfo ? (
            <Text style={styles.cardSet}>{setInfo}</Text>
          ) : null}
        </View>
      </View>
    );
  };

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
            <X size={24} color={colors.text} weight="regular" />
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

          {/* Card list - visible to all */}
          {allCards.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Deck List</Text>
                <Text style={styles.cardCount}>{allCards.reduce((sum: number, c: any) => sum + (c.count || 1), 0)} cards</Text>
              </View>

              {/* Group by type: Pokemon vs Trainer */}
              {(() => {
                const pokemon = allCards.filter((c: any) => {
                  const name = (c.name || '').toLowerCase();
                  return !['professor', 'mars', 'irida', 'guzma', 'cyrus', 'poké ball', 'poke ball',
                    'rare candy', 'giant cape', 'starting', 'rocky helmet', 'sabrina', 'leaf',
                    'misty', 'erika', 'giovanni', 'blaine', 'brock', 'koga', 'lt. surge',
                    'energy'].some(t => name.includes(t));
                });
                const trainers = allCards.filter((c: any) => !pokemon.includes(c));

                return (
                  <>
                    {pokemon.length > 0 && (
                      <View style={styles.cardGroup}>
                        <Text style={styles.cardGroupLabel}>Pokemon ({pokemon.reduce((s: number, c: any) => s + (c.count || 1), 0)})</Text>
                        {pokemon.map((card: any, idx: number) => renderCardRow(card, idx, true))}
                      </View>
                    )}
                    {trainers.length > 0 && (
                      <View style={styles.cardGroup}>
                        <Text style={styles.cardGroupLabel}>Trainers ({trainers.reduce((s: number, c: any) => s + (c.count || 1), 0)})</Text>
                        {trainers.map((card: any, idx: number) => renderCardRow(card, idx + 100, true))}
                      </View>
                    )}
                  </>
                );
              })()}
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Deck List</Text>
              <Text style={styles.noDataText}>No card data available for this deck</Text>
            </View>
          )}

          {/* Premium sections */}
          {isPremium ? (
            <>
              {/* Matchup data */}
              {matchups.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t('meta.matchups')}</Text>
                  {matchups.map((mu: any, idx: number) => (
                    <View key={idx} style={styles.matchupRow}>
                      <Text style={styles.matchupName} numberOfLines={1}>{mu.opponent || mu.name}</Text>
                      <Text style={styles.matchupMatches}>{mu.matches ?? ''}</Text>
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
                      <View style={styles.tournamentInfo}>
                        <Text style={styles.tournamentPlayer} numberOfLines={1}>{tr.player}</Text>
                        <Text style={styles.tournamentName} numberOfLines={1}>{tr.tournament || tr.name}</Text>
                      </View>
                      <View style={styles.tournamentStats}>
                        <Text style={styles.tournamentPlace}>{tr.placement || tr.place}</Text>
                        <Text style={styles.tournamentScore}>{tr.score}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : (
            /* Premium teaser for non-premium users */
            <View style={styles.premiumSection}>
              <View style={styles.blurOverlay}>
                <Lock size={32} color={colors.primary} weight="fill" />
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.primary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  cardCount: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  cardGroup: {
    marginBottom: spacing.md,
  },
  cardGroupLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  cardInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardName: {
    ...typography.body,
    fontSize: 14,
    flex: 1,
  },
  cardSet: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  noDataText: {
    ...typography.body,
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  matchupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  matchupName: {
    ...typography.body,
    fontSize: 14,
    flex: 1,
  },
  matchupMatches: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
    minWidth: 40,
    textAlign: 'right',
  },
  matchupRate: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'right',
  },
  tournamentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  tournamentInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  tournamentPlayer: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '600',
  },
  tournamentName: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  tournamentStats: {
    alignItems: 'flex-end',
  },
  tournamentPlace: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  tournamentScore: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
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
