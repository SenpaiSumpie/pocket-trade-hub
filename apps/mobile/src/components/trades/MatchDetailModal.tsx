import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import { Copy, Star, ArrowsLeftRight } from 'phosphor-react-native';
import { DetailSheet } from '@/src/components/animation/DetailSheet';
import Toast from 'react-native-toast-message';
import { ProposalCreationModal } from './ProposalCreationModal';
import { getAvatarById } from '@/src/constants/avatars';
import { colors, spacing, borderRadius, typography } from '@/src/constants/theme';
import type { TradeMatch, MatchCardPair } from '@pocket-trade-hub/shared';

interface MatchDetailModalProps {
  match: TradeMatch | null;
  visible: boolean;
  onClose: () => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: '#e74c3c',
  medium: colors.primary,
  low: colors.textMuted,
};

function CardPairItem({ pair, showPriority }: { pair: MatchCardPair; showPriority?: boolean }) {
  return (
    <View style={styles.cardPairItem}>
      <Image
        source={{ uri: pair.cardImageUrl }}
        style={styles.detailCardImage}
        contentFit="cover"
        transition={150}
      />
      <Text style={styles.cardPairName} numberOfLines={2}>{pair.cardName}</Text>
      {showPriority && (
        <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[pair.priority] ?? colors.textMuted }]} />
      )}
    </View>
  );
}

export function MatchDetailModal({ match, visible, onClose }: MatchDetailModalProps) {
  const [showProposalModal, setShowProposalModal] = useState(false);

  if (!match) return null;

  const avatar = getAvatarById(match.partnerAvatarId);

  const handleCopyFriendCode = async () => {
    if (match.partnerFriendCode) {
      await Clipboard.setStringAsync(match.partnerFriendCode);
      Toast.show({ type: 'success', text1: 'Friend code copied!' });
    }
  };

  return (
    <DetailSheet visible={visible} onDismiss={onClose}>
      {/* Partner profile header */}
      <View style={styles.partnerHeader}>
        <View style={[styles.avatarLarge, { backgroundColor: avatar?.color ?? colors.surfaceLight }]}>
          <Text style={styles.avatarEmojiLarge}>{avatar?.emoji ?? '?'}</Text>
        </View>
        <Text style={styles.partnerDisplayName}>
          {match.partnerDisplayName ?? 'Trainer'}
        </Text>
        {match.partnerFriendCode && (
          <Pressable onPress={handleCopyFriendCode} style={styles.friendCodeRow}>
            <Text style={styles.friendCode}>{match.partnerFriendCode}</Text>
            <Copy size={14} color={colors.textSecondary} weight="regular" />
          </Pressable>
        )}
        <Text style={styles.tradeCount}>
          {match.partnerTradeCount} trade{match.partnerTradeCount !== 1 ? 's' : ''} completed
        </Text>
      </View>

      {/* Star rating */}
      <View style={styles.ratingRow}>
        {Array.from({ length: 3 }, (_, i) => (
          <Star
            key={i}
            size={20}
            color={i < match.starRating ? '#f0c040' : colors.surfaceLight}
            weight="fill"
          />
        ))}
        <Text style={styles.ratingLabel}>
          {match.starRating === 3 ? 'Great match' : match.starRating === 2 ? 'Good match' : 'Fair match'}
        </Text>
      </View>

      {/* Card pairs */}
      <View style={styles.columnsContainer}>
        {/* You Give */}
        <View style={styles.column}>
          <Text style={styles.columnHeader}>You Give</Text>
          {match.userGives.map((pair) => (
            <CardPairItem key={pair.cardId} pair={pair} />
          ))}
        </View>

        {/* Arrow */}
        <View style={styles.arrowColumn}>
          <ArrowsLeftRight size={24} color={colors.primary} weight="regular" />
        </View>

        {/* You Get */}
        <View style={styles.column}>
          <Text style={styles.columnHeader}>You Get</Text>
          {match.userGets.map((pair) => (
            <CardPairItem key={pair.cardId} pair={pair} showPriority />
          ))}
        </View>
      </View>

      {/* Propose Trade button */}
      <TouchableOpacity
        style={styles.proposeButton}
        onPress={() => setShowProposalModal(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.proposeButtonText}>Propose Trade</Text>
      </TouchableOpacity>

      {/* Proposal creation modal */}
      <ProposalCreationModal
        visible={showProposalModal}
        onClose={() => setShowProposalModal(false)}
        match={match}
      />
    </DetailSheet>
  );
}

const styles = StyleSheet.create({
  partnerHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmojiLarge: {
    fontSize: 32,
  },
  partnerDisplayName: {
    ...typography.subheading,
    marginTop: spacing.sm,
  },
  friendCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  friendCode: {
    ...typography.caption,
    color: colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  tradeCount: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: spacing.lg,
  },
  ratingLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  columnsContainer: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  column: {
    flex: 1,
  },
  arrowColumn: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xl,
  },
  columnHeader: {
    ...typography.label,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  cardPairItem: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  detailCardImage: {
    width: 60,
    height: 84,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceLight,
  },
  cardPairName: {
    fontSize: 11,
    color: colors.text,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 80,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  proposeButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  proposeButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.background,
  },
});
