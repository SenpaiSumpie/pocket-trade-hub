import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import AvatarPicker from '@/src/components/AvatarPicker';
import { useAuthStore } from '@/src/stores/auth';
import { apiFetch } from '@/src/hooks/useApi';
import { updateProfileSchema } from '@pocket-trade-hub/shared';
import { colors, typography, spacing, borderRadius } from '@/src/constants/theme';

interface UpdateProfileResponse {
  id: string;
  email: string;
  displayName: string | null;
  avatarId: string | null;
  friendCode: string | null;
  createdAt: string;
}

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(
    user?.avatarId || null,
  );
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [friendCode, setFriendCode] = useState(user?.friendCode || '');
  const [loading, setLoading] = useState(false);

  const formatFriendCode = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 16);
    const parts = [];
    for (let i = 0; i < digits.length; i += 4) {
      parts.push(digits.slice(i, i + 4));
    }
    return parts.join('-');
  };

  const handleSave = async () => {
    const updates: Record<string, string | undefined> = {};

    if (displayName.trim() !== (user?.displayName || '')) {
      updates.displayName = displayName.trim() || undefined;
    }
    if (selectedAvatar !== user?.avatarId) {
      updates.avatarId = selectedAvatar || undefined;
    }
    if (friendCode !== (user?.friendCode || '')) {
      updates.friendCode = friendCode || undefined;
    }

    const result = updateProfileSchema.safeParse(updates);
    if (!result.success) {
      const firstError = result.error.errors[0];
      Toast.show({
        type: 'error',
        text1: t('profile.validationError'),
        text2: firstError?.message || t('profile.checkInput'),
      });
      return;
    }

    if (Object.keys(updates).length === 0) {
      router.back();
      return;
    }

    setLoading(true);
    try {
      const updatedUser = await apiFetch<UpdateProfileResponse>('/users/me', {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      if (user) {
        setUser({ ...user, ...updatedUser });
      }
      Toast.show({
        type: 'success',
        text1: t('profile.profileUpdated'),
        visibilityTime: 1500,
      });
      router.back();
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: t('profile.updateFailed'),
        text2: err instanceof Error ? err.message : t('common.somethingWentWrong'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.avatar')}</Text>
          <AvatarPicker
            selectedId={selectedAvatar}
            onSelect={setSelectedAvatar}
          />
        </View>

        {/* Display Name */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.displayName')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('profile.displayNamePlaceholder')}
            placeholderTextColor={colors.textMuted}
            maxLength={30}
            value={displayName}
            onChangeText={setDisplayName}
          />
          <Text style={styles.charCount}>{displayName.length}/30</Text>
        </View>

        {/* Friend Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.pokemonFriendCode')}</Text>
          <TextInput
            style={styles.input}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            value={friendCode}
            onChangeText={(text) => setFriendCode(formatFriendCode(text))}
            maxLength={19}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.saveButtonText}>{t('common.saveChanges')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.label,
    fontSize: 15,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 16,
  },
  charCount: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: '700',
  },
});
