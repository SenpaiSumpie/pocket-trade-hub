import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Lock, Diamond } from 'phosphor-react-native';
import type { Icon as PhosphorIcon } from 'phosphor-react-native';
import { colors, typography, spacing, borderRadius } from '@/src/constants/theme';

interface LockedFeatureCardProps {
  title: string;
  description: string;
  Icon: PhosphorIcon;
  onPress: () => void;
}

export function LockedFeatureCard({ title, description, Icon, onPress }: LockedFeatureCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconContainer}>
        <Icon size={28} color={colors.textMuted} weight="regular" />
        <View style={styles.lockBadge}>
          <Lock size={10} color={colors.background} weight="fill" />
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.premiumLabel}>
            <Diamond size={10} color="#f0c040" weight="fill" />
            <Text style={styles.premiumText}>Premium</Text>
          </View>
        </View>
        <Text style={styles.description}>{description}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    opacity: 0.75,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.textMuted,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textMuted,
  },
  premiumLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#f0c04020',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#f0c040',
  },
  description: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
