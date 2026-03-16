import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

interface CardExportProps {
  cardName: string;
  cardImage: string;
  rarity: string;
  setName?: string;
  showWatermark: boolean;
}

const GOLD = '#f0c040';
const BG = '#0f0f1a';
const SURFACE = '#1a1a2e';

const CardExport = forwardRef<View, CardExportProps>(
  ({ cardName, cardImage, rarity, setName, showWatermark }, ref) => {
    return (
      <View ref={ref} style={styles.root} collapsable={false}>
        {/* Large card image */}
        <View style={styles.imageWrapper}>
          <Image source={{ uri: cardImage }} style={styles.cardImage} contentFit="contain" />
        </View>

        {/* Card info */}
        <View style={styles.info}>
          <Text style={styles.cardName}>{cardName}</Text>
          <View style={styles.rarityBadge}>
            <Text style={styles.rarityText}>{rarity}</Text>
          </View>
          {setName && <Text style={styles.setName}>{setName}</Text>}
        </View>

        {/* Watermark */}
        {showWatermark && (
          <Text style={styles.watermark}>Pocket Trade Hub</Text>
        )}
      </View>
    );
  },
);

CardExport.displayName = 'CardExport';
export { CardExport };

const styles = StyleSheet.create({
  root: {
    backgroundColor: BG,
    padding: 48,
    alignItems: 'center',
    minHeight: 1350,
    justifyContent: 'center',
  },
  imageWrapper: {
    width: 700,
    height: 980,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: SURFACE,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  info: {
    alignItems: 'center',
    marginTop: 32,
    gap: 12,
  },
  cardName: {
    fontSize: 44,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  rarityBadge: {
    backgroundColor: GOLD,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
  },
  rarityText: {
    fontSize: 22,
    fontWeight: '700',
    color: BG,
  },
  setName: {
    fontSize: 24,
    color: '#a0a0b8',
    marginTop: 4,
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
