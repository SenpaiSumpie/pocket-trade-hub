import { useState, useEffect } from 'react';
import { View, Text, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/src/constants/theme';
import { useAuthStore } from '@/src/stores/auth';
import { useCardsStore } from '@/src/stores/cards';
import type { CardLanguage } from '@pocket-trade-hub/shared';

const LANGUAGE_OPTIONS: { code: CardLanguage; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'German' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'it', label: 'Italian' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'zh', label: 'Chinese' },
];

interface AddToCollectionModalProps {
  visible: boolean;
  cardId: string | null;
  cardName: string;
  onClose: () => void;
  onConfirm: (cardId: string, language: string, quantity: number) => void;
  mode: 'collection' | 'wanted';
}

export function AddToCollectionModal({
  visible,
  cardId,
  cardName,
  onClose,
  onConfirm,
  mode,
}: AddToCollectionModalProps) {
  const user = useAuthStore((s) => s.user);
  const translations = useCardsStore((s) => cardId ? s.translationsByCardId[cardId] : undefined);
  const fetchTranslations = useCardsStore((s) => s.fetchTranslations);

  const preferredLang = (user?.preferredCardLanguage as CardLanguage) || 'en';
  const [selectedLanguage, setSelectedLanguage] = useState<CardLanguage>(preferredLang);
  const [quantity, setQuantity] = useState(1);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedLanguage(preferredLang);
      setQuantity(1);
      if (cardId) {
        fetchTranslations(cardId);
      }
    }
  }, [visible, preferredLang, cardId, fetchTranslations]);

  // Determine available languages from translations
  const availableLanguages = translations
    ? new Set(translations.map((t) => t.language))
    : null;

  if (!cardId) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>
            {mode === 'collection' ? 'Add to Collection' : 'Add to Wanted'}
          </Text>
          <Text style={styles.cardName} numberOfLines={2}>
            {cardName}
          </Text>

          {/* Language selector */}
          <Text style={styles.sectionLabel}>Language</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.langRow}
          >
            {LANGUAGE_OPTIONS.map((lang) => {
              const isSelected = selectedLanguage === lang.code;
              const isAvailable = !availableLanguages || availableLanguages.has(lang.code);

              return (
                <Pressable
                  key={lang.code}
                  style={[
                    styles.langBadge,
                    isSelected && styles.langBadgeSelected,
                    !isAvailable && styles.langBadgeUnavailable,
                  ]}
                  onPress={() => setSelectedLanguage(lang.code)}
                >
                  <Text
                    style={[
                      styles.langCode,
                      isSelected && styles.langCodeSelected,
                      !isAvailable && styles.langCodeUnavailable,
                    ]}
                  >
                    {lang.code.toUpperCase()}
                  </Text>
                  <Text
                    style={[
                      styles.langLabel,
                      isSelected && styles.langLabelSelected,
                      !isAvailable && styles.langLabelUnavailable,
                    ]}
                    numberOfLines={1}
                  >
                    {lang.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={14} color={colors.primary} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Preferred language hint */}
          {preferredLang && (
            <Text style={styles.hint}>
              Pre-selected from your preferred language ({preferredLang.toUpperCase()})
            </Text>
          )}

          {/* Quantity (only for collection mode) */}
          {mode === 'collection' && (
            <View style={styles.quantitySection}>
              <Text style={styles.sectionLabel}>Quantity</Text>
              <View style={styles.quantityRow}>
                <Pressable
                  style={styles.quantityBtn}
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Ionicons name="remove" size={20} color={colors.primary} />
                </Pressable>
                <Text style={styles.quantityValue}>{quantity}</Text>
                <Pressable
                  style={styles.quantityBtn}
                  onPress={() => setQuantity(Math.min(99, quantity + 1))}
                >
                  <Ionicons name="add" size={20} color={colors.primary} />
                </Pressable>
              </View>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={styles.confirmBtn}
              onPress={() => {
                onConfirm(cardId, selectedLanguage, quantity);
                onClose();
              }}
            >
              <Ionicons
                name={mode === 'collection' ? 'add-circle' : 'heart'}
                size={18}
                color="#fff"
              />
              <Text style={styles.confirmText}>
                {mode === 'collection' ? 'Add to Collection' : 'Add to Wanted'}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cardName: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  langRow: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  langBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  langBadgeSelected: {
    backgroundColor: colors.primary + '25',
    borderColor: colors.primary,
  },
  langBadgeUnavailable: {
    opacity: 0.4,
  },
  langCode: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  langCodeSelected: {
    color: colors.primary,
  },
  langCodeUnavailable: {
    color: colors.textMuted,
  },
  langLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  langLabelSelected: {
    color: colors.primary,
  },
  langLabelUnavailable: {
    color: colors.textMuted,
  },
  hint: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  quantitySection: {
    marginTop: spacing.md,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  quantityBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    minWidth: 32,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  confirmBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
});
