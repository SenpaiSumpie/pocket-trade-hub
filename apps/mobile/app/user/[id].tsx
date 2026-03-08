import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import FriendCodeBadge from '@/src/components/FriendCodeBadge';
import { getAvatarById } from '@/src/constants/avatars';
import { apiFetch } from '@/src/hooks/useApi';
import { colors, typography, spacing, borderRadius } from '@/src/constants/theme';

interface UserProfile {
  id: string;
  displayName: string | null;
  avatarId: string | null;
  friendCode: string | null;
  createdAt: string;
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await apiFetch<UserProfile>(`/users/${id}`);
        setUser(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load profile',
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !user) {
    return (
      <View style={styles.centered}>
        <Ionicons name="person-remove-outline" size={64} color={colors.textMuted} />
        <Text style={styles.errorTitle}>User Not Found</Text>
        <Text style={styles.errorText}>
          {error || 'This user does not exist.'}
        </Text>
      </View>
    );
  }

  const avatar = getAvatarById(user.avatarId);
  const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <View
          style={[
            styles.avatarCircle,
            avatar && { borderColor: avatar.color },
          ]}
        >
          {avatar ? (
            <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
          ) : (
            <Ionicons name="person" size={48} color={colors.textMuted} />
          )}
        </View>
      </View>

      {/* Name */}
      <Text style={styles.displayName}>
        {user.displayName || 'Anonymous Trainer'}
      </Text>

      {/* Friend Code */}
      {user.friendCode && (
        <View style={styles.friendCodeSection}>
          <Text style={styles.sectionLabel}>Friend Code</Text>
          <FriendCodeBadge code={user.friendCode} />
        </View>
      )}

      {/* Info */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.infoText}>Member since {joinDate}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Ionicons name="swap-horizontal-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.infoText}>0 trades</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  avatarContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarEmoji: {
    fontSize: 56,
  },
  displayName: {
    ...typography.heading,
    marginBottom: spacing.lg,
  },
  friendCodeSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  infoText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  errorTitle: {
    ...typography.subheading,
    marginTop: spacing.md,
  },
  errorText: {
    ...typography.caption,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
