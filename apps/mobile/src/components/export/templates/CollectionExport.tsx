import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

interface CollectionExportProps {
  setName: string;
  completionPercent: number;
  cardImages: string[];
  totalCards: number;
  ownedCards: number;
  showWatermark: boolean;
}

const GOLD = '#f0c040';
const BG = '#0f0f1a';
const SURFACE = '#1a1a2e';

const CollectionExport = forwardRef<View, CollectionExportProps>(
  ({ setName, completionPercent, cardImages, totalCards, ownedCards, showWatermark }, ref) => {
    const displayImages = cardImages.slice(0, 20);

    return (
      <View ref={ref} style={styles.root} collapsable={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.setName}>{setName}</Text>
          <Text style={styles.completion}>{completionPercent}% Complete</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{ownedCards}</Text>
            <Text style={styles.statLabel}>Owned</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{totalCards}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.min(completionPercent, 100)}%` }]} />
        </View>

        {/* Card grid */}
        {displayImages.length > 0 && (
          <View style={styles.grid}>
            {displayImages.map((uri, i) => (
              <View key={i} style={styles.thumbWrapper}>
                <Image source={{ uri }} style={styles.thumb} contentFit="cover" />
              </View>
            ))}
          </View>
        )}

        {/* Watermark */}
        {showWatermark && (
          <Text style={styles.watermark}>Pocket Trade Hub</Text>
        )}
      </View>
    );
  },
);

CollectionExport.displayName = 'CollectionExport';
export { CollectionExport };

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
  setName: {
    fontSize: 48,
    fontWeight: '700',
    color: GOLD,
    textAlign: 'center',
  },
  completion: {
    fontSize: 32,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    gap: 48,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 40,
    fontWeight: '700',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 20,
    color: '#a0a0b8',
    marginTop: 4,
  },
  statDivider: {
    width: 2,
    height: 48,
    backgroundColor: SURFACE,
  },
  progressBar: {
    height: 12,
    backgroundColor: SURFACE,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 32,
  },
  progressFill: {
    height: '100%',
    backgroundColor: GOLD,
    borderRadius: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  thumbWrapper: {
    width: 180,
    height: 252,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: SURFACE,
  },
  thumb: {
    width: '100%',
    height: '100%',
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
