import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { RarityBadge } from '@/src/components/cards/RarityBadge';
import { colors, spacing, borderRadius, typography } from '@/src/constants/theme';
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
  const typeBadgeColor = isOffering ? colors.success : '#3b82f6';
  const typeBadgeLabel = isOffering ? t('market.offering').toUpperCase() : t('market.seeking').toUpperCase();

  return (
    <Pressable
      style={[
        styles.container,
        post.isRelevant && styles.containerRelevant,
      ]}
      onPress={onPress}
    >
      {/* Card image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: card.imageUrl }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
        {/* Type badge */}
        <View style={[styles.typeBadge, { backgroundColor: typeBadgeColor }]}>
          <Text style={styles.typeBadgeText}>{typeBadgeLabel}</Text>
        </View>
      </View>

      {/* Info section */}
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={styles.cardName} numberOfLines={1}>{card.name}</Text>
          {post.isRelevant && (
            <View style={styles.matchBadge}>
              <Ionicons name="star" size={10} color="#f0c040" />
              <Text style={styles.matchBadgeText}>{t('trades.matchFound')}</Text>
            </View>
          )}
        </View>

        <View style={styles.metaRow}>
          <RarityBadge rarity={card.rarity} />
          {card.setId && (
            <Text style={styles.metaText} numberOfLines={1}>{card.setId}</Text>
          )}
        </View>

        {/* Poster info (when available) */}
        {post.poster && (
          <View style={styles.posterRow}>
            <Text style={styles.posterName} numberOfLines={1}>{post.poster.displayName}</Text>
            {post.poster.averageRating != null && (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={10} color={colors.primary} />
                <Text style={styles.ratingText}>{post.poster.averageRating.toFixed(1)}</Text>
              </View>
            )}
            {post.poster.tradeCount > 0 && (
              <Text style={styles.tradeCountText}>{post.poster.tradeCount} trades</Text>
            )}
          </View>
        )}

        <View style={styles.bottomRow}>
          <Text style={styles.languageBadge}>{card.language.toUpperCase()}</Text>
          <Text style={styles.timeText}>{timeAgo(post.createdAt)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  containerRelevant: {
    borderColor: '#f0c040',
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
  typeBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
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
    ...typography.body,
    fontWeight: '600',
    fontSize: 15,
    flex: 1,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#f0c040' + '30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  matchBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#f0c040',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  metaText: {
    ...typography.caption,
    fontSize: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  languageBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
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
  timeText: {
    ...typography.caption,
    fontSize: 11,
  },
});
