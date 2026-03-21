import { useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Svg, { Path, Line, Text as SvgText } from 'react-native-svg';
import { X, CheckCircle } from 'phosphor-react-native';
import { probabilityInNPacks, packsForProbability } from '@pocket-trade-hub/shared';
import { colors, spacing, borderRadius } from '@/src/constants/theme';

interface LuckCalculatorProps {
  visible: boolean;
  onClose: () => void;
  cardRarity: string | null;
  cardName: string;
  setId: string | null;
  cardsOfSameRarityInPack: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = Math.min(SCREEN_WIDTH - spacing.lg * 4, 340);
const CHART_HEIGHT = 180;
const CHART_PADDING = { top: 16, right: 16, bottom: 28, left: 40 };
const PLOT_WIDTH = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
const PLOT_HEIGHT = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

const GOLD = '#f0c040';

function buildCurvePath(
  cardRarity: string,
  cardsOfSameRarityInPack: number,
  maxPacks: number,
): string {
  const points = 25;
  const parts: string[] = [];

  for (let i = 0; i <= points; i++) {
    const packs = Math.round((i / points) * maxPacks);
    const prob = probabilityInNPacks(cardRarity, cardsOfSameRarityInPack, packs);
    const x = CHART_PADDING.left + (i / points) * PLOT_WIDTH;
    const y = CHART_PADDING.top + PLOT_HEIGHT - prob * PLOT_HEIGHT;
    parts.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
  }

  return parts.join(' ');
}

function ProbabilityChart({
  cardRarity,
  cardsOfSameRarityInPack,
}: {
  cardRarity: string;
  cardsOfSameRarityInPack: number;
}) {
  const maxPacks = useMemo(() => {
    const p99 = packsForProbability(cardRarity, cardsOfSameRarityInPack, 0.99);
    return p99 === Infinity ? 500 : Math.min(p99, 2000);
  }, [cardRarity, cardsOfSameRarityInPack]);

  const curvePath = useMemo(
    () => buildCurvePath(cardRarity, cardsOfSameRarityInPack, maxPacks),
    [cardRarity, cardsOfSameRarityInPack, maxPacks],
  );

  const y50 = CHART_PADDING.top + PLOT_HEIGHT - 0.5 * PLOT_HEIGHT;
  const y90 = CHART_PADDING.top + PLOT_HEIGHT - 0.9 * PLOT_HEIGHT;

  return (
    <View style={chartStyles.container}>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        {/* Dashed line at 50% */}
        <Line
          x1={CHART_PADDING.left}
          y1={y50}
          x2={CHART_PADDING.left + PLOT_WIDTH}
          y2={y50}
          stroke={colors.textMuted}
          strokeWidth={1}
          strokeDasharray="4,4"
        />
        <SvgText
          x={CHART_PADDING.left - 4}
          y={y50 + 4}
          textAnchor="end"
          fontSize={10}
          fill={colors.textMuted}
        >
          50%
        </SvgText>

        {/* Dashed line at 90% */}
        <Line
          x1={CHART_PADDING.left}
          y1={y90}
          x2={CHART_PADDING.left + PLOT_WIDTH}
          y2={y90}
          stroke={colors.textMuted}
          strokeWidth={1}
          strokeDasharray="4,4"
        />
        <SvgText
          x={CHART_PADDING.left - 4}
          y={y90 + 4}
          textAnchor="end"
          fontSize={10}
          fill={colors.textMuted}
        >
          90%
        </SvgText>

        {/* Axes */}
        <Line
          x1={CHART_PADDING.left}
          y1={CHART_PADDING.top}
          x2={CHART_PADDING.left}
          y2={CHART_PADDING.top + PLOT_HEIGHT}
          stroke={colors.border}
          strokeWidth={1}
        />
        <Line
          x1={CHART_PADDING.left}
          y1={CHART_PADDING.top + PLOT_HEIGHT}
          x2={CHART_PADDING.left + PLOT_WIDTH}
          y2={CHART_PADDING.top + PLOT_HEIGHT}
          stroke={colors.border}
          strokeWidth={1}
        />

        {/* X-axis label */}
        <SvgText
          x={CHART_PADDING.left + PLOT_WIDTH / 2}
          y={CHART_HEIGHT - 4}
          textAnchor="middle"
          fontSize={10}
          fill={colors.textMuted}
        >
          Packs opened (up to {maxPacks})
        </SvgText>

        {/* Probability curve */}
        <Path d={curvePath} stroke={GOLD} strokeWidth={2.5} fill="none" />
      </Svg>
    </View>
  );
}

export function LuckCalculator({
  visible,
  onClose,
  cardRarity,
  cardName,
  cardsOfSameRarityInPack,
}: LuckCalculatorProps) {
  const rarity = cardRarity ?? 'unknown';
  const isGuaranteed = rarity === 'diamond1';

  const stats = useMemo(() => {
    if (isGuaranteed) return null;

    const packs50 = packsForProbability(rarity, cardsOfSameRarityInPack, 0.5);
    const packs90 = packsForProbability(rarity, cardsOfSameRarityInPack, 0.9);
    const perPackProb = probabilityInNPacks(rarity, cardsOfSameRarityInPack, 1);

    return {
      pullRate: (perPackProb * 100).toFixed(3),
      packs50: packs50 === Infinity ? '--' : packs50.toLocaleString(),
      packs90: packs90 === Infinity ? '--' : packs90.toLocaleString(),
      cost50: packs50 === Infinity ? '--' : (packs50 * 2).toLocaleString(),
      cost90: packs90 === Infinity ? '--' : (packs90 * 2).toLocaleString(),
    };
  }, [rarity, cardsOfSameRarityInPack, isGuaranteed]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={calcStyles.overlay} onPress={onClose}>
        <Pressable style={calcStyles.sheet} onPress={() => {}}>
          <View style={calcStyles.handle} />

          <View style={calcStyles.header}>
            <Text style={calcStyles.title}>Pull Rate Calculator</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <X size={22} color={colors.textSecondary} weight="regular" />
            </Pressable>
          </View>

          <Text style={calcStyles.cardName} numberOfLines={1}>
            {cardName}
          </Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={calcStyles.scrollContent}
          >
            {isGuaranteed ? (
              <View style={calcStyles.guaranteedBox}>
                <CheckCircle size={32} color={colors.success} weight="fill" />
                <Text style={calcStyles.guaranteedText}>
                  Guaranteed in every pack
                </Text>
                <Text style={calcStyles.guaranteedSub}>
                  Diamond 1 cards appear in slots 1-3 of every pack you open.
                </Text>
              </View>
            ) : (
              <>
                {/* Stats grid */}
                <View style={calcStyles.statsGrid}>
                  <View style={calcStyles.statBox}>
                    <Text style={calcStyles.statValue}>{stats!.pullRate}%</Text>
                    <Text style={calcStyles.statLabel}>Per pack</Text>
                  </View>
                  <View style={calcStyles.statBox}>
                    <Text style={calcStyles.statValue}>{stats!.packs50}</Text>
                    <Text style={calcStyles.statLabel}>Packs for 50%</Text>
                  </View>
                  <View style={calcStyles.statBox}>
                    <Text style={calcStyles.statValue}>{stats!.packs90}</Text>
                    <Text style={calcStyles.statLabel}>Packs for 90%</Text>
                  </View>
                  <View style={calcStyles.statBox}>
                    <Text style={calcStyles.statValue}>{stats!.cost90}</Text>
                    <Text style={calcStyles.statLabel}>Pack pts (90%)</Text>
                  </View>
                </View>

                {/* Cost estimate note */}
                <Text style={calcStyles.costNote}>
                  Each pack costs 2 pack points. Estimates based on {cardsOfSameRarityInPack} cards of this rarity in the set.
                </Text>

                {/* Chart */}
                <Text style={calcStyles.chartTitle}>Cumulative Probability</Text>
                <ProbabilityChart
                  cardRarity={rarity}
                  cardsOfSameRarityInPack={cardsOfSameRarityInPack}
                />
              </>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const chartStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
});

const calcStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '80%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  cardName: {
    fontSize: 14,
    color: GOLD,
    fontWeight: '600',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  // Guaranteed diamond1
  guaranteedBox: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  guaranteedText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.success,
  },
  guaranteedSub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: GOLD,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  costNote: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: 16,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
});
