import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { ProposalCreationModal } from './ProposalCreationModal';
import { FairnessMeter } from './FairnessMeter';
import { useProposals } from '@/src/hooks/useProposals';
import { apiFetch } from '@/src/hooks/useApi';
import { getAvatarById } from '@/src/constants/avatars';
import { colors, spacing, borderRadius, typography } from '@/src/constants/theme';
import type { TradeProposal, TradePost, ProposalCard } from '@pocket-trade-hub/shared';

interface ProposalDetailModalProps {
  visible: boolean;
  onClose: () => void;
  proposalId: string | null;
  currentUserId: string;
  onRatePartner?: (proposalId: string, partnerId: string) => void;
}

interface PartnerProfile {
  displayName: string;
  avatarId: string;
  friendCode: string | null;
  avgRating: number;
  tradeCount: number;
}

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
  return `${diffDays}d ago`;
}

function ThreadEntry({
  proposal,
  currentUserId,
  isActive,
}: {
  proposal: TradeProposal;
  currentUserId: string;
  isActive: boolean;
}) {
  const isMine = proposal.senderId === currentUserId;
  return (
    <View style={[styles.threadEntry, isActive && styles.threadEntryActive]}>
      <View style={styles.threadHeader}>
        <Text style={styles.threadSender}>
          {isMine ? 'You' : 'Partner'}
        </Text>
        <Text style={styles.threadTime}>{formatTimeAgo(proposal.createdAt)}</Text>
      </View>
      <View style={styles.threadCards}>
        <View style={styles.threadSide}>
          <Text style={styles.threadSideLabel}>Gives</Text>
          <View style={styles.threadCardRow}>
            {proposal.senderGives.map((c) => (
              <Image
                key={c.cardId}
                source={{ uri: c.imageUrl }}
                style={styles.threadCardThumb}
                contentFit="cover"
              />
            ))}
          </View>
        </View>
        <Ionicons name="swap-horizontal" size={16} color={colors.textMuted} />
        <View style={styles.threadSide}>
          <Text style={styles.threadSideLabel}>Gets</Text>
          <View style={styles.threadCardRow}>
            {proposal.senderGets.map((c) => (
              <Image
                key={c.cardId}
                source={{ uri: c.imageUrl }}
                style={styles.threadCardThumb}
                contentFit="cover"
              />
            ))}
          </View>
        </View>
      </View>
      <Text style={styles.threadFairness}>
        Fairness: {proposal.fairnessScore}
      </Text>
    </View>
  );
}

