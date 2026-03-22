import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { ArrowCircleUp, ArrowCircleDown, CaretRight } from 'phosphor-react-native';
import type { Icon as PhosphorIcon } from 'phosphor-react-native';
import { Card, Text, Badge } from '@/src/components/ui';
import { colors, spacing, borderRadius } from '@/src/constants/theme';
import type { TradePost } from '@pocket-trade-hub/shared';

interface MyPostCardProps {
  post: TradePost;
  onPress: () => void;
}

const STATUS_CONFIG: Record<string, { variant: 'success' | 'warning' | 'default'; label: string }> = {
  active: { variant: 'success', label: 'Active' },
  closed: { variant: 'default', label: 'Closed' },
  auto_closed: { variant: 'warning', label: 'Auto-closed' },
};

const TYPE_CONFIG: Record<string, { color: string; label: string; Icon: PhosphorIcon }> = {
  offering: { color: colors.success, label: 'Offering', Icon: ArrowCircleUp },
  seeking: { color: colors.primary, label: 'Seeking', Icon: ArrowCircleDown },
};

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
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

export function MyPostCard({ post, onPress }: MyPostCardProps) {
  const card = post.cards[0];
  const typeConfig = TYPE_CONFIG[post.type] ?? TYPE_CONFIG.offering;
  const statusConfig = STATUS_CONFIG[post.status] ?? STATUS_CONFIG.active;

  return (
    <Card
      onPress={onPress}
      style={styles.card}
      padding={spacing.sm}
    >
      <View style={styles.row}>
        {/* Card image */}
        <Image
          source={{ uri: card?.imageUrl }}
          style={styles.cardImage}
          contentFit="cover"
          transition={150}
        />

        {/* Info column */}
        <View style={styles.infoColumn}>
          <View style={styles.topRow}>
            {/* Type badge — custom coloured pill */}
            <View style={[styles.typeBadge, { backgroundColor: typeConfig.color }]}>
              <typeConfig.Icon size={12} color="#fff" weight="fill" />
              <Text
                preset="label"
                style={styles.typeBadgeText}
              >
                {typeConfig.label}
              </Text>
            </View>
            {/* Status badge */}
            <Badge variant={statusConfig.variant} label={statusConfig.label} />
          </View>

          <Text preset="label" style={styles.cardName} numberOfLines={1}>
            {card?.name ?? 'Unknown Card'}
          </Text>

          {card?.language && (
            <Text preset="label" color={colors.textSecondary}>
              {card.language.toUpperCase()}
            </Text>
          )}

          <Text preset="label" color={colors.textMuted}>
            {formatTimeAgo(post.createdAt)}
          </Text>
        </View>

        {/* Chevron */}
        <CaretRight size={18} color={colors.textMuted} weight="regular" />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
    marginHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardImage: {
    width: 56,
    height: 78,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceLight,
  },
  infoColumn: {
    flex: 1,
    marginLeft: spacing.sm,
    gap: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    lineHeight: 14,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 18,
  },
});
