import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Star } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Text } from '@/src/components/ui/Text';
import { RarityBadge } from '@/src/components/cards/RarityBadge';
import { colors, spacing, borderRadius } from '@/src/constants/theme';
import type { MarketPost } from '@/src/stores/posts';

interface PostCardProps {
  post: MarketPost;
  onPress: () => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function PostCard({ post, onPress }: PostCardProps) {
  const { t } = useTranslation();
  const card = post.cards[0];
  if (!card) return null;

  const isOffering = post.type === 'offering';
  const typeBadgeVariant = isOffering ? 'success' : 'default';
  const typeBadgeLabel = isOffering ? t('market.offering').toUpperCase() : t('market.seeking').toUpperCase();

  // Scaffold for premium poster -- field may not exist yet on the type
  const isPremium = !!(post.poster as any)?.isPremium;

  return (
    <Card
      onPress={onPress}
      style={[
        styles.cardOuter,
        post.isRelevant && styles.cardRelevant,
      ]}
      padding={0}
    >
      <View style={styles.container}>
        {/* Premium gold gradient left-border */}
        {isPremium && (
          <View style={styles.premiumBorder}>
            <Svg width={3} height="100%">
              <Defs>
                <LinearGradient id={`premiumGrad-${post.id}`} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#f5d060" />
                  <Stop offset="1" stopColor="#c9a020" />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width={3} height="100%" fill={`url(#premiumGrad-${post.id})`} />
            </Svg>
          </View>
        )}

        {/* Card image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: card.imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
          {/* Type badge */}
          <View style={styles.typeBadgeWrapper}>
            <Badge
              variant={typeBadgeVariant}
              label={typeBadgeLabel}
              textColor={isOffering ? undefined : '#3b82f6'}
              style={!isOffering ? { backgroundColor: 'rgba(59, 130, 246, 0.2)' } : undefined}
            />
          </View>
        </View>

        {/* Info section */}
        <View style={styles.info}>
          <View style={styles.topRow}>
            <Text preset="body" style={styles.cardName} numberOfLines={1}>{card.name}</Text>
            {post.isRelevant && (
              <Badge
                variant="warning"
                label={t('trades.matchFound')}
                style={styles.matchBadge}
              />
            )}
          </View>

          <View style={styles.metaRow}>
            <RarityBadge rarity={card.rarity} />
            {card.setId && (
              <Text preset="label" numberOfLines={1}>{card.setId}</Text>
            )}
          </View>

          {/* Poster info (when available) */}
          {post.poster && (
            <View style={styles.posterRow}>
              <Text preset="label" style={styles.posterName} numberOfLines={1}>{post.poster.displayName}</Text>
              {isPremium && (
                <Badge variant="premium" label="PRO" />
              )}
              {post.poster.averageRating != null && (
                <View style={styles.ratingRow}>
                  <Star size={10} color={colors.primary} weight="fill" />
                  <Text preset="label" style={styles.ratingText}>{post.poster.averageRating.toFixed(1)}</Text>
                </View>
              )}
              {post.poster.tradeCount > 0 && (
                <Text preset="label" style={styles.tradeCountText}>{post.poster.tradeCount} trades</Text>
              )}
            </View>
          )}

          <View style={styles.bottomRow}>
            <Badge variant="default" label={card.language.toUpperCase()} textColor={colors.primary} style={styles.langBadge} />
            <Text preset="label" style={styles.timeText}>{timeAgo(post.createdAt)}</Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  cardOuter: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  cardRelevant: {
    borderColor: '#f0c040',
  },
  container: {
    flexDirection: 'row',
    position: 'relative',
  },
  premiumBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    zIndex: 1,
    borderTopLeftRadius: borderRadius.lg,
    borderBottomLeftRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  imageContainer: {
    width: 90,
    height: 126,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  typeBadgeWrapper: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
  },
  info: {
    flex: 1,
    padding: spacing.sm,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardName: {
    fontWeight: '600',
    fontSize: 15,
    flex: 1,
  },
  matchBadge: {
    backgroundColor: '#f0c040' + '30',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  posterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  posterName: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
  },
  tradeCountText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  langBadge: {
    backgroundColor: colors.primary + '20',
  },
  timeText: {
    fontSize: 11,
  },
});
