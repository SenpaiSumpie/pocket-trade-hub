import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { ShieldCheck, Heart, X, Trash } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius } from '@/src/constants/theme';
import { useTierListStore } from '@/src/stores/tierlists';
import { useAuthStore } from '@/src/stores/auth';
import type { TierList } from '@pocket-trade-hub/shared';

interface TierListCardProps {
  tierList: TierList;
}

const TIER_COLORS: Record<string, string> = {
  S: '#e74c3c',
  A: '#e67e22',
  B: '#f1c40f',
  C: '#2ecc71',
  D: '#3498db',
};

const TIER_KEYS = ['S', 'A', 'B', 'C', 'D'] as const;

export function TierListCard({ tierList }: TierListCardProps) {
  const { t } = useTranslation();
  const vote = useTierListStore((s) => s.vote);
  const deleteTierList = useTierListStore((s) => s.deleteTierList);
  const currentUserId = useAuthStore((s) => s.user?.id) ?? '';
  const [detailVisible, setDetailVisible] = useState(false);

  const isOwner = currentUserId === tierList.userId;
  const totalDecks = TIER_KEYS.reduce(
    (sum, key) => sum + (tierList.tiers[key]?.length ?? 0),
    0,
  );

  const handleVote = () => {
    vote(tierList.id);
  };

  const handleDelete = () => {
    Alert.alert(
      t('meta.deleteTierList'),
      t('meta.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            deleteTierList(tierList.id);
            setDetailVisible(false);
          },
        },
      ],
    );
  };

  return (
    <>
      <Pressable style={styles.card} onPress={() => setDetailVisible(true)}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            {tierList.isOfficial && (
              <View style={styles.officialBadge}>
                <ShieldCheck size={14} color="#f0c040" weight="fill" />
                <Text style={styles.officialText}>{t('meta.official')}</Text>
              </View>
            )}
            <Text style={styles.title} numberOfLines={1}>
              {tierList.title}
            </Text>
          </View>
          <Pressable style={styles.voteButton} onPress={handleVote}>
            <Heart
              size={20}
              color={tierList.userVoted ? colors.error : colors.textMuted}
              weight={tierList.userVoted ? 'fill' : 'regular'}
            />
            <Text style={styles.voteCount}>{tierList.upvoteCount}</Text>
          </Pressable>
        </View>

        {/* Tier preview */}
        <View style={styles.tierPreview}>
          {TIER_KEYS.map((key) => {
            const count = tierList.tiers[key]?.length ?? 0;
            return (
              <View key={key} style={styles.tierPill}>
                <View style={[styles.tierDot, { backgroundColor: TIER_COLORS[key] }]} />
                <Text style={styles.tierLabel}>{key}</Text>
                <Text style={styles.tierCount}>{count}</Text>
              </View>
            );
          })}
        </View>

        {/* Footer */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>
            {t('meta.deckCount', { count: totalDecks })}
          </Text>
          <Text style={styles.footerText}>
            {new Date(tierList.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </Pressable>

      {/* Detail modal */}
      <Modal
        visible={detailVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDetailVisible(false)}
      >
        <View style={styles.modalContainer}>
          {/* Modal header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              {tierList.isOfficial && (
                <ShieldCheck size={18} color="#f0c040" weight="fill" />
              )}
              <Text style={styles.modalTitle} numberOfLines={2}>
                {tierList.title}
              </Text>
            </View>
            <Pressable
              style={styles.closeButton}
              onPress={() => setDetailVisible(false)}
            >
              <X size={24} color={colors.text} weight="regular" />
            </Pressable>
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalContent}
          >
            {/* Description */}
            {tierList.description && (
              <Text style={styles.description}>{tierList.description}</Text>
            )}

            {/* Creator info */}
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>
                {new Date(tierList.createdAt).toLocaleDateString()}
              </Text>
              <Pressable style={styles.voteButton} onPress={handleVote}>
                <Heart
                  size={22}
                  color={tierList.userVoted ? colors.error : colors.textMuted}
                  weight={tierList.userVoted ? 'fill' : 'regular'}
                />
                <Text style={styles.voteCountLarge}>{tierList.upvoteCount}</Text>
              </Pressable>
            </View>

            {/* Full tier breakdown */}
            {TIER_KEYS.map((key) => {
              const entries = tierList.tiers[key] ?? [];
              return (
                <View key={key} style={styles.tierRow}>
                  <View
                    style={[styles.tierHeader, { backgroundColor: TIER_COLORS[key] + '30' }]}
                  >
                    <Text style={[styles.tierHeaderText, { color: TIER_COLORS[key] }]}>
                      {key}
                    </Text>
                  </View>
                  <View style={styles.tierEntries}>
                    {entries.length > 0 ? (
                      entries.map((entry, idx) => (
                        <Text key={idx} style={styles.tierEntryText}>
                          {entry.deckName}
                        </Text>
                      ))
                    ) : (
                      <Text style={styles.tierEmptyText}>--</Text>
                    )}
                  </View>
                </View>
              );
            })}

            {/* Delete button for owners */}
            {isOwner && !tierList.isOfficial && (
              <Pressable style={styles.deleteButton} onPress={handleDelete}>
                <Trash size={18} color={colors.error} weight="regular" />
                <Text style={styles.deleteText}>{t('meta.deleteTierList')}</Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginRight: spacing.sm,
  },
  officialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#f0c040' + '20',
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  officialText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f0c040',
  },
  title: {
    ...typography.body,
    fontWeight: '600',
    flex: 1,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  voteCount: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tierPreview: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  tierDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tierLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tierCount: {
    fontSize: 12,
    color: colors.textMuted,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginRight: spacing.md,
  },
  modalTitle: {
    ...typography.subheading,
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  metaText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  voteCountLarge: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tierRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tierHeader: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  tierHeaderText: {
    fontSize: 18,
    fontWeight: '800',
  },
  tierEntries: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tierEntryText: {
    ...typography.body,
    fontSize: 13,
    color: colors.text,
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  tierEmptyText: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.error + '40',
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
  },
});
