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
import { useTranslation } from 'react-i18next';
import { apiFetch } from '@/src/hooks/useApi';
import { colors, typography, spacing, borderRadius } from '@/src/constants/theme';

type ResetRequestForm = z.infer<typeof resetRequestSchema>;
type ResetConfirmForm = z.infer<typeof resetConfirmSchema>;

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
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
        text1: t('auth.resetSent'),
        text2: t('auth.resetSentMessage'),
      });
      setStep('confirm');
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: t('auth.requestFailed'),
        text2: err instanceof Error ? err.message : t('common.somethingWentWrong'),
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
        text1: t('auth.resetPassword'),
        text2: t('auth.passwordResetSuccess'),
      });
      router.replace('/(auth)/login');
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: t('auth.resetFailed'),
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
        <View style={styles.headerSection}>
          <Text style={styles.title}>{t('auth.resetPassword')}</Text>
          <Text style={styles.subtitle}>
            {step === 'request'
              ? t('auth.enterEmailResetInstructions')
              : t('auth.enterTokenAndNewPassword')}
          </Text>
        </View>

        {step === 'request' ? (
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('auth.email')}</Text>
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
                <Text style={styles.buttonText}>{t('auth.sendResetLink')}</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('auth.resetToken')}</Text>
              <Controller
                control={confirmForm.control}
                name="token"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      confirmForm.formState.errors.token && styles.inputError,
                    ]}
                    placeholder={t('auth.pasteResetToken')}
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
              <Text style={styles.label}>{t('auth.newPassword')}</Text>
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
                    placeholder={t('auth.passwordTooShort')}
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
                <Text style={styles.buttonText}>{t('auth.resetPassword')}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => setStep('request')}
            >
              <Text style={styles.linkText}>{t('auth.backToEmailEntry')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Back to Login */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.footerLink}>{t('auth.backToLogin')}</Text>
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
