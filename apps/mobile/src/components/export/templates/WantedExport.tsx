import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

interface WantedCard {
  name: string;
  image: string;
  rarity: string;
  priority: 'high' | 'medium' | 'low';
}

interface WantedExportProps {
  wantedCards: WantedCard[];
  userName: string;
  showWatermark: boolean;
}

const GOLD = '#f0c040';
const BG = '#0f0f1a';
const SURFACE = '#1a1a2e';

const PRIORITY_COLORS: Record<string, string> = {
  high: '#e74c3c',
  medium: '#f0c040',
  low: '#a0a0b8',
};

const WantedExport = forwardRef<View, WantedExportProps>(
  ({ wantedCards, userName, showWatermark }, ref) => {
    return (
      <View ref={ref} style={styles.root} collapsable={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Wanted Cards</Text>
          <Text style={styles.subtitle}>{userName}'s Wish List</Text>
        </View>

        {/* Card grid */}
        <View style={styles.grid}>
          {wantedCards.map((card, i) => (
            <View key={i} style={styles.cardItem}>
              <View style={styles.cardImageWrapper}>
                <Image source={{ uri: card.image }} style={styles.cardImage} contentFit="cover" />
                {/* Priority indicator */}
                <View
                  style={[
                    styles.priorityDot,
                    { backgroundColor: PRIORITY_COLORS[card.priority] },
                  ]}
                />
              </View>
              <Text style={styles.cardName} numberOfLines={2}>{card.name}</Text>
              <Text style={styles.cardRarity}>{card.rarity}</Text>
            </View>
          ))}
        </View>

        {/* Watermark */}
        {showWatermark && (
          <Text style={styles.watermark}>Pocket Trade Hub</Text>
        )}
      </View>
    );
  },
);

WantedExport.displayName = 'WantedExport';
export { WantedExport };

const styles = StyleSheet.create({
  root: {
    backgroundColor: BG,
    padding: 48,
    minHeight: 1350,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    borderBottomWidth: 2,
    borderBottomColor: GOLD,
    paddingBottom: 24,
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    color: GOLD,
  },
  subtitle: {
    fontSize: 24,
    color: '#a0a0b8',
    marginTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  cardItem: {
    width: 220,
    alignItems: 'center',
    gap: 8,
  },
  cardImageWrapper: {
    width: 220,
    height: 308,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: SURFACE,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  priorityDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  cardName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  cardRarity: {
    fontSize: 14,
    color: GOLD,
    fontWeight: '500',
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
