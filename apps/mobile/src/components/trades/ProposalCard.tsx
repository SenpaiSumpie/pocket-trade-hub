import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Star, Newspaper, ArrowsLeftRight } from 'phosphor-react-native';
import { getAvatarById } from '@/src/constants/avatars';
import { Card, Text, Badge } from '@/src/components/ui';
import { colors, spacing, borderRadius } from '@/src/constants/theme';
import type { BadgeVariant } from '@/src/components/ui';
import type { TradeProposal, ProposalCard as ProposalCardType } from '@pocket-trade-hub/shared';

interface EnrichedProposal extends TradeProposal {
  partner?: {
    displayName: string;
    avatarId: string;
    avgRating: number;
    tradeCount: number;
  } | null;
  /** Post info when proposal was created from a post */
  postInfo?: {
    type: string;
    cardName: string;
  } | null;
}

interface ProposalCardProps {
  proposal: EnrichedProposal;
  currentUserId: string;
  onPress: () => void;
}

const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  pending: 'default',
  accepted: 'success',
  rejected: 'error',
  countered: 'default',
  completed: 'success',
  cancelled: 'default',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  countered: 'Countered',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  // Ensure UTC parsing — append Z if no timezone indicator present
  const normalized = dateStr.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(dateStr)
    ? dateStr
    : dateStr + 'Z';
  const date = new Date(normalized).getTime();
  const diffMs = now - date;
  if (diffMs < 0) return 'just now';
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

function CardPreview({ cards, max = 3 }: { cards: ProposalCardType[]; max?: number }) {
  const visible = cards.slice(0, max);
  const extra = cards.length - max;
  return (
    <View style={styles.cardPreview}>
      {visible.map((card, i) => (
        <Image
          key={card.cardId}
          source={{ uri: card.imageUrl }}
          style={[styles.previewThumb, i > 0 && styles.previewThumbOverlap]}
          contentFit="cover"
          transition={150}
        />
      ))}
      {extra > 0 && (
        <Text preset="label" color={colors.textSecondary} style={styles.moreText}>
          +{extra}
        </Text>
      )}
    </View>
  );
}

export function ProposalCard({
  proposal,
  currentUserId,
  onPress,
}: ProposalCardProps) {
  const isOutgoing = proposal.senderId === currentUserId;
  const partner = proposal.partner;
  const avatar = partner ? getAvatarById(partner.avatarId) : null;

  const partnerName = partner?.displayName ?? 'Trainer';
  const statusVariant = STATUS_VARIANTS[proposal.status] ?? 'default';
  const statusLabel = STATUS_LABELS[proposal.status] ?? proposal.status;

  return (
    <Card
      onPress={onPress}
      style={styles.card}
    >
      {/* Top row: partner info + status */}
      <View style={styles.topRow}>
        <View style={styles.partnerRow}>
          <View
            style={[
              styles.avatarCircle,
              { backgroundColor: avatar?.color ?? colors.surfaceLight },
            ]}
          >
            <Text style={styles.avatarEmoji}>{avatar?.emoji ?? '?'}</Text>
          </View>
          <View style={styles.partnerInfo}>
            <Text preset="label" style={styles.partnerName} numberOfLines={1}>
              {partnerName}
            </Text>
            {partner && partner.tradeCount > 0 ? (
              <View style={styles.reputationRow}>
                <Star size={11} color={colors.primary} weight="fill" />
                <Text preset="label" color={colors.primary} style={styles.reputationText}>
                  {partner.avgRating.toFixed(1)}
                </Text>
                <Text preset="label" color={colors.textMuted}>
                  ({partner.tradeCount} trade{partner.tradeCount !== 1 ? 's' : ''})
                </Text>
              </View>
            ) : (
              <Text preset="label" color={colors.textMuted}>New trader</Text>
            )}
          </View>
        </View>
        <View style={styles.metaColumn}>
          <Badge variant={statusVariant} label={statusLabel} />
          <Text preset="label" color={colors.textSecondary} style={styles.directionText}>
            {isOutgoing ? 'Outgoing' : 'Incoming'}
          </Text>
        </View>
      </View>

      {/* Post reference if from a post */}
      {(proposal as EnrichedProposal).postId && (
        <View style={styles.postRefRow}>
          <Newspaper size={12} color={colors.textSecondary} weight="regular" />
          <Text preset="label" color={colors.textSecondary}>
            From post{(proposal as EnrichedProposal).postInfo ? `: ${(proposal as EnrichedProposal).postInfo!.cardName}` : ''}
          </Text>
        </View>
      )}

      {/* Card trade preview — larger cards */}
      <View style={styles.tradeRow}>
        <View style={styles.tradeSide}>
          <Text preset="label" color={colors.textSecondary} style={styles.tradeSideLabel}>
            {isOutgoing ? 'You give' : 'They give'}
          </Text>
          <CardPreview cards={isOutgoing ? proposal.senderGives : proposal.senderGets} />
        </View>
        <View style={styles.swapContainer}>
          <ArrowsLeftRight size={18} color={colors.textMuted} weight="regular" />
        </View>
        <View style={styles.tradeSide}>
          <Text preset="label" color={colors.textSecondary} style={styles.tradeSideLabel}>
            {isOutgoing ? 'You get' : 'They get'}
          </Text>
          <CardPreview cards={isOutgoing ? proposal.senderGets : proposal.senderGives} />
        </View>
      </View>

      {/* Timestamp */}
      <Text preset="label" color={colors.textMuted} style={styles.timeText}>
        {formatTimeAgo(proposal.createdAt)}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
    marginHorizontal: spacing.md,
  },
  // Top row
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 18,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  reputationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  reputationText: {
    fontWeight: '600',
  },
  metaColumn: {
    alignItems: 'flex-end',
    gap: 3,
  },
  directionText: {
    fontSize: 10,
  },
  // Trade row
  tradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  tradeSide: {
    flex: 1,
    alignItems: 'center',
  },
  tradeSideLabel: {
    fontSize: 10,
    marginBottom: 6,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  swapContainer: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
  },
  cardPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewThumb: {
    width: 60,
    height: 84,
    borderRadius: 5,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewThumbOverlap: {
    marginLeft: -10,
  },
  moreText: {
    marginLeft: 6,
    fontWeight: '600',
  },
  // Post reference
  postRefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.xs,
  },
  // Timestamp
  timeText: {
    textAlign: 'right',
    marginTop: 2,
  },
});
