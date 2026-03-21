import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import Toast from 'react-native-toast-message';
import { Star, Info, XCircle, Trash, PaperPlaneTilt } from 'phosphor-react-native';
import { DetailSheet } from '@/src/components/animation/DetailSheet';
import { useTranslation } from 'react-i18next';
import { RarityBadge } from '@/src/components/cards/RarityBadge';
import { colors, spacing, borderRadius, typography } from '@/src/constants/theme';
import { useAuthStore } from '@/src/stores/auth';
import { usePremiumStore } from '@/src/stores/premium';
import { usePosts } from '@/src/hooks/usePosts';
import { useProposals } from '@/src/hooks/useProposals';
import { useImageExport } from '@/src/hooks/useImageExport';
import { ExportRenderer } from '@/src/components/export/ExportRenderer';
import { ShareButton } from '@/src/components/export/ShareButton';
import { PostExport } from '@/src/components/export/templates/PostExport';
import type { MarketPost } from '@/src/stores/posts';

interface PostDetailModalProps {
  visible: boolean;
  post: MarketPost | null;
  onClose: () => void;
}

export function PostDetailModal({ visible, post, onClose }: PostDetailModalProps) {
  const { t } = useTranslation();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const isPremium = usePremiumStore((s) => s.isPremium);
  const { closePost, deletePost } = usePosts();
  const { createProposal } = useProposals();
  const { viewRef: exportRef, exportAndShare, exporting } = useImageExport();
  const [sendingProposal, setSendingProposal] = useState(false);

  if (!post) return null;

  const card = post.cards[0];
  if (!card) return null;

  const isOwn = post.userId === currentUserId;
  const isActive = post.status === 'active';
  const isOffering = post.type === 'offering';
  const typeBadgeColor = isOffering ? colors.success : '#3b82f6';
  const typeLabel = isOffering ? t('market.offering') : t('market.seeking');

  const handleClose = () => {
    Alert.alert(t('market.closed'), t('market.deletePost'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.close'),
        style: 'destructive',
        onPress: () => {
          closePost(post.id);
          onClose();
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Post', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deletePost(post.id);
          onClose();
        },
      },
    ]);
  };

  const handleSendProposal = async () => {
    setSendingProposal(true);
    try {
      // Build a proposal from the post context
      // If post is Offering: the post owner has this card, so we want it (senderGets)
      // If post is Seeking: the post owner wants this card, so we give it (senderGives)
      const proposalCard = {
        cardId: card.cardId,
        cardName: card.name,
        imageUrl: card.imageUrl,
        rarity: card.rarity ?? 'diamond1',
      };

      const senderGives = isOffering ? [] : [proposalCard];
      const senderGets = isOffering ? [proposalCard] : [];

      await createProposal({
        postId: post.id,
        receiverId: post.userId,
        senderGives: senderGives.length > 0 ? senderGives : [proposalCard],
        senderGets: senderGets.length > 0 ? senderGets : [proposalCard],
        fairnessScore: 50,
      });

      Toast.show({
        type: 'success',
        text1: 'Proposal sent!',
        text2: 'The post owner will be notified.',
      });
      onClose();
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Failed to send proposal',
        text2: 'Please try again.',
      });
    } finally {
      setSendingProposal(false);
    }
  };

  return (
    <DetailSheet visible={visible} onDismiss={onClose}>
      {/* Offscreen export renderer */}
      <ExportRenderer ref={exportRef}>
        <PostExport
          postType={post.type}
          cards={post.cards.map((c) => ({
            name: c.name,
            image: c.imageUrl,
            rarity: c.rarity ?? 'Unknown',
          }))}
          posterName={post.poster?.username ?? 'Trader'}
          showWatermark={!isPremium}
        />
      </ExportRenderer>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Post Details</Text>
        <ShareButton
          onPress={() => exportAndShare('Share Post')}
          loading={exporting}
          size={20}
        />
      </View>

      {/* Card image */}
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: card.imageUrl }}
          style={styles.cardImage}
          contentFit="cover"
          transition={200}
        />
      </View>

      {/* Type badge */}
      <View style={styles.typeRow}>
        <View style={[styles.typeBadge, { backgroundColor: typeBadgeColor }]}>
          <Text style={styles.typeBadgeText}>{typeLabel}</Text>
        </View>
        {post.isRelevant && (
          <View style={styles.matchIndicator}>
            <Star size={12} color="#f0c040" weight="fill" />
            <Text style={styles.matchIndicatorText}>Matches your list</Text>
          </View>
        )}
        {!isActive && (
          <View style={styles.closedBadge}>
            <Text style={styles.closedBadgeText}>
              {post.status === 'closed' ? 'Closed' : 'Auto-closed'}
            </Text>
          </View>
        )}
      </View>

      {/* Card details */}
      <Text style={styles.cardName}>{card.name}</Text>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Language</Text>
        <Text style={styles.detailValue}>{card.language.toUpperCase()}</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Rarity</Text>
        <RarityBadge rarity={card.rarity} size="lg" />
      </View>

      {card.setId && (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Set</Text>
          <Text style={styles.detailValue}>{card.setId}</Text>
        </View>
      )}

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Posted</Text>
        <Text style={styles.detailValue}>
          {new Date(post.createdAt).toLocaleDateString()}
        </Text>
      </View>

      {/* Inactive post message */}
      {!isActive && (
        <View style={styles.inactiveNotice}>
          <Info size={18} color={colors.textMuted} weight="regular" />
          <Text style={styles.inactiveText}>This post is no longer active</Text>
        </View>
      )}

      {/* Actions */}
      {isOwn ? (
        <View style={styles.ownActions}>
          {isActive && (
            <Pressable style={styles.closePostButton} onPress={handleClose}>
              <XCircle size={20} color={colors.text} weight="regular" />
              <Text style={styles.closePostText}>Close Post</Text>
            </Pressable>
          )}
          <Pressable style={styles.deleteButton} onPress={handleDelete}>
            <Trash size={20} color={colors.error} weight="regular" />
            <Text style={styles.deleteText}>Delete Post</Text>
          </Pressable>
        </View>
      ) : (
        isActive && (
          <Pressable
            style={[styles.proposalButton, sendingProposal && styles.proposalButtonDisabled]}
            onPress={handleSendProposal}
            disabled={sendingProposal}
          >
            <PaperPlaneTilt size={20} color={colors.background} weight="fill" />
            <Text style={styles.proposalButtonText}>
              {sendingProposal ? 'Sending...' : 'Send Proposal'}
            </Text>
          </Pressable>
        )
      )}
    </DetailSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.subheading,
    textAlign: 'center',
  },
  imageWrapper: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardImage: {
    width: 200,
    height: 280,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  typeBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  matchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0c040' + '25',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  matchIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f0c040',
  },
  closedBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceLight,
  },
  closedBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  cardName: {
    ...typography.heading,
    fontSize: 22,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    ...typography.label,
  },
  detailValue: {
    ...typography.body,
    fontWeight: '500',
  },
  inactiveNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  inactiveText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  ownActions: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  closePostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  closePostText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.error + '20',
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  deleteText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.error,
  },
  proposalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
  },
  proposalButtonDisabled: {
    opacity: 0.5,
  },
  proposalButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.background,
  },
});
