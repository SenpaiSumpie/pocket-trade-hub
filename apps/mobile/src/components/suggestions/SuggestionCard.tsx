import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { RarityBadge } from '@/src/components/cards/RarityBadge';
import { colors, typography, spacing, borderRadius } from '@/src/constants/theme';
import type { TradeSuggestion } from '@pocket-trade-hub/shared';

interface SuggestionCardProps {
  suggestion: TradeSuggestion;
}

export function SuggestionCard({ suggestion }: SuggestionCardProps) {
  const { t } = useTranslation();
  const { giveCard, getCard, reasoning } = suggestion;

  return (
    <View style={styles.card}>
      <View style={styles.tradeRow}>
        {/* Give card */}
        <View style={styles.cardSide}>
          <Text style={styles.label}>{t('suggestions.give')}</Text>
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: giveCard.imageUrl }}
              style={styles.cardImage}
              contentFit="cover"
              placeholder={{ blurhash: 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4' }}
              transition={200}
            />
          </View>
          <Text style={styles.cardName} numberOfLines={1}>
            {giveCard.name}
          </Text>
          <RarityBadge rarity={giveCard.rarity} />
        </View>

        {/* Arrow */}
        <View style={styles.arrowContainer}>
          <Ionicons name="swap-horizontal" size={24} color={colors.primary} />
        </View>

        {/* Get card */}
        <View style={styles.cardSide}>
          <Text style={styles.label}>{t('suggestions.get')}</Text>
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: getCard.imageUrl }}
              style={styles.cardImage}
              contentFit="cover"
              placeholder={{ blurhash: 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4' }}
              transition={200}
            />
          </View>
          <Text style={styles.cardName} numberOfLines={1}>
            {getCard.name}
          </Text>
          <RarityBadge rarity={getCard.rarity} />
        </View>
      </View>

      {/* Reasoning */}
      <Text style={styles.reasoning} numberOfLines={2}>
        {reasoning}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 280,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardSide: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  imageWrapper: {
    width: 80,
    height: 112,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceLight,
    marginBottom: spacing.xs,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardName: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
    maxWidth: 100,
    marginBottom: 2,
  },
  arrowContainer: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.lg,
  },
  reasoning: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 17,
  },
});
