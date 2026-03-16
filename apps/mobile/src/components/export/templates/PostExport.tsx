import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

interface PostCard {
  name: string;
  image: string;
  rarity: string;
}

interface PostExportProps {
  postType: 'offering' | 'seeking';
  cards: PostCard[];
  posterName: string;
  showWatermark: boolean;
}

const GOLD = '#f0c040';
const BG = '#0f0f1a';
const SURFACE = '#1a1a2e';

const PostExport = forwardRef<View, PostExportProps>(
  ({ postType, cards, posterName, showWatermark }, ref) => {
    const isOffering = postType === 'offering';
    const badgeColor = isOffering ? '#2ecc71' : '#e74c3c';
    const badgeLabel = isOffering ? 'OFFERING' : 'SEEKING';

    return (
      <View ref={ref} style={styles.root} collapsable={false}>
        {/* Type badge */}
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeText}>{badgeLabel}</Text>
        </View>

        {/* Card list */}
        <View style={styles.cardList}>
          {cards.map((card, i) => (
            <View key={i} style={styles.cardRow}>
              <View style={styles.cardImageWrapper}>
                <Image source={{ uri: card.image }} style={styles.cardImage} contentFit="cover" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName} numberOfLines={2}>{card.name}</Text>
                <Text style={styles.cardRarity}>{card.rarity}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Attribution */}
        <View style={styles.footer}>
          <Text style={styles.posterName}>Posted by {posterName}</Text>
        </View>

        {/* Watermark */}
        {showWatermark && (
          <Text style={styles.watermark}>Pocket Trade Hub</Text>
        )}
      </View>
    );
  },
);

PostExport.displayName = 'PostExport';
export { PostExport };

const styles = StyleSheet.create({
  root: {
    backgroundColor: BG,
    padding: 48,
    minHeight: 1350,
  },
  badge: {
    alignSelf: 'center',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 32,
  },
  badgeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 2,
  },
  cardList: {
    gap: 16,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  cardImageWrapper: {
    width: 120,
    height: 168,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: BG,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardInfo: {
    flex: 1,
    gap: 8,
  },
  cardName: {
    fontSize: 28,
    fontWeight: '600',
    color: '#ffffff',
  },
  cardRarity: {
    fontSize: 20,
    color: GOLD,
    fontWeight: '500',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: SURFACE,
    paddingTop: 24,
  },
  posterName: {
    fontSize: 22,
    color: '#a0a0b8',
  },
  watermark: {
    position: 'absolute',
    bottom: 20,
    right: 24,
    fontSize: 24,
    fontWeight: '600',
    color: 'rgba(240, 192, 64, 0.3)',
    letterSpacing: 1,
  },
});
