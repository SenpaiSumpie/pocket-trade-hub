import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '@/src/constants/theme';
import { Text } from './Text';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: React.ComponentType<{ size: number; color: string; weight: string }>;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function EmptyState({ icon: Icon, title, subtitle, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Icon size={64} color={colors.textMuted} weight="light" />
      <Text preset="subheading" style={styles.title}>
        {title}
      </Text>
      {subtitle ? (
        <Text
          preset="body"
          color={colors.textSecondary}
          style={styles.subtitle}
        >
          {subtitle}
        </Text>
      ) : null}
      {ctaLabel && onCta ? (
        <Button
          label={ctaLabel}
          onPress={onCta}
          variant="primary"
          size="md"
          style={styles.cta}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  title: {
    marginTop: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: spacing.md,
    textAlign: 'center',
  },
  cta: {
    marginTop: spacing.md,
    minWidth: 160,
  },
});
