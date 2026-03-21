import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { ArrowCircleUp, ArrowCircleDown, CaretRight } from 'phosphor-react-native';
import type { Icon as PhosphorIcon } from 'phosphor-react-native';
import { colors, spacing, borderRadius, typography } from '@/src/constants/theme';
import type { TradePost } from '@pocket-trade-hub/shared';

interface MyPostCardProps {
  post: TradePost;
  onPress: () => void;
}

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  active: { color: colors.success, label: 'Active' },
  closed: { color: colors.textMuted, label: 'Closed' },
  auto_closed: { color: '#e67e22', label: 'Auto-closed' },
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
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
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
          {/* Type badge */}
          <View style={[styles.typeBadge, { backgroundColor: typeConfig.color }]}>
            <typeConfig.Icon size={12} color="#fff" weight="fill" />
            <Text style={styles.typeBadgeText}>{typeConfig.label}</Text>
          </View>
          {/* Status badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
            <Text style={styles.statusBadgeText}>{statusConfig.label}</Text>
          </View>
        </View>

        <Text style={styles.cardName} numberOfLines={1}>
          {card?.name ?? 'Unknown Card'}
        </Text>

        {card?.language && (
          <Text style={styles.languageText}>{card.language.toUpperCase()}</Text>
        )}

        <Text style={styles.timeText}>{formatTimeAgo(post.createdAt)}</Text>
      </View>

      {/* Chevron */}
      <CaretRight size={18} color={colors.textMuted} weight="regular" />
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
    padding: spacing.sm,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
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
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  cardName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  languageText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  timeText: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
