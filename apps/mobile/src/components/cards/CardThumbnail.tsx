import { useState, useEffect, useRef, useCallback } from 'react';
import { Pressable, View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Image } from 'expo-image';
import { CheckCircle, Heart, Circle } from 'phosphor-react-native';
import { hapticPatterns } from '@/src/hooks/useHaptics';
import ReanimatedAnimated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useShimmer } from '@/src/hooks/useShimmer';
import { RarityBadge } from './RarityBadge';
import { colors, spacing, borderRadius } from '@/src/constants/theme';
import type { Card } from '@pocket-trade-hub/shared';
import type { Priority } from '@pocket-trade-hub/shared';

interface CardThumbnailProps {
  card: Card;
  onPress: () => void;
  showSetBadge?: boolean;
  setName?: string;
  quantity?: number;
  priority?: Priority;
  dimmed?: boolean;
  onLongPress?: () => void;
  checklistMode?: boolean;
  checked?: boolean;
  onCheckToggle?: () => void;
  /** Show a small "in collection" indicator in browse/wanted modes */
  inCollection?: boolean;
  /** Show a small "wanted" indicator in browse/collection modes */
  isWanted?: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  Fire: '#f08030',
  Water: '#6890f0',
  Grass: '#78c850',
  Lightning: '#f8d030',
  Psychic: '#f85888',
  Fighting: '#c03028',
  Darkness: '#705848',
  Metal: '#b8b8d0',
  Dragon: '#7038f8',
  Colorless: '#a8a878',
  Normal: '#a8a878',
};

const PRIORITY_COLORS: Record<Priority, string> = {
  high: '#e74c3c',
  medium: colors.primary,
  low: colors.textMuted,
};

const PRIORITY_LABELS: Record<Priority, string> = {
  high: 'H',
  medium: 'M',
  low: 'L',
};

