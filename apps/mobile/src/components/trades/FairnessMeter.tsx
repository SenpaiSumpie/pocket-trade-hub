import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { calculateFairness } from '@pocket-trade-hub/shared';
import type { ProposalCard } from '@pocket-trade-hub/shared';
import { colors, spacing, borderRadius, typography } from '@/src/constants/theme';

interface FairnessMeterProps {
  givingCards: ProposalCard[];
  gettingCards: ProposalCard[];
}

const LABEL_COLORS: Record<string, string> = {
  Great: colors.success,
  Fair: colors.primary,
  Unfair: colors.error,
};

export function FairnessMeter({ givingCards, gettingCards }: FairnessMeterProps) {
  const { score, label } = calculateFairness(givingCards, gettingCards);
  const animatedPosition = useRef(new Animated.Value(score)).current;

  useEffect(() => {
    Animated.spring(animatedPosition, {
      toValue: score,
      useNativeDriver: false,
      tension: 60,
      friction: 10,
    }).start();
  }, [score, animatedPosition]);

  const indicatorColor = LABEL_COLORS[label] ?? colors.textMuted;

  // Position the indicator as a percentage of track width
  const indicatorLeft = animatedPosition.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <View style={styles.labelsRow}>
        <Text style={[styles.label, { color: colors.error }]}>Unfair</Text>
        <Text style={[styles.label, { color: colors.primary }]}>Fair</Text>
        <Text style={[styles.label, { color: colors.success }]}>Great</Text>
      </View>
      <View style={styles.track}>
        {/* Gradient segments */}
        <View style={[styles.segment, styles.segmentUnfairLeft]} />
        <View style={[styles.segment, styles.segmentFairLeft]} />
        <View style={[styles.segment, styles.segmentGreat]} />
        <View style={[styles.segment, styles.segmentFairRight]} />
        <View style={[styles.segment, styles.segmentUnfairRight]} />

        {/* Indicator dot */}
        <Animated.View
          style={[
            styles.indicator,
            {
              left: indicatorLeft,
              backgroundColor: indicatorColor,
            },
          ]}
        />
      </View>
      <Text style={[styles.scoreLabel, { color: indicatorColor }]}>
        {label} ({score})
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceLight,
    flexDirection: 'row',
    overflow: 'visible',
    position: 'relative',
  },
  segment: {
    flex: 1,
    height: 8,
  },
  segmentUnfairLeft: {
    backgroundColor: '#e74c3c',
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  segmentFairLeft: {
    backgroundColor: '#e8a030',
  },
  segmentGreat: {
    backgroundColor: colors.success,
  },
  segmentFairRight: {
    backgroundColor: '#e8a030',
  },
  segmentUnfairRight: {
    backgroundColor: '#e74c3c',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  indicator: {
    position: 'absolute',
    top: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: -8,
    borderWidth: 2,
    borderColor: colors.background,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  scoreLabel: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontWeight: '600',
  },
});
