import { View, Text, Modal, Pressable, FlatList, StyleSheet } from 'react-native';
import { Check } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { UI_LANGUAGES } from '@pocket-trade-hub/shared';
import { useLanguageStore } from '@/src/stores/language';
import { colors, spacing, borderRadius, typography } from '@/src/constants/theme';

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
}

export function LanguageSelector({ visible, onClose }: LanguageSelectorProps) {
  const { t } = useTranslation();
  const currentLanguage = useLanguageStore((s) => s.currentLanguage);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  const handleSelect = (code: string) => {
    setLanguage(code);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <View style={styles.handle} />
          <Text style={styles.title}>{t('profile.selectLanguage')}</Text>

          <FlatList
            data={UI_LANGUAGES}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => {
              const isSelected = currentLanguage === item.code;
              return (
                <Pressable
                  style={[styles.row, isSelected && styles.rowActive]}
                  onPress={() => handleSelect(item.code)}
                >
                  <View style={styles.rowContent}>
                    <Text style={[styles.nativeName, isSelected && styles.nativeNameActive]}>
                      {item.nativeName}
                    </Text>
                    <Text style={styles.codeLabel}>
                      ({item.code.toUpperCase()})
                    </Text>
                  </View>
                  {isSelected && (
                    <Check size={20} color={colors.primary} weight="regular" />
                  )}
                </Pressable>
              );
            }}
            style={styles.list}
          />
        </View>
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    maxHeight: '60%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.textMuted,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.subheading,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  list: {
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowActive: {
    backgroundColor: colors.primary + '10',
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  nativeName: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  nativeNameActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  codeLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
