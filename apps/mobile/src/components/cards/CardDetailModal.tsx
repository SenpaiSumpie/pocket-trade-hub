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
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { RarityBadge } from './RarityBadge';
import { colors, spacing, borderRadius } from '@/src/constants/theme';
import type { Card } from '@pocket-trade-hub/shared';

interface CardDetailModalProps {
  visible: boolean;
  cards: Card[];
  initialIndex: number;
  setName?: string;
  onClose: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function CardDetailPage({ card, setName }: { card: Card; setName?: string }) {
  return (
    <ScrollView
      style={{ width: SCREEN_WIDTH }}
      contentContainerStyle={styles.pageContent}
      showsVerticalScrollIndicator={false}
    >
      <Image
        source={{ uri: card.imageUrl }}
        style={styles.cardImage}
        contentFit="contain"
        transition={300}
      />

      <View style={styles.info}>
        <Text style={styles.cardName}>{card.name}</Text>
        {setName && <Text style={styles.setName}>{setName}</Text>}
        <Text style={styles.cardNumber}>#{card.cardNumber}</Text>

        <View style={styles.metaRow}>
          <RarityBadge rarity={card.rarity} size="lg" />
          {card.type && <Text style={styles.typeLabel}>{card.type}</Text>}
          {card.hp != null && (
            <Text style={styles.hpLabel}>
              HP <Text style={styles.hpValue}>{card.hp}</Text>
            </Text>
          )}
        </View>

        {card.stage && (
          <Text style={styles.stage}>Stage: {card.stage}</Text>
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

        <View style={styles.actions}>
          <Pressable style={[styles.actionBtn, styles.actionDisabled]}>
            <Ionicons name="add-circle-outline" size={20} color={colors.textMuted} />
            <Text style={styles.actionText}>Add to Collection</Text>
            <Text style={styles.comingSoon}>Coming in next update</Text>
          </Pressable>
          <Pressable style={[styles.actionBtn, styles.actionDisabled]}>
            <Ionicons name="heart-outline" size={20} color={colors.textMuted} />
            <Text style={styles.actionText}>Add to Wanted</Text>
            <Text style={styles.comingSoon}>Coming in next update</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

export function CardDetailModal({
  visible,
  cards,
  initialIndex,
  setName,
  onClose,
}: CardDetailModalProps) {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      onShow={() => {
        // Scroll to initial card when modal opens
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
          <Text style={styles.headerTitle}>
            {currentIndex + 1} / {cards.length}
          </Text>
          <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
            <Ionicons name="close" size={28} color={colors.text} />
          </Pressable>
        </View>

        <FlatList
          ref={flatListRef}
          data={cards}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CardDetailPage card={item} setName={setName} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 56,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  closeBtn: {
    position: 'absolute',
    right: spacing.md,
    top: 52,
  },
  pageContent: {
    paddingBottom: spacing.xxl,
  },
  cardImage: {
    width: SCREEN_WIDTH,
    aspectRatio: 1 / 1.4,
  },
  info: {
    padding: spacing.lg,
  },
  cardName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  setName: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  cardNumber: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  typeLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  hpLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  hpValue: {
    fontWeight: '700',
    color: colors.text,
  },
  stage: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.sm,
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
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  energyText: {
    fontSize: 10,
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
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  illustrator: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.lg,
    fontStyle: 'italic',
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
  actionDisabled: {
    opacity: 0.5,
  },
  actionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.textMuted,
  },
  comingSoon: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
