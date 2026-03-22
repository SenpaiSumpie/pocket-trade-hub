import { useState } from 'react';
import {
  View,
  Pressable,
  Modal,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { Shield, Heart, X, Trash } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius } from '@/src/constants/theme';
import { useTierListStore } from '@/src/stores/tierlists';
import { useAuthStore } from '@/src/stores/auth';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Text } from '@/src/components/ui/Text';
import { useToast } from '@/src/hooks/useToast';
import type { TierList } from '@pocket-trade-hub/shared';

interface TierListCardProps {
  tierList: TierList;
}

const TIER_BADGE_STYLES: Record<string, { bg: string; text: string }> = {
  S: { bg: 'rgba(240, 192, 64, 0.2)',  text: '#f0c040' },
  A: { bg: 'rgba(167, 139, 250, 0.2)', text: '#a78bfa' },
  B: { bg: 'rgba(96, 165, 250, 0.2)',  text: '#60a5fa' },
  C: { bg: 'rgba(52, 211, 153, 0.2)',  text: '#34d399' },
  D: { bg: colors.surfaceLight,         text: colors.textMuted },
};

const TIER_KEYS = ['S', 'A', 'B', 'C', 'D'] as const;

export function TierListCard({ tierList }: TierListCardProps) {
  const { t } = useTranslation();
  const vote = useTierListStore((s) => s.vote);
  const deleteTierList = useTierListStore((s) => s.deleteTierList);
  const currentUserId = useAuthStore((s) => s.user?.id) ?? '';
  const [detailVisible, setDetailVisible] = useState(false);
  const toast = useToast();

  const isOwner = currentUserId === tierList.userId;
  const totalDecks = TIER_KEYS.reduce(
    (sum, key) => sum + (tierList.tiers[key]?.length ?? 0),
    0,
  );

  const handleVote = async () => {
    try {
      await vote(tierList.id);
      if (tierList.userVoted) {
        toast.info('Vote removed');
      } else {
        toast.success('Vote recorded');
      }
    } catch {
      toast.error('Could not record vote. Please try again.');
    }
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
      <Card onPress={() => setDetailVisible(true)} style={styles.cardWrapper}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            {tierList.isOfficial && (
              <View style={styles.officialRow}>
                <Shield size={14} color="#2ecc71" weight="fill" />
                <Badge variant="success" label={t('meta.official')} />
              </View>
            )}
            <Text preset="body" style={styles.title} numberOfLines={1}>
              {tierList.title}
            </Text>
          </View>
          <Button
            variant={tierList.userVoted ? 'primary' : 'ghost'}
            size="sm"
            onPress={handleVote}
            Icon={({ size, color, weight }: { size: number; color: string; weight: string }) => (
              <Heart
                size={18}
                weight={tierList.userVoted ? 'fill' : 'regular'}
                color={tierList.userVoted ? '#0c0c18' : '#a0a0b8'}
              />
            )}
            label={String(tierList.upvoteCount)}
          />
        </View>

        {/* Tier preview */}
        <View style={styles.tierPreview}>
          {TIER_KEYS.map((key) => {
            const count = tierList.tiers[key]?.length ?? 0;
            const tierStyle = TIER_BADGE_STYLES[key];
            return (
              <Badge
                key={key}
                variant="default"
                label={`${key} ${count}`}
                style={{ backgroundColor: tierStyle.bg }}
                textColor={tierStyle.text}
              />
            );
          })}
        </View>

        {/* Footer */}
        <View style={styles.footerRow}>
          <Text preset="label" style={styles.footerText}>
            {t('meta.deckCount', { count: totalDecks })}
          </Text>
          <Text preset="label" style={styles.footerText}>
            {new Date(tierList.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </Card>

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
                <Shield size={18} color="#2ecc71" weight="fill" />
              )}
              <Text preset="subheading" style={styles.modalTitle} numberOfLines={2}>
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
              <Text preset="body" color={colors.textSecondary} style={styles.description}>
                {tierList.description}
              </Text>
            )}

            {/* Creator info */}
            <View style={styles.metaRow}>
              <Text preset="label">
                {new Date(tierList.createdAt).toLocaleDateString()}
              </Text>
              <Button
                variant={tierList.userVoted ? 'primary' : 'ghost'}
                size="sm"
                onPress={handleVote}
                Icon={({ size, color, weight }: { size: number; color: string; weight: string }) => (
                  <Heart
                    size={22}
                    weight={tierList.userVoted ? 'fill' : 'regular'}
                    color={tierList.userVoted ? '#0c0c18' : '#a0a0b8'}
                  />
                )}
                label={String(tierList.upvoteCount)}
              />
            </View>

            {/* Full tier breakdown */}
            {TIER_KEYS.map((key) => {
              const entries = tierList.tiers[key] ?? [];
              const tierStyle = TIER_BADGE_STYLES[key];
              return (
                <View key={key} style={styles.tierRow}>
                  <View
                    style={[styles.tierHeader, { backgroundColor: tierStyle.bg }]}
                  >
                    <Text preset="body" style={[styles.tierHeaderText, { color: tierStyle.text }]}>
                      {key}
                    </Text>
                  </View>
                  <View style={styles.tierEntries}>
                    {entries.length > 0 ? (
                      entries.map((entry, idx) => (
                        <Text key={idx} preset="body" style={styles.tierEntryText}>
                          {entry.deckName}
                        </Text>
                      ))
                    ) : (
                      <Text preset="label" style={styles.tierEmptyText}>--</Text>
                    )}
                  </View>
                </View>
              );
            })}

            {/* Delete button for owners */}
            {isOwner && !tierList.isOfficial && (
              <Pressable style={styles.deleteButton} onPress={handleDelete}>
                <Trash size={18} color={colors.error} weight="regular" />
                <Text preset="body" color={colors.error} style={styles.deleteText}>
                  {t('meta.deleteTierList')}
                </Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
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
  officialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontWeight: '600',
    flex: 1,
  },
  tierPreview: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 11,
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
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
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
    fontSize: 13,
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  tierEmptyText: {
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
  },
});
