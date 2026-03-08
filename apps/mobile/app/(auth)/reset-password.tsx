import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetRequestSchema, resetConfirmSchema } from '@pocket-trade-hub/shared';
import type { z } from 'zod';
import Toast from 'react-native-toast-message';
import { apiFetch } from '@/src/hooks/useApi';
import { colors, typography, spacing, borderRadius } from '@/src/constants/theme';

type ResetRequestForm = z.infer<typeof resetRequestSchema>;
type ResetConfirmForm = z.infer<typeof resetConfirmSchema>;

export default function ResetPasswordScreen() {
  const [step, setStep] = useState<'request' | 'confirm'>('request');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');

  const requestForm = useForm<ResetRequestForm>({
    resolver: zodResolver(resetRequestSchema),
    defaultValues: { email: '' },
  });

  const confirmForm = useForm<ResetConfirmForm>({
    resolver: zodResolver(resetConfirmSchema),
    defaultValues: { token: '', newPassword: '' },
  });

  const onRequestSubmit = async (data: ResetRequestForm) => {
    setLoading(true);
    try {
      const res = await apiFetch<{ message: string; resetToken?: string }>(
        '/auth/reset-request',
        {
          method: 'POST',
          body: JSON.stringify(data),
          skipAuth: true,
        },
      );
      // In dev mode, the reset token may be in the response
      if (res.resetToken) {
        setResetToken(res.resetToken);
        confirmForm.setValue('token', res.resetToken);
      }
      Toast.show({
        type: 'success',
        text1: 'Check Your Email',
        text2: 'Password reset instructions have been sent.',
      });
      setStep('confirm');
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Request Failed',
        text2: err instanceof Error ? err.message : 'Something went wrong',
      });
    } finally {
      setLoading(false);
    }
  };

  const onConfirmSubmit = async (data: ResetConfirmForm) => {
    setLoading(true);
    try {
      await apiFetch('/auth/reset-confirm', {
        method: 'POST',
        body: JSON.stringify(data),
        skipAuth: true,
      });
      Toast.show({
        type: 'success',
        text1: 'Password Reset',
        text2: 'Your password has been updated. Please log in.',
      });
      router.replace('/(auth)/login');
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Reset Failed',
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
        <View style={styles.headerSection}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            {step === 'request'
              ? "Enter your email and we'll send reset instructions."
              : 'Enter the reset token and your new password.'}
          </Text>
        </View>

        {step === 'request' ? (
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <Controller
                control={requestForm.control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      requestForm.formState.errors.email && styles.inputError,
                    ]}
                    placeholder="your@email.com"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {requestForm.formState.errors.email && (
                <Text style={styles.errorText}>
                  {requestForm.formState.errors.email.message}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={requestForm.handleSubmit(onRequestSubmit)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={styles.buttonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Reset Token</Text>
              <Controller
                control={confirmForm.control}
                name="token"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      confirmForm.formState.errors.token && styles.inputError,
                    ]}
                    placeholder="Paste reset token"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {confirmForm.formState.errors.token && (
                <Text style={styles.errorText}>
                  {confirmForm.formState.errors.token.message}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <Controller
                control={confirmForm.control}
                name="newPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      confirmForm.formState.errors.newPassword &&
                        styles.inputError,
                    ]}
                    placeholder="At least 8 characters"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {confirmForm.formState.errors.newPassword && (
                <Text style={styles.errorText}>
                  {confirmForm.formState.errors.newPassword.message}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={confirmForm.handleSubmit(onConfirmSubmit)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={styles.buttonText}>Reset Password</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => setStep('request')}
            >
              <Text style={styles.linkText}>Back to email entry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Back to Login */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.footerLink}>Back to Log In</Text>
          </TouchableOpacity>
        </View>
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
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.heading,
    color: colors.primary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  formSection: {
    gap: spacing.md,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
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
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: '700',
  },
  linkButton: {
    alignItems: 'center',
    padding: spacing.sm,
  },
  linkText: {
    color: colors.primary,
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  footerLink: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
});
