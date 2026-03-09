import { useState, useRef } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { RarityBadge } from './RarityBadge';
import { colors, spacing, borderRadius } from '@/src/constants/theme';
import type { Card } from '@pocket-trade-hub/shared';

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
const CARD_IMAGE_WIDTH = Math.min(SCREEN_WIDTH * 0.65, 320);
const CARD_IMAGE_HEIGHT = CARD_IMAGE_WIDTH * 1.4;

const PRIORITY_COLORS: Record<Priority, string> = {
  high: '#e74c3c',
  medium: colors.primary,
  low: colors.textMuted,
};

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
        <Ionicons name="remove" size={20} color={colors.primary} />
      </Pressable>
      <Text style={actionStyles.stepperValue}>{quantity}</Text>
      <Pressable style={actionStyles.stepperBtn} onPress={onIncrement}>
        <Ionicons name="add" size={20} color={colors.primary} />
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
/*  CardDetailPage (single card view)                                  */
/* ------------------------------------------------------------------ */

function CardDetailPage({
  card,
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
  const qty = collectionQuantity?.(card.id) ?? 0;
  const priority = wantedPriority?.(card.id);

  return (
    <ScrollView
      style={{ width: SCREEN_WIDTH }}
      contentContainerStyle={styles.pageContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: card.imageUrl }}
          style={styles.cardImage}
          contentFit="contain"
          transition={300}
        />
      </View>

      <View style={styles.info}>
        <Text style={styles.cardName}>{card.name}</Text>
        <View style={styles.subtitleRow}>
          {setName && <Text style={styles.setName}>{setName}</Text>}
          <Text style={styles.cardNumber}>#{card.cardNumber}</Text>
        </View>

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

        {/* Context-aware action buttons */}
        <View style={styles.actions}>
          {mode === 'browse' && (
            <>
              <Pressable
                style={[styles.actionBtn, styles.actionActive]}
                onPress={() => onAddToCollection?.(card.id)}
              >
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <Text style={styles.actionTextActive}>Add to Collection</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, styles.actionActive]}
                onPress={() => onAddToWanted?.(card.id)}
              >
                <Ionicons name="heart-outline" size={20} color={colors.primary} />
                <Text style={styles.actionTextActive}>Add to Wanted</Text>
              </Pressable>
            </>
          )}

          {mode === 'collection' && (
            <>
              <View style={[styles.actionBtn, styles.actionActive]}>
                <Ionicons name="layers-outline" size={20} color={colors.primary} />
                <Text style={styles.actionTextActive}>Quantity</Text>
                <QuantityStepper
                  quantity={qty}
                  onDecrement={() => onUpdateQuantity?.(card.id, Math.max(0, qty - 1))}
                  onIncrement={() => onUpdateQuantity?.(card.id, qty + 1)}
                />
              </View>
              {qty > 0 && (
                <Pressable
                  style={[styles.actionBtn, styles.actionDanger]}
                  onPress={() => onRemoveFromCollection?.(card.id)}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                  <Text style={styles.actionTextDanger}>Remove from Collection</Text>
                </Pressable>
              )}
              <Pressable
                style={[styles.actionBtn, styles.actionActive]}
                onPress={() => onAddToWanted?.(card.id)}
              >
                <Ionicons name="heart-outline" size={20} color={colors.primary} />
                <Text style={styles.actionTextActive}>Add to Wanted</Text>
              </Pressable>
            </>
          )}

          {mode === 'wanted' && (
            <>
              {priority && (
                <View style={[styles.actionBtn, styles.actionActive]}>
                  <Ionicons name="flag-outline" size={20} color={colors.primary} />
                  <Text style={styles.actionTextActive}>Priority</Text>
                  <PriorityPicker
                    current={priority}
                    onChange={(p) => onUpdatePriority?.(card.id, p)}
                  />
                </View>
              )}
              {priority && (
                <Pressable
                  style={[styles.actionBtn, styles.actionDanger]}
                  onPress={() => onRemoveFromWanted?.(card.id)}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                  <Text style={styles.actionTextDanger}>Remove from Wanted</Text>
                </Pressable>
              )}
              <Pressable
                style={[styles.actionBtn, styles.actionActive]}
                onPress={() => onAddToCollection?.(card.id)}
              >
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <Text style={styles.actionTextActive}>Add to Collection</Text>
              </Pressable>
            </>
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

  const canGoLeft = currentIndex > 0;
  const canGoRight = currentIndex < cards.length - 1;

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
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>
            {currentIndex + 1} / {cards.length}
          </Text>
          {/* Web navigation arrows */}
          {Platform.OS === 'web' && (
            <View style={styles.navArrows}>
              <Pressable
                onPress={() => canGoLeft && goTo(currentIndex - 1)}
                style={[styles.navBtn, !canGoLeft && styles.navBtnDisabled]}
              >
                <Ionicons name="chevron-back" size={20} color={canGoLeft ? colors.text : colors.textMuted} />
              </Pressable>
              <Pressable
                onPress={() => canGoRight && goTo(currentIndex + 1)}
                style={[styles.navBtn, !canGoRight && styles.navBtnDisabled]}
              >
                <Ionicons name="chevron-forward" size={20} color={canGoRight ? colors.text : colors.textMuted} />
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
  headerTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
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
  navArrows: {
    position: 'absolute',
    right: spacing.md,
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
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
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
  actions: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  actionActive: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionDanger: {
    borderWidth: 1,
    borderColor: colors.error + '40',
  },
  actionTextActive: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  actionTextDanger: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.error,
  },
});
