import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { AVATARS, type AvatarPreset } from '@/src/constants/avatars';
import { colors, spacing, borderRadius } from '@/src/constants/theme';

interface AvatarPickerProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function AvatarPicker({ selectedId, onSelect }: AvatarPickerProps) {
  const renderItem = ({ item }: { item: AvatarPreset }) => {
    const isSelected = item.id === selectedId;
    return (
      <TouchableOpacity
        style={[
          styles.avatarItem,
          isSelected && styles.avatarSelected,
          isSelected && { borderColor: item.color },
        ]}
        onPress={() => onSelect(item.id)}
        activeOpacity={0.7}
      >
        <Text style={styles.emoji}>{item.emoji}</Text>
        <Text style={[styles.label, isSelected && { color: item.color }]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={AVATARS}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={4}
        scrollEnabled={false}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  grid: {
    gap: spacing.sm,
  },
  row: {
    gap: spacing.sm,
    justifyContent: 'center',
  },
  avatarItem: {
    width: 72,
    height: 80,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarSelected: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 2,
  },
  emoji: {
    fontSize: 28,
  },
  label: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
});
