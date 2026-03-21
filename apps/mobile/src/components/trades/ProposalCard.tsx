import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Star, Newspaper, ArrowsLeftRight } from 'phosphor-react-native';
import { getAvatarById } from '@/src/constants/avatars';
import { colors, spacing, borderRadius, typography } from '@/src/constants/theme';
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

const STATUS_COLORS: Record<string, string> = {
  pending: colors.primary,
  accepted: colors.success,
  rejected: colors.error,
  countered: '#3498db',
  completed: colors.success,
  cancelled: colors.textMuted,
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
      {extra > 0 && <Text style={styles.moreText}>+{extra}</Text>}
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
  const statusColor = STATUS_COLORS[proposal.status] ?? colors.textMuted;
  const statusLabel = STATUS_LABELS[proposal.status] ?? proposal.status;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
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
            <Text style={styles.partnerName} numberOfLines={1}>
              {partnerName}
            </Text>
            {partner && partner.tradeCount > 0 ? (
              <View style={styles.reputationRow}>
                <Star size={11} color={colors.primary} weight="fill" />
                <Text style={styles.reputationText}>
                  {partner.avgRating.toFixed(1)}
                </Text>
                <Text style={styles.tradeCountText}>
                  ({partner.tradeCount} trade{partner.tradeCount !== 1 ? 's' : ''})
                </Text>
              </View>
            ) : (
              <Text style={styles.newTraderText}>New trader</Text>
            )}
          </View>
        </View>
        <View style={styles.metaColumn}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
          <Text style={styles.directionText}>
            {isOutgoing ? 'Outgoing' : 'Incoming'}
          </Text>
        </View>
      </View>

      {/* Post reference if from a post */}
      {(proposal as EnrichedProposal).postId && (
        <View style={styles.postRefRow}>
          <Newspaper size={12} color={colors.textSecondary} weight="regular" />
          <Text style={styles.postRefText}>
            From post{(proposal as EnrichedProposal).postInfo ? `: ${(proposal as EnrichedProposal).postInfo!.cardName}` : ''}
          </Text>
        </View>
      )}

      {/* Card trade preview — larger cards */}
      <View style={styles.tradeRow}>
        <View style={styles.tradeSide}>
          <Text style={styles.tradeSideLabel}>{isOutgoing ? 'You give' : 'They give'}</Text>
          <CardPreview cards={isOutgoing ? proposal.senderGives : proposal.senderGets} />
        </View>
        <View style={styles.swapContainer}>
          <ArrowsLeftRight size={18} color={colors.textMuted} weight="regular" />
        </View>
        <View style={styles.tradeSide}>
          <Text style={styles.tradeSideLabel}>{isOutgoing ? 'You get' : 'They get'}</Text>
          <CardPreview cards={isOutgoing ? proposal.senderGets : proposal.senderGives} />
        </View>
      </View>

      {/* Timestamp */}
      <Text style={styles.timeText}>{formatTimeAgo(proposal.createdAt)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
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
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  tradeCountText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  newTraderText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  metaColumn: {
    alignItems: 'flex-end',
    gap: 3,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  directionText: {
    fontSize: 10,
    color: colors.textSecondary,
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
    color: colors.textSecondary,
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
    fontSize: 12,
    color: colors.textSecondary,
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
  postRefText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  // Timestamp
  timeText: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: 2,
  },
});
