import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
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
  if (!match) return null;

  const avatar = getAvatarById(match.partnerAvatarId);

  const handleCopyFriendCode = async () => {
    if (match.partnerFriendCode) {
      await Clipboard.setStringAsync(match.partnerFriendCode);
      Toast.show({ type: 'success', text1: 'Friend code copied!' });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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
                  <Ionicons name="copy-outline" size={14} color={colors.textSecondary} />
                </Pressable>
              )}
              <Text style={styles.tradeCount}>
                {match.partnerTradeCount} trade{match.partnerTradeCount !== 1 ? 's' : ''} completed
              </Text>
            </View>

            {/* Star rating */}
            <View style={styles.ratingRow}>
              {Array.from({ length: 3 }, (_, i) => (
                <Ionicons
                  key={i}
                  name="star"
                  size={20}
                  color={i < match.starRating ? '#f0c040' : colors.surfaceLight}
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
                <Ionicons name="swap-horizontal" size={24} color={colors.primary} />
              </View>

              {/* You Get */}
              <View style={styles.column}>
                <Text style={styles.columnHeader}>You Get</Text>
                {match.userGets.map((pair) => (
                  <CardPairItem key={pair.cardId} pair={pair} showPriority />
                ))}
              </View>
            </View>

            {/* Propose Trade button (disabled placeholder) */}
            <TouchableOpacity style={styles.proposeButton} disabled activeOpacity={1}>
              <Text style={styles.proposeButtonText}>Propose Trade</Text>
              <Text style={styles.comingSoon}>Coming in Phase 5</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
    paddingTop: spacing.lg,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 10,
    padding: spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
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
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    opacity: 0.5,
  },
  proposeButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textMuted,
  },
  comingSoon: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
    fontSize: 11,
  },
});
