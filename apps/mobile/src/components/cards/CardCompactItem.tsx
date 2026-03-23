import { Pressable, Text, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { colors, spacing, borderRadius } from '@/src/constants/theme';
import type { Card } from '@pocket-trade-hub/shared';

interface CardCompactItemProps {
  card: Card;
  onPress: () => void;
  onLongPress?: () => void;
  setName?: string;
  dimmed?: boolean;
}

export function CardCompactItem({ card, onPress, onLongPress, setName, dimmed }: CardCompactItemProps) {
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
      <View style={styles.textArea}>
        <Text style={styles.name} numberOfLines={1}>
          {card.name}
        </Text>
        {setName ? (
          <Text style={styles.setLabel} numberOfLines={1}>
            {setName}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    margin: spacing.xs,
  },
  imageWrapper: {
    aspectRatio: 0.715,
    width: '100%',
    backgroundColor: colors.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  textArea: {
    padding: spacing.sm,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  setLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textMuted,
    marginTop: 2,
  },
});
