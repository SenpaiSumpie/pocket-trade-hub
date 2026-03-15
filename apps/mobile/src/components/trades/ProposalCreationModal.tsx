import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { FairnessMeter } from './FairnessMeter';
import { useProposals } from '@/src/hooks/useProposals';
import { apiFetch } from '@/src/hooks/useApi';
import { calculateFairness } from '@pocket-trade-hub/shared';
import { colors, spacing, borderRadius, typography } from '@/src/constants/theme';
import type { TradeMatch, TradePost, TradeProposal, ProposalCard } from '@pocket-trade-hub/shared';

interface ProposalCreationModalProps {
  visible: boolean;
  onClose: () => void;
  match?: TradeMatch | null;
  post?: TradePost | null;
  postReceiverId?: string;
  isCounter?: boolean;
  existingProposal?: TradeProposal;
}

interface CardPickerItem {
  cardId: string;
  cardName: string;
  imageUrl: string;
  rarity: string;
}

function matchCardToProposalCard(pair: { cardId: string; cardName: string; cardImageUrl: string; rarity: string | null }): ProposalCard {
  return {
    cardId: pair.cardId,
    cardName: pair.cardName,
    imageUrl: pair.cardImageUrl,
    rarity: pair.rarity ?? 'diamond1',
  };
}

function postCardToProposalCard(card: { cardId: string; name: string; imageUrl: string; rarity: string | null }): ProposalCard {
  return {
    cardId: card.cardId,
    cardName: card.name,
    imageUrl: card.imageUrl,
    rarity: card.rarity ?? 'diamond1',
  };
}

