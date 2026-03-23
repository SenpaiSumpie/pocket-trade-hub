import { Pressable, Text, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { RarityBadge } from './RarityBadge';
import { colors, spacing, borderRadius } from '@/src/constants/theme';
import type { Card } from '@pocket-trade-hub/shared';

interface CardListItemProps {
  card: Card;
  onPress: () => void;
  onLongPress?: () => void;
  setName?: string;
  dimmed?: boolean;
}

export function CardListItem({ card, onPress, onLongPress, setName, dimmed }: CardListItemProps) {
  return (
    <Pressable
      style={styles.container}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: card.imageUrl }}
          style={styles.image}
          recyclingKey={card.id}
          contentFit="cover"
          placeholder={{ blurhash: 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4' }}
          transition={200}
        />
        {dimmed && <View style={styles.dimOverlay} />}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {card.name}
        </Text>
        {setName ? (
          <Text style={styles.setName} numberOfLines={1}>
            {setName}
          </Text>
        ) : null}
      </View>
      <RarityBadge rarity={card.rarity} size="sm" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 76,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.xs,
    marginBottom: spacing.xs,
  },
  imageWrapper: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  image: {
    width: 60,
    height: 60,
  },
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  setName: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textMuted,
    marginTop: 2,
  },
});
