import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { ArrowLeft, X, ArrowCircleUp, ArrowCircleDown } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, borderRadius, typography } from '@/src/constants/theme';
import { usePosts } from '@/src/hooks/usePosts';
import { apiFetch } from '@/src/hooks/useApi';
import type { PostType, PostCard, CreatePostInput } from '@pocket-trade-hub/shared';

interface PostCreationModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
  onError?: () => void;
}

interface CardPickerItem {
  cardId: string;
  name: string;
  imageUrl: string;
  rarity: string | null;
  language: string;
  setId?: string;
}

type Step = 'type' | 'card' | 'confirm';

export function PostCreationModal({ visible, onClose, onCreated, onError }: PostCreationModalProps) {
  const { t } = useTranslation();
  const { createPost } = usePosts();
  const [step, setStep] = useState<Step>('type');
  const [postType, setPostType] = useState<PostType | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardPickerItem | null>(null);
  const [cards, setCards] = useState<CardPickerItem[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');

  const resetState = useCallback(() => {
    setStep('type');
    setPostType(null);
    setSelectedCard(null);
    setCards([]);
    setSearch('');
    setCreating(false);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  const selectType = useCallback(async (type: PostType) => {
    setPostType(type);
    setStep('card');
    setCardsLoading(true);
    try {
      if (type === 'offering') {
        // Fetch user's collection
        const data = await apiFetch<Array<{
          cardId: string;
          language: string;
          quantity: number;
          card: { id: string; name: string; imageUrl: string; rarity: string | null; setId?: string };
        }>>('/collection');
        const items: CardPickerItem[] = (Array.isArray(data) ? data : []).map((item) => ({
          cardId: item.cardId ?? item.card?.id,
          name: item.card?.name ?? 'Unknown',
          imageUrl: item.card?.imageUrl ?? '',
          rarity: item.card?.rarity ?? null,
          language: item.language ?? 'en',
          setId: item.card?.setId,
        }));
        setCards(items);
      } else {
        // Fetch user's wanted list
        const data = await apiFetch<Array<{
          cardId: string;
          language: string;
          priority: string;
          card: { id: string; name: string; imageUrl: string; rarity: string | null; setId?: string };
        }>>('/wanted');
        const items: CardPickerItem[] = (Array.isArray(data) ? data : []).map((item) => ({
          cardId: item.cardId ?? item.card?.id,
          name: item.card?.name ?? 'Unknown',
          imageUrl: item.card?.imageUrl ?? '',
          rarity: item.card?.rarity ?? null,
          language: item.language ?? 'en',
          setId: item.card?.setId,
        }));
        setCards(items);
      }
    } catch {
      setCards([]);
    } finally {
      setCardsLoading(false);
    }
  }, []);

  const selectCard = useCallback((card: CardPickerItem) => {
    setSelectedCard(card);
    setStep('confirm');
  }, []);

  const handleCreate = useCallback(async () => {
    if (!postType || !selectedCard) return;
    setCreating(true);
    const postCard: PostCard = {
      cardId: selectedCard.cardId,
      name: selectedCard.name,
      imageUrl: selectedCard.imageUrl,
      rarity: selectedCard.rarity,
      language: selectedCard.language,
      setId: selectedCard.setId,
    };
    const input: CreatePostInput = {
      type: postType,
      cards: [postCard],
    };
    const result = await createPost(input);
    setCreating(false);
    if (result) {
      resetState();
      onCreated();
    } else {
      onError?.();
    }
  }, [postType, selectedCard, createPost, resetState, onCreated, onError]);

  const filteredCards = useMemo(() => {
    if (!search.trim()) return cards;
    const q = search.toLowerCase();
    return cards.filter((c) => c.name.toLowerCase().includes(q));
  }, [cards, search]);

  const goBack = useCallback(() => {
    if (step === 'confirm') {
      setStep('card');
      setSelectedCard(null);
    } else if (step === 'card') {
      setStep('type');
      setPostType(null);
      setCards([]);
      setSearch('');
    }
  }, [step]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            {step !== 'type' ? (
              <Pressable onPress={goBack} style={styles.headerBtn}>
                <ArrowLeft size={24} color={colors.text} weight="regular" />
              </Pressable>
            ) : (
              <Pressable onPress={handleClose} style={styles.headerBtn}>
                <X size={24} color={colors.text} weight="regular" />
              </Pressable>
            )}
            <Text style={styles.title}>
              {step === 'type' && t('market.createPost')}
              {step === 'card' && (postType === 'offering' ? t('market.selectCards') : t('market.selectCards'))}
              {step === 'confirm' && t('market.createPost')}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Step 1: Select type */}
          {step === 'type' && (
            <View style={styles.typeContainer}>
              <Text style={styles.stepLabel}>{t('market.postType')}</Text>
              <Pressable
                style={[styles.typeCard, { borderColor: colors.success }]}
                onPress={() => selectType('offering')}
              >
                <ArrowCircleUp size={32} color={colors.success} weight="regular" />
                <View style={styles.typeCardContent}>
                  <Text style={styles.typeCardTitle}>{t('market.offering')}</Text>
                  <Text style={styles.typeCardDesc}>
                    {t('cards.myCollection')}
                  </Text>
                </View>
              </Pressable>
              <Pressable
                style={[styles.typeCard, { borderColor: '#3b82f6' }]}
                onPress={() => selectType('seeking')}
              >
                <ArrowCircleDown size={32} color="#3b82f6" weight="regular" />
                <View style={styles.typeCardContent}>
                  <Text style={styles.typeCardTitle}>{t('market.seeking')}</Text>
                  <Text style={styles.typeCardDesc}>
                    {t('cards.wanted')}
                  </Text>
                </View>
              </Pressable>
            </View>
          )}

          {/* Step 2: Select card */}
          {step === 'card' && (
            <View style={styles.cardPickerContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder={t('cards.searchPlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={search}
                onChangeText={setSearch}
              />
              {cardsLoading ? (
                <ActivityIndicator
                  size="large"
                  color={colors.primary}
                  style={styles.loader}
                />
              ) : (
                <FlatList
                  data={filteredCards}
                  keyExtractor={(item) => `${item.cardId}-${item.language}`}
                  numColumns={3}
                  renderItem={({ item }) => (
                    <Pressable
                      style={styles.cardItem}
                      onPress={() => selectCard(item)}
                    >
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.cardImage}
                        contentFit="cover"
                        transition={150}
                      />
                      <Text style={styles.cardItemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.cardItemLang}>{item.language.toUpperCase()}</Text>
                    </Pressable>
                  )}
                  contentContainerStyle={styles.cardList}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>
                      {postType === 'offering'
                        ? 'No cards in your collection. Add some first!'
                        : 'No cards in your wanted list. Add some first!'}
                    </Text>
                  }
                />
              )}
            </View>
          )}

          {/* Step 3: Confirm */}
          {step === 'confirm' && selectedCard && (
            <View style={styles.confirmContainer}>
              <View style={styles.confirmCard}>
                <Image
                  source={{ uri: selectedCard.imageUrl }}
                  style={styles.confirmImage}
                  contentFit="cover"
                  transition={200}
                />
                <View style={styles.confirmInfo}>
                  <View style={[
                    styles.confirmTypeBadge,
                    { backgroundColor: postType === 'offering' ? colors.success : '#3b82f6' },
                  ]}>
                    <Text style={styles.confirmTypeBadgeText}>
                      {postType === 'offering' ? 'OFFERING' : 'SEEKING'}
                    </Text>
                  </View>
                  <Text style={styles.confirmName}>{selectedCard.name}</Text>
                  <Text style={styles.confirmLang}>
                    Language: {selectedCard.language.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Pressable
                style={[styles.createButton, creating && styles.createButtonDisabled]}
                onPress={handleCreate}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <Text style={styles.createButtonText}>Create Post</Text>
                )}
              </Pressable>
            </View>
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
  container: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '92%',
    minHeight: '50%',
    paddingTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: {
    padding: spacing.xs,
  },
  title: {
    ...typography.subheading,
    textAlign: 'center',
    flex: 1,
  },
  // Step 1: Type selection
  typeContainer: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  stepLabel: {
    ...typography.label,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 2,
  },
  typeCardContent: {
    flex: 1,
  },
  typeCardTitle: {
    ...typography.subheading,
    fontSize: 18,
  },
  typeCardDesc: {
    ...typography.caption,
    marginTop: 2,
  },
  // Step 2: Card picker
  cardPickerContainer: {
    flex: 1,
    minHeight: 300,
  },
  searchInput: {
    ...typography.body,
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    color: colors.text,
  },
  loader: {
    marginTop: spacing.xl,
  },
  cardList: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  cardItem: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.xs,
  },
  cardImage: {
    width: 80,
    height: 112,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceLight,
  },
  cardItemName: {
    fontSize: 10,
    color: colors.text,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 80,
  },
  cardItemLang: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 2,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  // Step 3: Confirm
  confirmContainer: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  confirmCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  confirmImage: {
    width: 120,
    height: 168,
  },
  confirmInfo: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
    gap: spacing.sm,
  },
  confirmTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  confirmTypeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  confirmName: {
    ...typography.subheading,
    fontSize: 18,
  },
  confirmLang: {
    ...typography.caption,
  },
  createButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.background,
  },
});
