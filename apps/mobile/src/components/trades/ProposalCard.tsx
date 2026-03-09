import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { getAvatarById } from '@/src/constants/avatars';
import { colors, spacing, borderRadius, typography } from '@/src/constants/theme';
import type { TradeProposal, ProposalCard as ProposalCardType } from '@pocket-trade-hub/shared';

interface ProposalCardProps {
  proposal: TradeProposal;
  currentUserId: string;
  onPress: () => void;
  partnerReputation?: {
    displayName: string;
    avatarId: string;
    avgRating: number;
    tradeCount: number;
  };
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
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
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
      {visible.map((card) => (
        <Image
          key={card.cardId}
          source={{ uri: card.imageUrl }}
          style={styles.previewThumb}
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
  partnerReputation,
}: ProposalCardProps) {
  const isOutgoing = proposal.senderId === currentUserId;
  const partnerId = isOutgoing ? proposal.receiverId : proposal.senderId;
  const avatar = partnerReputation
    ? getAvatarById(partnerReputation.avatarId)
    : null;

  const partnerName = partnerReputation?.displayName ?? 'Trader';
  const statusColor = STATUS_COLORS[proposal.status] ?? colors.textMuted;
  const statusLabel = STATUS_LABELS[proposal.status] ?? proposal.status;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Left: Partner info */}
      <View style={styles.partnerSection}>
        <View
          style={[
            styles.avatarCircle,
            { backgroundColor: avatar?.color ?? colors.surfaceLight },
          ]}
        >
          <Text style={styles.avatarEmoji}>{avatar?.emoji ?? '?'}</Text>
        </View>
        <Text style={styles.partnerName} numberOfLines={1}>
          {partnerName}
        </Text>
        {/* Reputation display */}
        {partnerReputation && partnerReputation.tradeCount > 0 ? (
          <View style={styles.reputationRow}>
            <Ionicons name="star" size={10} color={colors.primary} />
            <Text style={styles.reputationText}>
              {partnerReputation.avgRating.toFixed(1)}
            </Text>
            <Text style={styles.tradeCountText}>
              ({partnerReputation.tradeCount})
            </Text>
          </View>
        ) : (
          <Text style={styles.newTraderText}>New trader</Text>
        )}
      </View>

      {/* Center: Card previews */}
      <View style={styles.centerSection}>
        <CardPreview cards={isOutgoing ? proposal.senderGives : proposal.senderGets} />
        <Ionicons name="swap-horizontal" size={14} color={colors.textMuted} />
        <CardPreview cards={isOutgoing ? proposal.senderGets : proposal.senderGives} />
      </View>

      {/* Right: Status and meta */}
      <View style={styles.rightSection}>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{statusLabel}</Text>
        </View>
        <Text style={styles.directionText}>
          {isOutgoing ? 'Outgoing' : 'Incoming'}
        </Text>
        <Text style={styles.timeText}>{formatTimeAgo(proposal.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    marginHorizontal: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  partnerSection: {
    alignItems: 'center',
    width: 64,
    marginRight: spacing.sm,
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
  partnerName: {
    ...typography.caption,
    color: colors.text,
    marginTop: 3,
    textAlign: 'center',
    maxWidth: 64,
    fontSize: 11,
  },
  reputationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  reputationText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
  },
  tradeCountText: {
    fontSize: 9,
    color: colors.textMuted,
  },
  newTraderText: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 2,
  },
  centerSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  cardPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  previewThumb: {
    width: 28,
    height: 39,
    borderRadius: 3,
    backgroundColor: colors.surfaceLight,
  },
  moreText: {
    fontSize: 9,
    color: colors.textSecondary,
    marginLeft: 2,
  },
  rightSection: {
    alignItems: 'center',
    marginLeft: spacing.sm,
    minWidth: 58,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  directionText: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 3,
  },
  timeText: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 2,
  },
});