export function CardThumbnail({
  card,
  onPress,
  showSetBadge,
  setName,
  quantity,
  priority,
  dimmed,
  onLongPress,
  checklistMode,
  checked,
  onCheckToggle,
  inCollection,
  isWanted,
}: CardThumbnailProps) {
  const typeColor = card.type ? TYPE_COLORS[card.type] || colors.textMuted : colors.textMuted;
  const toastOpacity = useRef(new Animated.Value(0)).current;

  // Width measurement for star shimmer
  const [imageWidth, setImageWidth] = useState(0);

  // Rarity detection
  const isStarRarity = card.rarity?.startsWith('star');
  const isCrownRarity = card.rarity === 'crown';

  // Star shimmer (call unconditionally — hooks can't be conditional)
  const shimmerTranslateX = useShimmer(imageWidth);
  const shimmerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerTranslateX.value }],
  }));

  // Crown glow (call unconditionally)
  const crownGlowOpacity = useSharedValue(0.15);
  const crownGlowStyle = useAnimatedStyle(() => ({
    opacity: crownGlowOpacity.value,
  }));

  useEffect(() => {
    if (isCrownRarity) {
      crownGlowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.45, { duration: 900 }),
          withTiming(0.15, { duration: 900 })
        ),
        -1,
        false
      );
    }
  }, [isCrownRarity]);

  const showToast = useCallback(() => {
    toastOpacity.setValue(1);
    Animated.timing(toastOpacity, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [toastOpacity]);

  const handleLongPress = useCallback(async () => {
    if (onLongPress) {
      if (Platform.OS !== 'web') {
        await hapticPatterns.navigation();
      }
      onLongPress();
      showToast();
    }
  }, [onLongPress, showToast]);

  const handlePress = useCallback(() => {
    if (checklistMode && onCheckToggle) {
      onCheckToggle();
    } else {
      onPress();
    }
  }, [checklistMode, onCheckToggle, onPress]);

  const bandWidth = imageWidth * 0.4;

  return (
    <Pressable style={styles.container} onPress={handlePress} onLongPress={handleLongPress}>
      <View
        style={[styles.imageContainer, checklistMode && checked && styles.imageContainerSelected]}
        onLayout={(e) => setImageWidth(e.nativeEvent.layout.width)}
      >
        <Image
          source={{ uri: card.imageUrl }}
          style={styles.image}
          recyclingKey={card.id}
          contentFit="cover"
          placeholder={{ blurhash: 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4' }}
          transition={200}
        />

        {/* Star rarity shimmer overlay */}
        {isStarRarity && imageWidth > 0 && (
          <ReanimatedAnimated.View
            style={[
              {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: bandWidth,
              },
              shimmerAnimStyle,
            ]}
            pointerEvents="none"
          >
            <Svg width={bandWidth} height="100%">
              <Defs>
                <LinearGradient id="starShimmer" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor="transparent" stopOpacity="0" />
                  <Stop offset="0.5" stopColor="rgba(240, 192, 64, 0.15)" stopOpacity="1" />
                  <Stop offset="1" stopColor="transparent" stopOpacity="0" />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width={bandWidth} height="100%" fill="url(#starShimmer)" />
            </Svg>
          </ReanimatedAnimated.View>
        )}

        {/* Crown rarity glow border */}
        {isCrownRarity && (
          <ReanimatedAnimated.View
            style={[
              {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderWidth: 2,
                borderColor: '#e8b4f8',
                borderRadius: borderRadius.md,
              },
              crownGlowStyle,
            ]}
            pointerEvents="none"
          />
        )}

        {/* Dimmed overlay for unowned cards */}
        {dimmed && <View style={styles.dimOverlay} />}

        {/* Quantity badge (top-right) */}
        {quantity != null && quantity > 1 && (
          <View style={styles.quantityBadge}>
            <Text style={styles.quantityText}>{quantity}</Text>
          </View>
        )}

        {/* Priority badge (top-left) */}
        {priority != null && (
          <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[priority] }]}>
            <Text style={styles.priorityText}>{PRIORITY_LABELS[priority]}</Text>
          </View>
        )}

        {/* State indicators (bottom-left corner) - show cross-state info */}
        <View style={styles.stateIndicators}>
          {inCollection && (
            <View style={styles.stateChip}>
              <CheckCircle size={12} color={colors.success} weight="fill" />
            </View>
          )}
          {isWanted && (
            <View style={styles.stateChip}>
              <Heart size={12} color="#e74c3c" weight="fill" />
            </View>
          )}
        </View>

        {/* Owned indicator (collection mode - show checkmark on owned cards) */}
        {quantity != null && quantity >= 1 && !dimmed && (
          <View style={styles.ownedIndicator}>
            <CheckCircle size={16} color={colors.success} weight="fill" />
          </View>
        )}

        {/* Set badge */}
        {showSetBadge && setName && (
          <View style={styles.setBadge}>
            <Text style={styles.setBadgeText} numberOfLines={1}>
              {setName}
            </Text>
          </View>
        )}

        {/* Multi-select overlay */}
        {checklistMode && (
          <View style={[styles.checkOverlay, checked && styles.checkOverlayChecked]}>
            {checked ? (
              <CheckCircle size={24} color={colors.primary} weight="fill" />
            ) : (
              <Circle size={24} color="rgba(255,255,255,0.7)" weight="regular" />
            )}
          </View>
        )}

        {/* Toast overlay for quick-add */}
        <Animated.View style={[styles.toastOverlay, { opacity: toastOpacity }]} pointerEvents="none">
          <CheckCircle size={28} color="#ffffff" weight="fill" />
          <Text style={styles.toastText}>Added!</Text>
        </Animated.View>
      </View>
      <Text style={[styles.name, dimmed && styles.nameDimmed]} numberOfLines={1}>
        {card.name}
      </Text>
      <View style={styles.meta}>
        <RarityBadge rarity={card.rarity} />
        {card.type && (
          <View style={[styles.typeDot, { backgroundColor: typeColor }]} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xs,
  },
  imageContainer: {
    aspectRatio: 0.715,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  imageContainerSelected: {
    borderColor: colors.primary,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  quantityBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  priorityBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  stateIndicators: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    flexDirection: 'row',
    gap: 2,
  },
  stateChip: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownedIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  setBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    maxWidth: '80%',
  },
  setBadgeText: {
    fontSize: 9,
    color: colors.text,
    fontWeight: '500',
  },
  checkOverlay: {
    position: 'absolute',
    top: 6,
    left: 6,
  },
  checkOverlayChecked: {},
  toastOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(46,204,113,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 2,
  },
  name: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
  nameDimmed: {
    color: colors.textMuted,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
