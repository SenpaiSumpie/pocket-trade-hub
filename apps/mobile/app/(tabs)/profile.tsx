import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/stores/auth';
import { getAvatarById } from '@/src/constants/avatars';
import FriendCodeBadge from '@/src/components/FriendCodeBadge';
import { colors, typography, spacing, borderRadius } from '@/src/constants/theme';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Unknown';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const avatar = getAvatarById(user?.avatarId);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <View style={[styles.avatarCircle, avatar && { borderColor: avatar.color }]}>
          {avatar ? (
            <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
          ) : (
            <Ionicons name="person" size={48} color={colors.textMuted} />
          )}
        </View>
        <Text style={styles.displayName}>
          {user?.displayName || 'No display name'}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Friend Code */}
      {user?.friendCode && (
        <View style={styles.friendCodeSection}>
          <FriendCodeBadge code={user.friendCode} />
        </View>
      )}

      {/* Info Cards */}
      <View style={styles.infoCard}>
        {!user?.friendCode && (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Friend Code</Text>
              <Text style={styles.infoValue}>Not set</Text>
            </View>
            <View style={styles.divider} />
          </>
        )}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Member Since</Text>
          <Text style={styles.infoValue}>{formatDate(user?.createdAt)}</Text>
        </View>
      </View>

      {/* Actions */}
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => router.push('/edit-profile')}
      >
        <Ionicons name="create-outline" size={20} color={colors.background} />
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>
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
  avatarContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    marginBottom: spacing.md,
  },
  avatarEmoji: {
    fontSize: 44,
  },
  displayName: {
    ...typography.subheading,
    color: colors.text,
  },
  email: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  friendCodeSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    marginBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    ...typography.label,
  },
  infoValue: {
    ...typography.body,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  editButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    width: '100%',
    marginBottom: spacing.md,
  },
  editButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.error,
  },
  logoutButtonText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
});
