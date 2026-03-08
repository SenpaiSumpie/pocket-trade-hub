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
import AvatarPicker from '@/src/components/AvatarPicker';
import { useAuthStore } from '@/src/stores/auth';
import { apiFetch } from '@/src/hooks/useApi';
import { friendCodeSchema } from '@pocket-trade-hub/shared';
import { colors, typography, spacing, borderRadius } from '@/src/constants/theme';

interface UpdateProfileResponse {
  id: string;
  email: string;
  displayName: string | null;
  avatarId: string | null;
  friendCode: string | null;
  createdAt: string;
}

export default function OnboardingScreen() {
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [friendCode, setFriendCode] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  const formatFriendCode = (text: string) => {
    // Remove non-digits
    const digits = text.replace(/\D/g, '').slice(0, 16);
    // Add dashes every 4 digits
    const parts = [];
    for (let i = 0; i < digits.length; i += 4) {
      parts.push(digits.slice(i, i + 4));
    }
    return parts.join('-');
  };

  const handleGetStarted = async () => {
    const updates: Record<string, string> = {};
    if (displayName.trim()) updates.displayName = displayName.trim();
    if (selectedAvatar) updates.avatarId = selectedAvatar;
    if (friendCode) {
      const result = friendCodeSchema.safeParse(friendCode);
      if (!result.success) {
        Toast.show({
          type: 'error',
          text1: 'Invalid Friend Code',
          text2: 'Format: XXXX-XXXX-XXXX-XXXX (digits only)',
        });
        return;
      }
      updates.friendCode = friendCode;
    }

    if (Object.keys(updates).length === 0) {
      router.replace('/(tabs)');
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
      router.replace('/(tabs)');
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: err instanceof Error ? err.message : 'Something went wrong',
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
        <Text style={styles.title}>Welcome to Pocket Trade Hub!</Text>
        <Text style={styles.subtitle}>
          Let's set up your trainer profile. You can always change these later.
        </Text>

        {/* Avatar Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Your Avatar</Text>
          <AvatarPicker
            selectedId={selectedAvatar}
            onSelect={setSelectedAvatar}
          />
        </View>

        {/* Display Name */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display Name</Text>
          <TextInput
            style={styles.input}
            placeholder="What should we call you?"
            placeholderTextColor={colors.textMuted}
            maxLength={30}
            value={displayName}
            onChangeText={setDisplayName}
          />
          <Text style={styles.charCount}>{displayName.length}/30</Text>
        </View>

        {/* Friend Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pokemon TCG Pocket Friend Code</Text>
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

        {/* Buttons */}
        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handleGetStarted}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.primaryButtonText}>Get Started</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.skipButtonText}>Skip for now</Text>
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
    paddingTop: spacing.xxl,
  },
  title: {
    ...typography.heading,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
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
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: '700',
  },
  skipButton: {
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  skipButtonText: {
    color: colors.textSecondary,
    fontSize: 15,
  },
});
