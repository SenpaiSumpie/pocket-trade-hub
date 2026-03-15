import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { usePosts } from '@/src/hooks/usePosts';
import { colors, spacing, borderRadius, typography } from '@/src/constants/theme';
import type { TradePost } from '@pocket-trade-hub/shared';

interface MyPostDetailModalProps {
  visible: boolean;
  onClose: () => void;
  post: TradePost | null;
}

const STATUS_CONFIG: Record<string, { color: string; label: string; description: string }> = {
  active: { color: colors.success, label: 'Active', description: 'This post is visible in the marketplace.' },
  closed: { color: colors.textMuted, label: 'Closed', description: 'You closed this post.' },
  auto_closed: { color: '#e67e22', label: 'Auto-closed', description: 'This post was automatically closed because the card was traded.' },
};

const TYPE_CONFIG: Record<string, { color: string; label: string }> = {
  offering: { color: colors.success, label: 'Offering' },
  seeking: { color: colors.primary, label: 'Seeking' },
};

function formatDate(dateStr: string): string {
  const normalized = dateStr.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(dateStr)
    ? dateStr
    : dateStr + 'Z';
  const date = new Date(normalized);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function MyPostDetailModal({ visible, onClose, post }: MyPostDetailModalProps) {
  const { closePost, deletePost } = usePosts();
  const [actionLoading, setActionLoading] = useState(false);

  const card = post?.cards[0];
  const statusConfig = STATUS_CONFIG[post?.status ?? 'active'];
  const typeConfig = TYPE_CONFIG[post?.type ?? 'offering'];
  const isActive = post?.status === 'active';

  const handleClose = useCallback(async () => {
    if (!post) return;
    setActionLoading(true);
    try {
      await closePost(post.id);
      onClose();
    } catch {
      // Error toast handled by hook
    } finally {
      setActionLoading(false);
    }
  }, [post, closePost, onClose]);

  const handleDelete = useCallback(() => {
    if (!post) return;
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await deletePost(post.id);
              onClose();
            } catch {
              // Error toast handled by hook
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  }, [post, deletePost, onClose]);

  if (!post) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
          <View style={styles.modalContainer}>
            {/* Close button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Card image */}
              {card && (
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: card.imageUrl }}
                    style={styles.cardImage}
                    contentFit="contain"
                    transition={200}
                  />
                </View>
              )}

              {/* Type and status badges */}
              <View style={styles.badgeRow}>
                <View style={[styles.badge, { backgroundColor: typeConfig.color }]}>
                  <Text style={styles.badgeText}>{typeConfig.label}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: statusConfig.color }]}>
                  <Text style={styles.badgeText}>{statusConfig.label}</Text>
                </View>
              </View>

              {/* Card name */}
              <Text style={styles.cardName}>{card?.name ?? 'Unknown Card'}</Text>

              {/* Card details */}
              <View style={styles.detailsContainer}>
                {card?.language && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Language</Text>
                    <Text style={styles.detailValue}>{card.language.toUpperCase()}</Text>
                  </View>
                )}
                {card?.rarity && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Rarity</Text>
                    <Text style={styles.detailValue}>{card.rarity}</Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Created</Text>
                  <Text style={styles.detailValue}>{formatDate(post.createdAt)}</Text>
                </View>
              </View>

              {/* Status explanation for non-active posts */}
              {!isActive && (
                <View style={styles.statusNotice}>
                  <Ionicons name="information-circle-outline" size={18} color={statusConfig.color} />
                  <Text style={styles.statusNoticeText}>{statusConfig.description}</Text>
                </View>
              )}

              {/* Actions */}
              <View style={styles.actionsContainer}>
                {isActive && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.closePostButton]}
                    onPress={handleClose}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Ionicons name="close-circle-outline" size={18} color="#fff" />
                        <Text style={styles.actionButtonText}>Close Post</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={handleDelete}
                  disabled={actionLoading}
                >
                  <Ionicons name="trash-outline" size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>Delete Post</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
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
  safeArea: {
    maxHeight: '92%',
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
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
  imageContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardImage: {
    width: 180,
    height: 252,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  cardName: {
    ...typography.subheading,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  detailsContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  detailValue: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  statusNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  statusNoticeText: {
    flex: 1,
    ...typography.caption,
    color: colors.textSecondary,
  },
  actionsContainer: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm + 4,
    borderRadius: borderRadius.md,
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
  closePostButton: {
    backgroundColor: colors.textSecondary,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
});
