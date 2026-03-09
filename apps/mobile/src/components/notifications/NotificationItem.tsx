import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@/src/constants/theme';
import type { Notification, NotificationType } from '@pocket-trade-hub/shared';

interface NotificationItemProps {
  notification: Notification;
  onPress: (notification: Notification) => void;
}

const TYPE_ICONS: Record<NotificationType, keyof typeof Ionicons.glyphMap> = {
  proposal_received: 'swap-horizontal',
  proposal_accepted: 'checkmark-circle',
  proposal_rejected: 'close-circle',
  proposal_countered: 'repeat',
  trade_completed: 'trophy',
  new_match: 'flash',
  rating_received: 'star',
  system: 'megaphone',
};

const TYPE_COLORS: Record<NotificationType, string> = {
  proposal_received: colors.primary,
  proposal_accepted: colors.success,
  proposal_rejected: colors.error,
  proposal_countered: colors.primary,
  trade_completed: colors.primary,
  new_match: '#6c63ff',
  rating_received: colors.primary,
  system: colors.textSecondary,
};

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks}w ago`;

  return new Date(dateStr).toLocaleDateString();
}

export function NotificationItem({ notification, onPress }: NotificationItemProps) {
  const iconName = TYPE_ICONS[notification.type] || 'notifications';
  const iconColor = TYPE_COLORS[notification.type] || colors.textSecondary;
  const isUnread = !notification.read;

  return (
    <Pressable
      style={[styles.container, isUnread && styles.unreadContainer]}
      onPress={() => onPress(notification)}
    >
      {isUnread && <View style={styles.unreadDot} />}
      <View style={[styles.iconCircle, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={iconName} size={20} color={iconColor} />
      </View>
      <View style={styles.textSection}>
        <Text
          style={[styles.title, isUnread && styles.unreadTitle]}
          numberOfLines={1}
        >
          {notification.title}
        </Text>
        <Text style={styles.body} numberOfLines={2}>
          {notification.body}
        </Text>
        <Text style={styles.time}>{getRelativeTime(notification.createdAt)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  unreadContainer: {
    backgroundColor: colors.surface,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    position: 'absolute',
    left: spacing.sm,
    top: '50%',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  textSection: {
    flex: 1,
  },
  title: {
    ...typography.label,
    color: colors.text,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  body: {
    ...typography.caption,
    marginTop: 2,
  },
  time: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
});
