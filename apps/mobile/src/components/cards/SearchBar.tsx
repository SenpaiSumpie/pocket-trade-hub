import { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { MagnifyingGlass, XCircle } from 'phosphor-react-native';
import { colors, spacing, borderRadius, fontFamily } from '@/src/constants/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
}

export function SearchBar({ value, onChangeText }: SearchBarProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.container,
        focused && styles.containerFocused,
      ]}
    >
      <MagnifyingGlass size={18} color={colors.textMuted} weight="regular" style={styles.icon} />
      <TextInput
        style={styles.input}
        placeholder="Search cards..."
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText('')} hitSlop={8}>
          <XCircle size={18} color={colors.textMuted} weight="regular" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    height: 44,
  },
  containerFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    height: '100%',
    fontFamily: fontFamily.regular,
  },
});