export function ProposalCreationModal({
  visible,
  onClose,
  match,
  post,
  postReceiverId,
  isCounter,
  existingProposal,
}: ProposalCreationModalProps) {
  const { createProposal, counterProposal } = useProposals();
  const [sending, setSending] = useState(false);
  const [showPicker, setShowPicker] = useState<'give' | 'get' | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerCards, setPickerCards] = useState<CardPickerItem[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);

  // Determine if we're in post mode or match mode
  const isPostMode = !!post && !match;

  // Initialize cards from match, post, or existing proposal
  const initialGiving = useMemo(() => {
    if (isCounter && existingProposal) {
      return existingProposal.senderGets.map((c) => ({ ...c }));
    }
    if (match) {
      return match.userGives.map(matchCardToProposalCard);
    }
    if (post) {
      // For Seeking posts: user has the card, so pre-fill senderGives
      if (post.type === 'seeking') {
        return post.cards.map(postCardToProposalCard);
      }
      // For Offering posts: user wants the card, senderGives starts empty
      return [];
    }
    return [];
  }, [match, post, isCounter, existingProposal]);

  const initialGetting = useMemo(() => {
    if (isCounter && existingProposal) {
      return existingProposal.senderGives.map((c) => ({ ...c }));
    }
    if (match) {
      return match.userGets.map(matchCardToProposalCard);
    }
    if (post) {
      // For Offering posts: user wants the card, so pre-fill senderGets
      if (post.type === 'offering') {
        return post.cards.map(postCardToProposalCard);
      }
      // For Seeking posts: user gives the card, senderGets starts empty
      return [];
    }
    return [];
  }, [match, post, isCounter, existingProposal]);

  const [givingCards, setGivingCards] = useState<ProposalCard[]>(initialGiving);
  const [gettingCards, setGettingCards] = useState<ProposalCard[]>(initialGetting);

  // Reset cards when modal opens with new data
  const handleShow = useCallback(() => {
    setGivingCards(initialGiving);
    setGettingCards(initialGetting);
    setSending(false);
    setShowPicker(null);
  }, [initialGiving, initialGetting]);

  const removeGivingCard = useCallback((cardId: string) => {
    setGivingCards((prev) => prev.filter((c) => c.cardId !== cardId));
  }, []);

  const removeGettingCard = useCallback((cardId: string) => {
    setGettingCards((prev) => prev.filter((c) => c.cardId !== cardId));
  }, []);

  const openPicker = useCallback(async (side: 'give' | 'get') => {
    setShowPicker(side);
    setPickerSearch('');
    setPickerLoading(true);
    try {
      if (side === 'give') {
        const data = await apiFetch<{ items: Array<{ card: CardPickerItem }> }>('/collection');
        setPickerCards(
          data.items.map((item) => ({
            cardId: item.card.cardId ?? (item.card as any).id,
            cardName: item.card.cardName ?? (item.card as any).name,
            imageUrl: item.card.imageUrl,
            rarity: item.card.rarity,
          })),
        );
      } else {
        const data = await apiFetch<{ items: Array<{ card: CardPickerItem }> }>('/wanted');
        setPickerCards(
          data.items.map((item) => ({
            cardId: item.card.cardId ?? (item.card as any).id,
            cardName: item.card.cardName ?? (item.card as any).name,
            imageUrl: item.card.imageUrl,
            rarity: item.card.rarity,
          })),
        );
      }
    } catch {
      setPickerCards([]);
    } finally {
      setPickerLoading(false);
    }
  }, []);

  const addCardFromPicker = useCallback(
    (card: CardPickerItem) => {
      const proposalCard: ProposalCard = {
        cardId: card.cardId,
        cardName: card.cardName,
        imageUrl: card.imageUrl,
        rarity: card.rarity,
      };
      if (showPicker === 'give') {
        setGivingCards((prev) => {
          if (prev.some((c) => c.cardId === card.cardId)) return prev;
          return [...prev, proposalCard];
        });
      } else {
        setGettingCards((prev) => {
          if (prev.some((c) => c.cardId === card.cardId)) return prev;
          return [...prev, proposalCard];
        });
      }
      setShowPicker(null);
    },
    [showPicker],
  );

  const filteredPickerCards = useMemo(() => {
    if (!pickerSearch.trim()) return pickerCards;
    const q = pickerSearch.toLowerCase();
    return pickerCards.filter((c) => c.cardName.toLowerCase().includes(q));
  }, [pickerCards, pickerSearch]);

  const handleSend = useCallback(async () => {
    if (givingCards.length === 0 || gettingCards.length === 0) return;

    // Need either a match or a post with receiverId
    const receiverId = match?.partnerId ?? postReceiverId;
    if (!receiverId) return;

    setSending(true);
    try {
      const fairness = calculateFairness(givingCards, gettingCards);
      const input = {
        matchId: match?.id,
        postId: post?.id,
        receiverId,
        senderGives: givingCards,
        senderGets: gettingCards,
        fairnessScore: fairness.score,
        parentId: isCounter && existingProposal ? existingProposal.id : undefined,
      };

      if (isCounter && existingProposal) {
        await counterProposal(existingProposal.id, input);
      } else {
        await createProposal(input);
      }

      Toast.show({
        type: 'success',
        text1: isCounter ? 'Counter-offer sent!' : 'Proposal sent!',
      });
      onClose();
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Failed to send proposal',
        text2: 'Please try again.',
      });
    } finally {
      setSending(false);
    }
  }, [match, post, postReceiverId, givingCards, gettingCards, isCounter, existingProposal, createProposal, counterProposal, onClose]);

  const canSend = givingCards.length > 0 && gettingCards.length > 0 && !sending;

  // Need either match or post to render
  if (!match && !post) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      onShow={handleShow}
    >
      <SafeAreaView style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>
              {isCounter ? 'Counter-Offer' : 'Propose Trade'}
            </Text>
          </View>

          {/* Post context hint */}
          {isPostMode && post && (
            <View style={styles.contextHint}>
              <Ionicons
                name={post.type === 'offering' ? 'arrow-up-circle' : 'arrow-down-circle'}
                size={16}
                color={post.type === 'offering' ? colors.success : colors.primary}
              />
              <Text style={styles.contextHintText}>
                {post.type === 'offering'
                  ? 'This user is offering a card. Add what you will give in return.'
                  : 'This user is seeking a card. The card is pre-filled in what you give.'}
              </Text>
            </View>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* You Give section */}
            <Text style={styles.sectionLabel}>You Give</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardRow}>
              {givingCards.map((card) => (
                <View key={card.cardId} style={styles.cardItem}>
                  <Image
                    source={{ uri: card.imageUrl }}
                    style={styles.cardImage}
                    contentFit="cover"
                    transition={150}
                  />
                  <Pressable
                    style={styles.removeButton}
                    onPress={() => removeGivingCard(card.cardId)}
                  >
                    <Ionicons name="close-circle" size={20} color={colors.error} />
                  </Pressable>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {card.cardName}
                  </Text>
                </View>
              ))}
              <TouchableOpacity
                style={styles.addCardButton}
                onPress={() => openPicker('give')}
              >
                <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
                <Text style={styles.addCardText}>Add</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Fairness Meter */}
            <FairnessMeter givingCards={givingCards} gettingCards={gettingCards} />

            {/* You Get section */}
            <Text style={styles.sectionLabel}>You Get</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardRow}>
              {gettingCards.map((card) => (
                <View key={card.cardId} style={styles.cardItem}>
                  <Image
                    source={{ uri: card.imageUrl }}
                    style={styles.cardImage}
                    contentFit="cover"
                    transition={150}
                  />
                  <Pressable
                    style={styles.removeButton}
                    onPress={() => removeGettingCard(card.cardId)}
                  >
                    <Ionicons name="close-circle" size={20} color={colors.error} />
                  </Pressable>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {card.cardName}
                  </Text>
                </View>
              ))}
              <TouchableOpacity
                style={styles.addCardButton}
                onPress={() => openPicker('get')}
              >
                <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
                <Text style={styles.addCardText}>Add</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Send button */}
            <TouchableOpacity
              style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!canSend}
              activeOpacity={0.7}
            >
              {sending ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={styles.sendButtonText}>
                  {isCounter ? 'Send Counter-Offer' : 'Send Proposal'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>

          {/* Card Picker Modal */}
          {showPicker && (
            <Modal
              visible
              animationType="slide"
              transparent
              onRequestClose={() => setShowPicker(null)}
            >
              <SafeAreaView style={styles.pickerOverlay}>
                <View style={styles.pickerContainer}>
                  <View style={styles.pickerHeader}>
                    <TouchableOpacity onPress={() => setShowPicker(null)}>
                      <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.pickerTitle}>
                      {showPicker === 'give' ? 'Your Collection' : 'Your Wanted Cards'}
                    </Text>
                    <View style={{ width: 24 }} />
                  </View>
                  <TextInput
                    style={styles.pickerSearch}
                    placeholder="Search cards..."
                    placeholderTextColor={colors.textMuted}
                    value={pickerSearch}
                    onChangeText={setPickerSearch}
                  />
                  {pickerLoading ? (
                    <ActivityIndicator
                      size="large"
                      color={colors.primary}
                      style={styles.pickerLoader}
                    />
                  ) : (
                    <FlatList
                      data={filteredPickerCards}
                      keyExtractor={(item) => item.cardId}
                      numColumns={3}
                      renderItem={({ item }) => (
                        <Pressable
                          style={styles.pickerCardItem}
                          onPress={() => addCardFromPicker(item)}
                        >
                          <Image
                            source={{ uri: item.imageUrl }}
                            style={styles.pickerCardImage}
                            contentFit="cover"
                            transition={150}
                          />
                          <Text style={styles.pickerCardName} numberOfLines={1}>
                            {item.cardName}
                          </Text>
                        </Pressable>
                      )}
                      contentContainerStyle={styles.pickerList}
                      ListEmptyComponent={
                        <Text style={styles.pickerEmpty}>No cards found</Text>
                      }
                    />
                  )}
                </View>
              </SafeAreaView>
            </Modal>
          )}
        </View>
      </SafeAreaView>
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
    paddingTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    position: 'absolute',
    left: spacing.md,
    padding: spacing.xs,
  },
  title: {
    ...typography.subheading,
    textAlign: 'center',
  },
  contextHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contextHintText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.md,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.primary,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  cardRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  cardItem: {
    alignItems: 'center',
    marginRight: spacing.sm,
    width: 72,
  },
  cardImage: {
    width: 60,
    height: 84,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceLight,
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -2,
    zIndex: 1,
  },
  cardName: {
    fontSize: 10,
    color: colors.text,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 68,
  },
  addCardButton: {
    width: 60,
    height: 84,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCardText: {
    fontSize: 10,
    color: colors.primary,
    marginTop: 2,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.background,
  },
  // Card Picker styles
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
    paddingTop: spacing.md,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  pickerTitle: {
    ...typography.label,
    color: colors.text,
    fontWeight: '600',
  },
  pickerSearch: {
    ...typography.body,
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    color: colors.text,
  },
  pickerLoader: {
    marginTop: spacing.xl,
  },
  pickerList: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  pickerCardItem: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.xs,
  },
  pickerCardImage: {
    width: 70,
    height: 98,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceLight,
  },
  pickerCardName: {
    fontSize: 10,
    color: colors.text,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 70,
  },
  pickerEmpty: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
