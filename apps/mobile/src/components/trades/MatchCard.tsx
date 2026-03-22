import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Star, ArrowsLeftRight } from 'phosphor-react-native';
import { getAvatarById } from '@/src/constants/avatars';
import { Card, Text } from '@/src/components/ui';
import { colors, spacing, borderRadius } from '@/src/constants/theme';
import { PremiumBadge } from '@/src/components/premium/PremiumBadge';
import type { TradeMatch } from '@pocket-trade-hub/shared';

interface MatchCardProps {
  match: TradeMatch;
  onPress: () => void;
}

export function MatchCard({ match, onPress }: MatchCardProps) {
  const avatar = getAvatarById(match.partnerAvatarId);
  const bestGet = match.userGets[0];
  const bestGive = match.userGives[0];
  const extraCount = match.cardCount - 1;

  return (
    <Card
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.row}>
        {/* Left: Partner info */}
        <View style={styles.partnerSection}>
          <View style={[styles.avatarCircle, { backgroundColor: avatar?.color ?? colors.surfaceLight }]}>
            <Text style={styles.avatarEmoji}>{avatar?.emoji ?? '?'}</Text>
          </View>
          <View style={styles.nameRow}>
            <Text preset="label" style={styles.partnerName} numberOfLines={1}>
              {match.partnerDisplayName ?? 'Trainer'}
            </Text>
            {match.partnerIsPremium && <PremiumBadge size={14} />}
          </View>
          {match.partnerAvgRating > 0 ? (
            <View style={styles.partnerRepRow}>
              <Star size={10} color="#f0c040" weight="fill" />
              <Text preset="label" color={colors.textSecondary} style={styles.partnerRepText}>
                {match.partnerAvgRating.toFixed(1)} ({match.partnerTradeCount})
              </Text>
            </View>
          ) : (
            <Text preset="label" color={colors.textMuted} style={styles.newTraderText}>New trader</Text>
          )}
        </View>

        {/* Center: Best card pair */}
        <View style={styles.pairSection}>
          {bestGive && (
            <Image
              source={{ uri: bestGive.cardImageUrl }}
              style={styles.cardThumb}
              contentFit="cover"
              transition={150}
            />
          )}
          <ArrowsLeftRight size={16} color={colors.textMuted} weight="regular" style={styles.swapIcon} />
          {bestGet && (
            <Image
              source={{ uri: bestGet.cardImageUrl }}
              style={styles.cardThumb}
              contentFit="cover"
              transition={150}
            />
          )}
          {extraCount > 0 && (
            <Text preset="label" color={colors.textSecondary} style={styles.moreText}>
              +{extraCount} more
            </Text>
          )}
        </View>

        {/* Right: Stars & card count */}
        <View style={styles.ratingSection}>
          <View style={styles.starsRow}>
            {Array.from({ length: 3 }, (_, i) => (
              <Star
                key={i}
                size={14}
                color={i < match.starRating ? '#f0c040' : colors.surfaceLight}
                weight="fill"
              />
            ))}
          </View>
          <Text preset="label" color={colors.textSecondary} style={styles.cardCount}>
            {match.cardCount} card{match.cardCount !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    marginHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partnerSection: {
    alignItems: 'center',
    width: 60,
    marginRight: spacing.sm,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 20,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    maxWidth: 60,
  },
  partnerName: {
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 60,
  },
  partnerRepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  partnerRepText: {
    fontSize: 10,
  },
  newTraderText: {
    fontSize: 10,
    marginTop: 2,
  },
  pairSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardThumb: {
    width: 40,
    height: 56,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceLight,
  },
  swapIcon: {
    marginHorizontal: spacing.xs,
  },
  moreText: {
    marginLeft: spacing.xs,
  },
  ratingSection: {
    alignItems: 'center',
    marginLeft: spacing.sm,
    minWidth: 50,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  cardCount: {
    marginTop: 4,
    fontSize: 11,
  },
});