export function ProposalDetailModal({
  visible,
  onClose,
  proposalId,
  currentUserId,
  onRatePartner,
}: ProposalDetailModalProps) {
  const {
    acceptProposal,
    rejectProposal,
    completeProposal,
    getProposalThread,
  } = useProposals();

  const [thread, setThread] = useState<TradeProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [postData, setPostData] = useState<TradePost | null>(null);

  const activeProposal = thread.length > 0
    ? thread.find((p) => p.status === 'pending') ?? thread[thread.length - 1]
    : null;

  const partnerId = activeProposal
    ? activeProposal.senderId === currentUserId
      ? activeProposal.receiverId
      : activeProposal.senderId
    : null;

  const isReceiver = activeProposal?.receiverId === currentUserId;

  // Load thread and partner data
  useEffect(() => {
    if (!visible || !proposalId) return;
    setLoading(true);
    getProposalThread(proposalId).then((t) => {
      // Sort chronologically
      const sorted = [...t].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      setThread(sorted);
      setLoading(false);
    });
  }, [visible, proposalId, getProposalThread]);

  // Fetch partner profile
  useEffect(() => {
    if (!partnerId) return;
    apiFetch<PartnerProfile>(`/users/${partnerId}`)
      .then(setPartner)
      .catch(() => {});
  }, [partnerId]);

  // Fetch post data if proposal has postId
  useEffect(() => {
    if (!activeProposal?.postId) {
      setPostData(null);
      return;
    }
    apiFetch<{ post: TradePost }>(`/posts/${activeProposal.postId}`)
      .then((result) => setPostData(result.post))
      .catch(() => setPostData(null));
  }, [activeProposal?.postId]);

  const handleAccept = useCallback(async () => {
    if (!activeProposal) return;
    setActionLoading(true);
    try {
      await acceptProposal(activeProposal.id);
      // Refetch thread
      if (proposalId) {
        const t = await getProposalThread(proposalId);
        setThread([...t].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
      }
      Toast.show({ type: 'success', text1: 'Proposal accepted!' });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to accept proposal' });
    } finally {
      setActionLoading(false);
    }
  }, [activeProposal, acceptProposal, proposalId, getProposalThread]);

  const handleReject = useCallback(async () => {
    if (!activeProposal) return;
    setActionLoading(true);
    try {
      await rejectProposal(activeProposal.id);
      if (proposalId) {
        const t = await getProposalThread(proposalId);
        setThread([...t].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
      }
      Toast.show({ type: 'success', text1: 'Proposal rejected' });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to reject proposal' });
    } finally {
      setActionLoading(false);
    }
  }, [activeProposal, rejectProposal, proposalId, getProposalThread]);

  const handleComplete = useCallback(async () => {
    if (!activeProposal) return;
    setActionLoading(true);
    try {
      await completeProposal(activeProposal.id);
      if (proposalId) {
        const t = await getProposalThread(proposalId);
        setThread([...t].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
      }
      Toast.show({ type: 'success', text1: 'Trade completed!' });
      if (onRatePartner && partnerId) {
        const pid = activeProposal.id;
        const partId = partnerId;
        onClose();
        // Brief delay so the detail modal animates out before rating modal opens
        setTimeout(() => onRatePartner(pid, partId), 400);
        return;
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to complete trade' });
    } finally {
      setActionLoading(false);
    }
  }, [activeProposal, completeProposal, proposalId, getProposalThread, onRatePartner, partnerId]);

  const handleCopyFriendCode = useCallback(async () => {
    if (partner?.friendCode) {
      await Clipboard.setStringAsync(partner.friendCode);
      Toast.show({ type: 'success', text1: 'Friend code copied!' });
    }
  }, [partner]);

  if (!proposalId) return null;

  const avatar = partner ? getAvatarById(partner.avatarId) : null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>

          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Partner reputation header */}
              {partner && (
                <View style={styles.partnerHeader}>
                  <View
                    style={[
                      styles.avatarLarge,
                      { backgroundColor: avatar?.color ?? colors.surfaceLight },
                    ]}
                  >
                    <Text style={styles.avatarEmoji}>{avatar?.emoji ?? '?'}</Text>
                  </View>
                  <Text style={styles.partnerName}>{partner.displayName}</Text>
                  {partner.tradeCount > 0 ? (
                    <View style={styles.reputationRow}>
                      {Array.from({ length: 5 }, (_, i) => {
                        const filled = partner.avgRating >= i + 1;
                        const half = !filled && partner.avgRating >= i + 0.5;
                        return (
                          <Ionicons
                            key={i}
                            name={filled ? 'star' : half ? 'star-half' : 'star-outline'}
                            size={16}
                            color={colors.primary}
                          />
                        );
                      })}
                      <Text style={styles.reputationText}>
                        {partner.avgRating.toFixed(1)} - {partner.tradeCount} completed trade
                        {partner.tradeCount !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.newTraderText}>New trader - no ratings yet</Text>
                  )}
                </View>
              )}

              {/* Friend code (shown when accepted) */}
              {activeProposal?.status === 'accepted' && partner?.friendCode && (
                <Pressable onPress={handleCopyFriendCode} style={styles.friendCodeBox}>
                  <Text style={styles.friendCodeLabel}>Partner Friend Code</Text>
                  <View style={styles.friendCodeRow}>
                    <Text style={styles.friendCodeText}>{partner.friendCode}</Text>
                    <Ionicons name="copy-outline" size={18} color={colors.primary} />
                  </View>
                  <Text style={styles.friendCodeHint}>Tap to copy</Text>
                </Pressable>
              )}

              {/* Thread history */}
              <Text style={styles.sectionTitle}>Proposal History</Text>
              {thread.map((p, i) => (
                <ThreadEntry
                  key={p.id}
                  proposal={p}
                  currentUserId={currentUserId}
                  isActive={p.id === activeProposal?.id}
                />
              ))}

              {/* Action buttons */}
              {activeProposal && (
                <View style={styles.actionsContainer}>
                  {activeProposal.status === 'pending' && isReceiver && (
                    <>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.acceptButton]}
                        onPress={handleAccept}
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <>
                            <Ionicons name="checkmark" size={18} color="#fff" />
                            <Text style={styles.actionButtonText}>Accept</Text>
                          </>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={handleReject}
                        disabled={actionLoading}
                      >
                        <Ionicons name="close" size={18} color="#fff" />
                        <Text style={styles.actionButtonText}>Reject</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.counterButton]}
                        onPress={() => setShowCounterModal(true)}
                        disabled={actionLoading}
                      >
                        <Ionicons name="return-up-back" size={18} color="#fff" />
                        <Text style={styles.actionButtonText}>Counter</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {activeProposal.status === 'accepted' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.completeButton]}
                      onPress={handleComplete}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <Ionicons name="trophy" size={18} color="#fff" />
                          <Text style={styles.actionButtonText}>Mark as Completed</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                  {activeProposal.status === 'completed' && onRatePartner && partnerId && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rateButton]}
                      onPress={() => onRatePartner(activeProposal.id, partnerId)}
                    >
                      <Ionicons name="star" size={18} color="#fff" />
                      <Text style={styles.actionButtonText}>Rate Partner</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </ScrollView>
          )}

          {/* Post context notice */}
          {postData && (
            <View style={styles.postNotice}>
              <Ionicons name="newspaper-outline" size={16} color={colors.textSecondary} />
              <View style={styles.postNoticeContent}>
                <Text style={styles.postNoticeTitle}>
                  From {postData.type === 'offering' ? 'Offering' : 'Seeking'} post
                </Text>
                <Text style={styles.postNoticeCard}>
                  {postData.cards[0]?.name ?? 'Unknown card'}
                  {postData.status !== 'active' && (
                    ` (${postData.status === 'auto_closed' ? 'auto-closed' : postData.status})`
                  )}
                </Text>
              </View>
            </View>
          )}

          {/* Counter-offer modal */}
          {activeProposal && (
            <ProposalCreationModal
              visible={showCounterModal}
              onClose={() => {
                setShowCounterModal(false);
                // Refetch thread after counter
                if (proposalId) {
                  getProposalThread(proposalId).then((t) => {
                    setThread(
                      [...t].sort(
                        (a, b) =>
                          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
                      ),
                    );
                  });
                }
              }}
              post={postData}
              postReceiverId={partnerId ?? undefined}
              isCounter
              existingProposal={activeProposal}
            />
          )}
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
    maxHeight: '92%',
    paddingTop: spacing.lg,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 10,
    padding: spacing.xs,
  },
  loaderContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  // Partner header
  partnerHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  partnerName: {
    ...typography.subheading,
    marginTop: spacing.sm,
  },
  reputationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  reputationText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  newTraderText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  // Friend code
  friendCodeBox: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  friendCodeLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  friendCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  friendCodeText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 2,
  },
  friendCodeHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  // Thread
  sectionTitle: {
    ...typography.label,
    color: colors.primary,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  threadEntry: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  threadEntryActive: {
    borderColor: colors.primary,
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  threadSender: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text,
  },
  threadTime: {
    ...typography.caption,
    color: colors.textMuted,
  },
  threadCards: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  threadSide: {
    alignItems: 'center',
  },
  threadSideLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  threadCardRow: {
    flexDirection: 'row',
    gap: 3,
  },
  threadCardThumb: {
    width: 32,
    height: 45,
    borderRadius: 3,
    backgroundColor: colors.surfaceLight,
  },
  threadFairness: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontSize: 11,
  },
  // Post notice
  postNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  postNoticeContent: {
    flex: 1,
  },
  postNoticeTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  postNoticeCard: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // Actions
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
    justifyContent: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    minWidth: 90,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  acceptButton: {
    backgroundColor: colors.success,
  },
  rejectButton: {
    backgroundColor: colors.error,
  },
  counterButton: {
    backgroundColor: '#3498db',
  },
  completeButton: {
    backgroundColor: colors.primary,
    flex: 1,
  },
  rateButton: {
    backgroundColor: colors.primary,
    flex: 1,
  },
});
