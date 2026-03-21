import { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  FlatList,
  Dimensions,
  StyleSheet,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Minus, Plus, CheckCircle, Heart, X, Stack, PlusCircle, Flag, Calculator, CaretRight, Trash, HeartBreak, CaretLeft } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { RarityBadge } from './RarityBadge';
import { LuckCalculator } from './LuckCalculator';
import { colors, spacing, borderRadius } from '@/src/constants/theme';
import { useCardsStore } from '@/src/stores/cards';
import { usePremiumStore } from '@/src/stores/premium';
import { useImageExport } from '@/src/hooks/useImageExport';
import { ExportRenderer } from '@/src/components/export/ExportRenderer';
import { ShareButton } from '@/src/components/export/ShareButton';
import { CardExport } from '@/src/components/export/templates/CardExport';
import type { Card, CardTranslation, CardLanguage } from '@pocket-trade-hub/shared';

type Priority = 'high' | 'medium' | 'low';

interface CardDetailModalProps {
  visible: boolean;
  cards: Card[];
  initialIndex: number;
  setName?: string;
  onClose: () => void;
  mode?: 'browse' | 'collection' | 'wanted';
  collectionQuantity?: (cardId: string) => number;
  wantedPriority?: (cardId: string) => Priority | undefined;
  onAddToCollection?: (cardId: string) => void;
  onRemoveFromCollection?: (cardId: string) => void;
  onUpdateQuantity?: (cardId: string, qty: number) => void;
  onAddToWanted?: (cardId: string) => void;
  onRemoveFromWanted?: (cardId: string) => void;
  onUpdatePriority?: (cardId: string, priority: Priority) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_IMAGE_WIDTH = Math.min(SCREEN_WIDTH * 0.55, 280);
const CARD_IMAGE_HEIGHT = CARD_IMAGE_WIDTH * 1.4;

const PRIORITY_COLORS: Record<Priority, string> = {
  high: '#e74c3c',
  medium: colors.primary,
  low: colors.textMuted,
};

// Priority labels handled via capitalization in PriorityPicker

/* ------------------------------------------------------------------ */
/*  Inline QuantityStepper                                            */
/* ------------------------------------------------------------------ */

function QuantityStepper({
  quantity,
  onDecrement,
  onIncrement,
}: {
  quantity: number;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <View style={actionStyles.stepperRow}>
      <Pressable style={actionStyles.stepperBtn} onPress={onDecrement}>
        <Minus size={20} color={colors.primary} weight="regular" />
      </Pressable>
      <Text style={actionStyles.stepperValue}>{quantity}</Text>
      <Pressable style={actionStyles.stepperBtn} onPress={onIncrement}>
        <Plus size={20} color={colors.primary} weight="regular" />
      </Pressable>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Inline PriorityPicker                                             */
/* ------------------------------------------------------------------ */

function PriorityPicker({
  current,
  onChange,
}: {
  current: Priority;
  onChange: (p: Priority) => void;
}) {
  const priorities: Priority[] = ['high', 'medium', 'low'];
  return (
    <View style={actionStyles.priorityRow}>
      {priorities.map((p) => {
        const active = current === p;
        return (
          <Pressable
            key={p}
            style={[
              actionStyles.priorityPill,
              active && { backgroundColor: PRIORITY_COLORS[p] },
            ]}
            onPress={() => onChange(p)}
          >
            <Text
              style={[
                actionStyles.priorityPillText,
                active && { color: '#ffffff' },
              ]}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Status Banner                                                      */
/* ------------------------------------------------------------------ */

function StatusBanner({
  qty,
  priority,
  mode,
}: {
  qty: number;
  priority?: Priority;
  mode: 'browse' | 'collection' | 'wanted';
}) {
  const { t } = useTranslation();
  const inCollection = qty > 0;
  const isWanted = priority != null;

  if (!inCollection && !isWanted) return null;

  return (
    <View style={statusStyles.container}>
      {inCollection && (
        <View style={statusStyles.badge}>
          <CheckCircle size={14} color={colors.success} weight="fill" />
          <Text style={statusStyles.badgeText}>
            {t('cards.myCollection')} ({qty})
          </Text>
        </View>
      )}
      {isWanted && (
        <View style={[statusStyles.badge, statusStyles.badgeWanted]}>
          <Heart size={14} color="#e74c3c" weight="fill" />
          <Text style={[statusStyles.badgeText, { color: '#e74c3c' }]}>
            {t('cards.wanted')} ({priority!.charAt(0).toUpperCase() + priority!.slice(1)})
          </Text>
        </View>
      )}
    </View>
  );
}

const statusStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.success + '20',
  },
  badgeWanted: {
    backgroundColor: '#e74c3c20',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
});

/* ------------------------------------------------------------------ */
/*  CardDetailPage (single card view)                                  */
/* ------------------------------------------------------------------ */

function TranslationBadges({
  cardId,
  onSelectTranslation,
  selectedLanguage,
}: {
  cardId: string;
  onSelectTranslation: (translation: CardTranslation | null) => void;
  selectedLanguage: string | null;
}) {
  const { t } = useTranslation();
  const translations = useCardsStore((s) => s.translationsByCardId[cardId]);
  const translationsLoading = useCardsStore((s) => s.translationsLoading);
  const fetchTranslations = useCardsStore((s) => s.fetchTranslations);

  useEffect(() => {
    fetchTranslations(cardId);
  }, [cardId, fetchTranslations]);

  if (translationsLoading && !translations) return null;
  if (!translations || translations.length === 0) return null;

  const ALL_LANGUAGES: CardLanguage[] = ['en', 'de', 'es', 'fr', 'it', 'ja', 'ko', 'pt', 'zh'];
  const availableCodes = new Set(translations.map((t) => t.language));

  return (
    <View style={translationStyles.container}>
      <Text style={translationStyles.label}>{t('cardDetail.availableLanguages')}</Text>
      <View style={translationStyles.badgeRow}>
        {/* Original / EN badge */}
        <Pressable
          style={[
            translationStyles.badge,
            selectedLanguage === null && translationStyles.badgeActive,
          ]}
          onPress={() => onSelectTranslation(null)}
        >
          <Text
            style={[
              translationStyles.badgeText,
              selectedLanguage === null && translationStyles.badgeTextActive,
            ]}
          >
            EN
          </Text>
        </Pressable>
        {ALL_LANGUAGES.map((lang) => {
          const isAvailable = availableCodes.has(lang);
          const isSelected = selectedLanguage === lang;
          const translation = translations.find((t) => t.language === lang);

          return (
            <Pressable
              key={lang}
              style={[
                translationStyles.badge,
                isSelected && translationStyles.badgeActive,
                !isAvailable && translationStyles.badgeDisabled,
              ]}
              onPress={() => {
                if (isAvailable && translation) {
                  onSelectTranslation(isSelected ? null : translation);
                }
              }}
              disabled={!isAvailable}
            >
              <Text
                style={[
                  translationStyles.badgeText,
                  isSelected && translationStyles.badgeTextActive,
                  !isAvailable && translationStyles.badgeTextDisabled,
                ]}
              >
                {lang.toUpperCase()}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const translationStyles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeActive: {
    backgroundColor: colors.primary + '30',
    borderColor: colors.primary,
  },
  badgeDisabled: {
    opacity: 0.35,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  badgeTextActive: {
    color: colors.primary,
  },
  badgeTextDisabled: {
    color: colors.textMuted,
  },
});

function CardDetailPage({
  card,
  allCards,
  setName,
  mode = 'browse',
  collectionQuantity,
  wantedPriority,
  onAddToCollection,
  onRemoveFromCollection,
  onUpdateQuantity,
  onAddToWanted,
  onRemoveFromWanted,
  onUpdatePriority,
}: {
  card: Card;
  allCards: Card[];
  setName?: string;
  mode?: 'browse' | 'collection' | 'wanted';
  collectionQuantity?: (cardId: string) => number;
  wantedPriority?: (cardId: string) => Priority | undefined;
  onAddToCollection?: (cardId: string) => void;
  onRemoveFromCollection?: (cardId: string) => void;
  onUpdateQuantity?: (cardId: string, qty: number) => void;
  onAddToWanted?: (cardId: string) => void;
  onRemoveFromWanted?: (cardId: string) => void;
  onUpdatePriority?: (cardId: string, priority: Priority) => void;
}) {
  const { t } = useTranslation();
  const qty = collectionQuantity?.(card.id) ?? 0;
  const priority = wantedPriority?.(card.id);
  const [activeTranslation, setActiveTranslation] = useState<CardTranslation | null>(null);
  const [luckCalcVisible, setLuckCalcVisible] = useState(false);

  // Count cards of same rarity in the set for probability calculation
  const cardsOfSameRarityInPack = useMemo(
    () => allCards.filter((c) => c.rarity === card.rarity).length || 1,
    [allCards, card.rarity],
  );

  // Reset translation when card changes
  useEffect(() => {
    setActiveTranslation(null);
  }, [card.id]);

  const displayName = activeTranslation?.name ?? card.name;
  const displayImageUrl = activeTranslation?.imageUrl ?? card.imageUrl;

  return (
    <ScrollView
      style={{ width: SCREEN_WIDTH }}
      contentContainerStyle={styles.pageContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: displayImageUrl }}
          style={styles.cardImage}
          contentFit="contain"
          transition={300}
        />
      </View>

      <View style={styles.info}>
        <Text style={styles.cardName}>{displayName}</Text>
        {activeTranslation && (
          <Text style={styles.translationIndicator}>
            {activeTranslation.language.toUpperCase()} {t('cardDetail.translations').toLowerCase()}
          </Text>
        )}
        <View style={styles.subtitleRow}>
          {setName && <Text style={styles.setName}>{setName}</Text>}
          <Text style={styles.cardNumber}>#{card.cardNumber}</Text>
        </View>

        {/* Translation badges */}
        <TranslationBadges
          cardId={card.id}
          onSelectTranslation={setActiveTranslation}
          selectedLanguage={activeTranslation?.language ?? null}
        />

        {/* Status banner -- always visible, shows cross-mode state */}
        <StatusBanner qty={qty} priority={priority} mode={mode} />

        <View style={styles.metaRow}>
          <RarityBadge rarity={card.rarity} size="lg" />
          {card.type && (
            <View style={styles.typePill}>
              <Text style={styles.typeLabel}>{card.type}</Text>
            </View>
          )}
          {card.hp != null && (
            <View style={styles.hpPill}>
              <Text style={styles.hpLabel}>HP</Text>
              <Text style={styles.hpValue}>{card.hp}</Text>
            </View>
          )}
        </View>

        {card.stage && (
          <Text style={styles.stage}>{card.stage}</Text>
        )}

        {/* Quick action buttons -- always show relevant actions regardless of mode */}
        <View style={styles.quickActions}>
          {qty === 0 && (
            <Pressable
              style={styles.quickBtn}
              onPress={() => onAddToCollection?.(card.id)}
            >
              <PlusCircle size={18} color={colors.primary} weight="fill" />
              <Text style={styles.quickBtnText}>{t('cards.addToCollection')}</Text>
            </Pressable>
          )}
          {qty > 0 && (
            <View style={styles.quickBtnGroup}>
              <View style={styles.quickBtn}>
                <Stack size={18} color={colors.primary} weight="regular" />
                <Text style={styles.quickBtnText}>{t('cards.quantity')}: {qty}</Text>
                <QuantityStepper
                  quantity={qty}
                  onDecrement={() => onUpdateQuantity?.(card.id, Math.max(0, qty - 1))}
                  onIncrement={() => onUpdateQuantity?.(card.id, qty + 1)}
                />
              </View>
            </View>
          )}
          {!priority && (
            <Pressable
              style={styles.quickBtn}
              onPress={() => onAddToWanted?.(card.id)}
            >
              <Heart size={18} color={colors.primary} weight="regular" />
              <Text style={styles.quickBtnText}>{t('cards.addToWanted')}</Text>
            </Pressable>
          )}
          {priority && (
            <View style={styles.quickBtn}>
              <Flag size={18} color={PRIORITY_COLORS[priority]} weight="fill" />
              <Text style={styles.quickBtnText}>{t('cards.priority')}</Text>
              <PriorityPicker
                current={priority}
                onChange={(p) => onUpdatePriority?.(card.id, p)}
              />
            </View>
          )}
        </View>

        {/* Calculate odds button */}
        <Pressable
          style={styles.oddsBtn}
          onPress={() => setLuckCalcVisible(true)}
        >
          <Calculator size={18} color={colors.primary} weight="regular" />
          <Text style={styles.oddsBtnText}>{t('cardDetail.calculateOdds')}</Text>
          <CaretRight size={16} color={colors.textMuted} weight="regular" />
        </Pressable>

        <LuckCalculator
          visible={luckCalcVisible}
          onClose={() => setLuckCalcVisible(false)}
          cardRarity={card.rarity}
          cardName={card.name}
          setId={card.setId}
          cardsOfSameRarityInPack={cardsOfSameRarityInPack}
        />

        {card.attacks && card.attacks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Attacks</Text>
            {card.attacks.map((attack, i) => (
              <View key={i} style={styles.attack}>
                <View style={styles.attackHeader}>
                  <View style={styles.energyCost}>
                    {attack.energyCost.map((e, j) => (
                      <View key={j} style={styles.energyDot}>
                        <Text style={styles.energyText}>{e.charAt(0)}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.attackName}>{attack.name}</Text>
                  {attack.damage && (
                    <Text style={styles.attackDamage}>{attack.damage}</Text>
                  )}
                </View>
                {attack.description && (
                  <Text style={styles.attackDesc}>{attack.description}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={styles.statsRow}>
          {card.weakness && (
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Weakness</Text>
              <Text style={styles.statValue}>{card.weakness}</Text>
            </View>
          )}
          {card.resistance && (
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Resistance</Text>
              <Text style={styles.statValue}>{card.resistance}</Text>
            </View>
          )}
          {card.retreatCost != null && (
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Retreat</Text>
              <Text style={styles.statValue}>{card.retreatCost}</Text>
            </View>
          )}
        </View>

        {card.illustrator && (
          <Text style={styles.illustrator}>Illus. {card.illustrator}</Text>
        )}

        {/* Danger zone actions */}
        <View style={styles.dangerActions}>
          {qty > 0 && (
            <Pressable
              style={styles.dangerBtn}
              onPress={() => onRemoveFromCollection?.(card.id)}
            >
              <Trash size={16} color={colors.error} weight="regular" />
              <Text style={styles.dangerBtnText}>{t('cards.removeFromCollection')}</Text>
            </Pressable>
          )}
          {priority && (
            <Pressable
              style={styles.dangerBtn}
              onPress={() => onRemoveFromWanted?.(card.id)}
            >
              <HeartBreak size={16} color={colors.error} weight="regular" />
              <Text style={styles.dangerBtnText}>{t('cards.removeFromWanted')}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

/* ------------------------------------------------------------------ */
/*  Main modal component                                               */
/* ------------------------------------------------------------------ */

export function CardDetailModal({
  visible,
  cards,
  initialIndex,
  setName,
  onClose,
  mode = 'browse',
  collectionQuantity,
  wantedPriority,
  onAddToCollection,
  onRemoveFromCollection,
  onUpdateQuantity,
  onAddToWanted,
  onRemoveFromWanted,
  onUpdatePriority,
}: CardDetailModalProps) {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const isPremium = usePremiumStore((s) => s.isPremium);
  const { viewRef: exportRef, exportAndShare, exporting } = useImageExport();

  const canGoLeft = currentIndex > 0;
  const canGoRight = currentIndex < cards.length - 1;

  const currentCard = cards[currentIndex];
  const currentQty = currentCard ? (collectionQuantity?.(currentCard.id) ?? 0) : 0;
  const currentPriority = currentCard ? wantedPriority?.(currentCard.id) : undefined;

  const goTo = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setCurrentIndex(index);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      onShow={() => {
        setCurrentIndex(initialIndex);
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: initialIndex,
            animated: false,
          });
        }, 50);
      }}
    >
      <View style={styles.container}>
        {/* Offscreen export renderer */}
        <ExportRenderer ref={exportRef}>
          {currentCard && (
            <CardExport
              cardName={currentCard.name}
              cardImage={currentCard.imageUrl}
              rarity={currentCard.rarity}
              setName={setName}
              showWatermark={!isPremium}
            />
          )}
        </ExportRenderer>

        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
            <X size={24} color={colors.text} weight="regular" />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              {currentIndex + 1} / {cards.length}
            </Text>
            {/* Mini state indicators in header */}
            <View style={styles.headerBadges}>
              {currentQty > 0 && (
                <View style={styles.headerBadge}>
                  <CheckCircle size={12} color={colors.success} weight="fill" />
                  <Text style={styles.headerBadgeText}>{currentQty}</Text>
                </View>
              )}
              {currentPriority && (
                <View style={[styles.headerBadge, { backgroundColor: PRIORITY_COLORS[currentPriority] + '30' }]}>
                  <Heart size={12} color={PRIORITY_COLORS[currentPriority]} weight="fill" />
                </View>
              )}
            </View>
          </View>
          {/* Share button */}
          <View style={styles.shareBtn}>
            <ShareButton
              onPress={() => exportAndShare('Share Card')}
              loading={exporting}
              size={20}
            />
          </View>
          {/* Web navigation arrows */}
          {Platform.OS === 'web' && (
            <View style={styles.navArrows}>
              <Pressable
                onPress={() => canGoLeft && goTo(currentIndex - 1)}
                style={[styles.navBtn, !canGoLeft && styles.navBtnDisabled]}
              >
                <CaretLeft size={20} color={canGoLeft ? colors.text : colors.textMuted} weight="regular" />
              </Pressable>
              <Pressable
                onPress={() => canGoRight && goTo(currentIndex + 1)}
                style={[styles.navBtn, !canGoRight && styles.navBtnDisabled]}
              >
                <CaretRight size={20} color={canGoRight ? colors.text : colors.textMuted} weight="regular" />
              </Pressable>
            </View>
          )}
        </View>

        <FlatList
          ref={flatListRef}
          data={cards}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CardDetailPage
              card={item}
              allCards={cards}
              setName={setName}
              mode={mode}
              collectionQuantity={collectionQuantity}
              wantedPriority={wantedPriority}
              onAddToCollection={onAddToCollection}
              onRemoveFromCollection={onRemoveFromCollection}
              onUpdateQuantity={onUpdateQuantity}
              onAddToWanted={onAddToWanted}
              onRemoveFromWanted={onRemoveFromWanted}
              onUpdatePriority={onUpdatePriority}
            />
          )}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(
              e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
            );
            setCurrentIndex(idx);
          }}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          initialScrollIndex={initialIndex}
        />
      </View>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const actionStyles = StyleSheet.create({
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    minWidth: 28,
    textAlign: 'center',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  priorityPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surfaceLight,
  },
  priorityPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Platform.OS === 'web' ? spacing.md : 56,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerCenter: {
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  headerBadges: {
    flexDirection: 'row',
    gap: 4,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.success + '20',
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.success,
  },
  closeBtn: {
    position: 'absolute',
    left: spacing.md,
    top: Platform.OS === 'web' ? spacing.md : 52,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtn: {
    position: 'absolute',
    right: spacing.md,
    top: Platform.OS === 'web' ? spacing.md : 52,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrows: {
    position: 'absolute',
    right: spacing.md + 44,
    top: Platform.OS === 'web' ? spacing.md : 52,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  pageContent: {
    alignItems: 'center',
    paddingBottom: spacing.xxl,
    paddingTop: spacing.lg,
  },
  imageWrapper: {
    width: CARD_IMAGE_WIDTH,
    height: CARD_IMAGE_HEIGHT,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    // Card shadow
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }
      : {}),
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  info: {
    padding: spacing.lg,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  cardName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  translationIndicator: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.primary,
    textAlign: 'center',
    marginTop: 2,
  },
  subtitleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  setName: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  cardNumber: {
    fontSize: 14,
    color: colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  typePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
  },
  typeLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  hpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
  },
  hpLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  hpValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  stage: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },

  // Quick actions (unified across all modes)
  quickActions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickBtnGroup: {
    gap: spacing.sm,
  },
  quickBtnText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },

  oddsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  oddsBtnText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },

  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  attack: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  attackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  energyCost: {
    flexDirection: 'row',
    gap: 2,
  },
  energyDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  energyText: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '700',
  },
  attackName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  attackDamage: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  attackDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  illustrator: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.lg,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Danger zone
  dangerActions: {
    marginTop: spacing.xl,
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.error + '10',
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  dangerBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.error,
  },
});
