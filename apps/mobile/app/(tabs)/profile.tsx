import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import { UI_LANGUAGES } from '@pocket-trade-hub/shared';
import { useAuthStore } from '@/src/stores/auth';
import { useLanguageStore } from '@/src/stores/language';
import { getAvatarById } from '@/src/constants/avatars';
import FriendCodeBadge from '@/src/components/FriendCodeBadge';
import { apiFetch } from '@/src/hooks/useApi';
import { signInWithGoogle } from '@/src/services/google-auth';
import { signInWithApple, isAppleSignInAvailable } from '@/src/services/apple-auth';
import { colors, typography, spacing, borderRadius } from '@/src/constants/theme';
import { PaywallCard } from '@/src/components/premium/PaywallCard';
import { PremiumBadge } from '@/src/components/premium/PremiumBadge';
import { usePremiumStore } from '@/src/stores/premium';
import RedeemCodeForm from '@/src/components/promo/RedeemCodeForm';

interface UserReputation {
  avgRating: number;
  tradeCount: number;
}

function ReputationStars({ avgRating, tradeCount, t }: UserReputation & { t: (key: string, opts?: Record<string, unknown>) => string }) {
  if (tradeCount === 0) {
    return <Text style={styles.noRatingsText}>{t('profile.noRatings')}</Text>;
  }

  const fullStars = Math.floor(avgRating);
  const hasHalf = avgRating - fullStars >= 0.25 && avgRating - fullStars < 0.75;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <View style={styles.reputationRow}>
      <View style={styles.starsRow}>
        {Array.from({ length: fullStars }, (_, i) => (
          <Ionicons key={`f${i}`} name="star" size={18} color="#f0c040" />
        ))}
        {hasHalf && <Ionicons name="star-half" size={18} color="#f0c040" />}
        {Array.from({ length: emptyStars }, (_, i) => (
          <Ionicons key={`e${i}`} name="star-outline" size={18} color={colors.textMuted} />
        ))}
      </View>
      <Text style={styles.ratingText}>
        {avgRating.toFixed(1)} ({t('trades.tradeCount', { count: tradeCount })})
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const linkedProviders = useAuthStore((s) => s.linkedProviders);
  const setLinkedProviders = useAuthStore((s) => s.setLinkedProviders);
  const linkAccount = useAuthStore((s) => s.linkAccount);
  const currentLanguage = useLanguageStore((s) => s.currentLanguage);
  const [languageVisible, setLanguageVisible] = useState(false);
  const [reputation, setReputation] = useState<UserReputation>({ avgRating: 0, tradeCount: 0 });
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null);
  const isPremium = usePremiumStore((s) => s.isPremium);
  const fetchPremiumStatus = usePremiumStore((s) => s.fetchStatus);

  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;
    apiFetch<{ avgRating: number; tradeCount: number }>(`/users/${user.id}`)
      .then((data) => {
        setReputation({ avgRating: data.avgRating, tradeCount: data.tradeCount });
      })
      .catch(() => {});
    fetchPremiumStatus();
    // Fetch linked providers
    apiFetch<{ providers: string[] }>('/auth/providers')
      .then((data) => setLinkedProviders(data.providers))
      .catch(() => {});
  }, [isLoggedIn, user?.id]);

  const handleLinkGoogle = async () => {
    setLinkingProvider('google');
    try {
      const idToken = await signInWithGoogle();
      if (!idToken) return;
      // Prompt for password to confirm linking
      if (Platform.OS === 'web') {
        const password = window.prompt(t('profile.enterPasswordToConfirm'));
        if (!password) return;
        await linkAccount('google', idToken, password);
      } else {
        Alert.prompt(
          t('profile.linkGoogleAccount'),
          t('profile.enterPasswordToConfirm'),
          async (password) => {
            if (!password) return;
            try {
              await linkAccount('google', idToken, password);
              setLinkedProviders([...linkedProviders, 'google']);
              Toast.show({ type: 'success', text1: t('profile.googleAccountLinked') });
            } catch (err) {
              Toast.show({
                type: 'error',
                text1: t('profile.linkFailed'),
                text2: err instanceof Error ? err.message : t('common.somethingWentWrong'),
              });
            }
          },
          'secure-text',
        );
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: t('profile.googleSignInFailed'),
        text2: err instanceof Error ? err.message : t('common.somethingWentWrong'),
      });
    } finally {
      setLinkingProvider(null);
    }
  };

  const handleLinkApple = async () => {
    setLinkingProvider('apple');
    try {
      const result = await signInWithApple();
      if (!result) return;
      if (Platform.OS === 'web') return; // Apple only on iOS
      Alert.prompt(
        t('profile.linkAppleAccount'),
        t('profile.enterPasswordToConfirm'),
        async (password) => {
          if (!password) return;
          try {
            await linkAccount('apple', result.idToken, password);
            setLinkedProviders([...linkedProviders, 'apple']);
            Toast.show({ type: 'success', text1: t('profile.appleAccountLinked') });
          } catch (err) {
            Toast.show({
              type: 'error',
              text1: t('profile.linkFailed'),
              text2: err instanceof Error ? err.message : t('common.somethingWentWrong'),
            });
          }
        },
        'secure-text',
      );
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: t('profile.appleSignInFailed'),
        text2: err instanceof Error ? err.message : t('common.somethingWentWrong'),
      });
    } finally {
      setLinkingProvider(null);
    }
  };

  const handleUnlink = (provider: string) => {
    // Guard: don't allow unlinking the only auth method
    const hasPassword = true; // Assume user has password if they have email/password account
    if (linkedProviders.length <= 1 && !hasPassword) {
      Alert.alert(
        t('profile.cannotUnlink'),
        t('profile.cannotUnlinkMessage'),
      );
      return;
    }

    const label = provider === 'google' ? 'Google' : 'Apple';
    Alert.alert(t('profile.unlinkAccount'), t('profile.unlinkConfirm', { provider: label }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.unlinkAccount'),
        style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch(`/auth/unlink/${provider}`, { method: 'DELETE' });
            setLinkedProviders(linkedProviders.filter((p) => p !== provider));
            Toast.show({ type: 'success', text1: t('profile.accountUnlinked', { provider: label }) });
          } catch (err) {
            Toast.show({
              type: 'error',
              text1: t('profile.unlinkFailed'),
              text2: err instanceof Error ? err.message : t('common.somethingWentWrong'),
            });
          }
        },
      },
    ]);
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm(t('profile.logOutConfirm'))) {
        logout();
      }
      return;
    }
    Alert.alert(t('profile.logOut'), t('profile.logOutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.logOut'),
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return t('common.noResults');
    return new Date(dateStr).toLocaleDateString(currentLanguage, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const currentLanguageName = UI_LANGUAGES.find((l) => l.code === currentLanguage)?.nativeName ?? currentLanguage;

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
        <View style={styles.nameRow}>
          <Text style={styles.displayName}>
            {user?.displayName || t('profile.noDisplayName')}
          </Text>
          {isPremium && <PremiumBadge size={18} />}
        </View>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.reputationSection}>
          <ReputationStars avgRating={reputation.avgRating} tradeCount={reputation.tradeCount} t={t} />
        </View>
      </View>

      {/* Friend Code */}
      {user?.friendCode && (
        <View style={styles.friendCodeSection}>
          <FriendCodeBadge code={user.friendCode} />
        </View>
      )}

      {/* Premium Section */}
      <PaywallCard />

      {/* Redeem Code */}
      <RedeemCodeForm />

      {/* Linked Accounts */}
      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>{t('profile.linkedAccounts')}</Text>
        <View style={styles.divider} />

        {/* Google */}
        <View style={styles.providerRow}>
          <View style={styles.providerInfo}>
            <Ionicons name="logo-google" size={20} color={colors.text} />
            <Text style={styles.providerLabel}>Google</Text>
          </View>
          {linkedProviders.includes('google') ? (
            <TouchableOpacity onPress={() => handleUnlink('google')}>
              <Text style={styles.unlinkText}>{t('profile.unlinkAccount')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.linkProviderButton}
              onPress={handleLinkGoogle}
              disabled={linkingProvider !== null}
            >
              {linkingProvider === 'google' ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.linkProviderText}>{t('profile.linkAccount')}</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Apple (iOS only) */}
        {isAppleSignInAvailable() && (
          <>
            <View style={styles.divider} />
            <View style={styles.providerRow}>
              <View style={styles.providerInfo}>
                <Ionicons name="logo-apple" size={20} color={colors.text} />
                <Text style={styles.providerLabel}>Apple</Text>
              </View>
              {linkedProviders.includes('apple') ? (
                <TouchableOpacity onPress={() => handleUnlink('apple')}>
                  <Text style={styles.unlinkText}>{t('profile.unlinkAccount')}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.linkProviderButton}
                  onPress={handleLinkApple}
                  disabled={linkingProvider !== null}
                >
                  {linkingProvider === 'apple' ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text style={styles.linkProviderText}>{t('profile.linkAccount')}</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </View>

      {/* Info Cards */}
      <View style={styles.infoCard}>
        {!user?.friendCode && (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('profile.friendCode')}</Text>
              <Text style={styles.infoValue}>{t('profile.friendCodeNotSet')}</Text>
            </View>
            <View style={styles.divider} />
          </>
        )}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('profile.memberSince')}</Text>
          <Text style={styles.infoValue}>{formatDate(user?.createdAt)}</Text>
        </View>
      </View>

      {/* Language */}
      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>{t('profile.language')}</Text>
        <View style={styles.divider} />
        <TouchableOpacity
          style={styles.infoRow}
          onPress={() => setLanguageVisible(true)}
        >
          <Text style={styles.infoLabel}>{t('profile.currentLanguage')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Text style={styles.infoValue}>{currentLanguageName}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Actions */}
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => router.push('/edit-profile')}
      >
        <Ionicons name="create-outline" size={20} color={colors.background} />
        <Text style={styles.editButtonText}>{t('profile.editProfile')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={styles.logoutButtonText}>{t('profile.logOut')}</Text>
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  displayName: {
    ...typography.subheading,
    color: colors.text,
  },
  email: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  reputationSection: {
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  reputationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  noRatingsText: {
    ...typography.caption,
    color: colors.textMuted,
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
  sectionTitle: {
    ...typography.label,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  providerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  providerLabel: {
    ...typography.body,
    color: colors.text,
  },
  linkProviderButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  linkProviderText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  unlinkText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '500',
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
