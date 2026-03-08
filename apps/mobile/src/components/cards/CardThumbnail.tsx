import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { RarityBadge } from './RarityBadge';
import { colors, spacing, borderRadius } from '@/src/constants/theme';
import type { Card } from '@pocket-trade-hub/shared';

interface CardThumbnailProps {
  card: Card;
  onPress: () => void;
  showSetBadge?: boolean;
  setName?: string;
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

export function CardThumbnail({ card, onPress, showSetBadge, setName }: CardThumbnailProps) {
  const typeColor = card.type ? TYPE_COLORS[card.type] || colors.textMuted : colors.textMuted;

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: card.imageUrl }}
          style={styles.image}
          recyclingKey={card.id}
          contentFit="cover"
          placeholder={{ blurhash: 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4' }}
          transition={200}
        />
        {showSetBadge && setName && (
          <View style={styles.setBadge}>
            <Text style={styles.setBadgeText} numberOfLines={1}>
              {setName}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.name} numberOfLines={1}>
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
  },
  image: {
    width: '100%',
    height: '100%',
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
  name: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '500',
    marginTop: spacing.xs,
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
