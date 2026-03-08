import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '@/src/constants/theme';

interface User {
  displayName: string | null;
  avatarId: string | null;
  friendCode: string | null;
}

interface SetupChecklistProps {
  user: User;
}

interface ChecklistItem {
  label: string;
  done: boolean;
}

export default function SetupChecklist({ user }: SetupChecklistProps) {
  const items: ChecklistItem[] = [
    { label: 'Set display name', done: !!user.displayName },
    { label: 'Choose avatar', done: !!user.avatarId },
    { label: 'Add friend code', done: !!user.friendCode },
  ];

  const completedCount = items.filter((i) => i.done).length;
  const allDone = completedCount === items.length;

  if (allDone) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.progress}>
          {completedCount}/{items.length}
        </Text>
      </View>

      {items.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.item}
          onPress={() => router.push('/edit-profile')}
          disabled={item.done}
          activeOpacity={0.7}
        >
          <Ionicons
            name={item.done ? 'checkmark-circle' : 'ellipse-outline'}
            size={22}
            color={item.done ? colors.success : colors.textMuted}
          />
          <Text
            style={[
              styles.itemText,
              item.done && styles.itemTextDone,
            ]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.subheading,
    fontSize: 16,
  },
  progress: {
    ...typography.caption,
    color: colors.primary,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  itemText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  itemTextDone: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
});
